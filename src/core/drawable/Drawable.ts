// Drawable.ts
import {LayerName} from "src/types"

export interface Drawable {
    layer: LayerName | null
    draw(ctx: CanvasRenderingContext2D): void
    toJSON(): any
    update?(x: number, y: number): void
    isIncremental?: boolean
}