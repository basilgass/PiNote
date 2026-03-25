// core/geometry/GeometryTypes.ts

// Un point qu’on peut utiliser pour “snapper”
import {LayerName} from "../types"

export interface SnapCandidate {
    x: number
    y: number
    type: "endpoint" | "midpoint" | "center" | "circumference" | "corner"
    shapeId: string
    layer: LayerName | null
}

// Un segment de ligne entre deux points
export interface Segment {
    a: { x: number; y: number }
    b: { x: number; y: number },
    layer: LayerName | null
}

// Bounding box axis-aligned d'une shape
export interface Bounds {
    minX: number
    minY: number
    maxX: number
    maxY: number
}

// Cercle géométrique pour Snap ou collision
export interface CircleGeom {
    center: { x: number; y: number }
    radius: number,
    layer: LayerName | null
}