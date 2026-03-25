// Cellule dans la grille
import {CircleGeom, Segment, SnapCandidate} from "../shapes/GeometryTypes"

interface GridCell {
    snapPoints: SnapCandidate[]
    segments: Segment[]
    circles: CircleGeom[]
}

export class SpatialIndex {
    private grid = new Map<string, GridCell>()
    private cellSize: number

    constructor(cellSize = 100) {
        this.cellSize = cellSize
    }

    // calcule la clé de la cellule
    private cellKey(x: number, y: number) {
        const ix = Math.floor(x / this.cellSize)
        const iy = Math.floor(y / this.cellSize)
        return `${ix},${iy}`
    }

    // ajoute un snap point
    insertSnapPoint(point: SnapCandidate) {
        const key = this.cellKey(point.x, point.y)
        if (!this.grid.has(key)) this.grid.set(key, { snapPoints: [], segments: [], circles: [] })
        this.grid.get(key)!.snapPoints.push(point)
    }

    // ajoute un segment (stocké dans toutes les cellules qu'il traverse)
    insertSegment(segment: Segment) {
        const minX = Math.min(segment.a.x, segment.b.x)
        const maxX = Math.max(segment.a.x, segment.b.x)
        const minY = Math.min(segment.a.y, segment.b.y)
        const maxY = Math.max(segment.a.y, segment.b.y)

        const startX = Math.floor(minX / this.cellSize)
        const endX = Math.floor(maxX / this.cellSize)
        const startY = Math.floor(minY / this.cellSize)
        const endY = Math.floor(maxY / this.cellSize)

        for (let ix = startX; ix <= endX; ix++) {
            for (let iy = startY; iy <= endY; iy++) {
                const key = `${ix},${iy}`
                if (!this.grid.has(key)) this.grid.set(key, { snapPoints: [], segments: [], circles: [] })
                this.grid.get(key)!.segments.push(segment)
            }
        }
    }

    insertCircle(circle: CircleGeom) {
        const key = this.cellKey(circle.center.x, circle.center.y)
        if (!this.grid.has(key)) this.grid.set(key, { snapPoints: [], segments: [], circles: [] })
        this.grid.get(key)!.circles.push(circle)
    }

    // récupère les points/segments/circles proches d’une position
    query(x: number, y: number): {
        snapPoints: SnapCandidate[]
        segments: Segment[]
        circles: CircleGeom[]
    } {
        const key = this.cellKey(x, y)
        const cell = this.grid.get(key)
        return {
            snapPoints: cell?.snapPoints ?? [],
            segments: cell?.segments ?? [],
            circles: cell?.circles ?? []
        }
    }

    // clear index
    clear() {
        this.grid.clear()
    }
}