<script lang="ts" setup>
import {onMounted, onUnmounted, ref} from 'vue'
import {ShapeFactory} from '../core/ShapeFactory'
import type {Adaptable} from '../shapes/Adaptable'
import type {LayerName} from '../types'
import {useCanvasTransform} from '../composables/useCanvasTransform'
import ZoomControls from './components/ZoomControls.vue'

const LOCAL_STORAGE_KEY = 'pi_note_draft'
const LAYER_ORDER: LayerName[] = ['BACKGROUND', 'MAIN', 'LAYER']

const canvasRef = ref<HTMLCanvasElement | null>(null)
const shapes = ref<Adaptable[]>([])

const {transform, zoomIn, zoomOut, resetView, fitView} = useCanvasTransform(canvasRef, {
    onTransformChange: render
})

let resizeObserver: ResizeObserver | null = null

// ---- Chargement ----
function loadShapes() {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return
    try {
        const parsed = JSON.parse(raw)
        shapes.value = parsed
            .map((s: any) => ShapeFactory.fromJSON(s))
            .filter((s: any): s is Adaptable => s !== null)
    } catch { /* données invalides */ }
}

// ---- Rendu ----
function render() {
    const canvas = canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.translate(transform.x, transform.y)
    ctx.scale(transform.scale, transform.scale)

    const byLayer = new Map<LayerName, Adaptable[]>()
    for (const shape of shapes.value) {
        if (!shape.layer) continue
        const arr = byLayer.get(shape.layer)
        if (arr) arr.push(shape)
        else byLayer.set(shape.layer, [shape])
    }
    for (const name of LAYER_ORDER) {
        const list = byLayer.get(name)
        if (list) for (const shape of list) shape.draw(ctx)
    }

    ctx.restore()
}

// ---- Fit to view ----
function onFitView() {
    fitView(shapes.value)
}

// ---- Lifecycle ----
onMounted(() => {
    const canvas = canvasRef.value!
    canvas.width = canvas.offsetWidth || 300
    canvas.height = canvas.offsetHeight || 300

    resizeObserver = new ResizeObserver(() => {
        canvas.width = canvas.offsetWidth
        canvas.height = canvas.offsetHeight
        render()
    })
    resizeObserver.observe(canvas)

    loadShapes()
    onFitView()
})

onUnmounted(() => {
    resizeObserver?.disconnect()
})
</script>

<template>
	<div class="preview-wrapper">
		<canvas ref="canvasRef" />
		<zoom-controls
			@zoom-in="zoomIn"
			@zoom-out="zoomOut"
			@fit-view="onFitView"
			@reset-view="resetView"
		/>
	</div>
</template>

