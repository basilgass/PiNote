import {AbstractShape} from "./AbstractShape"
import {Bounds, CircleGeom, Segment, SnapCandidate} from "./GeometryTypes"
import {DrawingMode, ShapeOptions} from "./Adaptable"
import type {IDrawingContext} from "../core/DrawingContext"
import type {ToolMode} from "../types"

interface Pt { x: number; y: number }

export interface CircleConfig {
    cx: number
    cy: number
    radius: number
}

export class Circle extends AbstractShape {
    public cx: number
    public cy: number
    public radius: number

    readonly mode: 'center-radius' | '3pts'
    readonly drawingMode: DrawingMode

    private _p1: Pt | null = null
    private _p2: Pt | null = null
    private _cursor: Pt | null = null

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
        const {cx, cy, radius} = config
        this.cx = cx
        this.cy = cy
        this.radius = radius
        this.mode = mode
        this.drawingMode = mode === '3pts' ? 'multi-click' : 'drag'
    }

    onDrawStart(x: number, y: number, _ctx: IDrawingContext): void {
        if (this.mode !== '3pts') return
        this._p1 = { x, y }
        this._cursor = { x, y }
    }

    onDrawMove(x: number, y: number, ctx: IDrawingContext): boolean {
        if (this.mode !== '3pts') return false
        const snapResult = ctx.snap(x, y, this.layer)
        const fx = snapResult?.x ?? x
        const fy = snapResult?.y ?? y
        this._cursor = { x: fx, y: fy }

        if (this._p2 !== null && this._p1 !== null) {
            const cc = this._circumcircle(this._p1, this._p2, this._cursor)
            if (cc) { this.cx = cc.cx; this.cy = cc.cy; this.radius = cc.r }
        }

        const { x: tx, y: ty, scale } = ctx.viewTransform
        const oCtx = ctx.overlayCtx
        oCtx.save()
        oCtx.translate(tx, ty)
        oCtx.scale(scale, scale)
        this.draw(oCtx)
        if (snapResult) ctx.drawSnapIndicator(snapResult)
        oCtx.restore()
        return true
    }

    onDrawClick(x: number, y: number, ctx: IDrawingContext): 'continue' | 'done' {
        const snapResult = ctx.snap(x, y, this.layer)
        const fx = snapResult?.x ?? x
        const fy = snapResult?.y ?? y

        if (this._p2 === null) {
            this._p2 = { x: fx, y: fy }
            return 'continue'
        }
        if (this._p1 !== null) {
            const cc = this._circumcircle(this._p1, this._p2, { x: fx, y: fy })
            if (cc) { this.cx = cc.cx; this.cy = cc.cy; this.radius = cc.r }
        }
        return 'done'
    }

    onDrawEnd(): void {
        this._cursor = null
        this._p1 = null
        this._p2 = null
    }

    private _circumcircle(a: Pt, b: Pt, c: Pt): { cx: number; cy: number; r: number } | null {
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

        // Phase 1 du mode 3pts : segment en pointillés P1 → curseur
        if (this.mode === '3pts' && this._p2 === null && this._p1 !== null && this._cursor !== null) {
            const dash = Math.max(this.width * 2, 5) / scale
            ctx.setLineDash([dash, dash])
            ctx.beginPath()
            ctx.moveTo(this._p1.x, this._p1.y)
            ctx.lineTo(this._cursor.x, this._cursor.y)
            ctx.stroke()
            ctx.setLineDash([])
            ctx.restore()
            return
        }

        // Phase 2 du mode 3pts (preview) ou dessin final : cercle
        const isPreview = this.mode === '3pts' && this._cursor !== null

        ctx.beginPath()
        ctx.arc(this.cx, this.cy, this.radius, 0, Math.PI * 2)
        if (this.fill && !isPreview) {
            ctx.globalAlpha = this.fillOpacity
            ctx.fillStyle = this.color
            ctx.fill()
            ctx.globalAlpha = 1
        }
        if (isPreview) {
            const dash = Math.max(this.width * 2, 5) / scale
            ctx.setLineDash([dash, dash])
        } else {
            AbstractShape.applyLineStyle(ctx, this.lineStyle, this.width, scale)
        }
        ctx.stroke()
        ctx.setLineDash([])

        if (!isPreview) {
            const dotRadius = Math.max(2, this.width * 1.5) / scale
            ctx.beginPath()
            ctx.arc(this.cx, this.cy, dotRadius, 0, Math.PI * 2)
            ctx.fillStyle = this.color
            ctx.fill()
        }

        ctx.restore()
    }

    update(x: number, y: number) {
        const dx = x - this.cx
        const dy = y - this.cy
        this.radius = Math.hypot(dx, dy)
    }

    hitTest(x: number, y: number, tolerance: number): boolean {
        return Math.abs(Math.hypot(x - this.cx, y - this.cy) - this.radius) <= this.width / 2 + tolerance
    }

    translate(dx: number, dy: number) {
        this.cx += dx; this.cy += dy
    }

    isEmpty() {
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
}
