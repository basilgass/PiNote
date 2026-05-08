/**
 * PointerClassifier — module pur d'observation des PointerEvents.
 *
 * Classifie chaque pointer actif en `pen | finger | palm | mouse | unknown`
 * et expose un snapshot agrégé. **Aucune action** sur la FSM ou l'Engine :
 * cette couche est purement observationnelle.
 *
 * Heuristique :
 * - `pointerType === 'mouse'` → `mouse` (priorité absolue, pas d'aire fiable).
 * - Sinon classification par aire de contact (`width × height` en pixels CSS²) :
 *     - aire ≤ `penMaxArea` (défaut 10)   → `pen`
 *     - aire ≤ `palmMinArea` (défaut 400) → `finger`
 *     - aire > `palmMinArea`              → `palm`
 *
 * On ignore volontairement `pointerType === 'pen'` car certains pilotes/OS
 * remontent les stylets comme `'touch'`. L'aire est le signal le plus fiable
 * en pratique. Les seuils sont ajustables via `setThresholds`.
 *
 * Verrou anti-flicker : un pointer classé `palm` ne redescend pas vers
 * `finger`/`pen` même si son aire diminue temporairement (la paume bouge).
 */

export type PointerKind = 'pen' | 'finger' | 'palm' | 'mouse' | 'unknown'

export interface PointerInfo {
    pointerId: number
    pointerType: string
    kind: PointerKind
    width: number
    height: number
    isPrimary: boolean
}

export interface PointerSnapshot {
    /** Nombre de pointers actuellement down */
    activeCount: number
    /** Tous les pointers actifs, indexés par pointerId */
    pointers: ReadonlyMap<number, PointerInfo>
    /**
     * Kind dominant à afficher : priorité pen > finger > palm > mouse.
     * `'unknown'` si aucun pointer actif.
     */
    primaryKind: PointerKind
    /** True si un `pen` a été détecté au moins une fois dans la session */
    penEverSeen: boolean
}

export interface PointerClassifierOptions {
    /** Aire max (px²) en deçà de laquelle le contact est classé `pen` (défaut 10) */
    penMaxArea?: number
    /** Aire min (px²) à partir de laquelle le contact est classé `palm` (défaut 400) */
    palmMinArea?: number
}

const KIND_PRIORITY: Record<PointerKind, number> = {
    pen: 4,
    finger: 3,
    palm: 2,
    mouse: 1,
    unknown: 0,
}

export class PointerClassifier {
    private _penMaxArea: number
    private _palmMinArea: number
    private _pointers = new Map<number, PointerInfo>()
    private _penEverSeen = false
    private _listeners = new Set<(snap: PointerSnapshot) => void>()

    constructor(options: PointerClassifierOptions = {}) {
        this._penMaxArea = options.penMaxArea ?? 10
        this._palmMinArea = options.palmMinArea ?? 400
    }

    /** Modifie les seuils d'aire à chaud (utile pour calibrage) */
    setThresholds(opts: { penMaxArea?: number; palmMinArea?: number }): void {
        if (opts.penMaxArea !== undefined) this._penMaxArea = opts.penMaxArea
        if (opts.palmMinArea !== undefined) this._palmMinArea = opts.palmMinArea
    }

    get penMaxArea(): number { return this._penMaxArea }
    get palmMinArea(): number { return this._palmMinArea }

    /** À appeler dans le handler `pointerdown` du canvas */
    onPointerDown(event: PointerEvent): void {
        const info = this._classify(event)
        this._pointers.set(event.pointerId, info)
        if (info.kind === 'pen') this._penEverSeen = true
        this._emit()
    }

    /** À appeler dans le handler `pointermove` — met à jour width/height */
    onPointerMove(event: PointerEvent): void {
        const existing = this._pointers.get(event.pointerId)
        if (!existing) return
        const updated = this._classify(event)
        // Anti-flicker : une fois classifié paume, on ne redescend pas vers
        // finger/pen — la zone de contact d'une paume oscille en cours de drag.
        if (existing.kind === 'palm' && updated.kind !== 'mouse') {
            updated.kind = 'palm'
        }
        this._pointers.set(event.pointerId, updated)
        this._emit()
    }

    /** À appeler dans `pointerup`, `pointercancel`, `pointerleave` */
    onPointerUp(event: PointerEvent): void {
        if (this._pointers.delete(event.pointerId)) this._emit()
    }

    /** Réinitialise tout (sauf `penEverSeen` qui persiste pour la session) */
    reset(): void {
        this._pointers.clear()
        this._emit()
    }

    snapshot(): PointerSnapshot {
        return {
            activeCount: this._pointers.size,
            pointers: new Map(this._pointers),
            primaryKind: this._computePrimaryKind(),
            penEverSeen: this._penEverSeen,
        }
    }

    /** Souscrit aux changements de snapshot. Retourne une fonction de désinscription. */
    subscribe(listener: (snap: PointerSnapshot) => void): () => void {
        this._listeners.add(listener)
        return () => { this._listeners.delete(listener) }
    }

    // ── Internals ─────────────────────────────────────────────────────────────

    private _classify(event: PointerEvent): PointerInfo {
        const width = event.width ?? 0
        const height = event.height ?? 0
        let kind: PointerKind

        if (event.pointerType === 'mouse') {
            kind = 'mouse'
        } else {
            const area = width * height
            if (area <= this._penMaxArea)        kind = 'pen'
            else if (area <= this._palmMinArea)  kind = 'finger'
            else                                  kind = 'palm'
        }

        return {
            pointerId: event.pointerId,
            pointerType: event.pointerType || 'unknown',
            kind,
            width,
            height,
            isPrimary: event.isPrimary,
        }
    }

    private _computePrimaryKind(): PointerKind {
        let best: PointerKind = 'unknown'
        let bestPrio = 0
        for (const info of this._pointers.values()) {
            const p = KIND_PRIORITY[info.kind]
            if (p > bestPrio) {
                bestPrio = p
                best = info.kind
            }
        }
        return best
    }

    private _emit(): void {
        if (this._listeners.size === 0) return
        const snap = this.snapshot()
        for (const fn of this._listeners) fn(snap)
    }
}
