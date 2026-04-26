import { ShapeFactory } from '../core/ShapeFactory'
import type { Adaptable } from '../shapes/Adaptable'
import type { PageEntry } from '../store/useNoteStore'
import { pdfStorageLoad } from './PdfStorage'
import { renderPdfPage } from './PdfRenderer'

// A4 at 150 dpi
const A4_W = 1240
const A4_H = 1754
// A4 in PDF points
const A4_PT_W = 595
const A4_PT_H = 842

function loadShapes(pageId: string): Adaptable[] {
  const raw = localStorage.getItem('pi_note_draft_' + pageId)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    const data: any[] = Array.isArray(parsed) ? parsed : (parsed.shapes ?? [])
    return data
      .map((s: any) => ShapeFactory.fromJSON(s))
      .filter((s): s is Adaptable => s !== null && !s.hidden)
  } catch {
    return []
  }
}

async function buildPageCanvas(
  page: PageEntry,
  pdfCanvasSize: { w: number; h: number } | null,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = A4_W
  canvas.height = A4_H
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, A4_W, A4_H)

  const shapes = loadShapes(page.id)

  if (page.pdfId !== undefined && page.pdfPageIndex !== undefined) {
    // Load full-resolution PDF page
    try {
      const buffer = await pdfStorageLoad(page.pdfId)
      if (buffer) {
        const bitmap = await renderPdfPage(page.pdfId, buffer, page.pdfPageIndex, A4_W)
        ctx.drawImage(bitmap, 0, 0, A4_W, A4_H)

        // Scale shapes to match: shapes were drawn in canvas space where PDF was pdfCanvasSize wide
        if (shapes.length && pdfCanvasSize) {
          const scaleX = A4_W / pdfCanvasSize.w
          const scaleY = A4_H / pdfCanvasSize.h
          const s = Math.min(scaleX, scaleY)
          ctx.save()
          ctx.scale(s, s)
          for (const sh of shapes) sh.draw(ctx)
          ctx.restore()
        } else if (shapes.length) {
          for (const sh of shapes) sh.draw(ctx)
        }
      }
    } catch {
      // fallback: render shapes only
    }
  } else if (shapes.length) {
    // FitView
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const s of shapes) {
      const b = s.getBounds()
      if (!b) continue
      minX = Math.min(minX, b.minX); minY = Math.min(minY, b.minY)
      maxX = Math.max(maxX, b.maxX); maxY = Math.max(maxY, b.maxY)
    }
    if (isFinite(minX)) {
      const PAD = 40
      const cW = Math.max(maxX - minX, 1)
      const cH = Math.max(maxY - minY, 1)
      const scale = Math.min((A4_W - 2 * PAD) / cW, (A4_H - 2 * PAD) / cH)
      const tx = PAD + (A4_W - 2 * PAD - cW * scale) / 2 - minX * scale
      const ty = PAD + (A4_H - 2 * PAD - cH * scale) / 2 - minY * scale
      ctx.save()
      ctx.translate(tx, ty)
      ctx.scale(scale, scale)
      for (const s of shapes) s.draw(ctx)
      ctx.restore()
    }
  }

  return canvas
}

function canvasToJpegBytes(canvas: HTMLCanvasElement): Promise<Uint8Array<ArrayBuffer>> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) { reject(new Error('toBlob failed')); return }
      blob.arrayBuffer().then(ab => resolve(new Uint8Array(ab))).catch(reject)
    }, 'image/jpeg', 0.92)
  })
}

function buildPdf(jpegBytes: Uint8Array<ArrayBuffer>, imgW: number, imgH: number): Uint8Array<ArrayBuffer> {
  const enc = new TextEncoder()

  const objects: Uint8Array[] = []
  const offsets: number[] = []

  function text(s: string): Uint8Array { return enc.encode(s) }
  function concat(...parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
    const len = parts.reduce((a, b) => a + b.length, 0)
    const out = new Uint8Array(len)
    let off = 0
    for (const p of parts) { out.set(p, off); off += p.length }
    return out
  }

  // obj 1: Catalog
  objects.push(text('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'))
  // obj 2: Pages
  objects.push(text('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'))
  // obj 3: Page
  objects.push(text(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_PT_W} ${A4_PT_H}]\n` +
    `/Resources << /XObject << /Im0 4 0 R >> >>\n/Contents 5 0 R >>\nendobj\n`,
  ))
  // obj 4: Image XObject (JPEG)
  const imgHeader = text(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH}\n` +
    `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`,
  )
  const imgFooter = text('\nendstream\nendobj\n')
  objects.push(concat(imgHeader, jpegBytes, imgFooter))
  // obj 5: Content stream — fill page with image
  const contentStr = `q ${A4_PT_W} 0 0 ${A4_PT_H} 0 0 cm /Im0 Do Q`
  const contentBody = text(contentStr)
  objects.push(text(
    `5 0 obj\n<< /Length ${contentBody.length} >>\nstream\n${contentStr}\nendstream\nendobj\n`,
  ))

  // Build body
  const header = text('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')
  let pos = header.length
  const xrefOffsets: number[] = []
  const bodyParts: Uint8Array[] = [header]
  for (let i = 0; i < objects.length; i++) {
    xrefOffsets.push(pos)
    bodyParts.push(objects[i])
    pos += objects[i].length
  }

  // xref
  const xrefPos = pos
  const xrefLines = [`xref\n0 ${objects.length + 1}\n`, '0000000000 65535 f \n']
  for (const o of xrefOffsets) {
    xrefLines.push(String(o).padStart(10, '0') + ' 00000 n \n')
  }
  const xref = text(xrefLines.join(''))
  bodyParts.push(xref)

  const trailer = text(
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`,
  )
  bodyParts.push(trailer)

  return concat(...bodyParts)
}

export async function exportPageAsPdf(
  page: PageEntry,
  pdfCanvasSize: { w: number; h: number } | null,
  filename: string,
): Promise<void> {
  const canvas = await buildPageCanvas(page, pdfCanvasSize)
  const jpegBytes = await canvasToJpegBytes(canvas)
  const pdfBytes = buildPdf(jpegBytes, A4_W, A4_H)
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
