import {AbstractShape} from "./AbstractShape"
import {AbstractPointShape} from "./AbstractPointShape"
import {Bounds, CircleGeom, Segment as SegmentGeom, SnapCandidate} from "./GeometryTypes"
import {ShapeOptions} from "./Adaptable"
import type {ToolMode} from "../types"

export interface LineConfig {
    x1: number
    y1: number
    x2: number
    y2: number
}

export class Line extends AbstractPointShape {
    public x1: number = 0
    public y1: number = 0
    public x2: number = 0
    public y2: number = 0

    readonly mode: 'line' | 'ray'
    readonly minPoints = 2
    readonly maxPoints = 2

    override readonly canHaveArrows = false

    static readonly modes: ToolMode[] = [
        { id: 'line', icon: 'tool-line' },
        { id: 'ray', icon: 'tool-line-ray' },
    ]

    constructor(
        config: LineConfig,
        options: Partial<ShapeOptions> = {},
        mode: 'line' | 'ray' = 'line'
    ) {
        super(options)
        const {x1, y1, x2, y2} = config
        this.x1 = x1
        this.y1 = y1
        this.x2 = x2
        this.y2 = y2
        this.mode = mode
        // Si la config est non triviale (fromJSON), reconstruit _points
        if (Math.hypot(x2 - x1, y2 - y1) > 0.01) {
            this._points = [{x: x1, y: y1}, {x: x2, y: y2}]
        }
    }

    protected _syncFromPoints(): void {
        if (this._points.length >= 1) {
            this.x1 = this._points[0].x
            this.y1 = this._points[0].y
        }
        if (this._points.length >= 2) {
            this.x2 = this._points[1].x
            this.y2 = this._points[1].y
        } else {
            this.x2 = this.x1
            this.y2 = this.y1
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        const dx = this.x2 - this.x1
        const dy = this.y2 - this.y1
        if (Math.abs(dx) < 1e-10 && Math.abs(dy) < 1e-10) return

        // Convertir les bords canvas (pixels écran) en coordonnées monde
        const m = ctx.getTransform()
        const scale = m.a
        if (Math.abs(scale) < 1e-10) return
        const w = ctx.canvas.width
        const h = ctx.canvas.height
        const xMin = (0 - m.e) / scale
        const xMax = (w - m.e) / scale
        const yMin = (0 - m.f) / scale
        const yMax = (h - m.f) / scale

        const ts: number[] = []
        if (Math.abs(dx) > 1e-10) {
            ts.push((xMin - this.x1) / dx)
            ts.push((xMax - this.x1) / dx)
        }
        if (Math.abs(dy) > 1e-10) {
            ts.push((yMin - this.y1) / dy)
            ts.push((yMax - this.y1) / dy)
        }

        const EPS = 0.5 / scale
        const valid = ts.filter(t => {
            if (this.mode === 'ray' && t < -1e-9) return false
            const x = this.x1 + t * dx
            const y = this.y1 + t * dy
            return x >= xMin - EPS && x <= xMax + EPS && y >= yMin - EPS && y <= yMax + EPS
        })

        if (this.mode === 'ray') valid.push(0)
        if (valid.length < 2) return
        valid.sort((a, b) => a - b)

        const t0 = valid[0]
        const t1 = valid[valid.length - 1]
        const px0 = this.x1 + t0 * dx, py0 = this.y1 + t0 * dy
        const px1 = this.x1 + t1 * dx, py1 = this.y1 + t1 * dy
        const angle = Math.atan2(dy, dx)
        const arrowSize = Math.max(this.width * 5, 14)

        ctx.save()
        ctx.beginPath()
        ctx.moveTo(px0, py0)
        ctx.lineTo(px1, py1)
        ctx.strokeStyle = this.color
        ctx.lineWidth = this.width
        ctx.lineCap = 'round'
        AbstractShape.applyLineStyle(ctx, this.lineStyle, this.width, scale)
        ctx.stroke()
        ctx.setLineDash([])

        if (this.mode !== 'ray') {
            if (this.arrowEnd)
                AbstractShape.drawArrowHead(ctx, this.x2, this.y2, angle, arrowSize, this.arrowStyle, this.color, this.width)
            if (this.arrowStart)
                AbstractShape.drawArrowHead(ctx, this.x1, this.y1, angle + Math.PI, arrowSize, this.arrowStyle, this.color, this.width)
        }

        ctx.restore()
    }

    hitTest(x: number, y: number, tolerance: number): boolean {
        const dx = this.x2 - this.x1, dy = this.y2 - this.y1
        const len2 = dx * dx + dy * dy
        if (len2 < 1e-20) return false
        const len = Math.sqrt(len2)
        const dist = Math.abs(dy * x - dx * y + this.x2 * this.y1 - this.y2 * this.x1) / len
        if (dist > this.width / 2 + tolerance) return false
        if (this.mode === 'ray') {
            const t = ((x - this.x1) * dx + (y - this.y1) * dy) / len2
            if (t < 0) return false
        }
        return true
    }

    translate(dx: number, dy: number) {
        this.x1 += dx; this.y1 += dy
        this.x2 += dx; this.y2 += dy
        for (const p of this._points) { p.x += dx; p.y += dy }
    }

    isEmpty() {
        if (this._points.length < this.minPoints) return true
        return Math.hypot(this.x2 - this.x1, this.y2 - this.y1) < 1
    }

    toJSON() {
        return {
            config: { x1: this.x1, y1: this.y1, x2: this.x2, y2: this.y2 },
            options: { ...super.toJSON(), toolMode: this.mode }
        }
    }

    getSnapPoints(): SnapCandidate[] {
        const pts: SnapCandidate[] = [
            {x: this.x1, y: this.y1, type: 'endpoint', shapeId: this.id, layer: this.layer},
        ]
        if (this.mode !== 'ray') {
            pts.push({x: this.x2, y: this.y2, type: 'endpoint', shapeId: this.id, layer: this.layer})
        }
        return pts
    }

    getSegments(): SegmentGeom[] {
        return [{a: {x: this.x1, y: this.y1}, b: {x: this.x2, y: this.y2}, layer: this.layer}]
    }

    getCircles(): CircleGeom[] {
        return []
    }

    getBounds(): Bounds {
        return {
            minX: Math.min(this.x1, this.x2),
            minY: Math.min(this.y1, this.y2),
            maxX: Math.max(this.x1, this.x2),
            maxY: Math.max(this.y1, this.y2),
        }
    }
}
