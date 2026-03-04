import {BackgroundMode, BackgroundState, Drawable, LayerName, ToolType} from "src/types"
import {Layer} from "@core/Layer"
import {drawAxes, drawGrid, drawRuled} from "@core/helper"
import {Stroke} from "@core/drawable/Stroke"
import {ShapeFactory, ShapeStartConfig} from "@core/ShapeFactory"

export class Engine {
    public bezier = false // <-- toggle global
    private container: HTMLDivElement
    private overlay!: Layer
    private readonly localStorageKey = 'pi_note_draft'

    private _background: BackgroundState = {mode: 'none'}

    private _tool: ToolType = 'pen'
    private _currentShape: Drawable | null = null
    private _shapes: Drawable[] = []


    constructor(container: HTMLDivElement) {
        this.container = container
        this.container.style.position = 'relative'

        this._layers = {
            BACKGROUND: new Layer(this.container, {name: 'BACKGROUND', zIndex: 1}),
            MAIN: new Layer(this.container, {name: 'MAIN', zIndex: 2}),
            LAYER: new Layer(this.container, {name: 'LAYER', zIndex: 3}),
        }

        this.overlay = new Layer(this.container, {
            name: 'overlay',
            zIndex: 99
        })

        // Resize auto
        const ro = new ResizeObserver(() => this.resize())
        ro.observe(this.container)
    }

    private _mode: BackgroundMode = 'none'

    get mode(): BackgroundMode {
        return this._mode
    }

    set mode(value: BackgroundMode) {
        this._mode = value
    }

    private _layers: Record<LayerName, Layer>

    get layers(): Layer[] {
        return Object.values(this._layers)
    }

    get shapes(): Drawable[] {
        return this._shapes
    }

    private _currentStroke: Stroke | null = null

    get currentStroke(): Stroke | null {
        return this._currentStroke
    }

    setBackground(state: BackgroundState) {
        this._background = state
        this.renderBackground(state)
    }

    public resize() {
        for (const layer of [...Object.values(this._layers), this.overlay]) {
            layer.resize(this.container)
        }

        this.renderBackground(this._background)

        this.draw()
    }

    setLayerVisibility(name: LayerName, visible: boolean) {
        const layer = this._layers[name]
        if (!layer) return

        layer.visible = visible
        layer.canvas.style.display = visible ? 'block' : 'none'
    }

    getLayer(name: LayerName): Layer {
        return this._layers[name] ?? this._layers['MAIN']
    }

    setLayerOpacity(name: LayerName, opacity: number) {
        const layer = this._layers[name]
        if (!layer) return

        layer.opacity = opacity
        layer.canvas.style.opacity = opacity.toString()
    }

    destroyStroke(index: number, count = 1) {
        if (index < 0 || index >= this._shapes.length) return
        if (count <= 0) return

        this._shapes.splice(index, count)
    }

    startShape(config: ShapeStartConfig) {
        this._tool = config.tool

        const shape = ShapeFactory.create(this._tool, config)

        this._currentShape = shape

        // Stroke est immédiatement push
        if (shape instanceof Stroke) {
            this._shapes.push(shape)
        }

        return shape
    }


    updateShape(x: number, y: number) {
        if (!this._currentShape) return

        this.overlay.clear()

        this._currentShape.update?.(x, y)
        this._currentShape.draw(this.overlay.ctx)
    }

    endShape() {
        if (!this._currentShape) return

        const s = this._currentShape

        if (!(s instanceof Stroke)) {
            this._shapes.push(s)
        }

        if (s.layer !== null) {
            const layer = this.getLayer(s.layer)
            s.draw(layer.ctx)
        }

        this.overlay.clear()
        this._currentShape = null

        this.saveLocal()
    }

    draw(layerName?: string) {
        this.clearAll()

        for (const shape of this._shapes) {
            if (!shape.layer) continue
            if (layerName && shape.layer === layerName) continue

            const layer = this.getLayer(shape.layer)
            shape.draw(layer.ctx)
        }

        this.saveLocal()
    }

    clearLayer(name: LayerName) {
        const layer = this.getLayer(name)

        if (!layer) return

        layer.clear()
    }

    clearAll() {
        for (const layer of Object.values(this._layers)) {
            if (layer.visible && !layer.locked && layer.name !== 'BACKGROUND') {
                layer.clear()
            }
        }
    }

    public saveLocal() {
        const data = this.shapes.map(s => s.toJSON())
        localStorage.setItem(this.localStorageKey, JSON.stringify(data))
    }

    public loadLocal() {
        const raw = localStorage.getItem(this.localStorageKey)
        if (!raw) return

        const parsed = JSON.parse(raw)
        this._shapes = parsed.map((s: any) => {
            const {options, points} = Stroke.fromJSON(s)

            const stroke = new Stroke(options)
            stroke.points = points

            return stroke
        })

        this.draw()
    }

    private renderBackground(state: BackgroundState) {
        const layer = this._layers['BACKGROUND']
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
            case 'axes':
                drawAxes(ctx, w, h, state.axes!)
                break
        }

        this.draw()
    }
}