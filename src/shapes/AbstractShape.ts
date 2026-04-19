import {ArrowStyle, LayerName, LineStyle, ToolType} from "../types"
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
    arrowStart: boolean
    arrowEnd: boolean
    arrowStyle: ArrowStyle
    lineStyle: LineStyle
    fill: boolean
    fillOpacity: number

    readonly canHaveArrows: boolean = false
    readonly canBeFilled: boolean = false

    constructor(options: Partial<ShapeOptions> = {}) {
        this.id = options.id ?? 'shape-' + Math.random().toString(36).slice(2, 9)
        this.createdAt = options.createdAt ?? Date.now()
        this.tool = options.tool ?? "pen"
        this.layer = options.layer ?? null
        this.color = options.color ?? "#000000"
        this.width = options.width ?? 2
        this.hidden = options.hidden ?? false
        this.arrowStart = options.arrowStart ?? false
        this.arrowEnd = options.arrowEnd ?? false
        this.arrowStyle = options.arrowStyle ?? 'filled'
        this.lineStyle = options.lineStyle ?? 'solid'
        this.fill = options.fill ?? false
        this.fillOpacity = options.fillOpacity ?? 0.3
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
            hidden: this.hidden,
            arrowStart: this.arrowStart,
            arrowEnd: this.arrowEnd,
            arrowStyle: this.arrowStyle,
            lineStyle: this.lineStyle,
            fill: this.fill,
            fillOpacity: this.fillOpacity,
        }
    }

    protected static applyLineStyle(ctx: CanvasRenderingContext2D, style: LineStyle, width: number, scale: number): void {
        ctx.setLineDash([])
        if (style === 'dashed') {
            const d = Math.max(width * 2.5, 8) / scale
            ctx.setLineDash([d, d * 0.6])
        } else if (style === 'dotted') {
            ctx.lineCap = 'round'
            ctx.setLineDash([0.01, Math.max(width * 2.8, 9) / scale])
        }
    }

    protected static drawArrowHead(
        ctx: CanvasRenderingContext2D,
        x: number, y: number,
        angle: number,
        size: number,
        style: ArrowStyle,
        color: string,
        lineWidth: number
    ): void {
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(angle)
        if (style === 'filled') {
            ctx.beginPath()
            ctx.moveTo(0, 0)
            ctx.lineTo(-size, -size * 0.38)
            ctx.lineTo(-size, size * 0.38)
            ctx.closePath()
            ctx.fillStyle = color
            ctx.fill()
        } else {
            ctx.beginPath()
            ctx.moveTo(-size, -size * 0.38)
            ctx.lineTo(0, 0)
            ctx.lineTo(-size, size * 0.38)
            ctx.strokeStyle = color
            ctx.lineWidth = lineWidth
            ctx.lineCap = 'round'
            ctx.stroke()
        }
        ctx.restore()
    }

    abstract translate(dx: number, dy: number): void
    abstract hitTest(x: number, y: number, tolerance: number): boolean

    protected static distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
        const dx = bx - ax, dy = by - ay
        const len2 = dx * dx + dy * dy
        if (len2 < 1e-10) return Math.hypot(px - ax, py - ay)
        const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2))
        return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
    }

    abstract getSnapPoints(): SnapCandidate[]

    abstract getSegments(): Segment[]

    abstract getCircles(): CircleGeom[]

    abstract getBounds(): Bounds | null

    update?(x: number, y: number): void

    isEmpty(): boolean { return false }
}
