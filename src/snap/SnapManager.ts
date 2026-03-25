import {SnapStrategy} from "./SnapStrategy"
import {SpatialIndex} from "@core/SpatialIndex"
import {Adaptable} from "../shapes/Adaptable"
import {SnapContext} from "./SnapContext"
import {SnapResult} from "./SnapResult"
import {GridSnap} from "./strategies/GridSnap"
import {MidpointSnap} from "./strategies/MidpointSnap"
import {PointSnap} from "./strategies/PointSnap"

export class SnapManager {
    private strategies: SnapStrategy[] = []
    private index: SpatialIndex = new SpatialIndex(100) // taille de cellule par défaut
    private _snapRadius: number

    constructor(options?: { snapRadius?: number; gridSize?: number }) {
        this._snapRadius = options?.snapRadius ?? 10

        this.addStrategies([
            new GridSnap({gridSize: options?.gridSize ?? 30, priority: 10}),
            new MidpointSnap(),
            new PointSnap()
        ])
    }

    // ajoute une stratégie de snap
   private addStrategies(strategies: SnapStrategy[]) {
        strategies.forEach(strategy => this.strategies.push(strategy))

        this.strategies.sort((a, b) => b.priority - a.priority) // priorité descendante
    }

    setStrategyEnabled(name: string, enabled: boolean) {
        const strategy = this.strategies.find(s => (s as any).name === name)
        if (strategy) strategy.enabled = enabled
    }

    // construit l'index spatial pour toutes les shapes
    buildIndex(shapes: Adaptable[]) {
        this.index.clear()
        for (const shape of shapes) {
            shape.getSnapPoints().forEach(p => this.index.insertSnapPoint(p))
            shape.getSegments().forEach(s => this.index.insertSegment(s))
            shape.getCircles().forEach(c => this.index.insertCircle(c))
        }
    }


    get snapRadius(): number {
        return this._snapRadius
    }

    set snapRadius(value: number) {
        this._snapRadius = value
    }

// calcule le snap pour une position (x,y)
    snap(x: number, y: number, shapes: Adaptable[], activeLayer?: string | null): SnapResult | null {
        // rebuild index à chaque frame si nécessaire
        this.buildIndex(shapes)

        const ctx: SnapContext = {
            x,
            y,
            shapes,
            index: this.index,
            snapRadius: this._snapRadius,
            activeLayer
        }

        let bestResult: SnapResult | null = null

        for (const strategy of this.strategies) {
            if (!strategy.enabled) continue

            const result = strategy.snap(ctx)
            if (!result) continue

            // on prend le snap avec la plus haute priorité
            if (!bestResult || (result.priority ?? 0) > (bestResult.priority ?? 0)) {
                bestResult = result
            }
        }

        return bestResult
    }

    // supprime toutes les stratégies et l'index
    clear() {
        this.strategies = []
        this.index.clear()
    }

    setGridSize(size: number) {
        const strategy = this.strategies.find(strategy=>strategy.name==='grid') as GridSnap
        if (strategy) strategy.gridSize = size
    }
}