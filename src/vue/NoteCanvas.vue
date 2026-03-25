<script lang="ts" setup>

import {onMounted, onUnmounted, reactive, ref, shallowRef, watch} from "vue"
import {Engine} from "@core/Engine"
import type {Adaptable} from "../shapes/Adaptable"
import {Stroke} from "../shapes/Stroke"
import type {BackgroundState, LayerName, ToolConfig} from "../types"
import NoteTools from "@pi-vue/NoteTools.vue"
import NoteHistory from "@pi-vue/NoteHistory.vue"
import ZoomControls from "./components/ZoomControls.vue"
import {useCanvasTransform} from "../composables/useCanvasTransform"

const emit = defineEmits<{
  'tool-change': [tool: ToolConfig]
}>()

const props = withDefaults(defineProps<{
  background?: BackgroundState
  snapGridSize?: number
  snapGridEnabled?: boolean
}>(), {
  background: (): BackgroundState => ({ mode: 'ruled', grid: { size: 80 }, ruled: { color: '#777', spacing: 40 } }),
  snapGridSize: 80,
  snapGridEnabled: false
})

const canvas = ref<HTMLDivElement | null>(null)
const {transform, zoomIn, zoomOut, resetView, fitView} = useCanvasTransform(canvas, {
  panButton: 2,
  onTransformChange: () => {
    engine.value?.setViewTransform(transform.x, transform.y, transform.scale)
    engine.value?.draw()
  }
})

const engine = shallowRef<Engine | undefined>(undefined)
let currentShape: Adaptable | null = null

const currentTool = reactive<ToolConfig>({
  layer: "MAIN",
  tool: "pen",
  width: 2,
  color: "black",
  bezier: false
})

const shapes = ref<Adaptable[]>([])
const layers = ref<LayerName[]>([])
const canUndo = ref(false)
const canRedo = ref(false)

function syncShapes() {
  shapes.value = engine.value?.shapes.slice() ?? []
  canUndo.value = engine.value?.canUndo ?? false
  canRedo.value = engine.value?.canRedo ?? false
}
let isDrawing = false
let startTime = 0

// --- Polygon ---
let isPolygonDrawing = false
let lastPolygonClickTime = 0

// --- Rectangle (3 points) ---
let isRectPhase1 = false  // P1 placé, en attente du 2e clic

// --- Déplacement / duplication de shape sélectionné ---
let isMovingShape = false
let isDuplicatingShape = false
let movePrevPos = { x: 0, y: 0 }
let selectedShapeId: string | null = null

// --- Pan manuel (outil 'move') ---
let isPanning = false
let panStart = { x: 0, y: 0 }

// --- Helpers ---
function getPos(event: PointerEvent): { x: number; y: number } {
  if (!canvas.value) return { x: 0, y: 0 }
  const rect = canvas.value.getBoundingClientRect()
  return {
    x: (event.clientX - rect.left - transform.x) / transform.scale,
    y: (event.clientY - rect.top - transform.y) / transform.scale
  }
}

