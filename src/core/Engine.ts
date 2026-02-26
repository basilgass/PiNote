import { StrokePoint } from "src/types"
import { Stroke } from "./Stroke"

export class Engine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private strokes: Stroke[] = []
  private currentStroke: Stroke | null = null
  public bezier: boolean = false // <-- toggle global

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
  }

  startStroke(stroke: Stroke) {
    this.currentStroke = stroke
    this.strokes.push(stroke)
  }

  addPoint(point: StrokePoint) {
    if (!this.currentStroke) return

    const stroke = this.currentStroke
    const pts = stroke.points
    const last = pts[pts.length - 1]

    // --- interpolation entre le dernier point et le nouveau ---
    if (last) {
      const dx = point.x - last.x
      const dy = point.y - last.y
      const dist = Math.hypot(dx, dy)
      const steps = Math.ceil(dist / 2) // ~2px spacing

      for (let i = 1; i <= steps; i++) {
        const x = last.x + (dx * i) / steps
        const y = last.y + (dy * i) / steps
        const t = last.t + ((point.t - last.t) * i) / steps
        stroke.addPoint({ x, y, t })
      }
    } else {
      stroke.addPoint(point)
    }

    // --- moving average pour lisser les derniers 3 points ---
    const n = 3
    if (stroke.points.length >= n) {
      const slice = stroke.points.slice(-n)
      const avgX = slice.reduce((sum, p) => sum + p.x, 0) / n
      const avgY = slice.reduce((sum, p) => sum + p.y, 0) / n
      const avgT = slice[slice.length - 1].t
      // on remplace le dernier point par la moyenne
      stroke.points[stroke.points.length - 1] = { x: avgX, y: avgY, t: avgT }
    }

    // redraw stroke courant
    this.drawStroke(stroke, this.bezier)
  }

  addPoint_old(point: { x: number; y: number; t: number }) {
    if (!this.currentStroke) return
    this.currentStroke.addPoint(point)
    this.drawStroke(this.currentStroke, this.bezier)
  }



  endStroke() {
    this.currentStroke = null
  }

  private drawStroke(stroke: Stroke, bezier: boolean = false) {
    const pts = stroke.points
    if (pts.length < 2) return

    const ctx = this.ctx

    // --- style général ---
    ctx.lineWidth = stroke.width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // --- outil spécifique ---
    switch (stroke.tool) {
      case 'pen':
        ctx.strokeStyle = stroke.color
        ctx.globalCompositeOperation = 'source-over'
        break
      case 'eraser':
        ctx.strokeStyle = 'rgba(0,0,0,1)' // couleur ignorée
        ctx.globalCompositeOperation = 'destination-out'
        break
      case 'marker':
        ctx.strokeStyle = stroke.color
        ctx.globalAlpha = 0.4
        ctx.globalCompositeOperation = 'source-over'
        break
      case 'brush':
        ctx.strokeStyle = stroke.color
        ctx.globalAlpha = 0.8
        ctx.lineWidth = stroke.width * 1.5
        ctx.globalCompositeOperation = 'source-over'
        break
      case 'highlighter':
        ctx.strokeStyle = stroke.color
        ctx.globalAlpha = 0.2
        ctx.lineWidth = stroke.width * 3
        ctx.globalCompositeOperation = 'source-over'
        break
      case 'line':
      case 'rect':
      case 'circle':
        ctx.strokeStyle = stroke.color
        ctx.globalCompositeOperation = 'source-over'
        break
    }

    ctx.beginPath()

    if (stroke.tool === 'line') {
      // simple ligne du premier au dernier point
      const first = pts[0], last = pts[pts.length - 1]
      ctx.moveTo(first.x, first.y)
      ctx.lineTo(last.x, last.y)
    } else if (stroke.tool === 'rect') {
      const first = pts[0], last = pts[pts.length - 1]
      ctx.rect(first.x, first.y, last.x - first.x, last.y - first.y)
    } else if (stroke.tool === 'circle') {
      const first = pts[0], last = pts[pts.length - 1]
      const radius = Math.hypot(last.x - first.x, last.y - first.y)
      ctx.arc(first.x, first.y, radius, 0, Math.PI * 2)
    } else {
      // pen / marker / brush / highlighter → Bézier si activé
      if (!bezier || pts.length < 4) {
        ctx.moveTo(pts[0].x, pts[0].y)
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
      } else {
        ctx.moveTo(pts[0].x, pts[0].y)
        for (let i = 0; i < pts.length - 3; i++) {
          const p0 = pts[i], p1 = pts[i + 1], p2 = pts[i + 2], p3 = pts[i + 3]
          const cp1x = p1.x + (p2.x - p0.x) / 6
          const cp1y = p1.y + (p2.y - p0.y) / 6
          const cp2x = p2.x - (p3.x - p1.x) / 6
          const cp2y = p2.y - (p3.y - p1.y) / 6
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
        }
        const last = pts[pts.length - 1]
        ctx.lineTo(last.x, last.y)
      }
    }

    ctx.stroke()
    ctx.globalAlpha = 1 // reset alpha
    ctx.globalCompositeOperation = 'source-over' // reset compositing
  }

  private drawStroke_old1(stroke: Stroke, bezier: boolean = false) {
    const pts = stroke.points
    if (pts.length < 2) return

    const ctx = this.ctx
    ctx.strokeStyle = stroke.color
    ctx.lineWidth = stroke.width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()

    if (!bezier || pts.length < 4) {
      // fallback classique
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
    } else {
      // Catmull-Rom to Bézier
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

      // dernier segment si nécessaire
      const last = pts[pts.length - 1]
      ctx.lineTo(last.x, last.y)
    }

    ctx.stroke()
  }

  private drawStroke_old(stroke: Stroke, bezier: boolean = false) {
    const pts = stroke.points
    if (pts.length < 2) return

    const ctx = this.ctx

    ctx.strokeStyle = stroke.color
    ctx.lineWidth = stroke.width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.beginPath()

    if (!bezier) {
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
    } else {
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length - 1; i++) {
        const xc = (pts[i].x + pts[i + 1].x) / 2
        const yc = (pts[i].y + pts[i + 1].y) / 2
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc)
      }
      const last = pts[pts.length - 1]
      ctx.lineTo(last.x, last.y)
    }

    ctx.stroke()
  }

  draw(upToTime?: number, bezier?: boolean) {
    this.clear()
    for (const stroke of this.strokes) {
      const pts = upToTime !== undefined ? stroke.getPointsUntil(upToTime) : stroke.points
      if (pts.length < 2) continue
      this.drawStroke(stroke, bezier ?? this.bezier)
    }
  }

  clear() {
    this.ctx.fillStyle = '#fff'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }
}