<script setup lang="ts">
import { ref } from 'vue'
import { usePdfStore } from '../../store/usePdfStore'
import { ShapeFactory } from '../../core/ShapeFactory'
import type { Adaptable } from '../../shapes/Adaptable'
import type { PageEntry } from '../../store/useNoteStore'

const props = defineProps<{ page: PageEntry }>()

const pdfStore = usePdfStore()
const canvasEl = ref<HTMLCanvasElement | null>(null)

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// ── Rendu ─────────────────────────────────────────────────────────────────────

async function render() {
  const canvas = canvasEl.value
  if (!canvas) return
  const W = 400, H = 300
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, W, H)

  const page = props.page

  // PDF
  let thumbImg: HTMLImageElement | null = null
  let pdfRect: { x: number, y: number, w: number, h: number } | null = null

  if (page.pdfId !== undefined && page.pdfPageIndex !== undefined) {
    const url = await pdfStore.ensureThumbnail(page.pdfId, page.pdfPageIndex)
    if (url) {
      try { thumbImg = await loadImage(url) } catch { /* skip */ }
    }
    const size = pdfStore.getPdfCanvasSize(page.pdfId, page.pdfPageIndex)
    if (size) pdfRect = { x: 0, y: 0, w: size.w, h: size.h }
  }

  // Shapes
  const shapes = loadShapes(page.id)

  // Bbox union : PDF (espace canvas) + shapes (même espace canvas)
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

  if (pdfRect) {
    minX = Math.min(minX, 0)
    minY = Math.min(minY, 0)
    maxX = Math.max(maxX, pdfRect.w)
    maxY = Math.max(maxY, pdfRect.h)
  }

  for (const s of shapes) {
    const b = s.getBounds()
    if (!b) continue
    minX = Math.min(minX, b.minX)
    minY = Math.min(minY, b.minY)
    maxX = Math.max(maxX, b.maxX)
    maxY = Math.max(maxY, b.maxY)
  }

  // Fallback : aucune géométrie connue → letterbox du thumbnail seul
  if (!isFinite(minX)) {
    if (thumbImg) {
      const s = Math.min(W / thumbImg.width, H / thumbImg.height)
      ctx.drawImage(thumbImg, (W - thumbImg.width * s) / 2, (H - thumbImg.height * s) / 2, thumbImg.width * s, thumbImg.height * s)
    }
    return
  }

  // FitView unique
  const PAD = 10
  const cW = Math.max(maxX - minX, 1)
  const cH = Math.max(maxY - minY, 1)
  const scale = Math.min((W - 2 * PAD) / cW, (H - 2 * PAD) / cH)
  const tx = PAD + (W - 2 * PAD - cW * scale) / 2 - minX * scale
  const ty = PAD + (H - 2 * PAD - cH * scale) / 2 - minY * scale

  // PDF thumbnail positionné dans l'espace fitView
  if (thumbImg && pdfRect) {
    ctx.drawImage(
      thumbImg,
      tx + pdfRect.x * scale,
      ty + pdfRect.y * scale,
      pdfRect.w * scale,
      pdfRect.h * scale,
    )
  }

  // Shapes dans le même espace fitView
  if (shapes.length) {
    ctx.save()
    ctx.translate(tx, ty)
    ctx.scale(scale, scale)
    for (const s of shapes) s.draw(ctx)
    ctx.restore()
  }
}

defineExpose({ render })
</script>

<template>
  <canvas ref="canvasEl" width="400" height="300" />
</template>