// --- Drawing ---
function startDrawing(event: PointerEvent) {
  if (!event.isPrimary || event.button !== 0) return
  if (!canvas.value || !engine.value) return

  if (currentTool.tool === 'move') {
    isPanning = true
    panStart = { x: event.clientX - transform.x, y: event.clientY - transform.y }
    return
  }

  const pos = getPos(event)

  // Handles de la sélection
  if (selectedShapeId) {
    if (engine.value?.isOverDuplicateHandle(pos.x, pos.y)) {
      isDuplicatingShape = true
      return
    }
    if (engine.value?.isOverMoveHandle(pos.x, pos.y)) {
      isMovingShape = true
      movePrevPos = pos
      return
    }
  }

  // --- Rectangle : clic P1, clic P2 (mousedown) + drag largeur ---
  if (currentTool.tool === 'rectangle') {
    if (!isRectPhase1) {
      // Premier clic : placer P1
      isRectPhase1 = true
      currentShape = engine.value.startShape({
        layer: currentTool.layer,
        color: currentTool.color ?? 'black',
        width: currentTool.width ?? 2,
        tool: 'rectangle',
        x: pos.x,
        y: pos.y
      })
    } else {
      // Deuxième mousedown : placer P2, passer en mode drag
      isRectPhase1 = false
      isDrawing = true
      startTime = Date.now()
      engine.value.setRectP2(pos.x, pos.y)
    }
    return
  }

  // --- Polygon : interaction clic par clic ---
  if (currentTool.tool === 'polygon') {
    if (!isPolygonDrawing) {
      // Premier clic : démarrer le polygone
      isPolygonDrawing = true
      lastPolygonClickTime = Date.now()
      currentShape = engine.value.startShape({
        layer: currentTool.layer,
        color: currentTool.color ?? 'black',
        width: currentTool.width ?? 2,
        tool: 'polygon',
        x: pos.x,
        y: pos.y
      })
      engine.value.addPolygonVertex(pos.x, pos.y)
    } else {
      // Clic suivant : double-clic ou fermeture sur premier sommet
      const now = Date.now()
      const isDoubleClick = (now - lastPolygonClickTime) < 300
      lastPolygonClickTime = now

      if (isDoubleClick) {
        engine.value.endShape()
        isPolygonDrawing = false
        currentShape = null
        syncShapes()
      } else {
        const closed = engine.value.addPolygonVertex(pos.x, pos.y)
        if (closed) {
          engine.value.endShape()
          isPolygonDrawing = false
          currentShape = null
          syncShapes()
        } else {
          engine.value.updateShape(pos.x, pos.y)
        }
      }
    }
    return
  }

  isDrawing = true
  startTime = Date.now()

  currentShape = engine.value.startShape({
    layer: currentTool.layer,
    color: currentTool.color ?? 'black',
    width: currentTool.width ?? 2,
    tool: currentTool.tool,
    createdAt: startTime,
    x: pos.x,
    y: pos.y
  })

  // Stroke : ajouter le premier point (bezier appliqué dans Engine.startShape)
  if (currentShape instanceof Stroke) {
    currentShape.addPoint({ x: pos.x, y: pos.y, t: 0, pressure: 1 })
  }
}

function drawMove(event: PointerEvent) {
  if (!event.isPrimary) return

  if (isPanning) {
    transform.x = event.clientX - panStart.x
    transform.y = event.clientY - panStart.y
    engine.value?.setViewTransform(transform.x, transform.y, transform.scale)
    engine.value?.draw()
    return
  }

  // Déplacement de shape
  if (isMovingShape && selectedShapeId) {
    const pos = getPos(event)
    engine.value?.moveShape(selectedShapeId, pos.x - movePrevPos.x, pos.y - movePrevPos.y)
    movePrevPos = pos
    return
  }

  // Curseur selon proximité des handles
  if (selectedShapeId && canvas.value) {
    const pos = getPos(event)
    if (engine.value?.isOverMoveHandle(pos.x, pos.y)) canvas.value.style.cursor = 'grab'
    else if (engine.value?.isOverDuplicateHandle(pos.x, pos.y)) canvas.value.style.cursor = 'copy'
    else canvas.value.style.cursor = ''
  }

  // Rectangle phase 1 : preview de l'arête
  if (isRectPhase1) {
    const pos = getPos(event)
    engine.value?.updateShape(pos.x, pos.y)
    return
  }

  // Polygon : preview de la ligne vers le curseur
  if (isPolygonDrawing) {
    const pos = getPos(event)
    engine.value?.updateShape(pos.x, pos.y)
    return
  }

  if (!isDrawing || !currentShape) return
  const pos = getPos(event)

  // Stroke points
  if (currentShape instanceof Stroke) {
    const t = Date.now() - startTime
    currentShape.addPoint({ x: pos.x, y: pos.y, t, pressure: 1 })
  }

  // Update shape (Snap automatique)
  engine.value?.updateShape(pos.x, pos.y)
}

function stopDrawing(event: PointerEvent) {
  if (!event.isPrimary) return

  if (isPanning) {
    isPanning = false
    return
  }

  if (isDuplicatingShape) {
    isDuplicatingShape = false
    if (selectedShapeId) {
      const newId = engine.value?.duplicateShape(selectedShapeId) ?? null
      selectedShapeId = newId
    }
    syncShapes()
    return
  }

  if (isMovingShape) {
    isMovingShape = false
    if (canvas.value) canvas.value.style.cursor = ''
    engine.value?.saveLocal()
    syncShapes()
    return
  }

  if (!isDrawing) return
  isDrawing = false

  if (currentShape) {
    engine.value?.endShape()
    syncShapes()
    currentShape = null
  }
}

