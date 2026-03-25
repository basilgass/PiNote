import {StrokePoint, ToolType} from "../types"
import {AbstractShape} from "./AbstractShape"
import {Bounds, CircleGeom, Segment, SnapCandidate} from "./GeometryTypes"
import {ShapeOptions} from "./Adaptable"

export interface StrokeConfig {
    tool: ToolType
    bezier?: boolean
    points?: StrokePoint[]
}

export class Stroke extends AbstractShape {
    points: StrokePoint[] = []
    bezier = true
    isIncremental = true

    // P1/A1: cache des points filtrés/lissés, invalidé à chaque addPoint
    private _cachedPts: StrokePoint[] | null = null

    constructor(
        config: StrokeConfig,
        options: Partial<ShapeOptions> = {}
    ) {
        super(options)
        this.points = config.points ? config.points : []
    }

    addPoint(point: StrokePoint) {
        // A2: arrondi à 1 décimale — réduit la taille JSON d'environ 60% par point
        this.points.push({
            ...point,
            x: Math.round(point.x * 10) / 10,
            y: Math.round(point.y * 10) / 10
        })
        this._cachedPts = null  // P1/A1: invalide le cache
    }

    update(x: number, y: number) {
        // P3: t capturé via performance.now() pour le futur feature de replay temporel
        this.addPoint({x, y, t: performance.now(), pressure: 1})
    }

    getPointsUntil(time: number): StrokePoint[] {
        return this.points.filter(p => p.t <= time)
    }

    translate(dx: number, dy: number) {
        for (const p of this.points) { p.x += dx; p.y += dy }
        this._cachedPts = null
    }

    isEmpty() {
        return this.points.length < 2
    }

    // P1/A1: calcul unique, mis en cache jusqu'au prochain addPoint
    private get processedPts(): StrokePoint[] {
        if (!this._cachedPts) {
            let pts = this.filterMinDistance(this.points, 1.2)
            pts = this.movingAverage(pts, 3)
            this._cachedPts = pts
        }
        return this._cachedPts
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.points.length < 2) return
        ctx.save()

        const pts = this.processedPts  // P1/A1: utilise le cache

        ctx.strokeStyle = this.color
        ctx.lineWidth = this.width
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.globalAlpha = 1
        ctx.globalCompositeOperation = "source-over"

        switch (this.tool) {
            case "pen":
                break
            case "eraser":
                ctx.strokeStyle = "rgba(0,0,0,1)"
                ctx.globalCompositeOperation = "destination-out"
                break
            case "highlighter":
                ctx.globalAlpha = 0.2
                break
        }

        ctx.beginPath()

        if (!this.bezier || pts.length < 4) {
            ctx.moveTo(pts[0].x, pts[0].y)
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
        } else {
            // P2/A6: points fantômes en début/fin pour couvrir tous les segments en bezier
            // sans kink visible sur le dernier segment
            const ext = [pts[0], ...pts, pts[pts.length - 1]]
            ctx.moveTo(pts[0].x, pts[0].y)
            for (let i = 0; i < ext.length - 3; i++) {
                const p0 = ext[i], p1 = ext[i + 1], p2 = ext[i + 2], p3 = ext[i + 3]
                const cp1x = p1.x + (p2.x - p0.x) / 6
                const cp1y = p1.y + (p2.y - p0.y) / 6
                const cp2x = p2.x - (p3.x - p1.x) / 6
                const cp2y = p2.y - (p3.y - p1.y) / 6
                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
            }
        }

        ctx.stroke()
        ctx.restore()
    }

    toJSON() {
        return {
            config: {
                bezier: this.bezier,
                points: this.points
            },
            options: super.toJSON()
        }
    }

    private filterMinDistance(points: StrokePoint[], minDist = 1.5) {
        if (!points.length) return points
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
            let sumX = 0, sumY = 0, count = 0
            for (let j = -Math.floor(windowSize / 2); j <= Math.floor(windowSize / 2); j++) {
                const idx = i + j
                if (idx >= 0 && idx < points.length) {
                    sumX += points[idx].x
                    sumY += points[idx].y
                    count++
                }
            }
            smoothed.push({x: sumX / count, y: sumY / count, t: points[i].t, pressure: points[i].pressure})
        }
        return smoothed
    }

    getSnapPoints(): SnapCandidate[] {
        if (!this.points.length) return []
        const first = this.points[0]
        const last = this.points[this.points.length - 1]
        return [
            {x: first.x, y: first.y, type: "endpoint", shapeId: this.id, layer: this.layer},
            {x: last.x, y: last.y, type: "endpoint", shapeId: this.id, layer: this.layer}
        ]
    }

    // P5/A5: 1 segment sur 5 — réduit la charge du SpatialIndex sur les longs tracés
    getSegments(): Segment[] {
        if (this.points.length < 2) return []
        const segments: Segment[] = []
        for (let i = 0; i < this.points.length - 1; i++) {
            if (i % 5 === 0) segments.push({a: this.points[i], b: this.points[i + 1], layer: this.layer})
        }
        return segments
    }

    getCircles(): CircleGeom[] {
        return []
    }

    getBounds(): Bounds | null {
        if (!this.points.length) return null
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        for (const p of this.points) {
            if (p.x < minX) minX = p.x
            if (p.y < minY) minY = p.y
            if (p.x > maxX) maxX = p.x
            if (p.y > maxY) maxY = p.y
        }
        return { minX, minY, maxX, maxY }
    }
}
