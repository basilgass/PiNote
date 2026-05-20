<script setup lang="ts">

import {ToolType} from "../../types"
import {computed, onMounted, ref, useTemplateRef, watch} from "vue"

const selectedColor = defineModel<string>()

const emit = defineEmits<{
  pick: [color: string]
}>()

interface Props {
  tool: ToolType
}

const props = defineProps<Props>()

const baseColors = [
  '#000000',
  '#ef4444',
  '#3b82f6',
  '#22c55e',
  '#eab308'
]

function isDisabled(color?: string):boolean{
  if(props.tool==='eraser') return true

  if(color===undefined) return false

  if(props.tool==='highlighter' && color==='#000000') return true

  return false
}

function selectColor(color: string) {
  selectedColor.value = color
  emit('pick', color)
}

// ── 2D gradient: hue (x) × lightness (y), saturation = 100% ─────────────────

const gradient = useTemplateRef<HTMLDivElement>('gradient')
/** Position verrouillée de la dernière couleur custom committée. */
const committedMarker = ref<{ fx: number; fy: number } | null>(null)
/** Position du curseur pendant survol / drag (transitoire). */
const hoverMarker = ref<{ fx: number; fy: number } | null>(null)
const marker = computed(() => hoverMarker.value ?? committedMarker.value)
const dragging = ref(false)
/** Couleur custom committée (mise à jour seulement au commit). */
const customColor = ref<string | null>(null)
/** Couleur prévisualisée pendant survol/drag (live). */
const previewColor = ref<string | null>(null)

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hp = h / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r = 0, g = 0, b = 0
  if (hp < 1)      { r = c; g = x }
  else if (hp < 2) { r = x; g = c }
  else if (hp < 3) { g = c; b = x }
  else if (hp < 4) { g = x; b = c }
  else if (hp < 5) { r = x; b = c }
  else             { r = c; b = x }
  const m = l - c / 2
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const r = parseInt(m[1].slice(0, 2), 16) / 255
  const g = parseInt(m[1].slice(2, 4), 16) / 255
  const b = parseInt(m[1].slice(4, 6), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0, s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0))
    else if (max === g) h = ((b - r) / d + 2)
    else h = ((r - g) / d + 4)
    h *= 60
  }
  return { h, s, l }
}

function colorAtFraction(fx: number, fy: number): string {
  const hue = Math.min(1, Math.max(0, fx)) * 360
  const lightness = 1 - Math.min(1, Math.max(0, fy))
  return hslToHex(hue, 1, lightness)
}

function updateFromEvent(e: PointerEvent, commit: boolean) {
  const el = gradient.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const fx = (e.clientX - rect.left) / rect.width
  const fy = (e.clientY - rect.top) / rect.height
  hoverMarker.value = { fx, fy }
  const c = colorAtFraction(fx, fy)
  previewColor.value = c
  if (commit) {
    committedMarker.value = { fx, fy }
    customColor.value = c
    selectedColor.value = c
  }
}

/** Synchronise marqueur committé et pastille custom avec selectedColor courante. */
function syncFromSelected() {
  const c = selectedColor.value
  if (!c || baseColors.includes(c.toLowerCase()) || baseColors.includes(c)) {
    committedMarker.value = null
    customColor.value = null
    return
  }
  const hsl = hexToHsl(c)
  if (!hsl) return
  committedMarker.value = { fx: hsl.h / 360, fy: 1 - hsl.l }
  customColor.value = c
}

watch(selectedColor, () => {
  if (!dragging.value) syncFromSelected()
})
onMounted(syncFromSelected)

function onPointerDown(e: PointerEvent) {
  dragging.value = true
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  updateFromEvent(e, false)
  e.preventDefault()
}

function onPointerMove(e: PointerEvent) {
  updateFromEvent(e, false)
}

function onPointerLeave() {
  if (dragging.value) return
  hoverMarker.value = null
  previewColor.value = null
}

function onPointerUp(e: PointerEvent) {
  if (!dragging.value) return
  dragging.value = false
  updateFromEvent(e, true)
  if (selectedColor.value) emit('pick', selectedColor.value)
}

function selectCustom() {
  if (!customColor.value) return
  selectedColor.value = customColor.value
  emit('pick', customColor.value)
}

</script>

<template>
	<div class="color-selector">
		<div class="color-top-row">
			<div class="color-base-row">
				<button
					v-for="color in baseColors"
					:key="color"
					class="color-button"
					:class="{
						active: selectedColor === color,
						disabled: isDisabled(color)
					}"
					:style="{ backgroundColor: color }"
					@click="selectColor(color)"
				/>
				<button
					class="color-button color-button-custom"
					:class="{
						active: !!customColor && selectedColor === customColor,
						empty: !customColor,
						disabled: isDisabled()
					}"
					:style="customColor ? { backgroundColor: customColor } : {}"
					title="Couleur personnalisée"
					@click="selectCustom"
				/>
			</div>

			<div
				class="color-preview"
				:class="{ empty: !previewColor }"
				:style="previewColor ? { backgroundColor: previewColor } : {}"
				title="Aperçu"
			/>
		</div>

		<div
			ref="gradient"
			class="color-gradient"
			:class="{ disabled: isDisabled() }"
			@pointerdown="onPointerDown"
			@pointermove="onPointerMove"
			@pointerup="onPointerUp"
			@pointercancel="onPointerUp"
			@pointerleave="onPointerLeave"
		>
			<div
				v-if="marker"
				class="color-gradient-marker"
				:style="{ left: (marker.fx * 100) + '%', top: (marker.fy * 100) + '%' }"
			/>
		</div>
	</div>
</template>

