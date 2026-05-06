import type { ContentSegment, Paragraph } from './types'

/** Découpe une ligne inline en segments texte / math inline ($...$). */
function parseInline(line: string): ContentSegment[] {
    const segments: ContentSegment[] = []
    let i = 0
    while (i < line.length) {
        const j = line.indexOf('$', i)
        if (j === -1) {
            if (i < line.length) segments.push({ type: 'text', content: line.slice(i) })
            break
        }
        if (j > i) segments.push({ type: 'text', content: line.slice(i, j) })
        // chercher le $ fermant
        const k = line.indexOf('$', j + 1)
        if (k === -1) {
            segments.push({ type: 'text', content: line.slice(j) })
            break
        }
        const latex = line.slice(j + 1, k)
        if (latex.trim()) segments.push({ type: 'math', content: latex, display: false })
        i = k + 1
    }
    return segments
}

/**
 * Parse une source texte en Paragraph[].
 *
 * Ordre de priorité :
 *  1. $$...$$ → paragraphe display isolé
 *  2. \n → séparateurs de paragraphes inline
 *  3. $...$ → math inline dans chaque ligne
 */
export function parseContent(source: string): Paragraph[] {
    const paragraphs: Paragraph[] = []

    // Extrait les blocs $$ en conservant leur ordre via des marqueurs
    const blocks: string[] = []
    const MARKER = '\x00MATH_DISPLAY_\x00'
    const withMarkers = source.replace(/\$\$([\s\S]*?)\$\$/g, (_match, latex) => {
        blocks.push(latex)
        return MARKER + (blocks.length - 1) + '\x00'
    })

    // Sépare en lignes
    const lines = withMarkers.split('\n')

    for (const line of lines) {
        if (!line.trim()) continue

        // Ligne contenant uniquement un marqueur display
        const displayMatch = line.trim().match(/^\x00MATH_DISPLAY_\x00(\d+)\x00$/)
        if (displayMatch) {
            const latex = blocks[parseInt(displayMatch[1])]
            if (latex?.trim()) {
                paragraphs.push({
                    kind: 'display',
                    segments: [{ type: 'math', content: latex.trim(), display: true }],
                })
            }
            continue
        }

        // Ligne inline : peut contenir des marqueurs display résiduels (edge case)
        // On les remplace par le texte LaTeX entouré de $$ pour affichage fallback
        const cleaned = line.replace(/\x00MATH_DISPLAY_\x00(\d+)\x00/g, (_m, idx) => {
            return `$$${blocks[parseInt(idx)]}$$`
        })

        const segments = parseInline(cleaned).filter(s => s.content.trim())
        if (segments.length > 0) {
            paragraphs.push({ kind: 'inline', segments })
        }
    }

    return paragraphs
}
