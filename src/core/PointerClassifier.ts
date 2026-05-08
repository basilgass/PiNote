/**
 * PointerClassifier — module pur d'observation des PointerEvents.
 *
 * Classifie chaque pointer actif en `pen | finger | palm | mouse | unknown`
 * et expose un snapshot agrégé. **Aucune action** sur la FSM ou l'Engine :
 * cette couche est purement observationnelle.
 *
 * Heuristique paume : `pointerType === 'touch'` et `width > palmThreshold`
 * (ou `height > palmThreshold`). `event.width`/`height` est en pixels CSS,
 * indique la taille de la zone de contact. Doigt typique ≈ 20-30px,
 * paume ≈ 40px et plus. Le seuil est ajustable.
 *
 * Limites connues :
 * - Sur desktop souris, `width/height` vaut 1 → toujours `mouse`.
 * - Certains pilotes stylet renvoient des valeurs de largeur élevées
 *   sur appui fort → faux positif paume. Le widget de visualisation
 *   sert à calibrer empiriquement le seuil.
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
    /** Seuil en pixels CSS pour qu'un touch soit considéré comme une paume (défaut 40) */
    palmThreshold?: number
}

const KIND_PRIORITY: Record<PointerKind, number> = {
    pen: 4,
    finger: 3,
    palm: 2,
    mouse: 1,
    unknown: 0,
}

export class PointerClassifier {
    private _palmThreshold: number
    private _pointers = new Map<number, PointerInfo>()
    private _penEverSeen = false
    private _listeners = new Set<(snap: PointerSnapshot) => void>()

    constructor(options: PointerClassifierOptions = {}) {
        this._palmThreshold = options.palmThreshold ?? 40
    }

    /** Modifie le seuil de détection paume à chaud (utile pour calibrage) */
    setPalmThreshold(value: number): void {
        this._palmThreshold = value
    }

    get palmThreshold(): number {
        return this._palmThreshold
    }

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
        // Une fois qu'un pointer est classifié paume, on ne le rebascule pas
        // en doigt (la zone de contact peut diminuer en cours de drag).
        if (existing.kind === 'palm' && updated.kind === 'finger') {
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

        switch (event.pointerType) {
            case 'pen':
                kind = 'pen'
                break
            case 'mouse':
                kind = 'mouse'
                break
            case 'touch': {
                const maxDim = Math.max(width, height)
                kind = maxDim > this._palmThreshold ? 'palm' : 'finger'
                break
            }
            default:
                kind = 'unknown'
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
