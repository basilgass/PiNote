import * as pdfjs from 'pdfjs-dist'
import { idbGetThumb, idbSetThumb, idbClearThumbsByPdfId, idbClearAllThumbs } from './PdfThumbnailDb'

export function initPdfWorker(workerSrc: string): void {
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
}

const _cache = new Map<string, ImageBitmap>()

export async function renderPdfPage(
  pdfId: string,
  buffer: ArrayBuffer,
  pageIndex: number,
  targetWidth: number,
): Promise<ImageBitmap> {
  const key = `${pdfId}:${pageIndex}:${targetWidth}`
  const cached = _cache.get(key)
  if (cached) return cached

  const doc = await pdfjs.getDocument({ data: buffer }).promise
  const page = await doc.getPage(pageIndex + 1)
  const viewport = page.getViewport({ scale: 1 })
  const scale = targetWidth / viewport.width
  const scaled = page.getViewport({ scale })

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(scaled.width)
  canvas.height = Math.round(scaled.height)
  const ctx = canvas.getContext('2d')!
  await page.render({ canvas, canvasContext: ctx, viewport: scaled }).promise

  const bitmap = await createImageBitmap(canvas)
  _cache.set(key, bitmap)
  return bitmap
}

export async function getPdfPageCount(buffer: ArrayBuffer): Promise<number> {
  const doc = await pdfjs.getDocument({ data: buffer }).promise
  return doc.numPages
}

export function clearPdfCache(pdfId?: string): void {
  if (pdfId === undefined) {
    for (const bm of _cache.values()) bm.close()
    _cache.clear()
    return
  }
  for (const [key, bm] of _cache) {
    if (key.startsWith(`${pdfId}:`)) {
      bm.close()
      _cache.delete(key)
    }
  }
}

const _thumbCache = new Map<string, string>()

export async function renderPdfThumbnail(
  pdfId: string,
  buffer: ArrayBuffer,
  pageIndex: number,
): Promise<string> {
  const key = `${pdfId}:${pageIndex}`

  const memCached = _thumbCache.get(key)
  if (memCached) return memCached

  const idbCached = await idbGetThumb(key)
  if (idbCached) {
    _thumbCache.set(key, idbCached)
    return idbCached
  }

  const THUMB_W = 320
  const doc = await pdfjs.getDocument({ data: buffer }).promise
  const page = await doc.getPage(pageIndex + 1)
  const viewport = page.getViewport({ scale: 1 })
  const scale = THUMB_W / viewport.width
  const scaled = page.getViewport({ scale })

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(scaled.width)
  canvas.height = Math.round(scaled.height)
  const ctx = canvas.getContext('2d')!
  await page.render({ canvas, canvasContext: ctx, viewport: scaled }).promise

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
  _thumbCache.set(key, dataUrl)
  void idbSetThumb(key, dataUrl)
  return dataUrl
}

export function clearPdfThumbnails(pdfId?: string): void {
  if (pdfId === undefined) {
    _thumbCache.clear()
    void idbClearAllThumbs()
    return
  }
  for (const key of _thumbCache.keys()) {
    if (key.startsWith(`${pdfId}:`)) _thumbCache.delete(key)
  }
  void idbClearThumbsByPdfId(pdfId)
}
