import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useNoteStore } from './useNoteStore'
import { pdfStorageLoad, pdfStorageSave } from '../services/PdfStorage'
import { renderPdfPage, renderPdfThumbnail, clearPdfThumbnails, getPdfPageCount, clearPdfCache } from '../services/PdfRenderer'

export const usePdfStore = defineStore('pdf', () => {
  const isRendering = ref(false)
  const currentBitmap = ref<ImageBitmap | null>(null)
  const thumbnails = ref<Record<string, string>>({})
  // Dimensions du bitmap PDF dans l'espace canvas (px) — peuplé à chaque rendu de page
  const pdfCanvasSizes = ref<Record<string, { w: number, h: number }>>({})

  async function renderPageForCurrentPage() {
    const noteStore = useNoteStore()
    const eng = noteStore.engine
    console.log('[PDF] renderPageForCurrentPage — engine:', eng, 'currentPageId:', noteStore.currentPageId)
    if (!eng) return

    const page = noteStore.pages.find(p => p.id === noteStore.currentPageId)
    console.log('[PDF] page entry:', page)
    if (!page?.pdfId || page.pdfPageIndex === undefined) {
      eng.setReferenceBitmap(null)
      currentBitmap.value = null
      return
    }

    isRendering.value = true
    try {
      const buffer = await pdfStorageLoad(page.pdfId)
      console.log('[PDF] buffer from IndexedDB:', buffer ? `${buffer.byteLength} bytes` : 'null')
      if (!buffer) {
        eng.setReferenceBitmap(null)
        currentBitmap.value = null
        return
      }
      const targetWidth = eng.getLayer('MAIN').canvas.clientWidth || 800
      console.log('[PDF] targetWidth:', targetWidth)
      const bitmap = await renderPdfPage(page.pdfId, buffer, page.pdfPageIndex, targetWidth)
      console.log('[PDF] bitmap:', bitmap)
      currentBitmap.value = bitmap
      pdfCanvasSizes.value[`${page.pdfId}:${page.pdfPageIndex}`] = { w: bitmap.width, h: bitmap.height }
      eng.setReferenceBitmap(bitmap)
    } catch (e) {
      console.error('[PDF] renderPageForCurrentPage error:', e)
    } finally {
      isRendering.value = false
    }
  }

  async function importPdf(file: File): Promise<{ pdfId: string; pageCount: number }> {
    const pdfId = 'pdf-' + Date.now()
    const buffer = await file.arrayBuffer()
    await pdfStorageSave(pdfId, file.name, buffer)
    const pageCount = await getPdfPageCount(buffer)
    _generateThumbnails(pdfId, buffer, pageCount)
    return { pdfId, pageCount }
  }

  async function _generateThumbnails(pdfId: string, buffer: ArrayBuffer, pageCount: number): Promise<void> {
    for (let i = 0; i < pageCount; i++) {
      try {
        const dataUrl = await renderPdfThumbnail(pdfId, buffer, i)
        thumbnails.value[`${pdfId}:${i}`] = dataUrl
      } catch (e) {
        console.warn('[PDF] thumbnail generation failed for page', i, e)
      }
    }
  }

  function getPdfCanvasSize(pdfId: string, pageIndex: number): { w: number, h: number } | null {
    return pdfCanvasSizes.value[`${pdfId}:${pageIndex}`] ?? null
  }

  function getThumbnail(pdfId: string, pageIndex: number): string | null {
    return thumbnails.value[`${pdfId}:${pageIndex}`] ?? null
  }

  async function ensureThumbnail(pdfId: string, pageIndex: number): Promise<string | null> {
    const key = `${pdfId}:${pageIndex}`
    if (thumbnails.value[key]) return thumbnails.value[key]
    try {
      const buffer = await pdfStorageLoad(pdfId)
      if (!buffer) return null
      const dataUrl = await renderPdfThumbnail(pdfId, buffer, pageIndex)
      thumbnails.value[key] = dataUrl
      return dataUrl
    } catch {
      return null
    }
  }

  function clearReference() {
    const noteStore = useNoteStore()
    noteStore.engine?.setReferenceBitmap(null)
    currentBitmap.value = null
  }

  function clearCacheForPdf(pdfId: string) {
    clearPdfCache(pdfId)
    clearPdfThumbnails(pdfId)
    for (const key of Object.keys(thumbnails.value)) {
      if (key.startsWith(`${pdfId}:`)) delete thumbnails.value[key]
    }
  }

  return {
    isRendering,
    currentBitmap,
    thumbnails,
    renderPageForCurrentPage,
    importPdf,
    getThumbnail,
    ensureThumbnail,
    getPdfCanvasSize,
    clearReference,
    clearCacheForPdf,
  }
})
