import {Layer} from "@core/Layer"
import {BackgroundMode, BackgroundState, LayerName, ToolType} from "../types"
import {Adaptable, ShapePatch} from "../shapes/Adaptable"
import {AbstractShape} from "../shapes/AbstractShape"
import {SnapManager} from "../snap/SnapManager"
import {SnapWorkerClient, type SnapGeometry} from "../snap/SnapWorkerClient"
import {ShapeFactory, ShapeStartConfig} from "@core/ShapeFactory"
import {drawGrid, drawHex, drawRuled} from "@core/helper"
import {SnapRenderer} from "../snap/visual/SnapRenderer"
import type {IDrawingContext} from "./DrawingContext"
import {TextShape} from "../shapes/TextShape"

export class Engine {
    public bezier = false // toggle global
    private _title: string = ''

    private static NO_SNAP_TOOLS = new Set<ToolType>(['pen', 'highlighter', 'eraser', 'text'])

    private container: HTMLDivElement
    private overlay!: Layer
    private _tempLayer!: Layer
    private _layers: Record<LayerName, Layer>
    private _shapes: Adaptable[] = []
    private _currentShape: Adaptable | null = null
    private _background: BackgroundState = {
        mode: 'none',
        grid:  { size: 80,  color: '#777777', lineWidth: 1 },
        ruled: { spacing: 40, color: '#777777', lineWidth: 1 },
        hex:   { size: 40,  color: '#777777', lineWidth: 1, orientation: 'pointy' },
    }
    private _pageId = 'default'
    private _onSaveCallback?: () => void
    private _snapManager: SnapManager = new SnapManager({snapRadius: 10})
    private _snapWorkerClient: SnapWorkerClient
    private _geometryDirty = true
    private _cachedGeometry: SnapGeometry = { points: [], segments: [], circles: [] }
    private snapRenderer: SnapRenderer
    private _resizeObserver: ResizeObserver
    private _viewTransform = { x: 0, y: 0, scale: 1 }
    private _referenceBitmap: ImageBitmap | null = null
    private _undoStack: Adaptable[] = []
    private _selectedShapeId: string | null = null
    private _snapGridEnabled = false
    private _snapGridSize = 80
    private _gridPreviewTimer: ReturnType<typeof setTimeout> | null = null
    private _tempFadeTimer: ReturnType<typeof requestAnimationFrame> | null = null

    constructor(container: HTMLDivElement, defaultBackground?: BackgroundState) {
        this.container = container
        this.container.style.position = 'relative'

        this._layers = {
            BACKGROUND: new Layer(this.container, { name: 'BACKGROUND', zIndex: 1 }),
            REFERENCE:  new Layer(this.container, { name: 'REFERENCE',  zIndex: 2 }),
            OVERLAY:    new Layer(this.container, { name: 'OVERLAY',    zIndex: 3 }),
            MAIN:       new Layer(this.container, { name: 'MAIN',       zIndex: 4 }),
            LAYER:      new Layer(this.container, { name: 'LAYER',      zIndex: 5 }),
        }

        this._tempLayer = new Layer(this.container, { name: 'TEMP', zIndex: 6 })
        this.overlay    = new Layer(this.container, { name: 'overlay', zIndex: 99 })

        this.snapRenderer = new SnapRenderer(this.overlay.ctx)
        this._snapWorkerClient = new SnapWorkerClient()

        if (defaultBackground) this._applyBackground(defaultBackground)

        this._resizeObserver = new ResizeObserver(() => this.resize())
        this._resizeObserver.observe(this.container)

        // Injecte le callback de re-render pour les TextShapes async
        TextShape.redrawCallback = () => this.draw()

        // Grid snap désactivé par défaut
        this._snapManager.setStrategyEnabled('grid', false)
    }

    get snapGridEnabled(): boolean { return this._snapGridEnabled }
    set snapGridEnabled(enabled: boolean) {
        this._snapGridEnabled = enabled
        this._snapManager.setStrategyEnabled('grid', enabled)
    }

    get snapGridSize(): number { return this._snapGridSize }
    set snapGridSize(size: number) {
        this._snapGridSize = size
        this._snapManager.setGridSize(size)
    }

    get snapManager(): SnapManager {
        return this._snapManager
    }

    private get _storageKey(): string { return 'pi_note_draft_' + this._pageId }
    setPageId(id: string) { this._pageId = id }
    set onSave(cb: () => void) { this._onSaveCallback = cb }

