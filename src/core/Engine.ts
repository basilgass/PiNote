import {Layer} from "@core/Layer"
import {BackgroundMode, BackgroundState, LayerName, ToolType} from "../types"
import {
    Adaptable,
    isPointBased,
    isStrokeBased,
    PointBasedShape,
    ShapePatch,
    StrokeBasedShape
} from "../shapes/Adaptable"
import {AbstractShape} from "../shapes/AbstractShape"
import {AbstractWidgetShape} from "../shapes/AbstractWidgetShape"
import {Stroke} from "../shapes/Stroke"
import {Point} from "../shapes/GeometryTypes"
import {SnapManager} from "../snap/SnapManager"
import {type SnapGeometry, SnapWorkerClient} from "../snap/SnapWorkerClient"
import {ShapeFactory, ShapeStartConfig} from "@core/ShapeFactory"
import {drawGrid, drawHex, drawRuled} from "@core/helper"
import {SnapRenderer} from "../snap/visual/SnapRenderer"
import type {SnapResult} from "../snap/SnapResult"
import type {IDrawingContext} from "./DrawingContext"
import {HoldIndicatorRenderer} from "./HoldIndicatorRenderer"
import {TextShape} from "../shapes/TextShape"

interface PersistedState {
    title?: string
    background?: BackgroundState
    shapes?: unknown[]
}

function isPersistedState(value: unknown): value is PersistedState {
    if (value === null || typeof value !== 'object') return false
    const v = value as Record<string, unknown>
    if (v.title !== undefined && typeof v.title !== 'string') return false
    if (v.shapes !== undefined && !Array.isArray(v.shapes)) return false
    if (v.background !== undefined && !isBackgroundState(v.background)) return false
    return true
}

function isBackgroundState(value: unknown): value is BackgroundState {
    if (value === null || typeof value !== 'object') return false
    const v = value as Record<string, unknown>
    return typeof v.mode === 'string'
        && (v.mode === 'none' || v.mode === 'grid' || v.mode === 'ruled' || v.mode === 'hex')
}

type HandleKind = 'move' | 'duplicate' | 'delete'
type SnapResolution = { x: number; y: number; snapResult: SnapResult | null }

/** Entrée d'historique pour undo/redo. */
type HistoryEntry =
    | { type: 'add'; shape: Adaptable }
    | { type: 'erase'; before: Adaptable[]; after: Adaptable[] }

export class Engine {
    public bezier = false // toggle global
    private _title = ''

    private static NO_SNAP_TOOLS = new Set<ToolType>(['pen', 'highlighter', 'text'])
    private static HOVER_SNAP_EXCLUDED = new Set<ToolType>([...Engine.NO_SNAP_TOOLS, 'eraser', 'move', 'select'])

    /** Délai max (ms) au-delà duquel un résultat de hover snap caché est considéré périmé. */
    private static SNAP_FRESHNESS_MS = 200
    /** Durée (ms) du fade-out du tempLayer après commit d'une shape sans layer, et du hold pending. */
    private static HOLD_DEFAULT_MS = 500
    private static TEMP_FADE_MS = 500

    /** Tolérances et tailles (en pixels écran) utilisées pour le hit-test et les overlays. */
    private static readonly HIT = {
        POINT_TOLERANCE_PX: 14,    // 1er/dernier point d'une shape en cours
        HANDLE_TOLERANCE_PX: 14,   // handles move/duplicate/delete
        SHAPE_TOLERANCE_PX: 6,     // findShapeAt
        SELECTION_PAD_PX: 8,       // padding bounding box sélection
        HANDLE_RADIUS_PX: 7,       // rayon des cercles handles
        HANDLE_GAP_PX: 20,         // espacement entre handles
    } as const

    /** Palette centralisée pour les overlays (sélection, indicateurs, points validés). */
    private static readonly COLORS = {
        SELECTION: '#3b82f6',          // bounding box + handles move/duplicate
        SELECTION_DELETE: '#ef4444',          // handle delete
        REFERENCE_BORDER: '#aaaaaa',          // bordure du PDF de référence
        POINT_VALIDATED: '#888',             // points déjà commit
        POINT_FIRST_RING: '#22c55e',          // anneau 1er point (closable)
        POINT_LAST_RING: '#f97316',          // anneau dernier point (open path)
        GRID_PREVIEW: '#00A8FF',          // overlay temporaire de la grille de snap
        HOLD_PENDING: 'rgba(0, 120, 255, 0.85)',
        HOLD_PENDING_BG: 'rgba(0, 120, 255, 0.20)',
        HOLD_ADJUSTING: 'rgba(0, 180, 80, 0.95)',
        EXPORT_BG: 'white',
    } as const

    private container: HTMLDivElement
    private overlay!: Layer
    private _tempLayer!: Layer
    private _layers: Record<LayerName, Layer>
    private _shapes: Adaptable[] = []
    private _currentShape: Adaptable | null = null
    private _drawState: 'idle' | 'drawing-points' | 'drawing-stroke' = 'idle'
    /** Point en cours de preview (curseur entre 2 commits). Commit au pointerup. */
    private _pendingPoint: Point | null = null
    private _strokeStartTime = 0
    private _background: BackgroundState = {
        mode: 'none',
        grid: {size: 80, color: '#777777', lineWidth: 1},
        ruled: {spacing: 40, color: '#777777', lineWidth: 1},
        hex: {size: 40, color: '#777777', lineWidth: 1, orientation: 'pointy'},
    }
    private _pageId = 'default'
    private _onSaveCallback?: () => void
    private _snapManager: SnapManager = new SnapManager({snapRadius: 10})
    private _snapWorkerClient: SnapWorkerClient
    private _geometryDirty = true
    private _cachedGeometry: SnapGeometry = {points: [], segments: [], circles: []}
    private snapRenderer: SnapRenderer
    private holdRenderer: HoldIndicatorRenderer
    private _resizeObserver: ResizeObserver
    private _viewTransform = {x: 0, y: 0, scale: 1}
    private _referenceBitmap: ImageBitmap | null = null
    private _history: HistoryEntry[] = []
    private _redoStack: HistoryEntry[] = []
    private _selectedShapeId: string | null = null
    /** Session de gomme en cours : snapshot du _shapes array au début. */
    private _eraseSession: { before: Adaptable[]; layer: LayerName | null } | null = null
    private _snapGridEnabled = false
    private _snapGridSize = 80
    private _gridPreviewTimer: ReturnType<typeof setTimeout> | null = null
    private _tempFadeTimer: ReturnType<typeof requestAnimationFrame> | null = null

