import { getMathBitmap } from './math-renderer'
import type { Paragraph, RenderedLine, RenderedSegment } from './types'

const DISPLAY_MARGIN_Y = 8   // px au-dessus et en-dessous des blocs display

// ── Rendu des segments ────────────────────────────────────────────────────────

export async function renderParagraphs(
    paragraphs: Paragraph[],
    fontSize: number,
    fontFamily: string,
    color: string
): Promise<RenderedLine[]> {
    // Contexte temporaire pour mesurer le texte
    const tmpCanvas = document.createElement('canvas')
    const tmpCtx    = tmpCanvas.getContext('2d')!
    tmpCtx.font     = `${fontSize}px ${fontFamily}`

    const lines: RenderedLine[] = []

    for (const para of paragraphs) {
        if (para.kind === 'display') {
            const seg = para.segments[0]
            if (seg.type !== 'math') continue
            const { bitmap, metrics } = await getMathBitmap(seg.content, true, fontSize, color)
            const rSeg: RenderedSegment = {
                type: 'math',
                content: seg.content,
                bitmap,
                width:   metrics.width,
                ascent:  metrics.height - metrics.depth,
                descent: metrics.depth,
                display: true,
            }
            lines.push({
                segments:   [rSeg],
                ascent:     rSeg.ascent,
                descent:    rSeg.descent,
                totalWidth: rSeg.width,
                display:    true,
            })
        } else {
            // Ligne inline : traiter chaque segment
            const renderedSegs: RenderedSegment[] = []
            for (const seg of para.segments) {
                if (seg.type === 'text') {
                    // Décomposer mot par mot pour que wrapLines puisse couper entre les mots
                    const words = seg.content.match(/\S+\s*/g) ?? [seg.content]
                    for (const word of words) {
                        const m = tmpCtx.measureText(word)
                        renderedSegs.push({
                            type:    'text',
                            content: word,
                            bitmap:  null,
                            width:   m.width,
                            ascent:  m.actualBoundingBoxAscent  ?? fontSize * 0.8,
                            descent: m.actualBoundingBoxDescent ?? fontSize * 0.2,
                            display: false,
                        })
                    }
                } else {
                    const { bitmap, metrics } = await getMathBitmap(seg.content, false, fontSize, color)
                    renderedSegs.push({
                        type:    'math',
                        content: seg.content,
                        bitmap,
                        width:   metrics.width,
                        ascent:  metrics.height - metrics.depth,
                        descent: metrics.depth,
                        display: false,
                    })
                }
            }
            const ascent  = Math.max(...renderedSegs.map(s => s.ascent),  0)
            const descent = Math.max(...renderedSegs.map(s => s.descent), 0)
            lines.push({
                segments:   renderedSegs,
                ascent,
                descent,
                totalWidth: renderedSegs.reduce((acc, s) => acc + s.width, 0),
                display:    false,
            })
        }
    }
    return lines
}

// ── Wrapping ──────────────────────────────────────────────────────────────────

export function wrapLines(lines: RenderedLine[], maxWidth: number): RenderedLine[] {
    if (maxWidth <= 0) return lines
    const result: RenderedLine[] = []
    for (const line of lines) {
        if (line.display || line.totalWidth <= maxWidth) {
            result.push(line)
            continue
        }
        // Wrap inline : découpe en sous-lignes
        let current: RenderedSegment[] = []
        let currentW = 0
        for (const seg of line.segments) {
            if (currentW + seg.width > maxWidth && current.length > 0) {
                result.push(buildLine(current))
                current = []
                currentW = 0
            }
            // Segment math atomique : si trop large mais seul, on le garde quand même
            current.push(seg)
            currentW += seg.width
        }
        if (current.length > 0) result.push(buildLine(current))
    }
    return result
}

function buildLine(segs: RenderedSegment[]): RenderedLine {
    return {
        segments:   segs,
        ascent:     Math.max(...segs.map(s => s.ascent),  0),
        descent:    Math.max(...segs.map(s => s.descent), 0),
        totalWidth: segs.reduce((acc, s) => acc + s.width, 0),
        display:    false,
    }
}

// ── Dessin ────────────────────────────────────────────────────────────────────

export function drawLines(
    ctx: CanvasRenderingContext2D,
    lines: RenderedLine[],
    x: number,
    y: number,
    fontSize: number,
    fontFamily: string,
    color: string,
    maxWidth: number
): void {
    ctx.save()
    ctx.fillStyle = color
    ctx.font      = `${fontSize}px ${fontFamily}`

    let curY = y
    for (const line of lines) {
        if (line.display) {
            // Bloc display : centré, avec marge verticale
            curY += DISPLAY_MARGIN_Y + line.ascent
            const seg = line.segments[0]
            if (seg?.bitmap) {
                const drawX = maxWidth > 0
                    ? x + (maxWidth - seg.width) / 2
                    : x
                ctx.drawImage(seg.bitmap, drawX, curY - seg.ascent, seg.width, seg.ascent + seg.descent)
            }
            curY += line.descent + DISPLAY_MARGIN_Y
        } else {
            // Ligne inline : baseline commune
            curY += line.ascent
            let curX = x
            for (const seg of line.segments) {
                if (seg.type === 'text') {
                    ctx.fillText(seg.content, curX, curY)
                } else if (seg.bitmap) {
                    ctx.drawImage(seg.bitmap, curX, curY - seg.ascent, seg.width, seg.ascent + seg.descent)
                }
                curX += seg.width
            }
            curY += line.descent
        }
    }
    ctx.restore()
}

// ── Hauteur totale ────────────────────────────────────────────────────────────

export function computeTotalHeight(lines: RenderedLine[]): number {
    let h = 0
    for (const line of lines) {
        if (line.display) {
            h += DISPLAY_MARGIN_Y + line.ascent + line.descent + DISPLAY_MARGIN_Y
        } else {
            h += line.ascent + line.descent
        }
    }
    return h
}
