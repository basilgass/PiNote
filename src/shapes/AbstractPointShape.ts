import {AbstractShape} from "./AbstractShape"
import {PointBasedShape} from "./Adaptable"
import {Point} from "./GeometryTypes"

/**
 * Base pour toutes les shapes créées via le protocole point-based unifié.
 *
 * Une sous-classe doit :
 *   - déclarer minPoints / maxPoints
 *   - implémenter _syncFromPoints() pour mettre à jour ses champs géométriques
 *     (cx, cy, x1, y1, ...) à partir de this._points
 *
 * Le cycle de vie est piloté par l'Engine via commitPoint / previewWith / finalize.
 */
export abstract class AbstractPointShape extends AbstractShape implements PointBasedShape {
    protected _points: Point[] = []
    /** True entre previewWith() et le prochain commitPoint/finalize. Permet à
     *  draw() de distinguer rendu transitoire (pointillés) du rendu final. */
    protected _isPreview: boolean = false

    abstract readonly minPoints: number
    abstract readonly maxPoints: number

    get points(): ReadonlyArray<Point> { return this._points }

    commitPoint(p: Point): void {
        this._isPreview = false
        this._points.push({x: p.x, y: p.y})
        this._syncFromPoints()
    }

    previewWith(points: ReadonlyArray<Point>, cursor: Point): void {
        this._isPreview = true
        this._syncPreview([...points, cursor])
    }

    finalize(_closed: boolean): void {
        this._isPreview = false
    }

    isEmpty(): boolean { return this._points.length < this.minPoints }

    /** Met à jour les champs géométriques internes à partir de this._points. */
    protected abstract _syncFromPoints(): void

    /** Variante pour la preview : les points incluent le curseur en dernière position. */
    protected _syncPreview(pointsWithCursor: ReadonlyArray<Point>): void {
        const saved = this._points
        this._points = pointsWithCursor as Point[]
        this._syncFromPoints()
        this._points = saved
    }
}
