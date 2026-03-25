import {SnapIndicator} from "./SnapIndicator"

export class SnapRenderer {

    private ctx: CanvasRenderingContext2D

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx
    }

    // A4: permet de mettre à jour le ctx si le canvas overlay est recréé
    updateCtx(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx
    }

    draw(indicator: SnapIndicator | null) {
        const ctx = this.ctx

        if (!indicator) return

        ctx.save()
        ctx.strokeStyle = '#00A8FF'
        ctx.lineWidth = 1.5

        switch (indicator.type) {

            case 'point':
                ctx.beginPath()
                ctx.arc(indicator.x, indicator.y, 6, 0, Math.PI * 2)
                ctx.stroke()
                break

            case 'midpoint':
                ctx.beginPath()
                ctx.moveTo(indicator.x - 6, indicator.y)
                ctx.lineTo(indicator.x + 6, indicator.y)
                ctx.moveTo(indicator.x, indicator.y - 6)
                ctx.lineTo(indicator.x, indicator.y + 6)
                ctx.stroke()
                break

            case 'grid':
                ctx.beginPath()
                ctx.rect(indicator.x - 4, indicator.y - 4, 8, 8)
                ctx.stroke()
                break
        }

        ctx.restore()
    }
}