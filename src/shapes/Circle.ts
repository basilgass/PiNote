import {AbstractShape} from "./AbstractShape"
import {AbstractPointShape} from "./AbstractPointShape"
import {Bounds, CircleGeom, Point, Segment, SnapCandidate} from "./GeometryTypes"
import {ShapeOptions} from "./Adaptable"
import type {StrokePoint, ToolMode} from "../types"

export interface CircleConfig {
    cx: number
    cy: number
    radius: number
}

export class Circle extends AbstractPointShape {
    public cx: number = 0
    public cy: number = 0
    public radius: number = 0

    /** Mode 3pts uniquement : 2e point en attente avant la fermeture du cercle. */
    private _segEnd: Point | null = null

    readonly mode: 'center-radius' | '3pts'
    readonly minPoints: number
    readonly maxPoints: number

    override readonly canBeFilled = true

    static readonly modes: ToolMode[] = [
        { id: 'center-radius', icon: 'circle' },
        { id: '3pts', icon: 'circle-3pts' },
    ]

    constructor(
        config: CircleConfig,
        options: Partial<ShapeOptions> = {},
        mode: 'center-radius' | '3pts' = 'center-radius'
    ) {
        super(options)
        this.cx = config.cx
        this.cy = config.cy
        this.radius = config.radius
        this.mode = mode
        this.minPoints = mode === '3pts' ? 3 : 2
        this.maxPoints = mode === '3pts' ? 3 : 2

        // Si la config est non triviale (fromJSON), reconstruit _points
        if (this.radius > 0.01) {
            if (mode === 'center-radius') {
                this._points = [
                    { x: this.cx, y: this.cy },
                    { x: this.cx + this.radius, y: this.cy },
                ]
            } else {
                this._points = [
                    { x: this.cx + this.radius, y: this.cy },
                    { x: this.cx - this.radius, y: this.cy },
                    { x: this.cx, y: this.cy + this.radius },
                ]
            }
        }
    }

    protected _syncFromPoints(): void {
        const pts = this._points
        this._segEnd = null

        if (this.mode === 'center-radius') {
            if (pts.length >= 1) { this.cx = pts[0].x; this.cy = pts[0].y }
            if (pts.length >= 2) {
                this.radius = Math.hypot(pts[1].x - this.cx, pts[1].y - this.cy)
            } else {
                this.radius = 0
            }
        } else {
            // mode 3pts
            if (pts.length === 0) {
                this.radius = 0
            } else if (pts.length === 1) {
                this.cx = pts[0].x
                this.cy = pts[0].y
                this.radius = 0
            } else if (pts.length === 2) {
                // Phase 1 : segment p0 → p1, le cercle n'est pas encore déterminé
                this.cx = pts[0].x
                this.cy = pts[0].y
                this.radius = 0
                this._segEnd = { x: pts[1].x, y: pts[1].y }
            } else {
                const cc = this._circumcircle(pts[0], pts[1], pts[2])
                if (cc) { this.cx = cc.cx; this.cy = cc.cy; this.radius = cc.r }
            }
        }
    }

    private _circumcircle(a: Point, b: Point, c: Point): { cx: number; cy: number; r: number } | null {
        const ax = b.x - a.x, ay = b.y - a.y
        const bx = c.x - a.x, by = c.y - a.y
        const D = 2 * (ax * by - ay * bx)
        if (Math.abs(D) < 1e-10) return null
        const ux = (by * (ax * ax + ay * ay) - ay * (bx * bx + by * by)) / D
        const uy = (ax * (bx * bx + by * by) - bx * (ax * ax + ay * ay)) / D
        return { cx: a.x + ux, cy: a.y + uy, r: Math.hypot(ux, uy) }
    }

    draw(ctx: CanvasRenderingContext2D) {
        const scale = Math.abs(ctx.getTransform().a) || 1
        ctx.save()
        ctx.strokeStyle = this.color
        ctx.lineWidth = this.width
        ctx.lineCap = 'round'

        // Phase 1 du mode 3pts : segment pointillé p0 → p1
        if (this._segEnd !== null) {
            const dash = Math.max(this.width * 2, 5) / scale
            ctx.setLineDash([dash, dash])
            ctx.beginPath()
            ctx.moveTo(this.cx, this.cy)
            ctx.lineTo(this._segEnd.x, this._segEnd.y)
            ctx.stroke()
            ctx.setLineDash([])
            ctx.restore()
            return
        }

        if (this.radius < 1e-6) { ctx.restore(); return }

        ctx.beginPath()
        ctx.arc(this.cx, this.cy, this.radius, 0, Math.PI * 2)
        if (this.fill && !this._isPreview) {
            ctx.globalAlpha = this.fillOpacity
            ctx.fillStyle = this.color
            ctx.fill()
            ctx.globalAlpha = 1
        }
        if (this._isPreview) {
            const dash = Math.max(this.width * 2, 5) / scale
            ctx.setLineDash([dash, dash])
        } else {
            AbstractShape.applyLineStyle(ctx, this.lineStyle, this.width, scale)
        }
        ctx.stroke()
        ctx.setLineDash([])

        if (!this._isPreview) {
            const dotRadius = Math.max(2, this.width * 1.5) / scale
            ctx.beginPath()
            ctx.arc(this.cx, this.cy, dotRadius, 0, Math.PI * 2)
            ctx.fillStyle = this.color
            ctx.fill()
        }

        ctx.restore()
    }

    hitTest(x: number, y: number, tolerance: number): boolean {
        return Math.abs(Math.hypot(x - this.cx, y - this.cy) - this.radius) <= this.width / 2 + tolerance
    }

    translate(dx: number, dy: number) {
        this.cx += dx; this.cy += dy
        for (const p of this._points) { p.x += dx; p.y += dy }
    }

    isEmpty() {
        if (this._points.length < this.minPoints) return true
        return this.radius < 1
    }

    toJSON() {
        return {
            config: {
                cx: this.cx,
                cy: this.cy,
                radius: this.radius,
            },
            options: super.toJSON()
        }
    }

    getSnapPoints(): SnapCandidate[] {
        return [
            {x: this.cx, y: this.cy, type: "center", shapeId: this.id, layer: this.layer},
            {x: this.cx + this.radius, y: this.cy, type: "circumference", shapeId: this.id, layer: this.layer},
            {x: this.cx - this.radius, y: this.cy, type: "circumference", shapeId: this.id, layer: this.layer},
            {x: this.cx, y: this.cy + this.radius, type: "circumference", shapeId: this.id, layer: this.layer},
            {x: this.cx, y: this.cy - this.radius, type: "circumference", shapeId: this.id, layer: this.layer}
        ]
    }

    getSegments(): Segment[] {
        return []
    }

    getCircles(): CircleGeom[] {
        return [{center: {x: this.cx, y: this.cy}, radius: this.radius, layer: this.layer}]
    }

    getBounds(): Bounds {
        return {
            minX: this.cx - this.radius,
            minY: this.cy - this.radius,
            maxX: this.cx + this.radius,
            maxY: this.cy + this.radius,
        }
    }

    override rasterize(step = 2): StrokePoint[] {
        if (this.radius < 0.5) return []
        const circumference = 2 * Math.PI * this.radius
        const n = Math.max(8, Math.ceil(circumference / step))
        const pts: StrokePoint[] = []
        for (let i = 0; i <= n; i++) {
            const a = (i / n) * 2 * Math.PI
            pts.push({
                x: this.cx + this.radius * Math.cos(a),
                y: this.cy + this.radius * Math.sin(a),
                t: 0,
                pressure: 0,
            })
        }
        return pts
    }
}
