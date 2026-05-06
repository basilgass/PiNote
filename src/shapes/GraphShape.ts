import { AbstractWidgetShape } from './AbstractWidgetShape'
import type { ShapeOptions } from './Adaptable'
import type { Bounds, CircleGeom, Segment, SnapCandidate } from './GeometryTypes'
import { evaluate, parse } from 'mathjs'

export interface GraphFunction {
    expr:  string
    color: string
}

export interface GraphConfig {
    x:           number
    y:           number
    width:       number
    height:      number
    xMin:        number
    xMax:        number
    yMin:        number
    yMax:        number
    orthonormal: boolean
    showGrid:    boolean
    labelMode:   'all' | 'unit' | 'none'
    functions:   GraphFunction[]
}

const DEFAULT_CONFIG: Omit<GraphConfig, 'x' | 'y' | 'width' | 'height'> = {
    xMin:        -5,
    xMax:        5,
    yMin:        -5,
    yMax:        5,
    orthonormal: false,
    showGrid:    true,
    labelMode:   'all',
    functions:   [],
}

export class GraphShape extends AbstractWidgetShape {
    private _cfg: GraphConfig

    constructor(config: GraphConfig, options: Partial<ShapeOptions> = {}) {
        super({ ...options, tool: 'graph' })
        this._cfg = { ...config }
    }

    // ── AbstractWidgetShape ───────────────────────────────────────────────────

    getDialogProps(): Record<string, unknown> {
        return { initialConfig: { ...this._cfg } }
    }

    applyConfig(config: unknown): void {
        this._cfg = { ...(config as GraphConfig) }
    }

    // ── Interaction ───────────────────────────────────────────────────────────

    update(x: number, y: number): void {
        this._cfg.width  = Math.max(0, x - this._cfg.x)
        this._cfg.height = Math.max(0, y - this._cfg.y)
    }

    hasSufficientSize(): boolean {
        return this._cfg.width >= 20 && this._cfg.height >= 20
    }

    isEmpty(): boolean {
        return this._cfg.width < 20 || this._cfg.height < 20
    }

    // ── Geometry ──────────────────────────────────────────────────────────────

    translate(dx: number, dy: number): void {
        this._cfg.x += dx
        this._cfg.y += dy
    }

    hitTest(x: number, y: number, _tolerance: number): boolean {
        const { x: gx, y: gy, width: gw, height: gh } = this._cfg
        return x >= gx && x <= gx + gw && y >= gy && y <= gy + gh
    }

    getBounds(): Bounds {
        const { x, y, width, height } = this._cfg
        return { minX: x, minY: y, maxX: x + width, maxY: y + height }
    }

    getSnapPoints(): SnapCandidate[] {
        const { x, y, width: w, height: h } = this._cfg
        return [
            { x,         y,         type: 'endpoint', shapeId: this.id, layer: this.layer },
            { x: x + w,  y,         type: 'endpoint', shapeId: this.id, layer: this.layer },
            { x,         y: y + h,  type: 'endpoint', shapeId: this.id, layer: this.layer },
            { x: x + w,  y: y + h,  type: 'endpoint', shapeId: this.id, layer: this.layer },
            { x: x + w/2, y: y + h/2, type: 'midpoint', shapeId: this.id, layer: this.layer },
        ]
    }

    getSegments(): Segment[] { return [] }
    getCircles(): CircleGeom[] { return [] }

    // ── Drawing ───────────────────────────────────────────────────────────────

    draw(ctx: CanvasRenderingContext2D): void {
        const cfg = this._resolvedConfig()
        const { x, y, width: w, height: h } = cfg

        ctx.save()
        ctx.beginPath()
        ctx.rect(x, y, w, h)
        ctx.clip()

        // Fond
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(x, y, w, h)

        if (cfg.showGrid)  this._drawGrid(ctx, cfg)
        this._drawAxes(ctx, cfg)
        if (cfg.labelMode !== 'none') this._drawLabels(ctx, cfg)
        this._drawFunctions(ctx, cfg)

        // Bordure
        ctx.restore()
        ctx.save()
        ctx.strokeStyle = this.color || '#333333'
        ctx.lineWidth   = 1.5
        ctx.setLineDash([])
        ctx.strokeRect(x, y, w, h)
        ctx.restore()
    }

