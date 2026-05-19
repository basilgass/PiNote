import {StrokePoint, ToolType} from "../types"
import {AbstractShape} from "./AbstractShape"
import {Bounds, CircleGeom, Segment, SnapCandidate} from "./GeometryTypes"
import {ShapeOptions, StrokeBasedShape} from "./Adaptable"
import {getConfig} from "../config/PiNoteConfig"

export interface StrokeConfig {
    tool: ToolType
    bezier?: boolean
    points?: StrokePoint[]
}

export class Stroke extends AbstractShape implements StrokeBasedShape {
    points: StrokePoint[] = []
    bezier = true

    override readonly canHaveArrows = false

    private _cachedPts: StrokePoint[] | null = null

    constructor(
        config: StrokeConfig,
        options: Partial<ShapeOptions> = {}
    ) {
        super(options)
        this.points = config.points ?? []
        this.bezier = config.bezier ?? true
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

    getPointsUntil(time: number): StrokePoint[] {
        return this.points.filter(p => p.t <= time)
    }

    hitTest(x: number, y: number, tolerance: number): boolean {
        if (this.points.length < 2) return false
        const thresh = this.width / 2 + tolerance
        for (let i = 0; i < this.points.length - 1; i++) {
            const p = this.points[i], q = this.points[i + 1]
            if (AbstractShape.distToSegment(x, y, p.x, p.y, q.x, q.y) <= thresh) return true
        }
        return false
    }

    translate(dx: number, dy: number) {
        for (const p of this.points) { p.x += dx; p.y += dy }
        this._cachedPts = null
    }

    isEmpty() {
        return this.points.length < 2
    }

    /**
     * Découpe ce Stroke par un cercle d'effacement.
     * Retourne null si aucun point n'est dans le cercle, sinon la liste
     * des sous-Strokes obtenus en retirant les points dans le cercle.
     * Un run contigu de points restants devient un sous-Stroke s'il a ≥ 2 points.
     * Le tableau retourné peut être vide (tout effacé).
     *
     * Procédé : densifie les points à step ≤ r/2 pour que le test point-cercle
     * capture correctement les segments traversant le cercle (sans densification,
     * un segment long dont les deux extrémités sont hors du cercle resterait intact
     * même si sa partie centrale est gommée). Chaque sous-stroke résultant est
     * ensuite simplifié (Douglas-Peucker) pour limiter la taille du JSON.
     */
    eraseInCircle(cx: number, cy: number, r: number): Stroke[] | null {
        if (this.points.length === 0) return null

        // Early-out : bounding box vs cercle
        const b = this.getBounds()
        if (!b) return null
        if (b.maxX < cx - r || b.minX > cx + r || b.maxY < cy - r || b.minY > cy + r) return null

        const step = Math.max(0.5, r / 2)
        const dense = Stroke.densify(this.points, step)
        const origStart = dense[0]
        const origEnd = dense[dense.length - 1]

        const r2 = r * r
        let touched = false
        const runs: StrokePoint[][] = []
        let current: StrokePoint[] = []

        for (const p of dense) {
            const dx = p.x - cx, dy = p.y - cy
            if (dx * dx + dy * dy <= r2) {
                touched = true
                if (current.length > 0) {
                    runs.push(current)
                    current = []
                }
            } else {
                current.push(p)
            }
        }
        if (current.length > 0) runs.push(current)

        if (!touched) return null

        const validRuns = runs
            .filter(run => run.length >= 2)
            .map(run => Stroke.simplify(run, 0.5))

        // Conserve les flèches sur les sous-strokes qui contiennent encore les
        // extrémités d'origine : arrowStart sur celui qui démarre à origStart,
        // arrowEnd sur celui qui se termine à origEnd.
        return validRuns.map(run => {
            const hasStart = this.arrowStart && run[0].x === origStart.x && run[0].y === origStart.y
            const hasEnd = this.arrowEnd && run[run.length - 1].x === origEnd.x && run[run.length - 1].y === origEnd.y
            return this._cloneWithPoints(run, hasStart, hasEnd)
        })
    }

    /**
     * Insère des points intermédiaires de manière à ce qu'aucun segment ne dépasse `step`.
     * Préserve les points d'origine. Interpole linéairement t (timestamp) et pressure=0.
     */
    static densify(points: StrokePoint[], step: number): StrokePoint[] {
        if (points.length < 2) return points.slice()
        const out: StrokePoint[] = [points[0]]
        for (let i = 1; i < points.length; i++) {
            const a = points[i - 1], b = points[i]
            const len = Math.hypot(b.x - a.x, b.y - a.y)
            if (len > step) {
                const n = Math.ceil(len / step)
                for (let j = 1; j < n; j++) {
                    const t = j / n
                    out.push({
                        x: a.x + t * (b.x - a.x),
                        y: a.y + t * (b.y - a.y),
                        t: a.t + t * (b.t - a.t),
                        pressure: 0,
                    })
                }
            }
            out.push(b)
        }
        return out
    }

    /**
     * Simplification Douglas-Peucker : retire les points qui s'écartent de moins
     * de `tolerance` de la corde reliant leurs voisins conservés. Préserve les
     * extrémités. Itératif (pas de récursion profonde sur les longs strokes).
     */
    static simplify(points: StrokePoint[], tolerance: number): StrokePoint[] {
        const n = points.length
        if (n < 3) return points.slice()

        const keep = new Uint8Array(n)
        keep[0] = 1
        keep[n - 1] = 1
        const stack: [number, number][] = [[0, n - 1]]

        while (stack.length > 0) {
            const [s, e] = stack.pop()!
            if (e - s < 2) continue
            const ax = points[s].x, ay = points[s].y
            const bx = points[e].x, by = points[e].y
            const dx = bx - ax, dy = by - ay
            const len2 = dx * dx + dy * dy
            let maxDist = 0, maxIdx = -1
            for (let i = s + 1; i < e; i++) {
                let d2: number
                if (len2 < 1e-10) {
                    const ex = points[i].x - ax, ey = points[i].y - ay
                    d2 = ex * ex + ey * ey
                } else {
                    const t = ((points[i].x - ax) * dx + (points[i].y - ay) * dy) / len2
                    const tc = Math.max(0, Math.min(1, t))
                    const px = ax + tc * dx, py = ay + tc * dy
                    const ex = points[i].x - px, ey = points[i].y - py
                    d2 = ex * ex + ey * ey
                }
                if (d2 > maxDist) { maxDist = d2; maxIdx = i }
            }
            if (maxIdx !== -1 && maxDist > tolerance * tolerance) {
                keep[maxIdx] = 1
                stack.push([s, maxIdx])
                stack.push([maxIdx, e])
            }
        }

        const out: StrokePoint[] = []
        for (let i = 0; i < n; i++) if (keep[i]) out.push(points[i])
        return out
    }

    /** Clone ce stroke avec un nouveau set de points et un nouvel id. */
    private _cloneWithPoints(points: StrokePoint[], arrowStart = false, arrowEnd = false): Stroke {
        const clone = new Stroke(
            { tool: this.tool, bezier: this.bezier, points: points.map(p => ({...p})) },
            {
                tool: this.tool,
                layer: this.layer,
                color: this.color,
                width: this.width,
                hidden: this.hidden,
                arrowStart,
                arrowEnd,
                arrowStyle: this.arrowStyle,
                lineStyle: this.lineStyle,
                fill: this.fill,
                fillOpacity: this.fillOpacity,
            }
        )
        return clone
    }

    // P1/A1: calcul unique, mis en cache jusqu'au prochain addPoint
    // Important : si bezier=false, on ne lisse pas — le Stroke représente une polyligne
    // stricte (cas des shapes paramétriques converties et des sous-strokes issus de la gomme).
    // Le moving average détruirait les coins sur ces strokes peu denses.
    private get processedPts(): StrokePoint[] {
        if (!this._cachedPts) {
            if (this.bezier) {
                let pts = this.filterMinDistance(this.points, 1.2)
                pts = this.movingAverage(pts, 3)
                this._cachedPts = pts
            } else {
                this._cachedPts = this.points.slice()
            }
        }
        return this._cachedPts
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.points.length < 2) return
        const scale = Math.abs(ctx.getTransform().a) || 1
        ctx.save()

        const pts = this.processedPts  // P1/A1: utilise le cache

        ctx.strokeStyle = this.color
        ctx.lineWidth = this.width
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.globalAlpha = 1
        ctx.globalCompositeOperation = "source-over"

        if (this.tool === "highlighter") {
            ctx.globalAlpha = 0.2
        }

        AbstractShape.applyLineStyle(ctx, this.lineStyle, this.width, scale)
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
        ctx.setLineDash([])

        // Debug : visualise les points bruts du Stroke (densité de l'échantillonnage)
        if (getConfig().debug.showPoints) {
            const r = 2 / scale
            ctx.fillStyle = '#ff3366'
            ctx.globalAlpha = 1
            for (const p of this.points) {
                ctx.beginPath()
                ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
                ctx.fill()
            }
        }

        // Flèches sur le trait (orientation calculée sur les derniers/premiers points)
        if (this.arrowStart || this.arrowEnd) {
            const n = this.points.length
            const arrowSize = Math.max(this.width * 5, 14)
            const span = Math.min(5, n - 1)
            if (this.arrowEnd) {
                const angle = Math.atan2(
                    this.points[n - 1].y - this.points[n - 1 - span].y,
                    this.points[n - 1].x - this.points[n - 1 - span].x
                )
                AbstractShape.drawArrowHead(ctx, this.points[n - 1].x, this.points[n - 1].y, angle, arrowSize, this.arrowStyle, this.color, this.width)
            }
            if (this.arrowStart) {
                const angle = Math.atan2(
                    this.points[0].y - this.points[span].y,
                    this.points[0].x - this.points[span].x
                )
                AbstractShape.drawArrowHead(ctx, this.points[0].x, this.points[0].y, angle, arrowSize, this.arrowStyle, this.color, this.width)
            }
        }

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
