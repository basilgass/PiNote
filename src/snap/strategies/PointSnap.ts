// PointSnap.ts
import {SnapStrategy} from "../SnapStrategy"
import {SnapContext} from "../SnapContext"
import {SnapResult} from "../SnapResult"

export class PointSnap implements SnapStrategy {
    name = 'point'
    enabled = true
    priority: number

    constructor(priority = 20) { // priorité forte pour que ce soit préféré au grid snap
        this.priority = priority
    }

    snap(ctx: SnapContext): SnapResult | null {
        const { x, y, snapRadius, index, activeLayer } = ctx

        let bestDist = snapRadius
        let bestX: number | null = null
        let bestY: number | null = null

        // on récupère les points autour de la position
        const { snapPoints } = index.query(x, y)

        for (const p of snapPoints) {
            if (activeLayer && p.layer !== activeLayer) continue

            const dx = x - p.x
            const dy = y - p.y
            const dist = Math.hypot(dx, dy)

            if (dist <= bestDist) {
                bestDist = dist
                bestX = p.x
                bestY = p.y
            }
        }

        if (bestX !== null && bestY !== null) {
            return {
                x: bestX,
                y: bestY,
                priority: this.priority,
                type: 'point'
            }
        }

        return null
    }
}