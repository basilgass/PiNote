import {LayerName} from "../../types"
import {LineOptions} from "@core/drawable/Line"
import {Drawable} from "@core/drawable/Drawable"

export class Rectangle implements Drawable {
    layer: LayerName | null

    constructor(
        public x: number,
        public y: number,
        public w: number,
        public h: number,
        private options: LineOptions
    ) {
        this.layer = options.layer
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        ctx.rect(this.x, this.y, this.w, this.h)
        ctx.strokeStyle = this.options.color
        ctx.lineWidth = this.options.width
        ctx.stroke()
    }

    toJSON() {
        return {
            type: 'rectangle',
            x: this.x,
            y: this.y,
            w: this.w,
            h: this.h,
            options: this.options
        }
    }

    update(x: number, y: number) {
        this.w = x - this.x
        this.h = y - this.y
    }

}