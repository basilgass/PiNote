import {LayerName} from "../../types"
import {LineOptions} from "@core/drawable/Line"
import {Drawable} from "@core/drawable/Drawable"

export class Circle implements Drawable {
    layer: LayerName| null

    constructor(
        public cx: number,
        public cy: number,
        public radius: number,
        private options: LineOptions
    ) {
        this.layer = options.layer
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        ctx.arc(this.cx, this.cy, this.radius, 0, Math.PI * 2)
        ctx.strokeStyle = this.options.color
        ctx.lineWidth = this.options.width
        ctx.stroke()
    }

    toJSON() {
        return {
            type: 'circle',
            cx: this.cx,
            cy: this.cy,
            radius: this.radius,
            options: this.options
        }
    }
    update(x: number, y: number) {
        const dx = x - this.cx
        const dy = y - this.cy
        this.radius = Math.hypot(dx, dy)
    }

}