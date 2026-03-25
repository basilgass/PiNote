// snap/strategies/GridSnap.ts
import {SnapStrategy} from "../SnapStrategy"
import {SnapContext} from "../SnapContext"
import {SnapResult} from "../SnapResult"

export interface GridSnapOptions {
    enabled?: boolean
    gridSize: number
    priority?: number
}

export class GridSnap implements SnapStrategy {
    private _name = 'grid'
    private _enabled: boolean
    gridSize: number
    private _priority: number

    constructor(options: GridSnapOptions) {
        this._enabled = options.enabled ?? true
        this.gridSize = options.gridSize
        this._priority = options.priority ?? 10
    }

    snap(ctx: SnapContext): SnapResult | null {
        if (!this._enabled) return null

        const snappedX = Math.round(ctx.x / this.gridSize) * this.gridSize
        const snappedY = Math.round(ctx.y / this.gridSize) * this.gridSize

        return { x: snappedX, y: snappedY, priority: this._priority, type: "point" }
    }


    get name(): string {
        return this._name
    }

    get enabled(): boolean {
        return this._enabled
    }

    set enabled(value: boolean) {
        this._enabled = value
    }

    get priority(): number {
        return this._priority
    }

    set priority(value: number) {
        this._priority = value
    }
}