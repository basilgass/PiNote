import {ArrowStyle, LayerName, LineStyle, ToolType} from "../types"
import {Bounds, CircleGeom, Segment, SnapCandidate} from "./GeometryTypes"
import type {IDrawingContext} from "../core/DrawingContext"

export type DrawingMode = 'drag' | 'multi-click' | 'two-phase'

export interface ShapeOptions {
    id?: string
    createdAt?: number
    tool?: ToolType
    layer?: LayerName | null
    color?: string
    width?: number
    hidden?: boolean
    arrowStart?: boolean
    arrowEnd?: boolean
    arrowStyle?: ArrowStyle
    lineStyle?: LineStyle
    fill?: boolean
    fillOpacity?: number
}

export type ShapePatch = Partial<ShapeOptions> & { bezier?: boolean; closed?: boolean; sector?: boolean }

export interface Capabilities {
    canHaveArrows: boolean
    canBeFilled: boolean
}


export interface Adaptable extends Capabilities {
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
    hitTest(x: number, y: number, tolerance: number): boolean

    // --- Hooks d'interaction (optionnels) ---
    readonly drawingMode?: DrawingMode
    /** Appelé après création + snap initial (startShape) */
    onDrawStart?(x: number, y: number, ctx: IDrawingContext): void
    /** Appelé sur pointermove. Retourne true si l'overlay est géré par la shape. */
    onDrawMove?(x: number, y: number, ctx: IDrawingContext): boolean
    /** Appelé sur pointermove pour accumuler un point (ex: Stroke) */
    onDrawPoint?(x: number, y: number, t: number): void
    /** Mode multi-click : appelé sur chaque clic suivant le premier */
    onDrawClick?(x: number, y: number, ctx: IDrawingContext): 'continue' | 'done'
    /** Mode two-phase : appelé au 2e clic (transition phase 1 → phase 2) */
    onPhaseTransition?(x: number, y: number, ctx: IDrawingContext): void
    /** Appelé juste avant que la shape soit finalisée dans endShape */
    onDrawEnd?(): void
    /** Délai double-clic en ms pour fermeture anticipée (multi-click) */
    readonly doubleClickTimeout?: number
}