    setViewTransform(x: number, y: number, scale: number) {
        this._viewTransform = { x, y, scale }
    }

    get shapes(): readonly Adaptable[] { return this._shapes }
    get currentShape(): Adaptable | null { return this._currentShape }
    get layers(): Layer[] { return Object.values(this._layers) }
    get mode(): BackgroundMode { return this._background.mode }
    set mode(value: BackgroundMode) { this._background.mode = value }
    get title(): string { return this._title }
    set title(value: string) {
        this._title = value
        try { this.saveLocal() } catch { /* ignore */ }
    }
    get backgroundState(): BackgroundState { return { ...this._background } }

    // --- Shape creation ---
    startShape(config: ShapeStartConfig): Adaptable {
        this._cancelTempFade()
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

        const shape = ShapeFactory.create({ ...config, x: startX, y: startY })
        shape.onDrawStart?.(startX, startY, this._buildDrawingContext())
        this._currentShape = shape
        return shape
    }

    /** Mode two-phase : transition phase 1 → phase 2 (2e clic). */
    phaseTransition(x: number, y: number) {
        if (!this._currentShape?.onPhaseTransition) return
        this.overlay.clear()
        this._currentShape.onPhaseTransition(x, y, this._buildDrawingContext())
    }

    /** Mode multi-click : traite un clic suivant. Retourne 'done' si la shape est terminée. */
    handleDrawClick(x: number, y: number): 'continue' | 'done' {
        if (!this._currentShape?.onDrawClick) return 'continue'
        return this._currentShape.onDrawClick(x, y, this._buildDrawingContext())
    }

    updateShape(x: number, y: number) {
        if (!this._currentShape) return

        this.overlay.clear()
        this._tempLayer.clear()

        const handled = this._currentShape.onDrawMove?.(x, y, this._buildDrawingContext())
        if (handled) return

        // Comportement générique : snap sur overlay, forme sur _tempLayer
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

        if (isSnapTool) {
            const octx = this.overlay.ctx
            octx.save()
            octx.translate(tx, ty)
            octx.scale(scale, scale)
            this.snapRenderer.draw(snapResult)
            octx.restore()
        }

        const ctx = this._tempLayer.ctx
        ctx.save()
        ctx.translate(tx, ty)
        ctx.scale(scale, scale)
        this._currentShape.draw(ctx)
        ctx.restore()
    }

    endShape() {
        if (!this._currentShape) return

        const shape = this._currentShape
        this._currentShape = null
        this.overlay.clear()
        this._tempLayer.clear()

        if ((shape as AbstractShape).isEmpty()) return

        shape.onDrawEnd?.()

        if (shape.layer === null) {
            this._startTempFade(shape)
            return
        }

        this._shapes.push(shape)
        this._undoStack = []
        this._markGeometryDirty()

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

        try {
            this.saveLocal()
        } catch {
            this._shapes.pop()
            this.draw()
        }
    }

