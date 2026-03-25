// core/snap/SnapResult.ts

import {SnapKind} from "./SnapTypes"

export interface SnapResult {
    x: number        // position snapée en X
    y: number        // position snapée en Y
    type: SnapKind
    shapeId?: string // id de la shape sur laquelle on snappe
    priority?: number // optionnel : pour trier les snaps si plusieurs candidats
}