import {LayerName, ToolType} from "../types"
import {Adaptable, ShapeOptions} from "./Adaptable"
import {Bounds, CircleGeom, Segment, SnapCandidate} from "./GeometryTypes"

export interface ShapeConfig {
    id: string
    createdAt?: number
}

export abstract class AbstractShape implements Adaptable {
    id = `shape-${Math.random().toString(36).slice(2, 9)}`
    tool: ToolType
    layer: LayerName | null
    color: string
    width: number
    hidden: boolean
    isIncremental?: boolean = false
    createdAt: number

    constructor(options: Partial<ShapeOptions> = {}) {
        this.id = options.id ?? 'shape-' + Math.random().toString(36).slice(2, 9)
        this.createdAt = options.createdAt ?? Date.now()
        this.tool = options.tool ?? "pen"
        this.layer = options.layer ?? null
        this.color = options.color ?? "#000000"
        this.width = options.width ?? 2
        this.hidden = options.hidden ?? false
    }

    abstract draw(ctx: CanvasRenderingContext2D): void

    toJSON(): any {
        return {
            id: this.id,
            createdAt: this.createdAt,
            tool: this.tool,
            layer: this.layer,
            color: this.color,
            width: this.width,
            hidden: this.hidden
        }
    }

    abstract translate(dx: number, dy: number): void

    abstract getSnapPoints(): SnapCandidate[]

    abstract getSegments(): Segment[]

    abstract getCircles(): CircleGeom[]

    abstract getBounds(): Bounds | null

    update?(x: number, y: number): void

    isEmpty(): boolean { return false }
}
