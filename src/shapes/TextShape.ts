import { AbstractWidgetShape } from './AbstractWidgetShape'
import type { ShapeOptions } from './Adaptable'
import type { Bounds, CircleGeom, Segment, SnapCandidate } from './GeometryTypes'
import { parseContent } from '../math/parse-content'
import { renderParagraphs, wrapLines, drawLines, computeTotalHeight } from '../math/text-layout'
import type { RenderedLine } from '../math/types'

export interface TextConfig {
    x: number
    y: number
    source: string
    fontSize: number
    fontFamily: string
    maxWidth: number
}

export class TextShape extends AbstractWidgetShape {
    public x: number
    public y: number
    public source: string
    public fontSize: number
    public fontFamily: string
    public maxWidth: number

    /** Callback déclenché quand le rendu async est terminé (injecté par Engine/NoteCanvas). */
    static redrawCallback: (() => void) | null = null

    private _renderedLines: RenderedLine[] | null = null
    private _renderKey = ''
    private _totalHeight = 0

    constructor(config: TextConfig, options: Partial<ShapeOptions> = {}) {
        super(options)
        this.x          = config.x
        this.y          = config.y
        this.source     = config.source
        this.fontSize   = config.fontSize
        this.fontFamily = config.fontFamily
        this.maxWidth   = config.maxWidth
    }

    private _currentRenderKey(): string {
        return `${this.source}|${this.fontSize}|${this.fontFamily}|${this.maxWidth}`
    }

    /** Déclenche le rendu async et rappelle redrawCallback quand c'est prêt. */
    scheduleRender(): void {
        const key = this._currentRenderKey()
        if (key === this._renderKey) return
        this._renderKey    = key
        this._renderedLines = null

        if (!this.source.trim()) return

        const paragraphs = parseContent(this.source)
        renderParagraphs(paragraphs, this.fontSize, this.fontFamily, this.color).then((lines) => {
            const wrapped = wrapLines(lines, this.maxWidth)
            // Vérifier que la requête est toujours valide (source n'a pas changé entre temps)
            if (key !== this._currentRenderKey()) return
            this._renderedLines = wrapped
            this._totalHeight   = computeTotalHeight(wrapped)
            TextShape.redrawCallback?.()
        })
    }

    draw(ctx: CanvasRenderingContext2D): void {
        if (!this.source.trim()) {
            this._drawPlaceholder(ctx)
            return
        }

        if (this._currentRenderKey() !== this._renderKey || !this._renderedLines) {
            this.scheduleRender()
            this._drawPlaceholder(ctx)
            return
        }

        drawLines(ctx, this._renderedLines, this.x, this.y, this.fontSize, this.fontFamily, this.color, this.maxWidth)
    }

    private _drawPlaceholder(ctx: CanvasRenderingContext2D): void {
        ctx.save()
        ctx.strokeStyle = this.color
        ctx.lineWidth   = 1
        ctx.setLineDash([4, 4])
        const h = this._totalHeight || this.fontSize * 1.5
        ctx.strokeRect(this.x, this.y, this.maxWidth || 120, h)
        ctx.setLineDash([])
        ctx.restore()
    }

    /** Pendant le drag : met à jour la largeur de la boîte. */
    update(x: number, y: number): void {
        this.maxWidth = Math.max(10, x - this.x)
    }

    hitTest(x: number, y: number, _tolerance: number): boolean {
        const h = this._totalHeight || this.fontSize * 1.5
        const w = this.maxWidth || 120
        return x >= this.x && x <= this.x + w && y >= this.y && y <= this.y + h
    }

    translate(dx: number, dy: number): void {
        this.x += dx
        this.y += dy
    }

    isEmpty(): boolean {
        return this.source.trim() === ''
    }

    getBounds(): Bounds {
        const h = this._totalHeight || this.fontSize * 1.5
        const w = this.maxWidth || 120
        return { minX: this.x, minY: this.y, maxX: this.x + w, maxY: this.y + h }
    }

    getSnapPoints(): SnapCandidate[] {
        const h = this._totalHeight || this.fontSize * 1.5
        const w = this.maxWidth || 120
        return [
            { x: this.x,         y: this.y,         type: 'endpoint', shapeId: this.id, layer: this.layer },
            { x: this.x + w,     y: this.y,         type: 'endpoint', shapeId: this.id, layer: this.layer },
            { x: this.x,         y: this.y + h,     type: 'endpoint', shapeId: this.id, layer: this.layer },
            { x: this.x + w,     y: this.y + h,     type: 'endpoint', shapeId: this.id, layer: this.layer },
            { x: this.x + w / 2, y: this.y + h / 2, type: 'midpoint', shapeId: this.id, layer: this.layer },
        ]
    }

    getSegments(): Segment[] { return [] }
    getCircles(): CircleGeom[] { return [] }

    toJSON(): any {
        return {
            config: {
                x:          this.x,
                y:          this.y,
                source:     this.source,
                fontSize:   this.fontSize,
                fontFamily: this.fontFamily,
                maxWidth:   this.maxWidth,
            },
            options: super.toJSON(),
        }
    }

    hasSufficientSize(): boolean {
        return this.maxWidth >= 20
    }

    getDialogProps(): Record<string, unknown> {
        return {
            initialSource: this.source,
            maxWidth:      this.maxWidth,
            fontSize:      this.fontSize,
            color:         this.color,
        }
    }

    applyConfig(config: unknown): void {
        const { source } = config as { source: string }
        this.source = source
        this.scheduleRender()
    }

    static fromData(config: TextConfig, options: Partial<ShapeOptions>): TextShape {
        const shape = new TextShape(config, options)
        shape.scheduleRender()
        return shape
    }
}
