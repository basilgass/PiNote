import {ArrowStyle, LayerName, LineStyle, StrokePoint, ToolType} from "../types"
import {Bounds, CircleGeom, Point, Segment, SnapCandidate} from "./GeometryTypes"
import type {IDrawingContext} from "../core/DrawingContext"

export interface ShapeOptions {
    id?: string
    createdAt?: number
    tool?: ToolType
    layer?: LayerName | null
    color?: string
    width?: number
    hidden?: boolean
    arrowStart?: boolean
    arrowEnd?: boolean
    arrowStyle?: ArrowStyle
    lineStyle?: LineStyle
    fill?: boolean
    fillOpacity?: number
}

export type ShapePatch = Partial<ShapeOptions> & { bezier?: boolean; closed?: boolean; sector?: boolean }

export interface Capabilities {
    canHaveArrows: boolean
    canBeFilled: boolean
}


export interface Adaptable extends Capabilities {
    id: string
    tool: ToolType
    layer: LayerName | null
    color: string

    draw(ctx: CanvasRenderingContext2D): void

    toJSON(): any

    getSnapPoints(): SnapCandidate[]

    getSegments(): Segment[]

    getCircles(): CircleGeom[]

    getBounds(): Bounds | null

    hidden: boolean
    translate(dx: number, dy: number): void
    hitTest(x: number, y: number, tolerance: number): boolean
}

// =============================================================================
// Nouveau contrat de création unifié — point-based
// =============================================================================
//
// Toutes les shapes (sauf Stroke) sont créées selon un protocole unique :
//   1. pointerdown      → l'Engine appelle commitPoint(p) sur la shape courante
//   2. pointermove      → l'Engine appelle previewWith(points, cursor)
//   3. pointerup        → si points.length atteint maxPoints, finalize(false)
//   4. clic sur 1er pt  → finalize(true)  (fermeture, polygone)
//   5. clic sur dernier → finalize(false) (terminaison, ligne brisée)
//   6. Esc / changement → cancelDraw() côté Engine
//
// Le shape ne sait rien de la machine à états — il déclare juste minPoints,
// maxPoints, et reçoit ses points au fur et à mesure.

/** Shape créée via le protocole point-based unifié. */
export interface PointBasedShape extends Adaptable {
    /** Nombre minimum de points avant que la shape soit valide / fermable. */
    readonly minPoints: number
    /** Nombre maximum de points. `Infinity` pour les shapes fermables (polygon). */
    readonly maxPoints: number
    /** Liste des points validés. Lue par l'Engine pour le rendu des indicateurs. */
    readonly points: ReadonlyArray<Point>

    /** Ajoute un point validé. La shape met à jour sa géométrie interne. */
    commitPoint(p: Point): void
    /** Met à jour la prévisualisation : points validés + curseur courant. */
    previewWith(points: ReadonlyArray<Point>, cursor: Point): void
    /** Indique à la shape qu'elle est finalisée. `closed` distingue polygone fermé
     *  vs ligne brisée pour les shapes à maxPoints infini. Sans effet sur les
     *  shapes à maxPoints fini. */
    finalize(closed: boolean): void
}

/** Shape créée par geste continu (pen, highlighter, eraser). Hors contrat point-based. */
export interface StrokeBasedShape extends Adaptable {
    addPoint(p: StrokePoint): void
    /** Hooks spécifiques (eraser : snapshot/restore de layer). */
    onStart?(ctx: IDrawingContext): void
    onMove?(x: number, y: number, ctx: IDrawingContext): boolean
    onEnd?(): void
}

/** Type guard : la shape implémente le contrat point-based ? */
export function isPointBased(shape: Adaptable): shape is PointBasedShape {
    return typeof (shape as PointBasedShape).commitPoint === 'function'
}

/** Type guard : la shape est un stroke continu ? */
export function isStrokeBased(shape: Adaptable): shape is StrokeBasedShape {
    return typeof (shape as StrokeBasedShape).addPoint === 'function'
}