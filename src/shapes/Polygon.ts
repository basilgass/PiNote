import {AbstractShape} from "./AbstractShape"
import {ShapeOptions} from "./Adaptable"
import {Bounds, CircleGeom, Segment, SnapCandidate} from "./GeometryTypes"

export type PolygonPoint = { x: number; y: number }

export interface PolygonConfig {
    points: PolygonPoint[]
    closed?: boolean
}

export class Polygon extends AbstractShape {
    points: PolygonPoint[] = []
    closed = false
    cursorPos: PolygonPoint | null = null

    constructor(config: PolygonConfig, options: Partial<ShapeOptions> = {}) {
        super(options)
        this.points = config.points ?? []
        this.closed = config.closed ?? false
    }

    addVertex(x: number, y: number) {
        this.points.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 })
    }

    // Appelé à chaque pointermove — met à jour la position du curseur pour le preview
    update(x: number, y: number) {
        this.cursorPos = { x, y }
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

        // Segments validés (traits pleins)
        ctx.beginPath()
        ctx.moveTo(previewPoints[0].x, previewPoints[0].y)
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(previewPoints[i].x, previewPoints[i].y)
        }
        ctx.stroke()

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

        // Polygone finalisé
        if (this.closed) {
            ctx.beginPath()
            ctx.moveTo(this.points[0].x, this.points[0].y)
            for (let i = 1; i < this.points.length; i++) {
                ctx.lineTo(this.points[i].x, this.points[i].y)
            }
            ctx.closePath()
            ctx.stroke()
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