    // --- Hold indicator (long-press tactile sur 1er point) ---
    private _holdState: 'idle' | 'pending' | 'adjusting' = 'idle'
    private _holdAnchor: Point = {x: 0, y: 0}
    private _holdStartTime = 0
    private _holdDuration = Engine.HOLD_DEFAULT_MS
    private _holdRafId: number | null = null
    private _lastHoverSnap: { reqX: number; reqY: number; result: SnapResult | null; ts: number } | null = null

    constructor(container: HTMLDivElement, defaultBackground?: BackgroundState) {
        this.container = container
        this.container.style.position = 'relative'

        this._layers = {
            BACKGROUND: new Layer(this.container, {name: 'BACKGROUND', zIndex: 1}),
            REFERENCE: new Layer(this.container, {name: 'REFERENCE', zIndex: 2}),
            OVERLAY: new Layer(this.container, {name: 'OVERLAY', zIndex: 3}),
            MAIN: new Layer(this.container, {name: 'MAIN', zIndex: 4}),
            LAYER: new Layer(this.container, {name: 'LAYER', zIndex: 5}),
        }

        this._tempLayer = new Layer(this.container, {name: 'TEMP', zIndex: 6})
        this.overlay = new Layer(this.container, {name: 'overlay', zIndex: 99})

        this.snapRenderer = new SnapRenderer(this.overlay.ctx)
        this.holdRenderer = new HoldIndicatorRenderer(this.overlay.ctx, {
            pending: Engine.COLORS.HOLD_PENDING,
            pendingBg: Engine.COLORS.HOLD_PENDING_BG,
            adjusting: Engine.COLORS.HOLD_ADJUSTING,
        })
        this._snapWorkerClient = new SnapWorkerClient()

        if (defaultBackground) this._applyBackground(defaultBackground)

        this._resizeObserver = new ResizeObserver(() => this.resize())
        this._resizeObserver.observe(this.container)

        // Injecte le callback de re-render pour les TextShapes async
        TextShape.redrawCallback = () => this.draw()

        // Grid snap désactivé par défaut
        this._snapManager.setStrategyEnabled('grid', false)
    }

    get snapGridEnabled(): boolean {
        return this._snapGridEnabled
    }

    set snapGridEnabled(enabled: boolean) {
        this._snapGridEnabled = enabled
        this._snapManager.setStrategyEnabled('grid', enabled)
    }

    get snapGridSize(): number {
        return this._snapGridSize
    }

    set snapGridSize(size: number) {
        this._snapGridSize = size
        this._snapManager.setGridSize(size)
    }

    get snapManager(): SnapManager {
        return this._snapManager
    }

    private get _storageKey(): string {
        return 'pi_note_draft_' + this._pageId
    }

    setPageId(id: string) {
        this._pageId = id
    }

    set onSave(cb: () => void) {
        this._onSaveCallback = cb
    }

    setViewTransform(x: number, y: number, scale: number) {
        this._viewTransform = {x, y, scale}
    }

    get shapes(): readonly Adaptable[] {
        return this._shapes
    }

    get currentShape(): Adaptable | null {
        return this._currentShape
    }

    get layers(): Layer[] {
        return Object.values(this._layers)
    }

    get mode(): BackgroundMode {
        return this._background.mode
    }

    set mode(value: BackgroundMode) {
        this._background.mode = value
    }

    get title(): string {
        return this._title
    }

    set title(value: string) {
        this._title = value
        this._safeSave()
    }

    get backgroundState(): BackgroundState {
        return {...this._background}
    }

    // --- Shape creation (FSM unifiée, contrat point-based) ---

    /** Crée la shape courante et met l'engine en état de dessin. Ne stage aucun point. */
    beginDraw(config: ShapeStartConfig): Adaptable {
        this._cancelTempFade()
        const shape = ShapeFactory.create(config)
        this._currentShape = shape
        this._pendingPoint = null

        if (isStrokeBased(shape)) {
            this._drawState = 'drawing-stroke'
            this._strokeStartTime = Date.now()
            // Propage le toggle bezier global sur le Stroke en cours
            if (shape instanceof Stroke) shape.bezier = this.bezier
        } else {
            this._drawState = 'drawing-points'
        }
        return shape
    }

    /**
     * pointerdown sur le canvas pendant un dessin.
     * - Stroke : ajoute le point initial.
     * - Point-based : si clic sur 1er/dernier point validé (≥ minPoints), finalize.
     *   Sinon : si c'est le 1er point de la shape, commit immédiatement (cas du drag
     *   tablette : down=p0, up=p1). Pour les points suivants, alimente le pending
     *   point ; il sera commit au pointerup.
     */
    pointerDown(x: number, y: number): 'staged' | 'closed' | 'finished' | 'dialog' | 'noop' {
        const shape = this._currentShape
        if (!shape) return 'noop'

        if (this._drawState === 'drawing-stroke' && isStrokeBased(shape)) {
            return this._pointerDownStroke(shape, x, y)
        }
        if (this._drawState === 'drawing-points' && isPointBased(shape)) {
            return this._pointerDownPoints(shape, x, y)
        }
        return 'noop'
    }

    /** pointerDown branche stroke : ajoute simplement un point au tracé. */
    private _pointerDownStroke(shape: StrokeBasedShape, x: number, y: number): 'staged' {
        shape.addPoint({x, y, t: Date.now() - this._strokeStartTime})
        return 'staged'
    }

    /** pointerDown branche point-based : finalize si clic 1er/dernier point, sinon stage. */
    private _pointerDownPoints(shape: PointBasedShape, x: number, y: number): 'staged' | 'closed' | 'finished' | 'dialog' {
        // Hit-test sur les points validés (prime sur snap)
        if (shape.points.length >= shape.minPoints) {
            if (this.isOverFirstPoint(x, y)) {
                shape.finalize(true)
                this._commitCurrentShape()
                return 'closed'
            }
            if (this.isOverLastPoint(x, y)) {
                shape.finalize(false)
                this._commitCurrentShape()
                return 'closed'
            }
        }

        const snapped = this._maybeSnap(x, y, shape)
        const p = {x: snapped.x, y: snapped.y}

        if (shape.points.length === 0) {
            // 1er point : commit immédiat (flux drag tablette : down=p0, up=p1)
            shape.commitPoint(p)
            this._pendingPoint = null
            if (shape.points.length >= shape.maxPoints) {
                return this._finalizePointShape(shape)
            }
        } else {
            // Points suivants : pending, commit au pointerup
            this._pendingPoint = p
            shape.previewWith(shape.points, p)
        }
        this._drawPointPreview(snapped.snapResult)
        return 'staged'
    }

