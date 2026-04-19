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

    override readonly canHaveArrows = true

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
        const scale = Math.abs(ctx.getTransform().a) || 1
        const dx = this.x2 - this.x1
        const dy = this.y2 - this.y1
        const angle = Math.atan2(dy, dx)
        const len = Math.hypot(dx, dy)
        const arrowSize = Math.max(this.width * 5, 14)

        // Raccourcir le trait sous la tête de flèche pour éviter le chevauchement
        let x1 = this.x1, y1 = this.y1, x2 = this.x2, y2 = this.y2
        if (this.arrowEnd && len > arrowSize) {
            x2 = this.x2 - arrowSize * 0.8 * Math.cos(angle)
            y2 = this.y2 - arrowSize * 0.8 * Math.sin(angle)
        }
        if (this.arrowStart && len > arrowSize) {
            x1 = this.x1 + arrowSize * 0.8 * Math.cos(angle)
            y1 = this.y1 + arrowSize * 0.8 * Math.sin(angle)
        }

        ctx.save()
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = this.color
        ctx.lineWidth = this.width
        ctx.lineCap = 'round'
        AbstractShape.applyLineStyle(ctx, this.lineStyle, this.width, scale)
        ctx.stroke()
        ctx.setLineDash([])

        if (this.arrowEnd)
            AbstractShape.drawArrowHead(ctx, this.x2, this.y2, angle, arrowSize, this.arrowStyle, this.color, this.width)
        if (this.arrowStart)
            AbstractShape.drawArrowHead(ctx, this.x1, this.y1, angle + Math.PI, arrowSize, this.arrowStyle, this.color, this.width)

        ctx.restore()
    }

    update(x: number, y: number) {
        this.x2 = x
        this.y2 = y
    }

    hitTest(x: number, y: number, tolerance: number): boolean {
        return AbstractShape.distToSegment(x, y, this.x1, this.y1, this.x2, this.y2) <= this.width / 2 + tolerance
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
        const pad = (this.arrowStart || this.arrowEnd) ? Math.max(this.width * 1.5, 4) : 0
        return {
            minX: Math.min(this.x1, this.x2) - pad,
            minY: Math.min(this.y1, this.y2) - pad,
            maxX: Math.max(this.x1, this.x2) + pad,
            maxY: Math.max(this.y1, this.y2) + pad,
        }
    }
}
