export interface StrokePoint {
    x: number
    y: number
    t: number
    pressure: number
}

export type GeomType =
    | 'line'        // droite infinie passant par deux points
    | 'segment'     // segment borné entre deux points
    | 'rectangle'
    | 'circle'
    | 'polygon'

export type ToolType =
    | 'pen'
    | 'eraser'
    | 'highlighter'
    | 'move'
    | GeomType


export interface ToolConfig {
    tool: ToolType
    color: string
    width: number
    layer: LayerName
    bezier: boolean
}

interface ToolState {
    color: string
    width: number
}

export type ToolMemory = Record<ToolType, ToolState>

export type LayerName = 'BACKGROUND' | 'MAIN' | 'LAYER'

export interface LayerInfo {
    name: string
    visible: boolean
    opacity: number
}

export type BackgroundMode = 'grid' | 'ruled' | 'axes' | 'none'

export interface BackgroundState {
    mode: BackgroundMode
    grid?: GridOptions
    ruled?: RuledOptions
    axes?: AxisOptions
}

export interface GridOptions {
    size: number        // taille cellule en px
    color?: string
    lineWidth?: number
    majorEvery?: number // ex: 5 → ligne plus épaisse toutes les 5 cases
    majorColor?: string
    majorWidth?: number
}

export interface RuledOptions {
    spacing: number
    color?: string
    lineWidth?: number
    marginTop?: number
}

export type OriginMode =
    | { mode: 'manual', x: number, y: number }
    | { mode: 'center' }
    | { mode: 'bottom' }
    | { mode: 'bottom-left' }

export interface AxisOptions {
    origin?: OriginMode
    color?: string
    lineWidth?: number
    arrowSize?: number
    tickSize?: number
    padding?: number
}
