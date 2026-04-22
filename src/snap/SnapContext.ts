import {Adaptable} from "../shapes/Adaptable"
import {SpatialIndex} from "@core/SpatialIndex"

export interface SnapContext {
    // position courante du curseur
    x: number
    y: number

    // toutes les shapes visibles pour snap (optionnel — les stratégies utilisent index)
    shapes?: Adaptable[]

    // index spatial pour accélérer la recherche
    index: SpatialIndex

    // rayon max de snap
    snapRadius: number

    // optionnel : couche active
    activeLayer?: string | null
}