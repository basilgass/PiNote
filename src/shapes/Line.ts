import {AbstractShape} from "./AbstractShape"
import {Bounds, CircleGeom, Segment as SegmentGeom, SnapCandidate} from "./GeometryTypes"
import {ShapeOptions} from "./Adaptable"

export interface LineConfig {
    x1: number
    y1: number
    x2: number
    y2: number
}

export class Line extends AbstractShape {
    public x1: number
    public y1: number
    public x2: number
    public y2: number

    override readonly canHaveArrows = false

    constructor(
        config: LineConfig,
        options: Partial<ShapeOptions> = {}
    ) {
        super(options)
        const {x1, y1, x2, y2} = config
        this.x1 = x1
        this.y1 = y1
        this.x2 = x2
        this.y2 = y2
    }

    draw(ctx: CanvasRenderingContext2D) {
        const dx = this.x2 - this.x1
        const dy = this.y2 - this.y1
        if (Math.abs(dx) < 1e-10 && Math.abs(dy) < 1e-10) return

        // Convertir les bords canvas (pixels écran) en coordonnées monde
        // en tenant compte du transform courant (appliqué par l'Engine)
        const m = ctx.getTransform()
        const scale = m.a
        if (Math.abs(scale) < 1e-10) return
        const w = ctx.canvas.width
        const h = ctx.canvas.height
        const xMin = (0 - m.e) / scale
        const xMax = (w - m.e) / scale
        const yMin = (0 - m.f) / scale
        const yMax = (h - m.f) / scale

        // Valeurs de t pour chaque bord visible (droite paramétrique P = P1 + t*(P2-P1))
        const ts: number[] = []
        if (Math.abs(dx) > 1e-10) {
            ts.push((xMin - this.x1) / dx)
            ts.push((xMax - this.x1) / dx)
        }
        if (Math.abs(dy) > 1e-10) {
            ts.push((yMin - this.y1) / dy)
            ts.push((yMax - this.y1) / dy)
        }

        // Garder les t dont le point est dans les bornes monde visibles
        const EPS = 0.5 / scale
        const valid = ts.filter(t => {
            const x = this.x1 + t * dx
            const y = this.y1 + t * dy
            return x >= xMin - EPS && x <= xMax + EPS && y >= yMin - EPS && y <= yMax + EPS
        })

        if (valid.length < 2) return
        valid.sort((a, b) => a - b)

        const t0 = valid[0]
        const t1 = valid[valid.length - 1]
        const px0 = this.x1 + t0 * dx, py0 = this.y1 + t0 * dy
        const px1 = this.x1 + t1 * dx, py1 = this.y1 + t1 * dy
        const angle = Math.atan2(dy, dx)
        const arrowSize = Math.max(this.width * 5, 14)

        ctx.save()
        ctx.beginPath()
        ctx.moveTo(px0, py0)
        ctx.lineTo(px1, py1)
        ctx.strokeStyle = this.color
        ctx.lineWidth = this.width
        ctx.lineCap = 'round'
        AbstractShape.applyLineStyle(ctx, this.lineStyle, this.width, scale)
        ctx.stroke()
        ctx.setLineDash([])

        // Flèches aux points de définition (P1 = départ, P2 = arrivée)
        if (this.arrowEnd)
            AbstractShape.drawArrowHead(ctx, this.x2, this.y2, angle, arrowSize, this.arrowStyle, this.color, this.width)
        if (this.arrowStart)
            AbstractShape.drawArrowHead(ctx, this.x1, this.y1, angle + Math.PI, arrowSize, this.arrowStyle, this.color, this.width)

        ctx.restore()
    }

    update(x: number, y: number) {
        this.x2 = x
        this.y2 = y
    }

    hitTest(x: number, y: number, tolerance: number): boolean {
        const dx = this.x2 - this.x1, dy = this.y2 - this.y1
        const len = Math.hypot(dx, dy)
        if (len < 1e-10) return false
        const dist = Math.abs(dy * x - dx * y + this.x2 * this.y1 - this.y2 * this.x1) / len
        return dist <= this.width / 2 + tolerance
    }

    translate(dx: number, dy: number) {
        this.x1 += dx; this.y1 += dy
        this.x2 += dx; this.y2 += dy
    }

    isEmpty() {
        return Math.hypot(this.x2 - this.x1, this.y2 - this.y1) < 1
    }

    toJSON() {
        return {
            config: { x1: this.x1, y1: this.y1, x2: this.x2, y2: this.y2 },
            options: super.toJSON()
        }
    }

    getSnapPoints(): SnapCandidate[] {
        return [
            {x: this.x1, y: this.y1, type: 'endpoint', shapeId: this.id, layer: this.layer},
            {x: this.x2, y: this.y2, type: 'endpoint', shapeId: this.id, layer: this.layer},
        ]
    }

    getSegments(): SegmentGeom[] {
        return [{a: {x: this.x1, y: this.y1}, b: {x: this.x2, y: this.y2}, layer: this.layer}]
    }

    getCircles(): CircleGeom[] {
        return []
    }

    // Bounds définis par les deux points créés (pas infini)
    getBounds(): Bounds {
        return {
            minX: Math.min(this.x1, this.x2),
            minY: Math.min(this.y1, this.y2),
            maxX: Math.max(this.x1, this.x2),
            maxY: Math.max(this.y1, this.y2),
        }
    }
}
