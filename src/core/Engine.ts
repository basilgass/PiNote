import {Layer} from "@core/Layer"
import {BackgroundMode, BackgroundState, LayerName, ToolType} from "../types"
import {Adaptable} from "../shapes/Adaptable"
import {AbstractShape} from "../shapes/AbstractShape"
import {Polygon} from "../shapes/Polygon"
import {Rectangle} from "../shapes/Rectangle"
import {SnapManager} from "../snap/SnapManager"
import {ShapeFactory, ShapeStartConfig} from "@core/ShapeFactory"
import {Stroke} from "../shapes/Stroke"
import {drawAxes, drawGrid, drawRuled} from "@core/helper"
import {SnapRenderer} from "../snap/visual/SnapRenderer"

export class Engine {
    public bezier = false // toggle global

    private static NO_SNAP_TOOLS = new Set<ToolType>(['pen', 'highlighter', 'eraser'])

    private container: HTMLDivElement
    private overlay!: Layer
    private _layers: Record<LayerName, Layer>
    private _shapes: Adaptable[] = []
    private _currentShape: Adaptable | null = null
    private _background: BackgroundState = { mode: 'none' }
    private static readonly localStorageKey = 'pi_note_draft'
    private _snapManager: SnapManager = new SnapManager({snapRadius: 10})
    private snapRenderer: SnapRenderer
    private _resizeObserver: ResizeObserver
    private _viewTransform = { x: 0, y: 0, scale: 1 }
    private _eraserSnapshot: ImageData | null = null
    private _undoStack: Adaptable[] = []
    private _selectedShapeId: string | null = null

    constructor(container: HTMLDivElement) {
        this.container = container
        this.container.style.position = 'relative'

        this._layers = {
            BACKGROUND: new Layer(this.container, { name: 'BACKGROUND', zIndex: 1 }),
            MAIN: new Layer(this.container, { name: 'MAIN', zIndex: 2 }),
            LAYER: new Layer(this.container, { name: 'LAYER', zIndex: 3 }),
        }

        this.overlay = new Layer(this.container, { name: 'overlay', zIndex: 99 })

        this.snapRenderer = new SnapRenderer(this.overlay.ctx)

        this._resizeObserver = new ResizeObserver(() => this.resize())
        this._resizeObserver.observe(this.container)
    }

    get snapManager(): SnapManager {
        return this._snapManager
    }

    setViewTransform(x: number, y: number, scale: number) {
        this._viewTransform = { x, y, scale }
    }

    get shapes(): readonly Adaptable[] { return this._shapes }
    get currentShape(): Adaptable | null { return this._currentShape }
    get layers(): Layer[] { return Object.values(this._layers) }
    get mode(): BackgroundMode { return this._background.mode }
    set mode(value: BackgroundMode) { this._background.mode = value }

    // --- Shape creation ---
    startShape(config: ShapeStartConfig): Adaptable {
        let startX = config.x
        let startY = config.y

        if (!Engine.NO_SNAP_TOOLS.has(config.tool)) {
            const snapResult = this.snapManager.snap(config.x, config.y, this._shapes, config.layer)

            this.overlay.clear()
            const { x: tx, y: ty, scale } = this._viewTransform
            const ctx = this.overlay.ctx
            ctx.save()
            ctx.translate(tx, ty)
            ctx.scale(scale, scale)
            this.snapRenderer.draw(snapResult)
            ctx.restore()

            startX = snapResult?.x ?? config.x
            startY = snapResult?.y ?? config.y
        }

        const shape = ShapeFactory.create({
            ...config,
            x: startX,
            y: startY
        })

        // P1: bezier assigné ici, ajout à _shapes unifié dans endShape
        if (shape instanceof Stroke) shape.bezier = this.bezier

        // Snapshot du layer cible pour l'effacement live
        if (config.tool === 'eraser' && shape.layer !== null) {
            const layer = this.getLayer(shape.layer)
            this._eraserSnapshot = layer.ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height)
        }

