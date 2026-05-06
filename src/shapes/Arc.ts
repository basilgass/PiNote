import {AbstractShape} from "./AbstractShape"
import {Bounds, CircleGeom, Segment, SnapCandidate} from "./GeometryTypes"
import {DrawingMode, ShapeOptions} from "./Adaptable"
import type {IDrawingContext} from "../core/DrawingContext"

interface Pt { x: number; y: number }

export interface ArcConfig {
    cx: number
    cy: number
    radius: number
    startAngle: number
    endAngle: number
    sector: boolean
}

export class Arc extends AbstractShape {
    public cx: number
    public cy: number
    public radius: number
    public startAngle: number
    public endAngle: number
    public sector: boolean

    readonly drawingMode: DrawingMode = 'multi-click'
    override readonly canBeFilled = true
    override readonly canHaveArrows = true

    private _p2: Pt | null = null
    private _cursor: Pt | null = null

    constructor(config: ArcConfig, options: Partial<ShapeOptions> = {}) {
        super(options)
        this.cx = config.cx
        this.cy = config.cy
        this.radius = config.radius
        this.startAngle = config.startAngle
        this.endAngle = config.endAngle
        this.sector = config.sector ?? false
    }

    onDrawStart(x: number, y: number, _ctx: IDrawingContext): void {
        this.cx = x
        this.cy = y
        this._cursor = { x, y }
    }

    onDrawMove(x: number, y: number, ctx: IDrawingContext): boolean {
        const snapResult = ctx.snap(x, y, this.layer)
        const fx = snapResult?.x ?? x
        const fy = snapResult?.y ?? y
        this._cursor = { x: fx, y: fy }

        if (this._p2 !== null) {
            this.radius = Math.hypot(fx - this.cx, fy - this.cy)
            this.endAngle = Math.atan2(fy - this.cy, fx - this.cx)
        }

        const { x: tx, y: ty, scale } = ctx.viewTransform
        const oCtx = ctx.overlayCtx
        oCtx.save()
        oCtx.translate(tx, ty)
        oCtx.scale(scale, scale)
        this.draw(oCtx)
        if (snapResult) ctx.drawSnapIndicator(snapResult)
        oCtx.restore()
        return true
    }

    onDrawClick(x: number, y: number, ctx: IDrawingContext): 'continue' | 'done' {
        const snapResult = ctx.snap(x, y, this.layer)
        const fx = snapResult?.x ?? x
        const fy = snapResult?.y ?? y

        if (this._p2 === null) {
            this._p2 = { x: fx, y: fy }
            this.startAngle = Math.atan2(fy - this.cy, fx - this.cx)
            return 'continue'
        }

        this.radius = Math.hypot(fx - this.cx, fy - this.cy)
        this.endAngle = Math.atan2(fy - this.cy, fx - this.cx)
        return 'done'
    }

    onDrawEnd(): void {
        this._cursor = null
        this._p2 = null
    }

