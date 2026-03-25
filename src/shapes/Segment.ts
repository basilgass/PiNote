import {AbstractShape} from "./AbstractShape"
import {Bounds, CircleGeom, Segment as SegmentGeom, SnapCandidate} from "./GeometryTypes"
import {ShapeOptions} from "./Adaptable"

export interface SegmentConfig {
    x1: number
    y1: number
    x2: number
    y2: number
}

export class Segment extends AbstractShape {
    public x1: number
    public y1: number
    public x2: number
    public y2: number

    constructor(
        config: SegmentConfig,
        options: Partial<ShapeOptions> = {}
    ) {
        super(options)
        const {x1, y1, x2, y2} = config
        this.x1 = x1
        this.y1 = y1
        this.x2 = x2
        this.y2 = y2
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(this.x1, this.y1)
        ctx.lineTo(this.x2, this.y2)
        ctx.strokeStyle = this.color
        ctx.lineWidth = this.width
        ctx.lineCap = 'round'
        ctx.stroke()
        ctx.restore()
    }

    update(x: number, y: number) {
        this.x2 = x
        this.y2 = y
    }

    translate(dx: number, dy: number) {
        this.x1 += dx; this.y1 += dy
        this.x2 += dx; this.y2 += dy
    }

    isEmpty() {
        return Math.hypot(this.x2 - this.x1, this.y2 - this.y1) < 1
    }

    toJSON() {
        return {
            config: { x1: this.x1, y1: this.y1, x2: this.x2, y2: this.y2 },
            options: super.toJSON()
        }
    }

    getSnapPoints(): SnapCandidate[] {
        return [
            {x: this.x1, y: this.y1, type: 'endpoint', shapeId: this.id, layer: this.layer},
            {x: this.x2, y: this.y2, type: 'endpoint', shapeId: this.id, layer: this.layer},
            {x: (this.x1 + this.x2) / 2, y: (this.y1 + this.y2) / 2, type: 'midpoint', shapeId: this.id, layer: this.layer},
        ]
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