    /** pointermove pendant un dessin. Met à jour la preview (curseur, snap, indicateurs). */
    pointerMove(x: number, y: number): void {
        const shape = this._currentShape
        if (!shape) return

        if (this._drawState === 'drawing-stroke' && isStrokeBased(shape)) {
            const t = Date.now() - this._strokeStartTime
            shape.addPoint({x, y, t, pressure: 0})
            this.overlay.clear()
            this._tempLayer.clear()
            const {x: tx, y: ty, scale} = this._viewTransform
            const ctx = this._tempLayer.ctx
            ctx.save()
            ctx.translate(tx, ty)
            ctx.scale(scale, scale)
            shape.draw(ctx)
            ctx.restore()
            return
        }

        if (this._drawState === 'drawing-points' && isPointBased(shape)) {
            const snapped = this._maybeSnap(x, y, shape)
            this._pendingPoint = {x: snapped.x, y: snapped.y}
            shape.previewWith(shape.points, this._pendingPoint)
            this._drawPointPreview(snapped.snapResult)
        }
    }

    /**
     * pointerup pendant un dessin.
     * - Stroke : finalize le tracé.
     * - Point-based : si un pending point existe, le commit. Si maxPoints est
     *   atteint, finalize. Pour les widgets, retourne 'dialog'.
     */
    pointerUp(_x: number, _y: number): 'continue' | 'finished' | 'dialog' {
        const shape = this._currentShape
        if (!shape) return 'finished'

        if (this._drawState === 'drawing-stroke' && isStrokeBased(shape)) {
            shape.onEnd?.()
            this._commitCurrentShape()
            return 'finished'
        }

        if (this._drawState === 'drawing-points' && isPointBased(shape)) {
            if (this._pendingPoint && shape.points.length < shape.maxPoints) {
                shape.commitPoint(this._pendingPoint)
                this._pendingPoint = null
                if (shape.points.length >= shape.maxPoints) {
                    return this._finalizePointShape(shape)
                }
            }
            this._drawPointPreview(null)
            return 'continue'
        }

        return 'finished'
    }

    /** Finalise une shape point-based qui vient d'atteindre maxPoints. */
    private _finalizePointShape(shape: PointBasedShape): 'finished' | 'dialog' {
        shape.finalize(false)
        if (shape instanceof AbstractWidgetShape) {
            if (!shape.hasSufficientSize()) {
                this.cancelDraw()
                return 'finished'
            }
            return 'dialog'
        }
        this._commitCurrentShape()
        return 'finished'
    }

    // --- Eraser (gomme destructive) ---

    /**
     * Démarre une session de gomme sur le layer donné.
     * Snapshot du _shapes array pour permettre l'undo.
     */
    beginErase(layer: LayerName | null): void {
        this._eraseSession = {
            before: this._shapes.slice(),
            layer,
        }
    }

    /**
     * Applique un coup de gomme circulaire (centre x,y, rayon r) sur le layer actif.
     * Stroke : découpé via eraseInCircle.
     * Autres shapes non-widget : si hitTest, rasterisées en Stroke puis découpées.
     * Widgets (AbstractWidgetShape) : intouchables.
     * Affiche un cercle pointillé sous le curseur sur l'overlay.
     */
    eraseAt(x: number, y: number, r: number): void {
        if (!this._eraseSession) return
        const layer = this._eraseSession.layer

        for (let i = this._shapes.length - 1; i >= 0; i--) {
            const shape = this._shapes[i]
            if (shape.layer !== layer) continue
            if (shape.hidden) continue
            if (shape instanceof AbstractWidgetShape) continue

            if (shape instanceof Stroke) {
                const result = shape.eraseInCircle(x, y, r)
                if (result === null) continue
                this._shapes.splice(i, 1, ...result)
            } else if ((shape as AbstractShape).hitTest(x, y, r)) {
                // Conversion paramétrique → Stroke équivalent, puis découpe.
                const converted = this._rasterizeToStroke(shape as AbstractShape)
                if (!converted) {
                    this._shapes.splice(i, 1)
                    continue
                }
                const result = converted.eraseInCircle(x, y, r)
                if (result === null) {
                    // shape touchée mais aucun point dans le cercle (rare) : remplace par le stroke complet
                    this._shapes.splice(i, 1, converted)
                } else {
                    this._shapes.splice(i, 1, ...result)
                }
            }
        }

        this._markGeometryDirty()
        this.draw()
        this._drawEraseCursor(x, y, r)
    }

    /** Finalise la session de gomme. Push une entrée d'historique si quelque chose a changé. */
    endErase(): void {
        const session = this._eraseSession
        this._eraseSession = null
        this.overlay.clear()
        if (!session) return

        const changed = session.before.length !== this._shapes.length
            || session.before.some((s, i) => s !== this._shapes[i])

        if (!changed) return

        this._history.push({
            type: 'erase',
            before: session.before,
            after: this._shapes.slice(),
        })
        this._redoStack = []
        this._safeSave()
    }

    /**
     * Convertit une shape paramétrique en Stroke équivalent par rasterisation.
     * Hérite couleur/largeur/layer/lineStyle. Retourne null si la rasterisation
     * ne produit pas assez de points pour former un Stroke valide.
     */
    private _rasterizeToStroke(shape: AbstractShape): Stroke | null {
        const raw = shape.rasterize(2)
        if (raw.length < 2) return null
        // Simplification (Douglas-Peucker) : retire les points colinéaires
        // pour limiter la taille du JSON sans perte visuelle.
        const points = Stroke.simplify(raw, 0.5)
        return new Stroke(
            { tool: 'pen', bezier: false, points },
            {
                tool: 'pen',
                layer: shape.layer,
                color: shape.color,
                width: shape.width,
                hidden: false,
                lineStyle: shape.lineStyle,
                arrowStart: shape.arrowStart,
                arrowEnd: shape.arrowEnd,
                arrowStyle: shape.arrowStyle,
            }
        )
    }

