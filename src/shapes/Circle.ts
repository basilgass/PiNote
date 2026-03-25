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
        ctx.save()
        ctx.beginPath()
        ctx.arc(this.cx, this.cy, this.radius, 0, Math.PI * 2)
        ctx.strokeStyle = this.color
        ctx.lineWidth = this.width
        ctx.stroke()
        ctx.restore()
    }

    update(x: number, y: number) {
        const dx = x - this.cx
        const dy = y - this.cy
        this.radius = Math.hypot(dx, dy)
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