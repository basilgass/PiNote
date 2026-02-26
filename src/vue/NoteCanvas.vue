<template>
  <div class="note-canvas-wrapper" @mousedown.prevent="startDrawing" @mousemove.prevent="drawMove"
    @mouseup.prevent="stopDrawing" @mouseleave.prevent="stopDrawing" @touchstart.prevent="startDrawing"
    @touchmove.prevent="drawMove" @touchend.prevent="stopDrawing">
    <div id="bezierToggle" @click="toggleBezier">{{ bezier ? 'bezier' : 'line' }}</div>
    <canvas ref="canvas" />
  </div>

</template>

<script
  setup
  lang="ts"
>

import { ref, onMounted, reactive } from 'vue'
import { Engine } from '@core/Engine'
import { Stroke } from '@core/Stroke'
import { StrokePoint } from 'src/types';

const props = defineProps<{
  color?: string
  width?: number
}>();

const canvas = ref<HTMLCanvasElement | null>(null)
const dpr = window.devicePixelRatio || 1

let engine: Engine
let currentStroke: Stroke | null = null
const bezier = ref(false)
function toggleBezier() {
  bezier.value = !bezier.value
  engine.bezier = bezier.value

  if (bezier === true) {
    // do something 
  }
}

const isDrawing = ref(false)
const startTime = ref<number>(0)

// Helper pour récupérer la position dans le canvas
function getPos(event: MouseEvent | TouchEvent): { x: number; y: number } {
  const rect = canvas.value!.getBoundingClientRect()
  if ('touches' in event) {
    const touch = event.touches[0]
    return getPosDpr({ x: touch.clientX - rect.left, y: touch.clientY - rect.top }, dpr)
  } else {
    return getPosDpr({ x: event.clientX - rect.left, y: event.clientY - rect.top }, dpr)
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

  currentStroke = new Stroke({
    id: `${Date.now()}`,
    layerId: 'main',
    color: props.color || 'black',
    width: props.width || 2,
    tool: 'pen',
    createdAt: startTime.value
  })

  const pos = getPos(event)
  currentStroke.addPoint({ x: pos.x, y: pos.y, t: 0 })
  engine.startStroke(currentStroke)
}

// Move : ajoute un point
function drawMove(event: MouseEvent | TouchEvent) {
  if (!isDrawing.value || !currentStroke) return
  const pos = getPos(event)
  const t = Date.now() - startTime.value
  const point: StrokePoint = { x: pos.x, y: pos.y, t }
  engine.addPoint(point)
}

// Stop : termine le stroke
function stopDrawing() {
  if (!isDrawing.value) return
  isDrawing.value = false
  if (currentStroke) {
    engine.endStroke()
    currentStroke = null
  }
}

// Expose pour le parent
defineExpose({
  engine
})

onMounted(() => {
  if (!canvas.value) return

  // taille réelle du canvas = taille du container
  const rect = canvas.value.getBoundingClientRect()

  canvas.value.width = rect.width * dpr
  canvas.value.height = rect.height * dpr

  engine = new Engine(canvas.value)
  engine.bezier = true
})
</script>

<style scoped>
.note-canvas-wrapper {
  width: 100%;
  height: 100%;
  background-color: white;
  border: 1px solid #ccc;
  position: relative;
  touch-action: none;
  /* évite le scroll sur mobile */
}

canvas {
  width: 100%;
  height: 100%;
  display: block;
}

#toggleBezier {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 10;
}
</style>