    private _startTempFade(shape: Adaptable) {
        this._cancelTempFade()
        const { x: tx, y: ty, scale } = this._viewTransform
        const ctx = this._tempLayer.ctx
        ctx.save()
        ctx.translate(tx, ty)
        ctx.scale(scale, scale)
        shape.draw(ctx)
        ctx.restore()

        const duration = 500
        const startTime = performance.now()
        const animate = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1)
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
            get overlayCtx() { return self.overlay.ctx },
            snap: (x, y, layer) => self._snapManager.snap(x, y, self._shapes, layer),
            getLayer: (name) => self.getLayer(name),
            get viewTransform() { return self._viewTransform },
            drawSnapIndicator: (result) => { self.snapRenderer.draw(result) },
            get bezierEnabled() { return self.bezier },
            getLayerSnapshot: (name) => {
                const layer = self.getLayer(name)
                return layer.ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height)
            },
            restoreLayerSnapshot: (name, data) => {
                self.getLayer(name).ctx.putImageData(data, 0, 0)
            },
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
            if (layer.visible && !layer.locked
                && layer.name !== 'BACKGROUND'
                && layer.name !== 'REFERENCE'
                && layer.name !== 'OVERLAY') layer.clear()
        }
        this._tempLayer.clear()
    }

    get referenceBitmap(): ImageBitmap | null { return this._referenceBitmap }

    setReferenceBitmap(bitmap: ImageBitmap | null) {
        this._referenceBitmap = bitmap
        this._drawReference()
    }

    private _drawReference() {
        const layer = this._layers['REFERENCE']
        layer.clear()
        if (!this._referenceBitmap) return
        const { x: tx, y: ty, scale } = this._viewTransform
        const ctx = layer.ctx
        ctx.save()
        ctx.translate(tx, ty)
        ctx.scale(scale, scale)
        ctx.drawImage(this._referenceBitmap, 0, 0)
        ctx.strokeStyle = '#aaaaaa'
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
        for (const layer of [...Object.values(this._layers), this._tempLayer, this.overlay]) {
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
        this._applyBackground(state)
        if (state.mode === 'grid' && state.grid?.size) {
            this._snapGridSize = state.grid.size
            this._snapManager.setGridSize(state.grid.size)
        }
        this.draw()
        try { this.saveLocal() } catch { /* ignore */ }
    }

    private _applyBackground(state: BackgroundState) {
        this._background = {
            mode:  state.mode,
            grid:  state.grid  ?? this._background.grid,
            ruled: state.ruled ?? this._background.ruled,
            hex:   state.hex   ?? this._background.hex,
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
            case 'grid': drawGrid(ctx, w, h, state.grid!); break
            case 'ruled': drawRuled(ctx, w, h, state.ruled!); break
            case 'hex': drawHex(ctx, w, h, state.hex!); break
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
        try { this.saveLocal() } catch { /* ignore */ }
    }

    resetState() {
        this._shapes = []
        this._undoStack = []
        this._selectedShapeId = null
        this._title = ''
        this._markGeometryDirty()
        this.overlay.clear()
        this.clearAll()
        this._applyBackground({ mode: 'none' })
        this.setReferenceBitmap(null)
    }

    resetAll() {
        this.resetState()
        try { this.saveLocal() } catch { /* ignore */ }
    }

    toJSONData(): object {
        return { title: this._title, background: this._background, shapes: this._shapes.map(s => s.toJSON()) }
    }

    saveLocal() {
        localStorage.setItem(this._storageKey, JSON.stringify(this.toJSONData()))
        this._onSaveCallback?.()
    }

    loadFromJSONData(parsed: any): void {
        // rétrocompatibilité : ancien format = tableau direct
        const shapesData: any[] = Array.isArray(parsed) ? parsed : (parsed.shapes ?? [])
        this._title = Array.isArray(parsed) ? '' : (parsed.title ?? '')
        if (!Array.isArray(parsed) && parsed.background) {
            this._applyBackground(parsed.background)
        }

        let skipped = 0
        this._shapes = shapesData.map((s: any) => {
            const shape = ShapeFactory.fromJSON(s)
            if (!shape) skipped++
            return shape
        }).filter((s): s is Adaptable => s !== null)

        if (skipped > 0) {
            console.warn(`[PiNote] loadFromJSONData: ${skipped} forme(s) ignorée(s) (données invalides ou outil inconnu)`)
        }

        this._undoStack = []
        this._selectedShapeId = null
        this._markGeometryDirty()
        this.draw()
        try { this.saveLocal() } catch { /* ignore */ }
    }

    loadLocal() {
        const raw = localStorage.getItem(this._storageKey)
        if (!raw) return

        let parsed: any
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
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, offscreen.width, offscreen.height)
        for (const name of ['REFERENCE', 'OVERLAY', 'MAIN', 'LAYER'] as LayerName[]) {
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

        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvasW, canvasH)

        // Fond décoratif sur toute la page A4
        if (this._background.mode !== 'none') {
            switch (this._background.mode) {
                case 'grid':  drawGrid(ctx, canvasW, canvasH, this._background.grid!); break
                case 'ruled': drawRuled(ctx, canvasW, canvasH, this._background.ruled!); break
                case 'hex':   drawHex(ctx, canvasW, canvasH, this._background.hex!); break
            }
        }

        // Shapes
        ctx.save()
        ctx.translate(tx, ty)
        ctx.scale(scale, scale)
        for (const layerName of ['BACKGROUND', 'MAIN', 'LAYER'] as LayerName[]) {
            if (!this._layers[layerName].visible) continue
            for (const shape of this._shapes) {
                if (!shape.hidden && shape.layer === layerName) shape.draw(ctx)
            }
        }
        ctx.restore()

        return offscreen.toDataURL('image/png')
    }

    // A5: annule le dessin en cours sans le finaliser ni sauvegarder
    cancelShape() {
        if (!this._currentShape) return
        this._cancelTempFade()
        this._currentShape = null
        this.overlay.clear()
        this._tempLayer.clear()
    }

    // --- Undo / Redo ---
    get canUndo(): boolean { return this._shapes.length > 0 }
    get canRedo(): boolean { return this._undoStack.length > 0 }

    undo() {
        if (!this.canUndo) return
        const removed = this._shapes.pop()!
        this._undoStack.push(removed)
        this._markGeometryDirty()
        if (this._selectedShapeId === removed.id) this._selectedShapeId = null
        this.draw()
        try { this.saveLocal() } catch { /* ignore */ }
    }

    redo() {
        if (!this.canRedo) return
        this._shapes.push(this._undoStack.pop()!)
        this._markGeometryDirty()
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

        // Handle de suppression (à droite du précédent) — croix ✕ rouge
        const dx3 = x + gap * 2
        ctx.fillStyle = '#ef4444'
        ctx.beginPath()
        ctx.arc(dx3, y, hr, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 1.5 / scale
        const cx = 3.5 / scale
        ctx.beginPath()
        ctx.moveTo(dx3 - cx, y - cx); ctx.lineTo(dx3 + cx, y + cx)
        ctx.moveTo(dx3 + cx, y - cx); ctx.lineTo(dx3 - cx, y + cx)
        ctx.stroke()

        ctx.restore()
    }

    get selectedShapeId(): string | null { return this._selectedShapeId }

    private _handlePositions(bounds: ReturnType<AbstractShape['getBounds']>) {
        if (!bounds) return null
        const { scale } = this._viewTransform
        const pad = 8 / scale
        const hx = bounds.minX - pad
        const hy = bounds.minY - pad
        const gap = 20 / scale
        return {
            move: { x: hx, y: hy },
            duplicate: { x: hx + gap, y: hy },
            delete: { x: hx + gap * 2, y: hy },
        }
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

    // Retourne true si (x,y) monde est sur le handle de suppression
    isOverDeleteHandle(x: number, y: number): boolean {
        if (!this._selectedShapeId) return false
        const shape = this._shapes.find(s => s.id === this._selectedShapeId) as AbstractShape | undefined
        if (!shape) return false
        const pos = this._handlePositions(shape.getBounds())
        if (!pos) return false
        return Math.hypot(x - pos.delete.x, y - pos.delete.y) * this._viewTransform.scale <= 14
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
        this._markGeometryDirty()
        this._selectedShapeId = clone.id
        this.draw()
        try { this.saveLocal() } catch { /* ignore */ }
        return clone.id
    }

    // Retourne l'id du shape sous (x,y), du plus récent au plus ancien
    findShapeAt(x: number, y: number): string | null {
        const tolerance = 6 / this._viewTransform.scale
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
        try { this.saveLocal() } catch { /* ignore */ }
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
        const { x: tx, y: ty, scale } = this._viewTransform
        const size = this._snapGridSize * scale
        if (size <= 0) return
        const offsetX = ((tx % size) + size) % size
        const offsetY = ((ty % size) + size) % size

        ctx.save()
        ctx.strokeStyle = '#00A8FF'
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
            headers: { 'Content-Type': 'application/json' },
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

    private static HOVER_SNAP_EXCLUDED = new Set<ToolType>(['pen', 'highlighter', 'eraser', 'move', 'select', 'text'])

    hoverSnap(x: number, y: number, tool: ToolType): void {
        if (Engine.HOVER_SNAP_EXCLUDED.has(tool)) return
        if (this._currentShape) return

        const geometry = this._getGeometry()
        this._snapWorkerClient.request(x, y, geometry, {
            snapRadius: this._snapManager.snapRadius,
            gridEnabled: this._snapGridEnabled,
            gridSize: this._snapGridSize,
            activeLayer: null,
        }, (result) => {
            if (this._currentShape) return
            this.overlay.clear()
            if (!result) return
            const { x: tx, y: ty, scale } = this._viewTransform
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
        this.overlay.clear()
        this._drawSelectionOverlay()
    }

    destroy() {
        if (this._gridPreviewTimer) clearTimeout(this._gridPreviewTimer)
        this._cancelTempFade()
        this._resizeObserver.disconnect()
        this._snapWorkerClient.destroy()
    }
}