    private _drawEraseCursor(x: number, y: number, r: number): void {
        const { x: tx, y: ty, scale } = this._viewTransform
        const ctx = this.overlay.ctx
        this.overlay.clear()
        ctx.save()
        ctx.translate(tx, ty)
        ctx.scale(scale, scale)
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)'
        ctx.lineWidth = 1 / scale
        ctx.setLineDash([4 / scale, 4 / scale])
        ctx.stroke()
        ctx.setLineDash([])
        ctx.restore()
    }

    /** Annule le dessin en cours sans finaliser ni sauvegarder. */
    cancelDraw(): void {
        if (!this._currentShape) return
        this._cancelTempFade()
        this._currentShape = null
        this._pendingPoint = null
        this._drawState = 'idle'
        this.overlay.clear()
        this._tempLayer.clear()
    }

    /** Finalise un widget après confirmation du dialog. */
    finalizeWidget(): void {
        if (!this._currentShape) return
        this._commitCurrentShape()
    }

    /** Hit-test sur le 1er point validé. */
    isOverFirstPoint(x: number, y: number): boolean {
        const shape = this._currentShape
        if (!shape || !isPointBased(shape)) return false
        const pts = shape.points
        if (pts.length === 0) return false
        const tol = Engine.HIT.POINT_TOLERANCE_PX / this._viewTransform.scale
        return Math.hypot(x - pts[0].x, y - pts[0].y) <= tol
    }

    /** Hit-test sur le dernier point validé. */
    isOverLastPoint(x: number, y: number): boolean {
        const shape = this._currentShape
        if (!shape || !isPointBased(shape)) return false
        const pts = shape.points
        if (pts.length === 0) return false
        const last = pts[pts.length - 1]
        const tol = Engine.HIT.POINT_TOLERANCE_PX / this._viewTransform.scale
        return Math.hypot(x - last.x, y - last.y) <= tol
    }

    private _maybeSnap(x: number, y: number, shape: Adaptable): SnapResolution {
        if (Engine.NO_SNAP_TOOLS.has(shape.tool)) return {x, y, snapResult: null}
        const snapResult = this.snapManager.snap(x, y, this._shapes, shape.layer)
        return {
            x: snapResult?.x ?? x,
            y: snapResult?.y ?? y,
            snapResult,
        }
    }

    /** Dessine la shape sur tempLayer + indicateurs (snap, points validés) sur overlay. */
    private _drawPointPreview(snapResult: SnapResult | null): void {
        const shape = this._currentShape
        if (!shape) return

        this.overlay.clear()
        this._tempLayer.clear()

        const {x: tx, y: ty, scale} = this._viewTransform

        const tCtx = this._tempLayer.ctx
        tCtx.save()
        tCtx.translate(tx, ty)
        tCtx.scale(scale, scale)
        shape.draw(tCtx)
        tCtx.restore()

        const oCtx = this.overlay.ctx
        oCtx.save()
        oCtx.translate(tx, ty)
        oCtx.scale(scale, scale)
        if (snapResult) this.snapRenderer.draw(snapResult)
        if (isPointBased(shape)) this._drawPointsOverlay(oCtx, shape, scale)
        oCtx.restore()
    }

    /** Dessine les points validés (cercles gris) + anneaux 1er/dernier point si fermable. */
    private _drawPointsOverlay(ctx: CanvasRenderingContext2D, shape: PointBasedShape, scale: number): void {
        const pts = shape.points
        if (pts.length === 0) return
        const r = 4 / scale
        ctx.fillStyle = Engine.COLORS.POINT_VALIDATED
        for (const p of pts) {
            ctx.beginPath()
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
            ctx.fill()
        }
        if (pts.length >= shape.minPoints) {
            ctx.lineWidth = 2 / scale
            ctx.beginPath()
            ctx.arc(pts[0].x, pts[0].y, r * 2, 0, Math.PI * 2)
            ctx.strokeStyle = Engine.COLORS.POINT_FIRST_RING
            ctx.stroke()
            if (pts.length > 1) {
                ctx.beginPath()
                ctx.arc(pts[pts.length - 1].x, pts[pts.length - 1].y, r * 2, 0, Math.PI * 2)
                ctx.strokeStyle = Engine.COLORS.POINT_LAST_RING
                ctx.stroke()
            }
        }
    }

    private _commitCurrentShape() {
        const shape = this._currentShape
        if (!shape) return
        this._currentShape = null
        this._pendingPoint = null
        this._drawState = 'idle'
        this.overlay.clear()
        this._tempLayer.clear()

        if ((shape as AbstractShape).isEmpty()) return

        if (shape.layer === null) {
            this._startTempFade(shape)
            return
        }

        this._shapes.push(shape)
        this._history.push({ type: 'add', shape })
        this._redoStack = []
        this._markGeometryDirty()

        const layer = this.getLayer(shape.layer)
        const ctx = layer.ctx
        if (shape.layer !== 'BACKGROUND') {
            const {x: tx, y: ty, scale} = this._viewTransform
            ctx.save()
            ctx.translate(tx, ty)
            ctx.scale(scale, scale)
            shape.draw(ctx)
            ctx.restore()
        } else {
            shape.draw(ctx)
        }

        try {
            this.saveLocal()
        } catch {
            this._shapes.pop()
            this._history.pop()
            this.draw()
        }
    }

    private _startTempFade(shape: Adaptable) {
        this._cancelTempFade()
        const {x: tx, y: ty, scale} = this._viewTransform
        const ctx = this._tempLayer.ctx
        ctx.save()
        ctx.translate(tx, ty)
        ctx.scale(scale, scale)
        shape.draw(ctx)
        ctx.restore()

        const startTime = performance.now()
        const animate = (now: number) => {
            const progress = Math.min((now - startTime) / Engine.TEMP_FADE_MS, 1)
            this._tempLayer.canvas.style.opacity = (1 - progress).toString()
            if (progress < 1) {
                this._tempFadeTimer = requestAnimationFrame(animate)
            } else {
                this._tempFadeTimer = null
                this._tempLayer.clear()
                this._tempLayer.canvas.style.opacity = '1'
            }
        }
        this._tempFadeTimer = requestAnimationFrame(animate)
    }

    private _cancelTempFade() {
        if (this._tempFadeTimer !== null) {
            cancelAnimationFrame(this._tempFadeTimer)
            this._tempFadeTimer = null
            this._tempLayer.clear()
            this._tempLayer.canvas.style.opacity = '1'
        }
    }

    private _buildDrawingContext(): IDrawingContext {
        const self = this
        return {
            get overlayCtx() {
                return self.overlay.ctx
            },
            snap: (x, y, layer) => self._snapManager.snap(x, y, self._shapes, layer),
            getLayer: (name) => self.getLayer(name),
            get viewTransform() {
                return self._viewTransform
            },
            drawSnapIndicator: (result) => {
                self.snapRenderer.draw(result)
            },
            get bezierEnabled() {
                return self.bezier
            },
        }
    }

    // --- Layer management ---
    getLayer(name: LayerName): Layer {
        return this._layers[name] ?? this._layers['MAIN']
    }

    setLayerVisibility(name: LayerName, visible: boolean) {
        const layer = this.getLayer(name)
        layer.visible = visible
        layer.canvas.style.display = visible ? 'block' : 'none'
    }

    setLayerOpacity(name: LayerName, opacity: number) {
        const layer = this.getLayer(name)
        layer.opacity = opacity
        layer.canvas.style.opacity = opacity.toString()
    }

    clearLayer(name: LayerName) {
        this.getLayer(name)?.clear()
    }

    clearAll() {
        for (const layer of Object.values(this._layers)) {
            if (layer.visible && !layer.locked
                && layer.name !== 'BACKGROUND'
                && layer.name !== 'REFERENCE'
                && layer.name !== 'OVERLAY') layer.clear()
        }
        this._tempLayer.clear()
    }

    get referenceBitmap(): ImageBitmap | null {
        return this._referenceBitmap
    }

    setReferenceBitmap(bitmap: ImageBitmap | null) {
        this._referenceBitmap = bitmap
        this._drawReference()
    }

    private _drawReference() {
        const layer = this._layers['REFERENCE']
        layer.clear()
        if (!this._referenceBitmap) return
        const {x: tx, y: ty, scale} = this._viewTransform
        const ctx = layer.ctx
        ctx.save()
        ctx.translate(tx, ty)
        ctx.scale(scale, scale)
        ctx.drawImage(this._referenceBitmap, 0, 0)
        ctx.strokeStyle = Engine.COLORS.REFERENCE_BORDER
        ctx.lineWidth = 1
        ctx.strokeRect(0, 0, this._referenceBitmap.width, this._referenceBitmap.height)
        ctx.restore()
    }

    // --- Drawing ---
    // excludeLayer: si fourni, les shapes appartenant à ce layer sont ignorées
    draw(excludeLayer?: LayerName) {
        this._drawReference()
        this.clearAll()
        const byLayer = new Map<LayerName, Adaptable[]>()
        for (const shape of this._shapes) {
            if (!shape.layer) continue
            if (excludeLayer && shape.layer === excludeLayer) continue
            if (shape.hidden) continue
            const arr = byLayer.get(shape.layer)
            if (arr) arr.push(shape)
            else byLayer.set(shape.layer, [shape])
        }
        const {x: tx, y: ty, scale} = this._viewTransform
        for (const [name, shapes] of byLayer) {
            const ctx = this.getLayer(name).ctx
            if (name !== 'BACKGROUND') {
                ctx.save()
                ctx.translate(tx, ty)
                ctx.scale(scale, scale)
            }
            for (const shape of shapes) shape.draw(ctx)
            if (name !== 'BACKGROUND') {
                ctx.restore()
            }
        }
        // Redessine la sélection si pas en cours de dessin
        if (!this._currentShape) this._drawSelectionOverlay()
    }

    resize() {
        for (const layer of [...Object.values(this._layers), this._tempLayer, this.overlay]) {
            layer.resize(this.container)
        }
        // A4: ctx overlay mis à jour après resize (défensif)
        this.snapRenderer.updateCtx(this.overlay.ctx)
        this.holdRenderer.updateCtx(this.overlay.ctx)
        // P3/P4: renderBackground ne call plus draw(), appelé explicitement ici
        this.renderBackground(this._background)
        this.draw()
    }

    // --- Background ---
    setBackground(state: BackgroundState) {
        this._applyBackground(state)
        this.draw()
        this._safeSave()
    }

    private _applyBackground(state: BackgroundState) {
        this._background = {
            mode: state.mode,
            grid: state.grid ?? this._background.grid,
            ruled: state.ruled ?? this._background.ruled,
            hex: state.hex ?? this._background.hex,
        }
        // Synchronise la taille du grid snap avec le fond (nécessaire aussi via loadFromJSONData)
        if (state.mode === 'grid' && state.grid?.size) {
            this._snapGridSize = state.grid.size
            this._snapManager.setGridSize(state.grid.size)
        }
        this.renderBackground(this._background)
    }

    private renderBackground(state: BackgroundState) {
        const layer = this.getLayer('OVERLAY')
        const ctx = layer.ctx
        const w = layer.canvas.width
        const h = layer.canvas.height
        ctx.clearRect(0, 0, w, h)

        switch (state.mode) {
            case 'grid':
                drawGrid(ctx, w, h, state.grid!)
                break
            case 'ruled':
                drawRuled(ctx, w, h, state.ruled!)
                break
            case 'hex':
                drawHex(ctx, w, h, state.hex!)
                break
        }
    }

    // --- LocalStorage ---
    getShapeById(id: string): Adaptable | undefined {
        return this._shapes.find(s => s.id === id)
    }

    updateShapeProps(id: string, patch: ShapePatch): void {
        const shape = this._shapes.find(s => s.id === id)
        if (!shape) return
        Object.assign(shape, patch)
        this.draw()
        this._drawSelectionOverlay()
        this._safeSave()
    }

    resetState() {
        this._shapes = []
        this._history = []
        this._redoStack = []
        this._selectedShapeId = null
        this._title = ''
        this._markGeometryDirty()
        this.overlay.clear()
        this.clearAll()
        this._applyBackground({mode: 'none'})
        this.setReferenceBitmap(null)
    }

    resetAll() {
        this.resetState()
        this._safeSave()
    }

    toJSONData(): PersistedState {
        return {title: this._title, background: {...this._background}, shapes: this._shapes.map(s => s.toJSON())}
    }

    saveLocal() {
        localStorage.setItem(this._storageKey, JSON.stringify(this.toJSONData()))
        this._onSaveCallback?.()
    }

    /** Tente de persister localStorage en avalant les exceptions (quota, mode privé, etc.). */
    private _safeSave(): void {
        try { this.saveLocal() } catch { /* ignore */ }
    }

    loadFromJSONData(parsed: unknown): void {
        // rétrocompatibilité : ancien format = tableau direct
        let shapesData: unknown[]
        let title = ''
        let background: BackgroundState | null = null

        if (Array.isArray(parsed)) {
            shapesData = parsed
        } else if (isPersistedState(parsed)) {
            shapesData = parsed.shapes ?? []
            title = typeof parsed.title === 'string' ? parsed.title : ''
            if (parsed.background && isBackgroundState(parsed.background)) {
                background = parsed.background
            }
        } else {
            console.warn('[PiNote] loadFromJSONData: format JSON invalide, état réinitialisé')
            this.resetState()
            return
        }

        this._title = title
        if (background) this._applyBackground(background)

        let skipped = 0
        let droppedEraser = 0
        this._shapes = shapesData.map((s) => {
            // Anciens fichiers : les Stroke tool='eraser' ne sont plus persistés (gomme destructive).
            const opts = (s as { options?: { tool?: string } } | null)?.options
            if (opts?.tool === 'eraser') {
                droppedEraser++
                return null
            }
            const shape = ShapeFactory.fromJSON(s)
            if (!shape) skipped++
            return shape
        }).filter((s): s is Adaptable => s !== null)

        if (skipped > 0) {
            console.warn(`[PiNote] loadFromJSONData: ${skipped} forme(s) ignorée(s) (données invalides ou outil inconnu)`)
        }
        if (droppedEraser > 0) {
            console.info(`[PiNote] loadFromJSONData: ${droppedEraser} ancienne(s) gomme(s) ignorée(s) (format obsolète)`)
        }

        this._history = []
        this._redoStack = []
        this._selectedShapeId = null
        this._markGeometryDirty()
        this.draw()
        this._safeSave()
    }

    loadLocal() {
        const raw = localStorage.getItem(this._storageKey)
        if (!raw) return

        let parsed: unknown
        try {
            parsed = JSON.parse(raw)
        } catch {
            console.warn('[PiNote] loadLocal: données localStorage invalides, ignorées')
            return
        }

        this.loadFromJSONData(parsed)
    }

    exportPNG(): string {
        const ref = this._layers.MAIN.canvas
        const offscreen = document.createElement('canvas')
        offscreen.width = ref.width
        offscreen.height = ref.height
        const ctx = offscreen.getContext('2d')!
        ctx.fillStyle = Engine.COLORS.EXPORT_BG
        ctx.fillRect(0, 0, offscreen.width, offscreen.height)
        // Composite des layers dans l'ordre d'affichage écran (z-index croissant) :
        // BACKGROUND (z1) → REFERENCE (z2) → OVERLAY (z3, fond grid/ruled) → MAIN (z4) → LAYER (z5)
        for (const name of ['BACKGROUND', 'REFERENCE', 'OVERLAY', 'MAIN', 'LAYER'] as LayerName[]) {
            if (this._layers[name].visible) ctx.drawImage(this._layers[name].canvas, 0, 0)
        }
        return offscreen.toDataURL('image/png')
    }

    exportA4(orientation: 'portrait' | 'landscape' | 'auto'): string {
        const mmToPx = (mm: number) => Math.round(mm / 25.4 * 150) // 150 DPI
        const margin = mmToPx(15)

        // Bounding box de toutes les shapes visibles
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        for (const shape of this._shapes) {
            if (shape.hidden || !shape.layer) continue
            const b = shape.getBounds()
            if (!b) continue
            if (b.minX < minX) minX = b.minX
            if (b.minY < minY) minY = b.minY
            if (b.maxX > maxX) maxX = b.maxX
            if (b.maxY > maxY) maxY = b.maxY
        }
        if (!isFinite(minX)) return this.exportPNG() // fallback si vide

        const contentW = Math.max(maxX - minX, 1)
        const contentH = Math.max(maxY - minY, 1)

        const resolved = orientation === 'auto'
            ? (contentW > contentH ? 'landscape' : 'portrait')
            : orientation
        const isPortrait = resolved === 'portrait'
        const canvasW = mmToPx(isPortrait ? 210 : 297)
        const canvasH = mmToPx(isPortrait ? 297 : 210)

        const scale = Math.min(
            (canvasW - 2 * margin) / contentW,
            (canvasH - 2 * margin) / contentH
        )
        const drawW = contentW * scale
        const drawH = contentH * scale
        const tx = (canvasW - drawW) / 2 - minX * scale
        const ty = (canvasH - drawH) / 2 - minY * scale

        const offscreen = document.createElement('canvas')
        offscreen.width = canvasW
        offscreen.height = canvasH
        const ctx = offscreen.getContext('2d')!

        ctx.fillStyle = Engine.COLORS.EXPORT_BG
        ctx.fillRect(0, 0, canvasW, canvasH)

        // Fond décoratif sur toute la page A4
        if (this._background.mode !== 'none') {
            switch (this._background.mode) {
                case 'grid':
                    drawGrid(ctx, canvasW, canvasH, this._background.grid!)
                    break
                case 'ruled':
                    drawRuled(ctx, canvasW, canvasH, this._background.ruled!)
                    break
                case 'hex':
                    drawHex(ctx, canvasW, canvasH, this._background.hex!)
                    break
            }
        }

        // PDF de référence (sous les shapes), recadré comme les shapes
        ctx.save()
        ctx.translate(tx, ty)
        ctx.scale(scale, scale)
        if (this._referenceBitmap && this._layers.REFERENCE.visible) {
            ctx.drawImage(this._referenceBitmap, 0, 0)
        }
        // Shapes
        for (const layerName of ['BACKGROUND', 'MAIN', 'LAYER'] as LayerName[]) {
            if (!this._layers[layerName].visible) continue
            for (const shape of this._shapes) {
                if (!shape.hidden && shape.layer === layerName) shape.draw(ctx)
            }
        }
        ctx.restore()

        return offscreen.toDataURL('image/png')
    }

    // --- Undo / Redo ---
    get canUndo(): boolean {
        return this._history.length > 0
    }

    get canRedo(): boolean {
        return this._redoStack.length > 0
    }

    undo() {
        if (!this.canUndo) return
        const entry = this._history.pop()!
        if (entry.type === 'add') {
            const idx = this._shapes.indexOf(entry.shape)
            if (idx !== -1) this._shapes.splice(idx, 1)
            if (this._selectedShapeId === entry.shape.id) this._selectedShapeId = null
        } else {
            this._shapes = entry.before.slice()
            // désélectionne si la shape ne fait plus partie du _shapes
            if (this._selectedShapeId && !this._shapes.some(s => s.id === this._selectedShapeId)) {
                this._selectedShapeId = null
            }
        }
        this._redoStack.push(entry)
        this._markGeometryDirty()
        this.draw()
        this._safeSave()
    }

    redo() {
        if (!this.canRedo) return
        const entry = this._redoStack.pop()!
        if (entry.type === 'add') {
            this._shapes.push(entry.shape)
        } else {
            this._shapes = entry.after.slice()
        }
        this._history.push(entry)
        this._markGeometryDirty()
        this.draw()
        this._safeSave()
    }

    // --- Highlight & sélection ---
    highlightShape(id: string) {
        this._selectedShapeId = id
        this._drawSelectionOverlay()
    }

    clearHighlight() {
        this._selectedShapeId = null
        this.overlay.clear()
    }

    private _drawSelectionOverlay() {
        this.overlay.clear()
        if (!this._selectedShapeId) return
        const shape = this._shapes.find(s => s.id === this._selectedShapeId) as AbstractShape | undefined
        if (!shape) return
        const bounds = shape.getBounds()
        if (!bounds) return
        const {x: tx, y: ty, scale} = this._viewTransform
        const ctx = this.overlay.ctx
        ctx.save()
        ctx.translate(tx, ty)
        ctx.scale(scale, scale)
        const pad = Engine.HIT.SELECTION_PAD_PX / scale
        const x = bounds.minX - pad
        const y = bounds.minY - pad
        const w = bounds.maxX - bounds.minX + pad * 2
        const h = bounds.maxY - bounds.minY + pad * 2

        // Bounding box
        ctx.strokeStyle = Engine.COLORS.SELECTION
        ctx.lineWidth = 1.5 / scale
        ctx.setLineDash([5 / scale, 4 / scale])
        ctx.strokeRect(x, y, w, h)
        ctx.setLineDash([])

        const hr = Engine.HIT.HANDLE_RADIUS_PX / scale
        const gap = Engine.HIT.HANDLE_GAP_PX / scale  // espace entre les deux handles

        // Handle de déplacement (coin haut-gauche) — croix ✛
        ctx.fillStyle = Engine.COLORS.SELECTION
        ctx.beginPath()
        ctx.arc(x, y, hr, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 1.5 / scale
        ctx.beginPath()
        ctx.moveTo(x - 3.5 / scale, y)
        ctx.lineTo(x + 3.5 / scale, y)
        ctx.moveTo(x, y - 3.5 / scale)
        ctx.lineTo(x, y + 3.5 / scale)
        ctx.stroke()

        // Handle de duplication (à droite du précédent) — deux carrés ⧉
        const dx2 = x + gap
        ctx.fillStyle = Engine.COLORS.SELECTION
        ctx.beginPath()
        ctx.arc(dx2, y, hr, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 1.2 / scale
        const sq = 2.8 / scale
        const off = 1.5 / scale
        ctx.strokeRect(dx2 - sq - off, y - sq - off, sq * 2, sq * 2)
        ctx.strokeRect(dx2 - sq + off, y - sq + off, sq * 2, sq * 2)

        // Handle de suppression (à droite du précédent) — croix ✕ rouge
        const dx3 = x + gap * 2
        ctx.fillStyle = Engine.COLORS.SELECTION_DELETE
        ctx.beginPath()
        ctx.arc(dx3, y, hr, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 1.5 / scale
        const cx = 3.5 / scale
        ctx.beginPath()
        ctx.moveTo(dx3 - cx, y - cx)
        ctx.lineTo(dx3 + cx, y + cx)
        ctx.moveTo(dx3 + cx, y - cx)
        ctx.lineTo(dx3 - cx, y + cx)
        ctx.stroke()

        ctx.restore()
    }

    get selectedShapeId(): string | null {
        return this._selectedShapeId
    }

    private _handlePositions(bounds: ReturnType<AbstractShape['getBounds']>) {
        if (!bounds) return null
        const {scale} = this._viewTransform
        const pad = Engine.HIT.SELECTION_PAD_PX / scale
        const hx = bounds.minX - pad
        const hy = bounds.minY - pad
        const gap = Engine.HIT.HANDLE_GAP_PX / scale
        return {
            move: {x: hx, y: hy},
            duplicate: {x: hx + gap, y: hy},
            delete: {x: hx + gap * 2, y: hy},
        }
    }

    private _isOverHandle(kind: HandleKind, x: number, y: number): boolean {
        if (!this._selectedShapeId) return false
        const shape = this._shapes.find(s => s.id === this._selectedShapeId) as AbstractShape | undefined
        if (!shape) return false
        const pos = this._handlePositions(shape.getBounds())
        if (!pos) return false
        const target = pos[kind]
        return Math.hypot(x - target.x, y - target.y) * this._viewTransform.scale <= Engine.HIT.HANDLE_TOLERANCE_PX
    }

    isOverMoveHandle(x: number, y: number): boolean      { return this._isOverHandle('move', x, y) }
    isOverDuplicateHandle(x: number, y: number): boolean { return this._isOverHandle('duplicate', x, y) }
    isOverDeleteHandle(x: number, y: number): boolean    { return this._isOverHandle('delete', x, y) }

    // --- Duplication ---
    duplicateShape(id: string): string | null {
        const shape = this._shapes.find(s => s.id === id)
        if (!shape) return null
        // JSON.parse/stringify garantit une copie profonde (pas de références partagées)
        const json = JSON.parse(JSON.stringify(shape.toJSON()))
        delete json.options.id   // force new ID
        json.options.hidden = false
        const clone = ShapeFactory.fromJSON(json)
        if (!clone) return null
        clone.translate(15, 15)
        this._shapes.push(clone)
        this._history.push({ type: 'add', shape: clone })
        this._redoStack = []
        this._markGeometryDirty()
        this._selectedShapeId = clone.id
        this.draw()
        this._safeSave()
        return clone.id
    }

    // Retourne l'id du shape sous (x,y), du plus récent au plus ancien
    findShapeAt(x: number, y: number): string | null {
        const tolerance = Engine.HIT.SHAPE_TOLERANCE_PX / this._viewTransform.scale
        for (let i = this._shapes.length - 1; i >= 0; i--) {
            const shape = this._shapes[i]
            if (shape.hidden) continue
            if (shape.hitTest(x, y, tolerance)) return shape.id
        }
        return null
    }

    // --- Visibilité ---
    toggleVisibility(id: string) {
        const shape = this._shapes.find(s => s.id === id)
        if (!shape) return
        shape.hidden = !shape.hidden
        this.draw()
        this._safeSave()
    }

    // --- Déplacement ---
    moveShape(id: string, dx: number, dy: number) {
        const shape = this._shapes.find(s => s.id === id)
        if (!shape) return
        shape.translate(dx, dy)
        this._markGeometryDirty()
        this.draw()
    }

    // --- Shape destruction ---
    destroyById(id: string) {
        const idx = this._shapes.findIndex(s => s.id === id)
        if (idx === -1) return
        const [removed] = this._shapes.splice(idx, 1)
        this._markGeometryDirty()
        this.draw()
        try {
            this.saveLocal()
        } catch {
            this._shapes.splice(idx, 0, removed)
            this._markGeometryDirty()
            this.draw()
        }
    }

    // --- Grid preview ---
    showGridPreview(duration = 1500) {
        if (this._currentShape) return  // pas pendant un dessin
        if (this._gridPreviewTimer) clearTimeout(this._gridPreviewTimer)
        this._renderGridPreview()
        this._gridPreviewTimer = setTimeout(() => {
            this._gridPreviewTimer = null
            this.overlay.clear()
            this._drawSelectionOverlay()
        }, duration)
    }

    private _renderGridPreview() {
        this.overlay.clear()
        const ctx = this.overlay.ctx
        const w = this.overlay.canvas.width
        const h = this.overlay.canvas.height
        const {x: tx, y: ty, scale} = this._viewTransform
        const size = this._snapGridSize * scale
        if (size <= 0) return
        const offsetX = ((tx % size) + size) % size
        const offsetY = ((ty % size) + size) % size

        ctx.save()
        ctx.strokeStyle = Engine.COLORS.GRID_PREVIEW
        ctx.globalAlpha = 0.35
        ctx.lineWidth = 1
        ctx.setLineDash([2, 4])

        for (let x = offsetX; x <= w + size; x += size) {
            ctx.beginPath()
            ctx.moveTo(x, 0)
            ctx.lineTo(x, h)
            ctx.stroke()
        }
        for (let y = offsetY; y <= h + size; y += size) {
            ctx.beginPath()
            ctx.moveTo(0, y)
            ctx.lineTo(w, y)
            ctx.stroke()
        }

        ctx.setLineDash([])
        ctx.restore()
    }

    async syncRemote(url: string): Promise<void> {
        const res = await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(this.toJSONData()),
        })
        if (!res.ok) throw new Error(`[PiNote] syncRemote: ${res.status} ${res.statusText}`)
    }

    // --- Hover snap ---

    private _getGeometry(): SnapGeometry {
        if (this._geometryDirty) {
            this._cachedGeometry = SnapWorkerClient.buildGeometry(this._shapes)
            this._geometryDirty = false
        }
        return this._cachedGeometry
    }

    private _markGeometryDirty() {
        this._geometryDirty = true
    }

    hoverSnap(x: number, y: number, tool: ToolType): void {
        if (Engine.HOVER_SNAP_EXCLUDED.has(tool)) return
        if (this._currentShape) return

        const geometry = this._getGeometry()
        const reqX = x, reqY = y
        this._snapWorkerClient.request(x, y, geometry, {
            snapRadius: this._snapManager.snapRadius,
            gridEnabled: this._snapGridEnabled,
            gridSize: this._snapGridSize,
            activeLayer: null,
        }, (result) => {
            if (this._currentShape) return
            this._lastHoverSnap = {reqX, reqY, result, ts: performance.now()}

            // Si le hold indicator est actif, son RAF possède l'overlay : on déclenche un redraw.
            if (this._holdState !== 'idle') {
                this._scheduleHoldFrame()
                return
            }

            this.overlay.clear()
            if (!result) return
            const {x: tx, y: ty, scale} = this._viewTransform
            const ctx = this.overlay.ctx
            ctx.save()
            ctx.translate(tx, ty)
            ctx.scale(scale, scale)
            this.snapRenderer.draw(result)
            ctx.restore()
        })
    }

    clearHoverSnap(): void {
        if (this._currentShape) return
        if (this._holdState !== 'idle') return
        this.overlay.clear()
        this._drawSelectionOverlay()
    }

    // --- Hold indicator (long-press tactile) ---

    /** Démarre l'indicateur d'anneau qui se remplit pendant durationMs. */
    startHoldIndicator(x: number, y: number, durationMs: number): void {
        this._holdState = 'pending'
        this._holdAnchor = {x, y}
        this._holdStartTime = performance.now()
        this._holdDuration = durationMs
        this._lastHoverSnap = null
        if (this._holdRafId !== null) {
            cancelAnimationFrame(this._holdRafId)
            this._holdRafId = null
        }
        this._scheduleHoldFrame()
    }

    /** Met à jour la position de l'ancre (utilisé pendant la phase 'adjusting'). */
    updateHoldIndicator(x: number, y: number): void {
        if (this._holdState === 'idle') return
        this._holdAnchor = {x, y}
        if (this._holdState === 'adjusting') this._scheduleHoldFrame()
    }

    /** Bascule en phase 'adjusting' : anneau plein, suit le doigt. */
    completeHoldIndicator(): void {
        if (this._holdState === 'idle') return
        this._holdState = 'adjusting'
        this._scheduleHoldFrame()
    }

    /** Arrête l'indicateur, libère l'overlay. Conserve le cache snap pour resolveSnap. */
    clearHoldIndicator(): void {
        if (this._holdState === 'idle') return
        this._holdState = 'idle'
        if (this._holdRafId !== null) {
            cancelAnimationFrame(this._holdRafId)
            this._holdRafId = null
        }
        this.overlay.clear()
        // Si le dernier snap est encore frais, le redessine pour ne pas faire « clignoter »
        // l'indicateur entre la fin du hold et le prochain pointermove.
        const cached = this._lastHoverSnap
        if (cached?.result && performance.now() - cached.ts <= Engine.SNAP_FRESHNESS_MS) {
            const {x: tx, y: ty, scale} = this._viewTransform
            const ctx = this.overlay.ctx
            ctx.save()
            ctx.translate(tx, ty)
            ctx.scale(scale, scale)
            this.snapRenderer.draw(cached.result)
            ctx.restore()
        } else {
            this._drawSelectionOverlay()
        }
    }

    /** Retourne la position snappée si le dernier résultat hover correspond aux coords demandées. */
    resolveSnap(x: number, y: number, tool: ToolType): { x: number; y: number } | null {
        if (Engine.HOVER_SNAP_EXCLUDED.has(tool)) return null
        const cached = this._lastHoverSnap
        if (!cached || !cached.result) return null
        if (performance.now() - cached.ts > Engine.SNAP_FRESHNESS_MS) return null
        if (Math.abs(cached.reqX - x) < 0.5 && Math.abs(cached.reqY - y) < 0.5) {
            return {x: cached.result.x, y: cached.result.y}
        }
        return null
    }

    /** Programme un (unique) frame de redraw du hold indicator. Idempotent. */
    private _scheduleHoldFrame(): void {
        if (this._holdState === 'idle') return
        if (this._holdRafId !== null) return
        this._holdRafId = requestAnimationFrame((now) => this._renderHoldFrame(now))
    }

    private _renderHoldFrame(now: number): void {
        this._holdRafId = null
        if (this._holdState === 'idle') return

        this.overlay.clear()
        const view = this._viewTransform
        const ctx = this.overlay.ctx

        // En mode 'adjusting', dessine d'abord le snap (sous l'anneau)
        if (this._holdState === 'adjusting' && this._lastHoverSnap?.result) {
            ctx.save()
            ctx.translate(view.x, view.y)
            ctx.scale(view.scale, view.scale)
            this.snapRenderer.draw(this._lastHoverSnap.result)
            ctx.restore()
        }

        const progress = this._holdState === 'adjusting'
            ? 1
            : Math.min(1, (now - this._holdStartTime) / this._holdDuration)

        this.holdRenderer.draw({
            phase: this._holdState,
            anchor: this._holdAnchor,
            progress,
        }, view)

        // En 'pending', l'arc se remplit en continu → ré-arme un RAF.
        // En 'adjusting', le rendu ne change qu'à updateHoldIndicator ou nouveau snap → on s'arrête.
        if (this._holdState === 'pending') {
            this._holdRafId = requestAnimationFrame((t) => this._renderHoldFrame(t))
        }
    }

    destroy() {
        if (this._gridPreviewTimer) clearTimeout(this._gridPreviewTimer)
        if (this._holdRafId !== null) cancelAnimationFrame(this._holdRafId)
        this._cancelTempFade()
        this._resizeObserver.disconnect()
        this._snapWorkerClient.destroy()
    }
}
