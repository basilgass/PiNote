import type {MathMetrics} from './types'

// ── Initialisation MathJax v4 (lazy, une seule fois) ──────────────────────────

let _mjxReady: Promise<{ convert: (latex: string, display: boolean) => string }> | null = null

function getMathJax() {
    if (_mjxReady) return _mjxReady
    _mjxReady = (async () => {
        const { mathjax }             = await import('@mathjax/src/mjs/mathjax.js')
        const { TeX }                 = await import('@mathjax/src/mjs/input/tex.js')
        const { SVG }                 = await import('@mathjax/src/mjs/output/svg.js')
        const { liteAdaptor }         = await import('@mathjax/src/mjs/adaptors/liteAdaptor.js')
        const { RegisterHTMLHandler } = await import('@mathjax/src/mjs/handlers/html.js')

        // Packages TeX essentiels — base est inclus dans tex.js, on ajoute le reste
        await import('@mathjax/src/mjs/input/tex/ams/AmsConfiguration.js')
        await import('@mathjax/src/mjs/input/tex/boldsymbol/BoldsymbolConfiguration.js')
        await import('@mathjax/src/mjs/input/tex/cancel/CancelConfiguration.js')
        await import('@mathjax/src/mjs/input/tex/color/ColorConfiguration.js')
        await import('@mathjax/src/mjs/input/tex/physics/PhysicsConfiguration.js')

        const adaptor = liteAdaptor()
        RegisterHTMLHandler(adaptor)

        const doc = mathjax.document('', {
            InputJax:  new TeX({ packages: ['base', 'ams', 'boldsymbol', 'cancel', 'color', 'physics'] }),
            OutputJax: new SVG({ fontCache: 'none', linebreaks: { inline: false } }),
        })

        return {
            convert(latex: string, display: boolean): string {
                const node = doc.convert(latex, { display })
                // outerHTML retourne <mjx-container>...</mjx-container> — on veut uniquement le <svg>
                return adaptor.innerHTML(node)
            }
        }
    })()
    return _mjxReady
}

// ── Cache L1 : Map mémoire ────────────────────────────────────────────────────

const _l1 = new Map<string, { bitmap: ImageBitmap; metrics: MathMetrics }>()

function cacheKey(latex: string, display: boolean, fontSize: number): string {
    return `${fontSize}:${display ? 'D' : 'I'}:${latex}`
}

// ── Cache L2 : IndexedDB (désactivé pour tests) ───────────────────────────────
// TODO: réactiver une fois le rendu validé

// ── Métriques SVG ─────────────────────────────────────────────────────────────

const EX_TO_FONT_RATIO = 0.5

export function extractMetrics(svg: string, fontSize: number): MathMetrics {
    const ex      = fontSize * EX_TO_FONT_RATIO
    const wMatch  = svg.match(/width="([\d.]+)ex"/)
    const hMatch  = svg.match(/height="([\d.]+)ex"/)
    const vaMatch = svg.match(/vertical-align:\s*(-?[\d.]+)ex/)
    const width   = wMatch  ? parseFloat(wMatch[1])  * ex : fontSize * 2
    const height  = hMatch  ? parseFloat(hMatch[1])  * ex : fontSize
    const depth   = vaMatch ? -parseFloat(vaMatch[1]) * ex : 0
    return { width, height, depth }
}

// ── SVG → ImageBitmap ─────────────────────────────────────────────────────────

async function svgToBitmap(svg: string, metrics: MathMetrics, color: string): Promise<ImageBitmap> {
    const w = Math.max(Math.ceil(metrics.width),  4)
    const h = Math.max(Math.ceil(metrics.height), 4)
    const ready = svg
        .replace(/width="[\d.]+ex"/, `width="${w}px"`)
        .replace(/height="[\d.]+ex"/, `height="${h}px"`)
        // currentColor n'a pas de contexte CSS dans un blob — on injecte la couleur réelle
        .replaceAll('currentColor', color)
    const blob = new Blob([ready], { type: 'image/svg+xml' })
    const url  = URL.createObjectURL(blob)
    try {
        const img = new Image(w, h)
        await new Promise<void>((res, rej) => {
            img.onload = () => res()
            img.onerror = rej
            img.src = url
        })
        return createImageBitmap(img)
    } finally {
        URL.revokeObjectURL(url)
    }
}

// ── API publique ──────────────────────────────────────────────────────────────

export async function getMathBitmap(
    latex: string,
    display: boolean,
    fontSize: number,
    color = '#000000'
): Promise<{ bitmap: ImageBitmap; metrics: MathMetrics }> {
    const key = cacheKey(latex, display, fontSize)

    const l1 = _l1.get(key)
    if (l1) return l1

    const mjx     = await getMathJax()
    const svg     = mjx.convert(latex, display)
    const metrics = extractMetrics(svg, fontSize)
    const bitmap  = await svgToBitmap(svg, metrics, color)
    const entry   = { bitmap, metrics }
    _l1.set(key, entry)
    return entry
}

// ── Rendu HTML pour preview (dialog d'édition) ────────────────────────────────

function _escHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function renderToHtml(source: string): Promise<string> {
    const { parseContent } = await import('./parse-content')
    const mjx = await getMathJax()
    const paragraphs = parseContent(source)
    if (!paragraphs.length) return ''

    const parts: string[] = []
    for (const para of paragraphs) {
        if (para.kind === 'display') {
            const seg = para.segments[0]
            if (seg?.type === 'math') {
                const svg = mjx.convert(seg.content, true)
                parts.push(`<div class="pn-ted-display">${svg}</div>`)
            }
        } else {
            const spans: string[] = []
            for (const seg of para.segments) {
                if (seg.type === 'text') {
                    spans.push(_escHtml(seg.content))
                } else {
                    const svg = mjx.convert(seg.content, false)
                    spans.push(`<span class="pn-ted-math">${svg}</span>`)
                }
            }
            parts.push(`<p class="pn-ted-para">${spans.join('')}</p>`)
        }
    }
    return parts.join('')
}
