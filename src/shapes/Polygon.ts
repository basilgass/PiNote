import {AbstractShape} from "./AbstractShape"
import {AbstractPointShape} from "./AbstractPointShape"
import {ShapeOptions} from "./Adaptable"
import {Bounds, CircleGeom, Point, Segment, SnapCandidate} from "./GeometryTypes"

export interface PolygonPoint { x: number; y: number }

export interface PolygonConfig {
    points: PolygonPoint[]
    closed?: boolean
}

export class Polygon extends AbstractPointShape {
    closed = false
    /** Position du curseur pendant la preview (segments pointillés). Null hors preview. */
    private _cursorPos: Point | null = null

    readonly minPoints = 3
    readonly maxPoints = Infinity

    override readonly canBeFilled = true

    constructor(config: PolygonConfig, options: Partial<ShapeOptions> = {}) {
        super(options)
        this.closed = config.closed ?? false
        const pts = config.points ?? []
        if (pts.length > 0) {
            this._points = pts.map(p => ({
                x: Math.round(p.x * 10) / 10,
                y: Math.round(p.y * 10) / 10,
            }))
        }
    }

    protected _syncFromPoints(): void {
        if (this._isPreview && this._points.length > 0) {
            const last = this._points[this._points.length - 1]
            this._cursorPos = { x: last.x, y: last.y }
        } else {
            this._cursorPos = null
        }
    }

    override commitPoint(p: Point): void {
        super.commitPoint({
            x: Math.round(p.x * 10) / 10,
            y: Math.round(p.y * 10) / 10,
        })
    }

    override finalize(closed: boolean): void {
        super.finalize(closed)
        this.closed = closed
    }

    hitTest(x: number, y: number, tolerance: number): boolean {
        const pts = this._points
        if (pts.length < 2) return false
        const thresh = this.width / 2 + tolerance
        for (let i = 0; i < pts.length - 1; i++) {
            const a = pts[i], b = pts[i + 1]
            if (AbstractShape.distToSegment(x, y, a.x, a.y, b.x, b.y) <= thresh) return true
        }
        if (this.closed && pts.length >= 3) {
            const first = pts[0], last = pts[pts.length - 1]
            if (AbstractShape.distToSegment(x, y, last.x, last.y, first.x, first.y) <= thresh) return true
        }
        return false
    }

    translate(dx: number, dy: number) {
        for (const p of this._points) { p.x += dx; p.y += dy }
        if (this._cursorPos) { this._cursorPos.x += dx; this._cursorPos.y += dy }
    }

    isEmpty() {
        return this._points.length < 2
    }

    draw(ctx: CanvasRenderingContext2D) {
        const pts = this._points
        if (pts.length < 1) return

        const m = ctx.getTransform()
        const scale = Math.abs(m.a) || 1

        ctx.save()
        ctx.strokeStyle = this.color
        ctx.lineWidth = this.width
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        // Segments validés
        ctx.beginPath()
        ctx.moveTo(pts[0].x, pts[0].y)
        for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y)
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
        if (this._isPreview && !this.closed && this._cursorPos && pts.length >= 1) {
            const dash = Math.max(this.width * 2, 5) / scale
            ctx.setLineDash([dash, dash])
            ctx.beginPath()
            ctx.moveTo(pts[pts.length - 1].x, pts[pts.length - 1].y)
            ctx.lineTo(this._cursorPos.x, this._cursorPos.y)
            if (pts.length >= 2) {
                ctx.lineTo(pts[0].x, pts[0].y)
            }
            ctx.stroke()
            ctx.setLineDash([])
        }

        ctx.restore()
    }

    toJSON() {
        return {
            config: { points: this._points.map(p => ({x: p.x, y: p.y})), closed: this.closed },
            options: super.toJSON()
        }
    }

    getSnapPoints(): SnapCandidate[] {
        const pts = this._points
        const candidates: SnapCandidate[] = []
        for (const p of pts) {
            candidates.push({ x: p.x, y: p.y, type: 'corner', shapeId: this.id, layer: this.layer })
        }
        for (let i = 0; i < pts.length - 1; i++) {
            candidates.push({
                x: (pts[i].x + pts[i + 1].x) / 2,
                y: (pts[i].y + pts[i + 1].y) / 2,
                type: 'midpoint', shapeId: this.id, layer: this.layer
            })
        }
        if (this.closed && pts.length >= 3) {
            const first = pts[0]
            const last = pts[pts.length - 1]
            candidates.push({
                x: (first.x + last.x) / 2,
                y: (first.y + last.y) / 2,
                type: 'midpoint', shapeId: this.id, layer: this.layer
            })
        }
        return candidates
    }

    getSegments(): Segment[] {
        const pts = this._points
        if (pts.length < 2) return []
        const segments: Segment[] = []
        for (let i = 0; i < pts.length - 1; i++) {
            segments.push({ a: pts[i], b: pts[i + 1], layer: this.layer })
        }
        if (this.closed && pts.length >= 3) {
            segments.push({ a: pts[pts.length - 1], b: pts[0], layer: this.layer })
        }
        return segments
    }

    getCircles(): CircleGeom[] { return [] }

    getBounds(): Bounds | null {
        const pts = this._points
        if (!pts.length) return null
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        for (const p of pts) {
            if (p.x < minX) minX = p.x
            if (p.y < minY) minY = p.y
            if (p.x > maxX) maxX = p.x
            if (p.y > maxY) maxY = p.y
        }
        return { minX, minY, maxX, maxY }
    }
}
