// midPointSnap.ts
import {SnapStrategy} from "../SnapStrategy"
import {SnapContext} from "../SnapContext"
import {SnapResult} from "../SnapResult"

export class MidpointSnap implements SnapStrategy {
    name = 'midpoint'
    enabled = true
    priority: number

    constructor(priority = 5) {
        this.priority = priority
    }

    snap(ctx: SnapContext): SnapResult | null {
        let bestDist = ctx.snapRadius
        let bestX: number | null = null
        let bestY: number | null = null

        // récupère les segments autour de la position
        const {segments} = ctx.index.query(ctx.x, ctx.y)

        for (const seg of segments) {
            if (ctx.activeLayer && seg.layer !== ctx.activeLayer) continue

            const mx = (seg.a.x + seg.b.x) / 2
            const my = (seg.a.y + seg.b.y) / 2

            const dx = ctx.x - mx
            const dy = ctx.y - my
            const dist = Math.hypot(dx, dy)

            if (dist <= bestDist) {
                bestDist = dist
                bestX = mx
                bestY = my
            }
        }

        if (bestX !== null && bestY !== null) {
            return {x: bestX, y: bestY, priority: this.priority, type: 'midpoint'}
        }

        return null
    }
}