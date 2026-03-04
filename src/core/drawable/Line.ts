import {LayerName} from "src/types"
import {Drawable} from "@core/drawable/Drawable"

export interface LineOptions {
    layer: LayerName | null
    color: string
    width: number
}

export class Line implements Drawable {
    layer: LayerName | null

    constructor(
        public x1: number,
        public y1: number,
        public x2: number,
        public y2: number,
        private options: LineOptions
    ) {
        this.layer = options.layer
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        ctx.moveTo(this.x1, this.y1)
        ctx.lineTo(this.x2, this.y2)
        ctx.strokeStyle = this.options.color
        ctx.lineWidth = this.options.width
        ctx.lineCap = 'round'
        ctx.stroke()
    }

    toJSON() {
        return {
            type: 'line',
            x1: this.x1,
            y1: this.y1,
            x2: this.x2,
            y2: this.y2,
            options: this.options
        }
    }

    update(x: number, y: number) {
        this.x2 = x
        this.y2 = y
    }
}