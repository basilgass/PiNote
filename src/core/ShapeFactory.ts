// ShapeFactory.ts
import {ArrowStyle, LayerName, LineStyle, ToolMode, ToolType} from "src/types"
import {Stroke, StrokeConfig} from "../shapes/Stroke"
import {Line, LineConfig} from "../shapes/Line"
import {Segment, SegmentConfig} from "../shapes/Segment"
import {Circle, CircleConfig} from "../shapes/Circle"
import {Rectangle, RectangleConfig} from "../shapes/Rectangle"
import {Polygon, PolygonConfig} from "../shapes/Polygon"
import {TextShape, TextConfig} from "../shapes/TextShape"
import {Arc, ArcConfig} from "../shapes/Arc"
import {GraphShape, GraphConfig} from "../shapes/GraphShape"
import {Adaptable, ShapeOptions} from "../shapes/Adaptable"

// configuration de départ pour toutes les shapes
export interface ShapeStartConfig {
    id?: string
    tool: ToolType
    x: number
    y: number
    color?: string
    width?: number
    layer?: LayerName | null
    createdAt?: number
    arrowStart?: boolean
    arrowEnd?: boolean
    arrowStyle?: ArrowStyle
    lineStyle?: LineStyle
    fill?: boolean
    fillOpacity?: number
    toolMode?: string
}

// factory industrialisable
export class ShapeFactory {
    private static _idCounter = 0

    private static generateId() {
        this._idCounter++
        return `shape-${this._idCounter}`
    }

    static create(config: ShapeStartConfig, values?: LineConfig | SegmentConfig | StrokeConfig | RectangleConfig | CircleConfig | PolygonConfig | TextConfig | ArcConfig | GraphConfig): Adaptable {
        const {x, y, color, width, layer, id, createdAt, tool} = config

        const finalLayer = layer ?? null
        const finalColor = color ?? "#000"
        const finalWidth = width ?? 1
        const finalId = id ?? this.generateId()
        const finalCreatedAt = createdAt ?? Date.now()

        const options: ShapeOptions = {
            id: finalId,
            createdAt: finalCreatedAt,
            tool,
            layer: finalLayer,
            color: finalColor,
            width: finalWidth,
            arrowStart: config.arrowStart,
            arrowEnd: config.arrowEnd,
            arrowStyle: config.arrowStyle,
            lineStyle: config.lineStyle,
            fill: config.fill,
            fillOpacity: config.fillOpacity,
        }

        switch (tool) {
            case "pen":
            case "highlighter":
            case "eraser":
                return new Stroke((values as StrokeConfig) ?? {tool}, options)

            case "line":
                return new Line((values as LineConfig) ?? {x1: x, y1: y, x2: x, y2: y}, options)

            case "segment":
                return new Segment((values as SegmentConfig) ?? {x1: x, y1: y, x2: x, y2: y}, options)

            case "circle":
                return new Circle(
                    (values as CircleConfig) ?? {cx: x, cy: y, radius: 0},
                    options,
                    (config.toolMode as 'center-radius' | '3pts') ?? 'center-radius'
                )

            case "rectangle":
                return new Rectangle(
                    (values as RectangleConfig) ?? {p1: {x, y}, p2: {x, y}, w: 0},
                    options,
                    (config.toolMode as '2pts' | '3pts') ?? '2pts'
                )

            case "polygon":
                return new Polygon((values as PolygonConfig) ?? {points: []}, options)

            case "arc":
                return new Arc(
                    (values as ArcConfig) ?? { cx: x, cy: y, radius: 0, startAngle: 0, endAngle: 0, sector: false },
                    options
                )

            case "vector":
                return new Segment(
                    (values as SegmentConfig) ?? {x1: x, y1: y, x2: x, y2: y},
                    { ...options, arrowEnd: options.arrowEnd ?? true }
                )

            case "text":
                return TextShape.fromData(
                    (values as TextConfig) ?? { x, y, source: '', fontSize: finalWidth, fontFamily: 'serif', maxWidth: 0 },
                    options
                )

            case "graph":
                return GraphShape.fromData(
                    (values as GraphConfig) ?? GraphShape.defaultConfig(x, y),
                    options
                )

            default:
                throw new Error(`Tool not supported: ${tool}`)
        }
    }

    static getModes(tool: ToolType): ToolMode[] {
        if (tool === 'rectangle') return Rectangle.modes
        if (tool === 'circle') return Circle.modes
        return []
    }

    static fromJSON(data: any): Adaptable | null {
        try {
            const { config, options } = data
            const startConfig: ShapeStartConfig = {
                tool: options.tool,
                x: 0,
                y: 0,
                color: options.color,
                width: options.width,
                layer: options.layer,
                id: options.id,
                createdAt: options.createdAt,
                arrowStart: options.arrowStart,
                arrowEnd: options.arrowEnd,
                arrowStyle: options.arrowStyle,
                lineStyle: options.lineStyle,
                fill: options.fill,
                fillOpacity: options.fillOpacity,
            }
            return ShapeFactory.create(startConfig, config)
        } catch {
            return null
        }
    }
}