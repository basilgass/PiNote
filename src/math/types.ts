export type ParagraphKind = 'inline' | 'display'

export type ContentSegment =
    | { type: 'text'; content: string }
    | { type: 'math'; content: string; display: boolean }

export interface Paragraph {
    kind: ParagraphKind
    segments: ContentSegment[]
}

export interface MathMetrics {
    width: number
    height: number
    depth: number   // baseline offset (positive = below baseline)
}

export interface RenderedSegment {
    type: 'text' | 'math'
    content: string
    bitmap: ImageBitmap | null
    width: number
    ascent: number
    descent: number
    display: boolean
}

export interface RenderedLine {
    segments: RenderedSegment[]
    ascent: number
    descent: number
    totalWidth: number
    display: boolean
}
