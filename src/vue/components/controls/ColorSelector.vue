<script setup lang="ts">

import {ToolType} from "../../types"
import {ref, useTemplateRef} from "vue"

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
const marker = ref<{ x: number; y: number } | null>(null)
const dragging = ref(false)
const customColor = ref<string | null>(null)

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

function colorAt(px: number, py: number, w: number, h: number): string {
  const fx = Math.min(1, Math.max(0, px / w))
  const fy = Math.min(1, Math.max(0, py / h))
  const hue = fx * 360
  const lightness = 1 - fy
  return hslToHex(hue, 1, lightness)
}

function updateFromEvent(e: PointerEvent, commit: boolean) {
  const el = gradient.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const px = e.clientX - rect.left
  const py = e.clientY - rect.top
  marker.value = { x: px, y: py }
  const c = colorAt(px, py, rect.width, rect.height)
  customColor.value = c
  if (commit) selectedColor.value = c
}

function onPointerDown(e: PointerEvent) {
  dragging.value = true
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  updateFromEvent(e, true)
  e.preventDefault()
}

function onPointerMove(e: PointerEvent) {
  updateFromEvent(e, dragging.value)
}

function onPointerLeave() {
  if (!dragging.value) marker.value = null
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
				:style="{ left: marker.x + 'px', top: marker.y + 'px' }"
			/>
		</div>
	</div>
</template>

