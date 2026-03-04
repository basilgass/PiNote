<script
    lang="ts"
    setup
>

import {onMounted, reactive, ref} from 'vue'
import {Engine} from '@core/Engine'
import {Drawable, StrokePoint, ToolConfig} from 'src/types'
import NoteTools from "@pi-vue/NoteTools.vue"
import NoteHistory from "@pi-vue/NoteHistory.vue"
import {Stroke} from "@core/drawable/Stroke"

const canvas = ref<HTMLDivElement | null>(null)
const dpr = window.devicePixelRatio || 1

let engine: Engine
let currentShape: Drawable | null = null

const currentTool = reactive<ToolConfig>({
  layer: "MAIN",
  tool: "pen",
  width: 2,
  color: "black"
})

const bezier = ref(false)

const shapes = ref<Drawable[]>([])
const layers = ref<string[]>([])

function toggleBezier() {
  bezier.value = !bezier.value
  engine.bezier = bezier.value
}

const isDrawing = ref(false)
const startTime = ref<number>(0)

// Helper pour récupérer la position dans le canvas
function getPos(event: MouseEvent | TouchEvent): { x: number; y: number } {
  const rect = canvas.value!.getBoundingClientRect()
  if ('touches' in event) {
    const touch = event.touches[0]
    return getPosDpr({x: touch.clientX - rect.left, y: touch.clientY - rect.top}, dpr)
  } else {
    return getPosDpr({x: event.clientX - rect.left, y: event.clientY - rect.top}, dpr)
  }
}

function getPosDpr(pos: { x: number, y: number }, dpr: number): { x: number, y: number } {
  return {
    x: pos.x * dpr,
    y: pos.y * dpr
  }
}

// Start d’un stroke
function startDrawing(event: MouseEvent | TouchEvent) {
  if (!canvas.value) return
  if (!engine) engine = new Engine(canvas.value)

  isDrawing.value = true
  startTime.value = Date.now()

  const pos = getPos(event)

  currentShape = engine.startShape({
    id: `${Date.now()}`,
    layer: currentTool.layer,
    color: currentTool.color || 'black',
    width: currentTool.width || 2,
    tool: currentTool.tool,
    createdAt: startTime.value,
    x: pos.x,
    y: pos.y
  })

  // Si c'est un Stroke, ajouter le premier point
  if (currentShape instanceof Stroke) {
    currentShape.addPoint({ x: pos.x, y: pos.y, t: 0, pressure: 1 })
  }
}

// Move : ajoute un point
function drawMove(event: MouseEvent | TouchEvent) {
  if (!isDrawing.value || !currentShape) return

  const pos = getPos(event)

  // Pour Stroke, le temps et la pression restent pertinents
  if (currentShape instanceof Stroke) {
    const t = Date.now() - startTime.value
    const point: StrokePoint = { x: pos.x, y: pos.y, t, pressure: 1 }
    engine.updateShape(pos.x, pos.y) // Stroke implémente updateShape via addPoint
  } else {
    // Line / Circle / Rectangle
    engine.updateShape(pos.x, pos.y)
  }
}

function stopDrawing() {
  if (!isDrawing.value) return

  isDrawing.value = false

  if (currentShape) {
    engine.endShape()

    shapes.value = engine.shapes.slice()
    currentShape = null
  }
}

// Expose pour le parent
defineExpose({
  engine
})

onMounted(() => {
  if (!canvas.value) return

  engine = new Engine(canvas.value)

  engine.bezier = true

  shapes.value = engine.shapes
  layers.value = engine.layers.map(x => x.name)

  // engine.setBackground({
  //   mode: 'grid',
  //   grid: {
  //     size: 30
  //   }
  // })

  // engine.setBackground({
  //   mode: 'ruled',
  //   ruled: {
  //     spacing: 50,
  //   }
  // })

  engine.setBackground({
    mode: 'axes',
    axes: {
      tickSize: 50
    }
  })
})

function onStrokeDestroy(index: number) {
  engine.destroyStroke(index, 1)
  shapes.value = engine.shapes.slice()
  engine.draw()
}

function onLayerChange(name: string) {
  const layer = engine.getLayer(name)
  layer.visible = !layer.visible
}

</script>

<template>
	<div
		class="note-canvas-wrapper"
	>
		<div
			ref="canvas"
			class="note-canvas"
			@pointerdown.prevent="startDrawing"
			@pointermove.prevent="drawMove"
			@pointerup.prevent="stopDrawing"
			@pointerleave.prevent="stopDrawing"
		/>

		<div
			id="bezierToggle"
			style="position: fixed;top:0;left:0;z-index: 100"
			@click="toggleBezier"
		>
			{{ bezier ? 'bezier' : 'line' }} - {{ currentTool.tool }} - {{ currentTool.width }} - {{ currentTool.color }} -
			{{ shapes.length }}
		</div>
		<note-tools
			v-model="currentTool"
			:layers
		/>
		<note-history
			:shapes
			:layers
			style="position: fixed; right:0;bottom:0; z-index: 20"
			@destroy="onStrokeDestroy"
			@layer-change="onLayerChange"
		/>
	</div>
</template>

<style scoped>
.note-canvas-wrapper {
  width: 100%;
  height: 100%;
  background-color: white;
  border: 1px solid #ccc;
  position: relative;
  /* évite le scroll sur mobile */
  touch-action: none;
}

.note-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

</style>