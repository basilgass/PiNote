import {SnapContext} from "./SnapContext"
import {SnapResult} from "./SnapResult"

export interface SnapStrategy {
    name: string
    enabled: boolean
    priority: number
    snap(ctx: SnapContext): SnapResult | null
}