    // Sweep angle going counterclockwise from startAngle to endAngle (0 to 2π)
    private _sweep(): number {
        return ((this.startAngle - this.endAngle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
    }

    // Returns true if the given angle is within the counterclockwise arc range
    private _inArcRange(angle: number): boolean {
        const sweep = this._sweep()
        if (sweep < 1e-6) return false
        const d = ((this.startAngle - angle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
        return d <= sweep
    }

    draw(ctx: CanvasRenderingContext2D) {
        const scale = Math.abs(ctx.getTransform().a) || 1
        const isPreview = this._cursor !== null

        ctx.save()
        ctx.strokeStyle = this.color
        ctx.lineWidth = this.width
        ctx.lineCap = 'round'

        // Phase 1 : segment pointillé centre → curseur (direction du premier côté)
        if (this._p2 === null && this._cursor !== null) {
            const dash = Math.max(this.width * 2, 5) / scale
            ctx.setLineDash([dash, dash])
            ctx.beginPath()
            ctx.moveTo(this.cx, this.cy)
            ctx.lineTo(this._cursor.x, this._cursor.y)
            ctx.stroke()
            ctx.setLineDash([])
            ctx.restore()
            return
        }

        if (this.radius < 0.5) {
            ctx.restore()
            return
        }

        const arrowSize = Math.max(this.width * 5, 14)
        const angleDelta = this.radius > 0 ? arrowSize * 0.8 / this.radius : 0

        // Angles effectifs de l'arc (raccourcis sous les têtes de flèche)
        const effStart = (!isPreview && this.arrowStart) ? this.startAngle - angleDelta : this.startAngle
        const effEnd   = (!isPreview && this.arrowEnd)   ? this.endAngle   + angleDelta : this.endAngle

        const startPtX = this.cx + this.radius * Math.cos(this.startAngle)
        const startPtY = this.cy + this.radius * Math.sin(this.startAngle)
        const endPtX = this.cx + this.radius * Math.cos(this.endAngle)
        const endPtY = this.cy + this.radius * Math.sin(this.endAngle)

        if (isPreview) {
            const dash = Math.max(this.width * 2, 5) / scale
            ctx.setLineDash([dash, dash])
        } else {
            AbstractShape.applyLineStyle(ctx, this.lineStyle, this.width, scale)
        }

        // Remplissage du secteur (seulement en mode final)
        if (this.fill && !isPreview) {
            ctx.beginPath()
            ctx.moveTo(this.cx, this.cy)
            ctx.arc(this.cx, this.cy, this.radius, this.startAngle, this.endAngle, true)
            ctx.closePath()
            ctx.globalAlpha = this.fillOpacity
            ctx.fillStyle = this.color
            ctx.fill()
            ctx.globalAlpha = 1
        }

        // Arc (avec raccourcissement si flèches)
        ctx.beginPath()
        ctx.arc(this.cx, this.cy, this.radius, effStart, effEnd, true)
        ctx.stroke()

        // Côtés du secteur
        if (this.sector) {
            ctx.beginPath()
            ctx.moveTo(this.cx, this.cy)
            ctx.lineTo(startPtX, startPtY)
            ctx.moveTo(this.cx, this.cy)
            ctx.lineTo(endPtX, endPtY)
            ctx.stroke()
        }

        ctx.setLineDash([])

        // Flèches tangentes à l'arc (sens trigonométrique : tangente = (sin t, -cos t))
        if (!isPreview) {
            if (this.arrowEnd)
                AbstractShape.drawArrowHead(ctx, endPtX, endPtY,
                    this.endAngle - Math.PI / 2, arrowSize, this.arrowStyle, this.color, this.width)
            if (this.arrowStart)
                AbstractShape.drawArrowHead(ctx, startPtX, startPtY,
                    this.startAngle + Math.PI / 2, arrowSize, this.arrowStyle, this.color, this.width)
        }

        // Point central (mode final uniquement)
        if (!isPreview) {
            const dotRadius = Math.max(2, this.width * 1.5) / scale
            ctx.beginPath()
            ctx.arc(this.cx, this.cy, dotRadius, 0, Math.PI * 2)
            ctx.fillStyle = this.color
            ctx.fill()
        }

        ctx.restore()
    }

    hitTest(x: number, y: number, tolerance: number): boolean {
        const dist = Math.hypot(x - this.cx, y - this.cy)
        const tol = this.width / 2 + tolerance
        const angle = Math.atan2(y - this.cy, x - this.cx)

        if (Math.abs(dist - this.radius) <= tol && this._inArcRange(angle)) return true

        if (this.sector) {
            const startPtX = this.cx + this.radius * Math.cos(this.startAngle)
            const startPtY = this.cy + this.radius * Math.sin(this.startAngle)
            const endPtX = this.cx + this.radius * Math.cos(this.endAngle)
            const endPtY = this.cy + this.radius * Math.sin(this.endAngle)
            if (AbstractShape.distToSegment(x, y, this.cx, this.cy, startPtX, startPtY) <= tol) return true
            if (AbstractShape.distToSegment(x, y, this.cx, this.cy, endPtX, endPtY) <= tol) return true
        }

        if (this.fill && dist <= this.radius && this._inArcRange(angle)) return true

        return false
    }

    translate(dx: number, dy: number) {
        this.cx += dx
        this.cy += dy
    }

    isEmpty(): boolean {
        return this.radius < 1
    }

    toJSON() {
        return {
            config: {
                cx: this.cx,
                cy: this.cy,
                radius: this.radius,
                startAngle: this.startAngle,
                endAngle: this.endAngle,
                sector: this.sector,
            },
            options: super.toJSON()
        }
    }

    getSnapPoints(): SnapCandidate[] {
        const sweep = this._sweep()
        const midAngle = this.startAngle - sweep / 2
        return [
            { x: this.cx, y: this.cy, type: 'endpoint', shapeId: this.id, layer: this.layer },
            { x: this.cx + this.radius * Math.cos(this.startAngle), y: this.cy + this.radius * Math.sin(this.startAngle), type: 'endpoint', shapeId: this.id, layer: this.layer },
            { x: this.cx + this.radius * Math.cos(this.endAngle), y: this.cy + this.radius * Math.sin(this.endAngle), type: 'endpoint', shapeId: this.id, layer: this.layer },
            { x: this.cx + this.radius * Math.cos(midAngle), y: this.cy + this.radius * Math.sin(midAngle), type: 'midpoint', shapeId: this.id, layer: this.layer },
        ]
    }

    getSegments(): Segment[] {
        return []
    }

    getCircles(): CircleGeom[] {
        return [{ center: { x: this.cx, y: this.cy }, radius: this.radius, layer: this.layer }]
    }

    getBounds(): Bounds {
        if (this.radius < 0.5) return { minX: this.cx, minY: this.cy, maxX: this.cx, maxY: this.cy }

        const pts: Pt[] = [
            { x: this.cx + this.radius * Math.cos(this.startAngle), y: this.cy + this.radius * Math.sin(this.startAngle) },
            { x: this.cx + this.radius * Math.cos(this.endAngle), y: this.cy + this.radius * Math.sin(this.endAngle) },
        ]

        for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2, Math.PI * 3 / 2]) {
            if (this._inArcRange(a)) {
                pts.push({ x: this.cx + this.radius * Math.cos(a), y: this.cy + this.radius * Math.sin(a) })
            }
        }

        if (this.sector) pts.push({ x: this.cx, y: this.cy })

        return {
            minX: Math.min(...pts.map(p => p.x)),
            minY: Math.min(...pts.map(p => p.y)),
            maxX: Math.max(...pts.map(p => p.x)),
            maxY: Math.max(...pts.map(p => p.y)),
        }
    }
}