    // ── Résolution orthonormée ────────────────────────────────────────────────

    private _resolvedConfig(): GraphConfig {
        const cfg = { ...this._cfg }
        if (cfg.orthonormal) {
            const xRange = cfg.xMax - cfg.xMin
            const yRange = xRange * (cfg.height / cfg.width)
            const yMid   = (cfg.yMax + cfg.yMin) / 2
            cfg.yMin = yMid - yRange / 2
            cfg.yMax = yMid + yRange / 2
        }
        return cfg
    }

    // ── Helpers de dessin ─────────────────────────────────────────────────────

    private _toCanvasX(mathX: number, cfg: GraphConfig): number {
        return cfg.x + (mathX - cfg.xMin) / (cfg.xMax - cfg.xMin) * cfg.width
    }

    private _toCanvasY(mathY: number, cfg: GraphConfig): number {
        return cfg.y + cfg.height - (mathY - cfg.yMin) / (cfg.yMax - cfg.yMin) * cfg.height
    }

    private _drawGrid(ctx: CanvasRenderingContext2D, cfg: GraphConfig): void {
        const { x, y, width: w, height: h, xMin, xMax, yMin, yMax } = cfg

        ctx.save()
        ctx.strokeStyle = '#e0e0e0'
        ctx.lineWidth   = 0.5
        ctx.setLineDash([])

        // Lignes verticales
        const xStep = this._niceStep(xMax - xMin, Math.floor(w / 40))
        for (let val = Math.ceil(xMin / xStep) * xStep; val <= xMax; val += xStep) {
            const cx = this._toCanvasX(val, cfg)
            ctx.beginPath()
            ctx.moveTo(cx, y)
            ctx.lineTo(cx, y + h)
            ctx.stroke()
        }

        // Lignes horizontales
        const yStep = this._niceStep(yMax - yMin, Math.floor(h / 40))
        for (let val = Math.ceil(yMin / yStep) * yStep; val <= yMax; val += yStep) {
            const cy = this._toCanvasY(val, cfg)
            ctx.beginPath()
            ctx.moveTo(x, cy)
            ctx.lineTo(x + w, cy)
            ctx.stroke()
        }

        ctx.restore()
    }

    private _drawAxes(ctx: CanvasRenderingContext2D, cfg: GraphConfig): void {
        const { x, y, width: w, height: h, xMin, xMax, yMin, yMax } = cfg

        ctx.save()
        ctx.strokeStyle = '#555555'
        ctx.lineWidth   = 1.2
        ctx.setLineDash([])

        // Axe X (y=0)
        if (yMin <= 0 && yMax >= 0) {
            const cy = this._toCanvasY(0, cfg)
            ctx.beginPath()
            ctx.moveTo(x, cy)
            ctx.lineTo(x + w, cy)
            ctx.stroke()
        }

        // Axe Y (x=0)
        if (xMin <= 0 && xMax >= 0) {
            const cx = this._toCanvasX(0, cfg)
            ctx.beginPath()
            ctx.moveTo(cx, y)
            ctx.lineTo(cx, y + h)
            ctx.stroke()
        }

        ctx.restore()
    }

