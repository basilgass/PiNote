import {LayerName, StrokePoint, ToolType} from "../../types"
import {Drawable} from "@core/drawable/Drawable"

export interface StrokeOptions {
    id: string
    layer: LayerName
    color: string
    width: number
    tool: ToolType
    bezier?: boolean
    createdAt: number
}

export class Stroke implements Drawable {
    readonly id: string
    readonly color: string
    readonly width: number
    readonly tool: ToolType
    readonly createdAt: number

    constructor(options: StrokeOptions) {
        this.id = options.id
        this._layer = options.layer
        this.color = options.color
        this.width = options.width
        this.tool = options.tool
        this._bezier = options.bezier ?? false
        this.createdAt = options.createdAt
    }

    private _bezier: boolean

    get bezier(): boolean {
        return this._bezier
    }

    set bezier(value: boolean) {
        this._bezier = value
    }

    private _layer: LayerName

    get layer(): LayerName {
        return this._layer
    }

    set layer(value: LayerName) {
        this._layer = value
    }

    private _points: StrokePoint [] = []

    get points(): StrokePoint [] {
        return this._points
    }

    set points(points: StrokePoint[]) {
        this._points = points
    }

    static fromJSON(data: any): { options: StrokeOptions, points: StrokePoint[] } {
        const options: StrokeOptions = {
            id: data.id,
            layer: data.layer,
            color: data.color,
            width: data.width,
            tool: data.tool,
            createdAt: data.createdAt
        }

        const points: StrokePoint[] = data.points ?? []
        return {options, points}
    }

    addPoint(point: StrokePoint) {
        this._points.push(point)
    }

    getPointsUntil(time: number): StrokePoint [] {
        return this._points.filter(p => p.t <= time)
    }

    isEmpty(): boolean {
        return this._points.length === 0
    }

    toJSON(): StrokeOptions & { points: StrokePoint[] } {
        return {
            id: this.id,
            layer: this._layer,
            color: this.color,
            width: this.width,
            tool: this.tool,
            createdAt: this.createdAt,
            points: this._points
        }
    }

    public draw(ctx: CanvasRenderingContext2D) {
        if (this.points.length < 2) return

        ctx.save()

        // Préprocssing
        let pts = this.filterMinDistance(this.points, 1.2)
        pts = this.movingAverage(pts, 3)

        // --- style général ---
        ctx.lineWidth = this.width
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.globalAlpha = 1
        ctx.globalCompositeOperation = 'source-over'

        // --- outil spécifique ---
        switch (this.tool) {
            case 'pen':
                ctx.strokeStyle = this.color
                break
            case 'eraser':
                ctx.strokeStyle = 'rgba(0,0,0,1)' // couleur ignorée
                ctx.globalCompositeOperation = 'destination-out'
                break
            case 'highlighter':
                ctx.strokeStyle = this.color
                ctx.globalAlpha = 0.2
                ctx.lineWidth = this.width * 3
                break
        }

        ctx.beginPath()

        // pen / marker / brush / highlighter → Bézier si activé
        if (!this._bezier || pts.length < 4) {
            ctx.moveTo(pts[0].x, pts[0].y)
            for (let i = 1; i < pts.length; i++) {
                ctx.lineTo(pts[i].x, pts[i].y)
            }
        } else {
            ctx.moveTo(pts[0].x, pts[0].y)

            for (let i = 0; i < pts.length - 3; i++) {
                const p0 = pts[i]
                const p1 = pts[i + 1]
                const p2 = pts[i + 2]
                const p3 = pts[i + 3]

                const cp1x = p1.x + (p2.x - p0.x) / 6
                const cp1y = p1.y + (p2.y - p0.y) / 6

                const cp2x = p2.x - (p3.x - p1.x) / 6
                const cp2y = p2.y - (p3.y - p1.y) / 6

                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
            }

            const last = pts[pts.length - 1]
            ctx.lineTo(last.x, last.y)
        }

        ctx.stroke()

        ctx.globalAlpha = 1 // reset alpha
        ctx.globalCompositeOperation = 'source-over' // reset compositing

        ctx.restore()
    }

    private filterMinDistance(points: StrokePoint[], minDist = 1.5) {
        if (points.length === 0) return points

        const filtered = [points[0]]
        let last = points[0]

        for (let i = 1; i < points.length; i++) {
            const dx = points[i].x - last.x
            const dy = points[i].y - last.y
            if (dx * dx + dy * dy >= minDist * minDist) {
                filtered.push(points[i])
                last = points[i]
            }
        }

        return filtered
    }

    private movingAverage(points: StrokePoint[], windowSize = 3) {
        if (points.length < windowSize) return points

        const smoothed: StrokePoint[] = []

        for (let i = 0; i < points.length; i++) {
            let sumX = 0
            let sumY = 0
            let count = 0

            for (let j = -Math.floor(windowSize / 2); j <= Math.floor(windowSize / 2); j++) {
                const idx = i + j
                if (idx >= 0 && idx < points.length) {
                    sumX += points[idx].x
                    sumY += points[idx].y
                    count++
                }
            }

            smoothed.push({
                x: sumX / count,
                y: sumY / count,
                pressure: points[i].pressure,
                t: points[i].t
            })
        }

        return smoothed
    }

    isIncremental = true

    update(x: number, y: number) {
        // TOOD: add time and pressure ?
        this.addPoint({x, y, t: 0, pressure: 1})
    }
}