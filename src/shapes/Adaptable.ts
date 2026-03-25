import {LayerName, ToolType} from "../types"
import {Bounds, CircleGeom, Segment, SnapCandidate} from "./GeometryTypes"

export interface ShapeOptions {
    id?: string
    createdAt?: number
    tool?: ToolType
    layer?: LayerName | null
    color?: string
    width?: number
    hidden?: boolean
}


export interface Adaptable  {
    id: string
    tool: ToolType
    layer: LayerName | null
    color: string

    draw(ctx: CanvasRenderingContext2D): void

    toJSON(): any

    update?(x: number, y: number): void

    isIncremental?: boolean

    getSnapPoints(): SnapCandidate[]

    getSegments(): Segment[]

    getCircles(): CircleGeom[]

    getBounds(): Bounds | null

    hidden: boolean
    translate(dx: number, dy: number): void
}