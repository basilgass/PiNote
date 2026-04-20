import {AbstractShape} from "./AbstractShape"
import {Bounds, CircleGeom, Segment, SnapCandidate} from "./GeometryTypes"
import {ShapeOptions} from "./Adaptable"

export interface CircleConfig {
    cx: number
    cy: number
    radius: number
}

export class Circle extends AbstractShape {
    public cx: number
    public cy: number
    public radius: number

    override readonly canBeFilled = true

    constructor(
        config: CircleConfig,
        options: Partial<ShapeOptions> = {}
    ) {

        super(options) // layer/color/width gérés par AbstractShape
        const {cx, cy, radius} = config
        this.cx = cx
        this.cy = cy
        this.radius = radius
    }

    draw(ctx: CanvasRenderingContext2D) {
        const scale = Math.abs(ctx.getTransform().a) || 1
        ctx.save()
        ctx.beginPath()
        ctx.arc(this.cx, this.cy, this.radius, 0, Math.PI * 2)
        if (this.fill) {
            ctx.globalAlpha = this.fillOpacity
            ctx.fillStyle = this.color
            ctx.fill()
            ctx.globalAlpha = 1
        }
        ctx.strokeStyle = this.color
        ctx.lineWidth = this.width
        AbstractShape.applyLineStyle(ctx, this.lineStyle, this.width, scale)
        ctx.stroke()
        ctx.setLineDash([])

        const dotRadius = Math.max(2, this.width * 1.5) / scale
        ctx.beginPath()
        ctx.arc(this.cx, this.cy, dotRadius, 0, Math.PI * 2)
        ctx.fillStyle = this.color
        ctx.fill()

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
        return [] // pas de segment pour un cercle
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