        this._currentShape = shape
        return shape
    }

    // Place le deuxième point du rectangle (arête) avec snap. Redessine l'overlay.
    setRectP2(x: number, y: number) {
        if (!(this._currentShape instanceof Rectangle)) return
        const snapResult = this.snapManager.snap(x, y, this._shapes, this._currentShape.layer)
        this._currentShape.setP2(snapResult?.x ?? x, snapResult?.y ?? y)
        this.overlay.clear()
        const { x: tx, y: ty, scale } = this._viewTransform
        const ctx = this.overlay.ctx
        ctx.save()
        ctx.translate(tx, ty)
        ctx.scale(scale, scale)
        this._currentShape.draw(ctx)
        if (snapResult) this.snapRenderer.draw(snapResult)
        ctx.restore()
    }

    // Ajoute un sommet au polygone en cours. Retourne true si le polygone se ferme (clic sur premier sommet).
    addPolygonVertex(x: number, y: number): boolean {
        if (!(this._currentShape instanceof Polygon)) return false
        const polygon = this._currentShape

        // Fermeture si clic proche du premier sommet (≥ 3 sommets existants)
        if (polygon.points.length >= 3) {
            const first = polygon.points[0]
            const screenDist = Math.hypot(x - first.x, y - first.y) * this._viewTransform.scale
            if (screenDist <= 15) {
                polygon.closed = true
                return true
            }
        }

        const snapResult = this.snapManager.snap(x, y, this._shapes, polygon.layer)
        polygon.addVertex(snapResult?.x ?? x, snapResult?.y ?? y)
        return false
    }

    updateShape(x: number, y: number) {
        if (!this._currentShape) return

        this.overlay.clear()

        // Cas polygon : preview curseur + highlight premier sommet si proche
        if (this._currentShape instanceof Polygon) {
            const polygon = this._currentShape
            const { x: tx, y: ty, scale } = this._viewTransform

            let finalX = x, finalY = y
            let snapToFirst = false

            if (polygon.points.length >= 3) {
                const first = polygon.points[0]
                const screenDist = Math.hypot(x - first.x, y - first.y) * scale
                if (screenDist <= 15) {
                    finalX = first.x
                    finalY = first.y
                    snapToFirst = true
                }
            }

            let snapResult = null
            if (!snapToFirst) {
                snapResult = this.snapManager.snap(x, y, this._shapes, polygon.layer)
                if (snapResult) { finalX = snapResult.x; finalY = snapResult.y }
            }

            polygon.update(finalX, finalY)

            const ctx = this.overlay.ctx
            ctx.save()
            ctx.translate(tx, ty)
            ctx.scale(scale, scale)
            polygon.draw(ctx)

            if (snapToFirst) {
                const first = polygon.points[0]
                ctx.beginPath()
                ctx.arc(first.x, first.y, 8 / scale, 0, Math.PI * 2)
                ctx.strokeStyle = polygon.color
                ctx.lineWidth = 2 / scale
                ctx.stroke()
            } else if (snapResult) {
                this.snapRenderer.draw(snapResult)
            }

            ctx.restore()
            return
        }

        // Cas eraser : effacement live sur le layer cible + curseur circulaire sur l'overlay
        if (this._currentShape.tool === 'eraser') {
            this._currentShape.update?.(x, y)

            if (this._eraserSnapshot && this._currentShape.layer !== null) {
                const layer = this.getLayer(this._currentShape.layer)
                layer.ctx.putImageData(this._eraserSnapshot, 0, 0)
                const { x: tx, y: ty, scale } = this._viewTransform
                const lCtx = layer.ctx
                lCtx.save()
                if (this._currentShape.layer !== 'BACKGROUND') {
                    lCtx.translate(tx, ty)
                    lCtx.scale(scale, scale)
                }
                this._currentShape.draw(lCtx)
                lCtx.restore()
            }

            const { x: tx, y: ty, scale } = this._viewTransform
            const oCtx = this.overlay.ctx
            oCtx.save()
            oCtx.translate(tx, ty)
            oCtx.scale(scale, scale)
            this._drawEraserCursor(oCtx, x, y, (this._currentShape as AbstractShape).width)
            oCtx.restore()
            return
        }

        let newX = x
        let newY = y
        const isSnapTool = !Engine.NO_SNAP_TOOLS.has(this._currentShape.tool)
        const snapResult = isSnapTool
            ? this.snapManager.snap(x, y, this._shapes, this._currentShape.layer)
            : null

        if (isSnapTool && snapResult) {
            newX = snapResult.x
            newY = snapResult.y
        }

        this._currentShape.update?.(newX, newY)

        const { x: tx, y: ty, scale } = this._viewTransform
        const ctx = this.overlay.ctx
        ctx.save()
        ctx.translate(tx, ty)
        ctx.scale(scale, scale)
        if (isSnapTool) this.snapRenderer.draw(snapResult)
        this._currentShape.draw(ctx)
        ctx.restore()
    }

    endShape() {
        if (!this._currentShape) return

        const shape = this._currentShape
        this._currentShape = null
        this.overlay.clear()

        // Libère le snapshot eraser
        this._eraserSnapshot = null

        // Ignore les shapes dégénérées (simple clic sans déplacement)
        if ((shape as AbstractShape).isEmpty()) return

        // Polygon : marquer comme fermé à la finalisation
        if (shape instanceof Polygon) shape.closed = true

        this._shapes.push(shape)
        this._undoStack = []  // tout nouveau shape invalide le redo

        if (shape.layer !== null) {
            const layer = this.getLayer(shape.layer)
            const ctx = layer.ctx
            if (shape.layer !== 'BACKGROUND') {
                const { x: tx, y: ty, scale } = this._viewTransform
                ctx.save()
                ctx.translate(tx, ty)
                ctx.scale(scale, scale)
                shape.draw(ctx)
                ctx.restore()
            } else {
                shape.draw(ctx)
            }
        }

        // P5: rollback visuel si saveLocal échoue
        try {
            this.saveLocal()
        } catch {
            this._shapes.pop()
            this.draw()
        }
    }

    // --- Layer management ---
    getLayer(name: LayerName): Layer { return this._layers[name] ?? this._layers['MAIN'] }
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
    clearLayer(name: LayerName) { this.getLayer(name)?.clear() }
    clearAll() {
        for (const layer of Object.values(this._layers)) {
            if (layer.visible && !layer.locked && layer.name !== 'BACKGROUND') layer.clear()
        }
    }

    // --- Drawing ---
    // excludeLayer: si fourni, les shapes appartenant à ce layer sont ignorées
    draw(excludeLayer?: LayerName) {
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
        const { x: tx, y: ty, scale } = this._viewTransform
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
        for (const layer of [...Object.values(this._layers), this.overlay]) {
            layer.resize(this.container)
        }
        // A4: ctx overlay mis à jour après resize (défensif)
        this.snapRenderer.updateCtx(this.overlay.ctx)
        // P3/P4: renderBackground ne call plus draw(), appelé explicitement ici
        this.renderBackground(this._background)
        this.draw()
    }

    // --- Background ---
    setBackground(state: BackgroundState) {
        this._background = state
        // P3/P4: renderBackground ne call plus draw(), appelé explicitement ici
        this.renderBackground(state)
        this.draw()
    }

    private renderBackground(state: BackgroundState) {
        const layer = this.getLayer('BACKGROUND')
        const ctx = layer.ctx
        const w = layer.canvas.width
        const h = layer.canvas.height
        ctx.clearRect(0, 0, w, h)

        switch (state.mode) {
            case 'grid': drawGrid(ctx, w, h, state.grid!); break
            case 'ruled': drawRuled(ctx, w, h, state.ruled!); break
            case 'axes': drawAxes(ctx, w, h, state.axes!); break
        }
        // P3/P4: this.draw() supprimé — l'appelant en est responsable
    }

    // --- LocalStorage ---
    saveLocal() {
        const data = this._shapes.map(s => s.toJSON())
        localStorage.setItem(Engine.localStorageKey, JSON.stringify(data))
    }

    loadLocal() {
        const raw = localStorage.getItem(Engine.localStorageKey)
        if (!raw) return

        let parsed: any[]
        try {
            parsed = JSON.parse(raw)
        } catch {
            console.warn('[PiNote] loadLocal: données localStorage invalides, ignorées')
            return
        }

        let skipped = 0
        // P2: filtre typé au lieu de cast as Adaptable[]
        this._shapes = parsed.map((s: any) => {
            const shape = ShapeFactory.fromJSON(s)
            if (!shape) skipped++
            return shape
        }).filter((s): s is Adaptable => s !== null)

        if (skipped > 0) {
            console.warn(`[PiNote] loadLocal: ${skipped} forme(s) ignorée(s) (données invalides ou outil inconnu)`)
        }

        this.draw()
    }

    // A5: annule le dessin en cours sans le finaliser ni sauvegarder
    cancelShape() {
        if (!this._currentShape) return
        this._currentShape = null
        this.overlay.clear()
    }

    private _drawEraserCursor(ctx: CanvasRenderingContext2D, x: number, y: number, width: number) {
        const s = this._viewTransform.scale
        ctx.save()
        ctx.beginPath()
        ctx.arc(x, y, width / 2, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)'
        ctx.lineWidth = 1 / s
        ctx.setLineDash([4 / s, 4 / s])
        ctx.stroke()
        ctx.restore()
    }

    // --- Undo / Redo ---
    get canUndo(): boolean { return this._shapes.length > 0 }
    get canRedo(): boolean { return this._undoStack.length > 0 }

    undo() {
        if (!this.canUndo) return
        const removed = this._shapes.pop()!
        this._undoStack.push(removed)
        if (this._selectedShapeId === removed.id) this._selectedShapeId = null
        this.draw()
        try { this.saveLocal() } catch { /* ignore */ }
    }

    redo() {
        if (!this.canRedo) return
        this._shapes.push(this._undoStack.pop()!)
        this.draw()
        try { this.saveLocal() } catch { /* ignore */ }
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
        const { x: tx, y: ty, scale } = this._viewTransform
        const ctx = this.overlay.ctx
        ctx.save()
        ctx.translate(tx, ty)
        ctx.scale(scale, scale)
        const pad = 8 / scale
        const x = bounds.minX - pad
        const y = bounds.minY - pad
        const w = bounds.maxX - bounds.minX + pad * 2
        const h = bounds.maxY - bounds.minY + pad * 2

        // Bounding box
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 1.5 / scale
        ctx.setLineDash([5 / scale, 4 / scale])
        ctx.strokeRect(x, y, w, h)
        ctx.setLineDash([])

        const hr = 7 / scale
        const gap = 20 / scale  // espace entre les deux handles

        // Handle de déplacement (coin haut-gauche) — croix ✛
        ctx.fillStyle = '#3b82f6'
        ctx.beginPath()
        ctx.arc(x, y, hr, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 1.5 / scale
        ctx.beginPath()
        ctx.moveTo(x - 3.5 / scale, y); ctx.lineTo(x + 3.5 / scale, y)
        ctx.moveTo(x, y - 3.5 / scale); ctx.lineTo(x, y + 3.5 / scale)
        ctx.stroke()

        // Handle de duplication (à droite du précédent) — deux carrés ⧉
        const dx2 = x + gap
        ctx.fillStyle = '#3b82f6'
        ctx.beginPath()
        ctx.arc(dx2, y, hr, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 1.2 / scale
        const sq = 2.8 / scale
        const off = 1.5 / scale
        ctx.strokeRect(dx2 - sq - off, y - sq - off, sq * 2, sq * 2)
        ctx.strokeRect(dx2 - sq + off, y - sq + off, sq * 2, sq * 2)

        ctx.restore()
    }

    get selectedShapeId(): string | null { return this._selectedShapeId }

    private _handlePositions(bounds: ReturnType<AbstractShape['getBounds']>) {
        if (!bounds) return null
        const { scale } = this._viewTransform
        const pad = 8 / scale
        const hx = bounds.minX - pad
        const hy = bounds.minY - pad
        return { move: { x: hx, y: hy }, duplicate: { x: hx + 20 / scale, y: hy } }
    }

    // Retourne true si (x,y) monde est sur le handle de déplacement
    isOverMoveHandle(x: number, y: number): boolean {
        if (!this._selectedShapeId) return false
        const shape = this._shapes.find(s => s.id === this._selectedShapeId) as AbstractShape | undefined
        if (!shape) return false
        const pos = this._handlePositions(shape.getBounds())
        if (!pos) return false
        return Math.hypot(x - pos.move.x, y - pos.move.y) * this._viewTransform.scale <= 14
    }

    // Retourne true si (x,y) monde est sur le handle de duplication
    isOverDuplicateHandle(x: number, y: number): boolean {
        if (!this._selectedShapeId) return false
        const shape = this._shapes.find(s => s.id === this._selectedShapeId) as AbstractShape | undefined
        if (!shape) return false
        const pos = this._handlePositions(shape.getBounds())
        if (!pos) return false
        return Math.hypot(x - pos.duplicate.x, y - pos.duplicate.y) * this._viewTransform.scale <= 14
    }

    // --- Duplication ---
    duplicateShape(id: string): string | null {
        const shape = this._shapes.find(s => s.id === id)
        if (!shape) return null
        // JSON.parse/stringify garantit une copie profonde (pas de références partagées)
        const json = JSON.parse(JSON.stringify(shape.toJSON()))
        json.options.id = undefined   // force new ID
        json.options.hidden = false
        const clone = ShapeFactory.fromJSON(json)
        if (!clone) return null
        clone.translate(15, 15)
        this._shapes.push(clone)
        this._undoStack = []
        this._selectedShapeId = clone.id
        this.draw()
        try { this.saveLocal() } catch { /* ignore */ }
        return clone.id
    }

    // --- Visibilité ---
    toggleVisibility(id: string) {
        const shape = this._shapes.find(s => s.id === id)
        if (!shape) return
        shape.hidden = !shape.hidden
        this.draw()
        try { this.saveLocal() } catch { /* ignore */ }
    }

    // --- Déplacement ---
    moveShape(id: string, dx: number, dy: number) {
        const shape = this._shapes.find(s => s.id === id)
        if (!shape) return
        shape.translate(dx, dy)
        this.draw()
    }

    // --- Shape destruction ---
    destroyById(id: string) {
        const idx = this._shapes.findIndex(s => s.id === id)
        if (idx === -1) return
        const [removed] = this._shapes.splice(idx, 1)
        this.draw()
        // P5: rollback si saveLocal échoue
        try {
            this.saveLocal()
        } catch {
            this._shapes.splice(idx, 0, removed)
            this.draw()
        }
    }

    destroy() {
        this._resizeObserver.disconnect()
    }
}