    private _drawLabels(ctx: CanvasRenderingContext2D, cfg: GraphConfig): void {
        const { xMin, xMax, yMin, yMax } = cfg
        const fontSize = Math.max(9, Math.min(12, cfg.width / 30))

        ctx.save()
        ctx.fillStyle  = '#555555'
        ctx.font       = `${fontSize}px sans-serif`
        ctx.textAlign  = 'center'
        ctx.textBaseline = 'top'

        const originX = this._toCanvasX(0, cfg)
        const originY = this._toCanvasY(0, cfg)
        const axisYVisible = xMin <= 0 && xMax >= 0
        const axisXVisible = yMin <= 0 && yMax >= 0

        const labelBaseX = axisYVisible ? originX : cfg.x + 4
        const labelBaseY = axisXVisible ? originY + 2 : cfg.y + cfg.height - fontSize - 2

        const xStep = this._niceStep(xMax - xMin, Math.floor(cfg.width / 40))
        const yStep = this._niceStep(yMax - yMin, Math.floor(cfg.height / 40))

        const isAll  = cfg.labelMode === 'all'
        const isUnit = cfg.labelMode === 'unit'

        // Labels axe X
        if (isAll || isUnit) {
            for (let val = Math.ceil(xMin / xStep) * xStep; val <= xMax; val += xStep) {
                if (Math.abs(val) < xStep * 0.01) continue // zéro géré séparément
                if (isUnit && Math.abs(Math.abs(val) - xStep) > xStep * 0.01) continue
                const cx = this._toCanvasX(val, cfg)
                ctx.fillText(this._fmt(val), cx, labelBaseY)
            }
        }

        // Labels axe Y
        ctx.textAlign = 'right'
        ctx.textBaseline = 'middle'
        if (isAll || isUnit) {
            for (let val = Math.ceil(yMin / yStep) * yStep; val <= yMax; val += yStep) {
                if (Math.abs(val) < yStep * 0.01) continue
                if (isUnit && Math.abs(Math.abs(val) - yStep) > yStep * 0.01) continue
                const cy = this._toCanvasY(val, cfg)
                ctx.fillText(this._fmt(val), labelBaseX - 2, cy)
            }
        }

        ctx.restore()
    }

    private _drawFunctions(ctx: CanvasRenderingContext2D, cfg: GraphConfig): void {
        const { x, y, width: w, height: h, xMin, xMax, yMin, yMax, functions } = cfg

        for (const fn of functions) {
            if (!fn.expr.trim()) continue

            // Validation rapide de l'expression
            try { parse(fn.expr) } catch { continue }

            ctx.save()
            ctx.strokeStyle = fn.color || '#0066cc'
            ctx.lineWidth   = 1.8
            ctx.setLineDash([])
            ctx.beginPath()

            let penUp = true
            const steps = Math.ceil(w * 2)

            for (let i = 0; i <= steps; i++) {
                const mathX = xMin + (i / steps) * (xMax - xMin)
                let mathY: number

                try {
                    const result = evaluate(fn.expr, { x: mathX })
                    mathY = typeof result === 'number' ? result : NaN
                } catch {
                    penUp = true
                    continue
                }

                if (!isFinite(mathY)) {
                    penUp = true
                    continue
                }

                // Clamp vertical avec marge pour éviter les artefacts de clip
                const margin = (yMax - yMin) * 2
                if (mathY < yMin - margin || mathY > yMax + margin) {
                    penUp = true
                    continue
                }

                const cx = x + (i / steps) * w
                const cy = y + h - (mathY - yMin) / (yMax - yMin) * h

                if (penUp) {
                    ctx.moveTo(cx, cy)
                    penUp = false
                } else {
                    ctx.lineTo(cx, cy)
                }
            }

            ctx.stroke()
            ctx.restore()
        }
    }

    // ── Utilitaires ───────────────────────────────────────────────────────────

    private _niceStep(range: number, targetCount: number): number {
        if (targetCount <= 0) return range
        const rough = range / targetCount
        const mag   = Math.pow(10, Math.floor(Math.log10(rough)))
        const norm  = rough / mag
        const nice  = norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10
        return nice * mag
    }

    private _fmt(val: number): string {
        return Number.isInteger(val) ? String(val) : val.toPrecision(3).replace(/\.?0+$/, '')
    }

    // ── Sérialisation ─────────────────────────────────────────────────────────

    toJSON(): any {
        return {
            config:  { ...this._cfg },
            options: super.toJSON(),
        }
    }

    static fromData(config: GraphConfig, options: Partial<ShapeOptions>): GraphShape {
        return new GraphShape(config, options)
    }

    static defaultConfig(x: number, y: number, width = 0, height = 0): GraphConfig {
        return { x, y, width, height, ...DEFAULT_CONFIG, functions: [] }
    }
}
