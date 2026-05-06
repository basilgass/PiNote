<script lang="ts" setup>
import {onMounted, onUnmounted, ref} from 'vue'
import {createPinia, getActivePinia, setActivePinia} from 'pinia'
import {Engine} from '@core/Engine'
import {useCanvasTransform} from '../composables/useCanvasTransform'
import {useNoteStore} from '../store/useNoteStore'
import ZoomControls from './components/ZoomControls.vue'

if (!getActivePinia()) setActivePinia(createPinia())
const store = useNoteStore()

const canvasEl = ref<HTMLDivElement | null>(null)
let engine: Engine | null = null

const {transform, zoomIn, zoomOut, resetView, fitView} = useCanvasTransform(canvasEl, {
    onTransformChange: () => {
        engine?.setViewTransform(transform.x, transform.y, transform.scale)
        engine?.draw()
    },
})

function onFitView() {
    if (engine) fitView(engine.shapes)
}

onMounted(() => {
    if (!canvasEl.value) return

    const pageId = localStorage.getItem('pi_note_current') ?? 'default'
    engine = new Engine(canvasEl.value)
    engine.setPageId(pageId)
    engine.loadLocal()

    store.registerZoom({zoomIn, zoomOut, resetView, fitView: onFitView})
    onFitView()
})

onUnmounted(() => {
    store.registerZoom(null)
    engine?.destroy()
    engine = null
})
</script>

<template>
	<div class="preview-wrapper">
		<div
			ref="canvasEl"
			class="preview-canvas"
		/>
		<zoom-controls class="zoom-controls" />
	</div>
</template>
