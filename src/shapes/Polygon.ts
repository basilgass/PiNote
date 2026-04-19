import {AbstractShape} from "./AbstractShape"
import {ShapeOptions} from "./Adaptable"
import {Bounds, CircleGeom, Segment, SnapCandidate} from "./GeometryTypes"
import type {IDrawingContext} from "../core/DrawingContext"

export interface PolygonPoint { x: number; y: number }

export interface PolygonConfig {
    points: PolygonPoint[]
    closed?: boolean
}

export class Polygon extends AbstractShape {
    points: PolygonPoint[] = []
    closed = false
    cursorPos: PolygonPoint | null = null

    override readonly canBeFilled = true
    readonly drawingMode = 'multi-click' as const
    readonly doubleClickTimeout = 300

    constructor(config: PolygonConfig, options: Partial<ShapeOptions> = {}) {
        super(options)
        this.points = config.points ?? []
        this.closed = config.closed ?? false
    }

    addVertex(x: number, y: number) {
        this.points.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 })
    }

    update(x: number, y: number) {
        this.cursorPos = { x, y }
    }

    onDrawStart(x: number, y: number, _ctx: IDrawingContext): void {
        this.addVertex(x, y)
    }

    onDrawMove(x: number, y: number, ctx: IDrawingContext): boolean {
        const { x: tx, y: ty, scale } = ctx.viewTransform
        let finalX = x, finalY = y
        let snapToFirst = false

        if (this.points.length >= 3) {
            const first = this.points[0]
            if (Math.hypot(x - first.x, y - first.y) * scale <= 15) {
                finalX = first.x
                finalY = first.y
                snapToFirst = true
            }
        }

        let snapResult = null
        if (!snapToFirst) {
            snapResult = ctx.snap(x, y, this.layer)
            if (snapResult) { finalX = snapResult.x; finalY = snapResult.y }
        }

        this.update(finalX, finalY)

        const oCtx = ctx.overlayCtx
        oCtx.save()
        oCtx.translate(tx, ty)
        oCtx.scale(scale, scale)
        this.draw(oCtx)

        if (snapToFirst) {
            const first = this.points[0]
            oCtx.beginPath()
            oCtx.arc(first.x, first.y, 8 / scale, 0, Math.PI * 2)
            oCtx.strokeStyle = this.color
            oCtx.lineWidth = 2 / scale
            oCtx.stroke()
        } else if (snapResult) {
            ctx.drawSnapIndicator(snapResult)
        }

        oCtx.restore()
        return true
    }

    onDrawClick(x: number, y: number, ctx: IDrawingContext): 'continue' | 'done' {
        if (this.points.length >= 3) {
            const first = this.points[0]
            if (Math.hypot(x - first.x, y - first.y) * ctx.viewTransform.scale <= 15) {
                this.closed = true
                return 'done'
            }
        }
        const snapResult = ctx.snap(x, y, this.layer)
        this.addVertex(snapResult?.x ?? x, snapResult?.y ?? y)
        return 'continue'
    }

    onDrawEnd(): void {
        this.closed = true
    }

    hitTest(x: number, y: number, tolerance: number): boolean {
        if (this.points.length < 2) return false
        const thresh = this.width / 2 + tolerance
        for (let i = 0; i < this.points.length - 1; i++) {
            const a = this.points[i], b = this.points[i + 1]
            if (AbstractShape.distToSegment(x, y, a.x, a.y, b.x, b.y) <= thresh) return true
        }
        if (this.closed && this.points.length >= 3) {
            const first = this.points[0], last = this.points[this.points.length - 1]
            if (AbstractShape.distToSegment(x, y, last.x, last.y, first.x, first.y) <= thresh) return true
        }
        return false
    }

    translate(dx: number, dy: number) {
        for (const p of this.points) { p.x += dx; p.y += dy }
    }

    isEmpty() {
        return this.points.length < 2
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.points.length < 1) return

        const m = ctx.getTransform()
        const scale = Math.abs(m.a) || 1

        ctx.save()
        ctx.strokeStyle = this.color
        ctx.lineWidth = this.width
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        // Pendant le dessin : inclure le curseur comme prochain sommet
        const previewPoints = (!this.closed && this.cursorPos)
            ? [...this.points, this.cursorPos]
            : this.points

        // Segments validés
        ctx.beginPath()
        ctx.moveTo(previewPoints[0].x, previewPoints[0].y)
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(previewPoints[i].x, previewPoints[i].y)
        }
        if (this.closed) ctx.closePath()
        if (this.fill && this.closed) {
            ctx.globalAlpha = this.fillOpacity
            ctx.fillStyle = this.color
            ctx.fill()
            ctx.globalAlpha = 1
        }
        AbstractShape.applyLineStyle(ctx, this.lineStyle, this.width, scale)
        ctx.stroke()
        ctx.setLineDash([])

        // Segments de preview (pointillés) : dernier validé → curseur → premier sommet
        if (!this.closed && this.cursorPos && previewPoints.length >= 2) {
            const dash = Math.max(this.width * 2, 5) / scale
            ctx.setLineDash([dash, dash])
            ctx.beginPath()
            ctx.moveTo(this.points[this.points.length - 1].x, this.points[this.points.length - 1].y)
            ctx.lineTo(this.cursorPos.x, this.cursorPos.y)
            if (previewPoints.length >= 3) {
                ctx.lineTo(previewPoints[0].x, previewPoints[0].y)
            }
            ctx.stroke()
            ctx.setLineDash([])
        }


        ctx.restore()
    }

    toJSON() {
        return {
            config: { points: this.points, closed: this.closed },
            options: super.toJSON()
        }
    }

    getSnapPoints(): SnapCandidate[] {
        const candidates: SnapCandidate[] = []
        for (const p of this.points) {
            candidates.push({ x: p.x, y: p.y, type: 'corner', shapeId: this.id, layer: this.layer })
        }
        for (let i = 0; i < this.points.length - 1; i++) {
            candidates.push({
                x: (this.points[i].x + this.points[i + 1].x) / 2,
                y: (this.points[i].y + this.points[i + 1].y) / 2,
                type: 'midpoint', shapeId: this.id, layer: this.layer
            })
        }
        if (this.closed && this.points.length >= 3) {
            const first = this.points[0]
            const last = this.points[this.points.length - 1]
            candidates.push({
                x: (first.x + last.x) / 2,
                y: (first.y + last.y) / 2,
                type: 'midpoint', shapeId: this.id, layer: this.layer
            })
        }
        return candidates
    }

    getSegments(): Segment[] {
        if (this.points.length < 2) return []
        const segments: Segment[] = []
        for (let i = 0; i < this.points.length - 1; i++) {
            segments.push({ a: this.points[i], b: this.points[i + 1], layer: this.layer })
        }
        if (this.closed && this.points.length >= 3) {
            segments.push({ a: this.points[this.points.length - 1], b: this.points[0], layer: this.layer })
        }
        return segments
    }

    getCircles(): CircleGeom[] { return [] }

    getBounds(): Bounds | null {
        if (!this.points.length) return null
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        for (const p of this.points) {
            if (p.x < minX) minX = p.x
            if (p.y < minY) minY = p.y
            if (p.x > maxX) maxX = p.x
            if (p.y > maxY) maxY = p.y
        }
        return { minX, minY, maxX, maxY }
    }
}
