<script setup lang="ts">
import {nextTick, ref, watch} from 'vue'
import PiIcon from '../PiIcon.vue'
import WidgetDialog from './WidgetDialog.vue'
import {renderToHtml} from "../../../math/math-renderer"
import {parseContent} from "../../../math/parse-content"
import {computeTotalHeight, drawLines, renderParagraphs, wrapLines} from "../../../math/text-layout"

const props = defineProps<{
  open:          boolean
  initialSource: string
  maxWidth:      number
  fontSize:      number
  color:         string
}>()

const emit = defineEmits<{
  confirm: [config: { source: string }]
  cancel:  []
}>()

const textareaEl  = ref<HTMLTextAreaElement | null>(null)
const canvasEl    = ref<HTMLCanvasElement  | null>(null)
const source      = ref('')
const previewHtml = ref('')
const previewMode = ref<'html' | 'svg'>('html')
let _debounceTimer: ReturnType<typeof setTimeout> | null = null

// ── Preview HTML ──────────────────────────────────────────────────────────────

async function updateHtmlPreview() {
  previewHtml.value = await renderToHtml(source.value)
}

// ── Preview SVG (rendu canvas exact) ─────────────────────────────────────────

async function updateSvgPreview() {
  const canvas = canvasEl.value
  if (!canvas) return
  const paragraphs = parseContent(source.value)
  const lines      = await renderParagraphs(paragraphs, props.fontSize, 'serif', props.color)
  const wrapped    = wrapLines(lines, props.maxWidth)
  const totalH     = Math.max(computeTotalHeight(wrapped), props.fontSize * 2)

  canvas.width  = props.maxWidth
  canvas.height = totalH
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  drawLines(ctx, wrapped, 0, 0, props.fontSize, 'serif', props.color, props.maxWidth)
}

function updatePreview() {
  if (previewMode.value === 'html') return updateHtmlPreview()
  return updateSvgPreview()
}

function schedulePreview() {
  if (_debounceTimer) clearTimeout(_debounceTimer)
  _debounceTimer = setTimeout(updatePreview, 30)
}

async function toggleMode() {
  previewMode.value = previewMode.value === 'html' ? 'svg' : 'html'
  await nextTick()
  void updatePreview()
}

// ── Open ──────────────────────────────────────────────────────────────────────

watch(() => props.open, async (open) => {
  if (open) {
    source.value = props.initialSource
    previewMode.value = 'html'
    await nextTick()
    textareaEl.value?.focus()
    textareaEl.value?.setSelectionRange(source.value.length, source.value.length)
    void updateHtmlPreview()
  }
})

// ── Actions ───────────────────────────────────────────────────────────────────

function onConfirm() { emit('confirm', { source: source.value }) }
function onCancel()  { emit('cancel') }

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') { e.preventDefault(); emit('cancel') }
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); onConfirm() }
}
</script>

<template>
	<WidgetDialog
		:open="open"
		@confirm="onConfirm"
		@cancel="onCancel"
	>
		<!-- Bouton toggle mode preview (haut-droite absolu) -->
		<button
			class="btn btn-ghost pn-ted-mode-btn"
			type="button"
			:title="previewMode === 'html' ? 'Passer en aperçu canvas' : 'Passer en aperçu HTML'"
			@click="toggleMode"
		>
			<PiIcon :icon="previewMode === 'html' ? 'eye' : 'eye-slash'" />
			<span>{{ previewMode === 'html' ? 'Canvas' : 'HTML' }}</span>
		</button>

		<!-- Colonne gauche : saisie -->
		<div class="pn-ted-input">
			<textarea
				ref="textareaEl"
				v-model="source"
				class="pn-ted-textarea"
				placeholder="Texte LaTeX... ex: l'angle $\alpha = 36$°"
				spellcheck="false"
				@input="schedulePreview"
				@keydown="onKeydown"
			/>
		</div>

		<!-- Colonne droite : preview -->
		<div
			class="pn-ted-preview"
			:style="{ width: maxWidth + 'px' }"
		>
			<div
				v-if="previewMode === 'html'"
				class="pn-ted-preview-inner"
				:style="{ color: color, fontSize: fontSize + 'px' }"
				v-html="previewHtml || '&nbsp;'"
			/>
			<canvas
				v-else
				ref="canvasEl"
				class="pn-ted-canvas"
			/>
		</div>
	</WidgetDialog>
</template>
