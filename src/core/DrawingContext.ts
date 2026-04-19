import type { SnapResult } from '../snap/SnapResult'
import type { Layer } from './Layer'
import type { LayerName } from '../types'

export interface IDrawingContext {
    readonly overlayCtx: CanvasRenderingContext2D
    /** Calcule le snap pour (x, y) en tenant compte de toutes les shapes existantes */
    snap(x: number, y: number, layer?: LayerName | null): SnapResult | null
    getLayer(name: LayerName): Layer
    readonly viewTransform: Readonly<{ x: number; y: number; scale: number }>
    /** Dessine l'indicateur de snap — appeler avec le transform world déjà actif sur overlayCtx */
    drawSnapIndicator(result: SnapResult | null): void
    readonly bezierEnabled: boolean
    getLayerSnapshot(name: LayerName): ImageData
    restoreLayerSnapshot(name: LayerName, data: ImageData): void
}
