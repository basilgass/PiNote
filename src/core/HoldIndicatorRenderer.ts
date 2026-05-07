/**
 * Rendu de l'indicateur "long-press" sur l'overlay.
 *
 * Phase 'pending' : un anneau bleu se remplit progressivement (timer en cours).
 * Phase 'adjusting' : anneau plein vert, suit le doigt — l'utilisateur cherche un snap.
 *
 * Le renderer ne porte pas d'état métier (la FSM est dans Engine), il dessine un frame
 * à partir des paramètres reçus.
 */
export interface HoldIndicatorFrame {
    phase: 'pending' | 'adjusting'
    /** Centre de l'anneau en coordonnées monde (le caller fournit le viewTransform). */
    anchor: { x: number; y: number }
    /** Progression 0..1 (utilisé seulement en 'pending' ; vaut 1 en 'adjusting'). */
    progress: number
}

export interface HoldIndicatorColors {
    pending: string
    pendingBg: string
    adjusting: string
}

export class HoldIndicatorRenderer {
    private ctx: CanvasRenderingContext2D
    private readonly colors: HoldIndicatorColors

    /** Rayon de l'anneau, en pixels écran (constant quel que soit le zoom). */
    static readonly RADIUS_PX = 18
    static readonly LINE_WIDTH_PX = 3
    static readonly CENTER_DOT_PX = 3

    constructor(ctx: CanvasRenderingContext2D, colors: HoldIndicatorColors) {
        this.ctx = ctx
        this.colors = colors
    }

    updateCtx(ctx: CanvasRenderingContext2D): void {
        this.ctx = ctx
    }

    /** Dessine l'anneau et le point central à l'ancre, en tenant compte du viewTransform. */
    draw(frame: HoldIndicatorFrame, viewTransform: { x: number; y: number; scale: number }): void {
        const { x: tx, y: ty, scale } = viewTransform
        const sx = frame.anchor.x * scale + tx
        const sy = frame.anchor.y * scale + ty
        const r = HoldIndicatorRenderer.RADIUS_PX
        const ctx = this.ctx

        const accent = frame.phase === 'adjusting' ? this.colors.adjusting : this.colors.pending

        ctx.save()
        // Fond de l'anneau
        ctx.beginPath()
        ctx.arc(sx, sy, r, 0, Math.PI * 2)
        ctx.strokeStyle = this.colors.pendingBg
        ctx.lineWidth = HoldIndicatorRenderer.LINE_WIDTH_PX
        ctx.stroke()

        // Arc de progression (anneau plein en 'adjusting')
        ctx.beginPath()
        ctx.arc(sx, sy, r, -Math.PI / 2, -Math.PI / 2 + frame.progress * Math.PI * 2)
        ctx.strokeStyle = accent
        ctx.lineWidth = HoldIndicatorRenderer.LINE_WIDTH_PX
        ctx.lineCap = 'round'
        ctx.stroke()

        // Point central
        ctx.beginPath()
        ctx.arc(sx, sy, HoldIndicatorRenderer.CENTER_DOT_PX, 0, Math.PI * 2)
        ctx.fillStyle = accent
        ctx.fill()
        ctx.restore()
    }
}