watch(() => currentTool.bezier, (val) => {
  if (engine.value) engine.value.bezier = val
})

// Annule le polygone / rectangle phase 1 en cours si on change d'outil
watch(() => currentTool.tool, (newTool) => {
  if (isPolygonDrawing && newTool !== 'polygon') {
    engine.value?.cancelShape()
    isPolygonDrawing = false
    currentShape = null
  }
  if (isRectPhase1 && newTool !== 'rectangle') {
    engine.value?.cancelShape()
    isRectPhase1 = false
    currentShape = null
  }
})

// --- Layers & history ---
function onStrokeDestroy(id: string) {
  engine.value?.destroyById(id)
  syncShapes()
}

function onLayerChange(name: LayerName) {
  engine.value?.setLayerVisibility(name, !engine.value.getLayer(name).visible)
}

function onHighlight(id: string | null) {
  selectedShapeId = id
  if (id) engine.value?.highlightShape(id)
  else engine.value?.clearHighlight()
}

function onToggleVisibility(id: string) {
  engine.value?.toggleVisibility(id)
  syncShapes()
}

function onUndo() {
  engine.value?.undo()
  syncShapes()
}

function onRedo() {
  engine.value?.redo()
  syncShapes()
}

// --- Fit to view ---
function onFitView() {
  if (engine.value) fitView(engine.value.shapes)
}

// --- Mounted ---
onMounted(() => {
  if (!canvas.value) return

  // Annule le dessin si un 2e doigt arrive (pinch → pan/zoom)
  canvas.value.addEventListener('touchstart', (e) => {
    if (e.touches.length >= 2) {
      if (isDrawing) {
        engine.value?.cancelShape()
        isDrawing = false
        currentShape = null
      }
      if (isPolygonDrawing) {
        engine.value?.cancelShape()
        isPolygonDrawing = false
        currentShape = null
      }
      if (isRectPhase1) {
        engine.value?.cancelShape()
        isRectPhase1 = false
        currentShape = null
      }
    }
  }, {passive: true})

  engine.value = new Engine(canvas.value)
  engine.value.loadLocal()
  engine.value.bezier = currentTool.bezier

  syncShapes()
  layers.value = engine.value.layers.map(l => l.name as LayerName)

  engine.value.setBackground(props.background)

  engine.value.snapManager.setGridSize(props.snapGridSize)
  engine.value.snapManager.setStrategyEnabled('grid', props.snapGridEnabled)
})

onUnmounted(() => {
  engine.value?.destroy()
})

watch(() => props.background, (bg) => {
  engine.value?.setBackground(bg)
}, { deep: true })

watch(() => props.snapGridSize, (size) => {
  engine.value?.snapManager.setGridSize(size)
})

watch(() => props.snapGridEnabled, (enabled) => {
  engine.value?.snapManager.setStrategyEnabled('grid', enabled)
})

watch(currentTool, (val) => {
  emit('tool-change', { ...val })
}, { deep: true })

// Expose Engine au parent (Vue unwrap automatiquement le shallowRef)
defineExpose({ engine })
</script>

<template>
	<div class="note-canvas-wrapper">
		<div
			ref="canvas"
			class="note-canvas"
			:class="{
				'cursor-grab': currentTool.tool === 'move' && !isPanning,
				'cursor-grabbing': currentTool.tool === 'move' && isPanning
			}"
			@pointerdown.prevent="startDrawing"
			@pointermove.prevent="drawMove"
			@pointerup.prevent="stopDrawing"
			@pointerleave.prevent="stopDrawing"
			@pointercancel="stopDrawing"
			@contextmenu.prevent
		/>

		<note-tools
			v-model="currentTool"
			:layers
		/>
		<note-history
			:shapes="shapes"
			:layers="layers"
			:can-undo="canUndo"
			:can-redo="canRedo"
			@destroy="onStrokeDestroy"
			@layer-change="onLayerChange"
			@highlight="onHighlight"
			@toggle-visibility="onToggleVisibility"
			@undo="onUndo"
			@redo="onRedo"
		/>
		<zoom-controls
			@zoom-in="zoomIn"
			@zoom-out="zoomOut"
			@fit-view="onFitView"
			@reset-view="resetView"
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
  touch-action: none;
}
.note-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.note-canvas.cursor-grab {
  cursor: grab;
}

.note-canvas.cursor-grabbing {
  cursor: grabbing;
}
</style>
