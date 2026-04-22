import {AbstractShape} from "./AbstractShape"
import {DrawingMode, ShapeOptions} from "./Adaptable"
import {Bounds, CircleGeom, Segment, SnapCandidate} from "./GeometryTypes"
import type {IDrawingContext} from "../core/DrawingContext"

export interface RectangleConfig {
    p1: { x: number; y: number }
    p2: { x: number; y: number }
    w: number  // largeur perpendiculaire signée
}

interface Pt { x: number; y: number }

export class Rectangle extends AbstractShape {
    p1: Pt
    p2: Pt
    w: number
    cursorPos: Pt | null = null
    readonly mode: '2pts' | '3pts'

    override readonly canBeFilled = true
    readonly drawingMode: DrawingMode

    constructor(config: RectangleConfig, options: Partial<ShapeOptions> = {}, mode: '2pts' | '3pts' = '2pts') {
        super(options)
        this.p1 = config.p1
        this.p2 = config.p2
        this.w = config.w
        this.mode = mode
        this.drawingMode = mode === '3pts' ? 'two-phase' : 'drag'
    }

    // Phase courante : 1 si P2 pas encore placé (arête de longueur nulle), 2 sinon
    private get phase(): 1 | 2 {
        return Math.hypot(this.p2.x - this.p1.x, this.p2.y - this.p1.y) > 0.01 ? 2 : 1
    }

    setP2(x: number, y: number) {
        this.p2 = { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }
    }

    onPhaseTransition(x: number, y: number, ctx: IDrawingContext): void {
        const snapResult = ctx.snap(x, y, this.layer)
        this.setP2(snapResult?.x ?? x, snapResult?.y ?? y)
        const { x: tx, y: ty, scale } = ctx.viewTransform
        const oCtx = ctx.overlayCtx
        oCtx.save()
        oCtx.translate(tx, ty)
        oCtx.scale(scale, scale)
        this.draw(oCtx)
        if (snapResult) ctx.drawSnapIndicator(snapResult)
        oCtx.restore()
    }

    update(x: number, y: number) {
        if (this.mode === '2pts') {
            this.p2 = { x: Math.round(x * 10) / 10, y: Math.round(this.p1.y * 10) / 10 }
            const sign = x >= this.p1.x ? 1 : -1
            this.w = Math.round((y - this.p1.y) * sign * 10) / 10
        } else if (this.phase === 1) {
            this.cursorPos = { x, y }
        } else {
            const dx = this.p2.x - this.p1.x
            const dy = this.p2.y - this.p1.y
            const len = Math.hypot(dx, dy)
            if (len < 1e-10) return
            const perpX = -dy / len
            const perpY = dx / len
            this.w = (x - this.p1.x) * perpX + (y - this.p1.y) * perpY
        }
    }

    getCorners(): [Pt, Pt, Pt, Pt] | null {
        if (this.phase === 1) return null
        const dx = this.p2.x - this.p1.x
        const dy = this.p2.y - this.p1.y
        const len = Math.hypot(dx, dy)
        if (len < 1e-10) return null
        const px = (-dy / len) * this.w
        const py = (dx / len) * this.w
        return [
            { x: this.p1.x, y: this.p1.y },
            { x: this.p2.x, y: this.p2.y },
            { x: this.p2.x + px, y: this.p2.y + py },
            { x: this.p1.x + px, y: this.p1.y + py },
        ]
    }

    hitTest(x: number, y: number, tolerance: number): boolean {
        const corners = this.getCorners()
        if (!corners) return false
        const thresh = this.width / 2 + tolerance
        for (let i = 0; i < 4; i++) {
            const a = corners[i], b = corners[(i + 1) % 4]
            if (AbstractShape.distToSegment(x, y, a.x, a.y, b.x, b.y) <= thresh) return true
        }
        return false
    }

    translate(dx: number, dy: number) {
        this.p1.x += dx; this.p1.y += dy
        this.p2.x += dx; this.p2.y += dy
    }

    isEmpty() {
        if (this.phase === 1) return true
        const edgeLen = Math.hypot(this.p2.x - this.p1.x, this.p2.y - this.p1.y)
        return edgeLen < 1 || Math.abs(this.w) < 1
    }

    draw(ctx: CanvasRenderingContext2D) {
        const m = ctx.getTransform()
        const scale = Math.abs(m.a) || 1

        ctx.save()
        ctx.strokeStyle = this.color
        ctx.lineWidth = this.width
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        if (this.phase === 1) {
            // Premier drag : on trace le segment (rectangle de largeur nulle)
            if (!this.cursorPos) { ctx.restore(); return }
            ctx.beginPath()
            ctx.moveTo(this.p1.x, this.p1.y)
            ctx.lineTo(this.cursorPos.x, this.cursorPos.y)
            ctx.stroke()
        } else {
            const corners = this.getCorners()
            if (!corners) { ctx.restore(); return }
            ctx.beginPath()
            ctx.moveTo(corners[0].x, corners[0].y)
            for (let i = 1; i < 4; i++) ctx.lineTo(corners[i].x, corners[i].y)
            ctx.closePath()
            if (this.fill) {
                ctx.globalAlpha = this.fillOpacity
                ctx.fillStyle = this.color
                ctx.fill()
                ctx.globalAlpha = 1
            }
            AbstractShape.applyLineStyle(ctx, this.lineStyle, this.width, scale)
            ctx.stroke()
            ctx.setLineDash([])
        }

        ctx.restore()
    }

    toJSON() {
        return {
            config: { p1: this.p1, p2: this.p2, w: this.w },
            options: super.toJSON()
        }
    }

    getSnapPoints(): SnapCandidate[] {
        const corners = this.getCorners()
        if (!corners) return []
        const pts: SnapCandidate[] = corners.map(c => ({
            x: c.x, y: c.y, type: 'corner' as const, shapeId: this.id, layer: this.layer
        }))
        pts.push({
            x: (corners[0].x + corners[2].x) / 2,
            y: (corners[0].y + corners[2].y) / 2,
            type: 'center', shapeId: this.id, layer: this.layer
        })
        return pts
    }

    getSegments(): Segment[] {
        const corners = this.getCorners()
        if (!corners) return []
        return [
            { a: corners[0], b: corners[1], layer: this.layer },
            { a: corners[1], b: corners[2], layer: this.layer },
            { a: corners[2], b: corners[3], layer: this.layer },
            { a: corners[3], b: corners[0], layer: this.layer },
        ]
    }

    getCircles(): CircleGeom[] { return [] }

    getBounds(): Bounds | null {
        const corners = this.getCorners()
        if (!corners) return null
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        for (const c of corners) {
            if (c.x < minX) minX = c.x
            if (c.y < minY) minY = c.y
            if (c.x > maxX) maxX = c.x
            if (c.y > maxY) maxY = c.y
        }
        return { minX, minY, maxX, maxY }
    }
}
