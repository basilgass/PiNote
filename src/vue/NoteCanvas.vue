<script lang="ts" setup>
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { createPinia, getActivePinia, setActivePinia } from 'pinia'
import { Engine } from '@core/Engine'
import type { Adaptable } from '../shapes/Adaptable'
import type { BackgroundState, ToolConfig } from '../types'
import NoteTools from '@pi-vue/NoteTools.vue'
import NoteSidebar from '@pi-vue/components/NoteSidebar.vue'
import ToolHint from '@pi-vue/components/ToolHint.vue'
import { useCanvasTransform } from '../composables/useCanvasTransform'
import { useNoteStore } from '../store/useNoteStore'

// ── Initialisation Pinia (library-safe) ─────────────────────────────────────
if (!getActivePinia()) setActivePinia(createPinia())
const store = useNoteStore()

// ── Props & emits ────────────────────────────────────────────────────────────

const emit = defineEmits<{
  'tool-change': [tool: ToolConfig]
}>()

const props = withDefaults(defineProps<{
  background?: BackgroundState
  snapGridSize?: number
  snapGridEnabled?: boolean
}>(), {
  background: (): BackgroundState => ({
    mode: 'none',
    grid: { size: 80, color: '#777777', lineWidth: 1 },
    ruled: { spacing: 40, color: '#777777', lineWidth: 1 },
  }),
  snapGridSize: 80,
  snapGridEnabled: false,
})

// ── Canvas & transform ───────────────────────────────────────────────────────

const canvasEl = ref<HTMLDivElement | null>(null)
const { transform, zoomIn, zoomOut, resetView, fitView } = useCanvasTransform(canvasEl, {
  panButton: 2,
  onTransformChange: () => {
    store.engine?.setViewTransform(transform.x, transform.y, transform.scale)
    store.engine?.draw()
  },
  canPan: () => store.tool.tool === 'move',
})

// ── État de dessin (local — ne concerne pas l'UI des panels) ─────────────────

const engine = shallowRef<Engine | undefined>(undefined)
let currentShape: Adaptable | null = null
let isDrawing = false
let startTime = 0

// Mode multi-click (ex: polygone) : clics successifs pour ajouter des sommets
let isMultiClickDrawing = false
let lastClickTime = 0

// Mode two-phase (ex: rectangle) : 1er clic = phase 1 (arête), 2e clic = phase 2 (largeur)
let isPhase1Active = false

// Déplacement / duplication de shape sélectionnée
let isMovingShape = false
let isDuplicatingShape = false
let movePrevPos = { x: 0, y: 0 }

// Pan manuel (outil 'move')
let isPanning = false
let panStart = { x: 0, y: 0 }

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convertit les coordonnées client d'un PointerEvent en coordonnées canvas (avec transform) */
function toCanvasCoords(event: PointerEvent): { x: number; y: number } {
  if (!canvasEl.value) return { x: 0, y: 0 }
  const rect = canvasEl.value.getBoundingClientRect()
  return {
    x: (event.clientX - rect.left - transform.x) / transform.scale,
    y: (event.clientY - rect.top - transform.y) / transform.scale,
  }
}

// ── Logique de dessin ────────────────────────────────────────────────────────

function onPointerDown(event: PointerEvent) {
  if (!event.isPrimary || event.button !== 0) return
  if (!canvasEl.value || !engine.value) return

  if (store.tool.tool === 'move') {
    isPanning = true
    panStart = { x: event.clientX - transform.x, y: event.clientY - transform.y }
    return
  }

  const pos = toCanvasCoords(event)

  // Handles de la shape sélectionnée (supprimer / dupliquer / déplacer)
  if (store.selectedShapeId) {
    if (engine.value.isOverDeleteHandle(pos.x, pos.y)) {
      store.destroyShape(store.selectedShapeId)
      return
    }
    if (engine.value.isOverDuplicateHandle(pos.x, pos.y)) {
      isDuplicatingShape = true
      return
    }
    if (engine.value.isOverMoveHandle(pos.x, pos.y)) {
      isMovingShape = true
      movePrevPos = pos
      return
    }
  }

  // Outil select : clic pour sélectionner ou commencer un déplacement
  if (store.tool.tool === 'select') {
    const id = engine.value.findShapeAt(pos.x, pos.y)
    if (id && id === store.selectedShapeId) {
      isMovingShape = true
      movePrevPos = pos
    } else if (id) {
      store.highlightShape(id)
    } else {
      store.highlightShape(null)
    }
    return
  }

  // Transition phase 1 → phase 2 (ex: rectangle 2e clic)
  if (isPhase1Active && currentShape) {
    isPhase1Active = false
    isDrawing = true
    startTime = Date.now()
    engine.value.phaseTransition(pos.x, pos.y)
    return
  }

  // Continuation d'un dessin multi-click (ex: polygone)
  if (isMultiClickDrawing && currentShape) {
    const now = Date.now()
    const isDoubleClick = (currentShape.doubleClickTimeout !== undefined)
      && (now - lastClickTime < currentShape.doubleClickTimeout)
    lastClickTime = now

    if (isDoubleClick) {
      engine.value.endShape()
      isMultiClickDrawing = false
      currentShape = null
      store.syncFromEngine()
    } else {
      const result = engine.value.handleDrawClick(pos.x, pos.y)
      if (result === 'done') {
        engine.value.endShape()
        isMultiClickDrawing = false
        currentShape = null
        store.syncFromEngine()
      } else {
        engine.value.updateShape(pos.x, pos.y)
      }
    }
    return
  }

  // Démarrage d'un nouveau dessin
  startTime = Date.now()
  currentShape = engine.value.startShape({
    layer: store.tool.layer,
    color: store.tool.color ?? 'black',
    width: store.tool.width ?? 2,
    tool: store.tool.tool,
    createdAt: startTime,
    x: pos.x,
    y: pos.y,
  })

  const mode = currentShape.drawingMode ?? 'drag'
  if (mode === 'two-phase') {
    isPhase1Active = true
  } else if (mode === 'multi-click') {
    isMultiClickDrawing = true
    lastClickTime = Date.now()
  } else {
    isDrawing = true
  }

  currentShape.onDrawPoint?.(pos.x, pos.y, 0)
}

function onPointerMove(event: PointerEvent) {
  if (!event.isPrimary) return

  if (isPanning) {
    transform.x = event.clientX - panStart.x
    transform.y = event.clientY - panStart.y
    engine.value?.setViewTransform(transform.x, transform.y, transform.scale)
    engine.value?.draw()
    return
  }

  if (isMovingShape && store.selectedShapeId) {
    const pos = toCanvasCoords(event)
    engine.value?.moveShape(store.selectedShapeId, pos.x - movePrevPos.x, pos.y - movePrevPos.y)
    movePrevPos = pos
    return
  }

  // Curseur selon la proximité des handles ou de l'outil select
  if (canvasEl.value) {
    const pos = toCanvasCoords(event)
    if (store.selectedShapeId && engine.value?.isOverMoveHandle(pos.x, pos.y)) {
      canvasEl.value.style.cursor = 'grab'
    } else if (store.selectedShapeId && engine.value?.isOverDeleteHandle(pos.x, pos.y)) {
      canvasEl.value.style.cursor = 'not-allowed'
    } else if (store.selectedShapeId && engine.value?.isOverDuplicateHandle(pos.x, pos.y)) {
      canvasEl.value.style.cursor = 'copy'
    } else if (store.tool.tool === 'select') {
      canvasEl.value.style.cursor = engine.value?.findShapeAt(pos.x, pos.y) ? 'pointer' : ''
    } else {
      canvasEl.value.style.cursor = ''
    }
  }

  if (isPhase1Active || isMultiClickDrawing) {
    engine.value?.updateShape(toCanvasCoords(event).x, toCanvasCoords(event).y)
    return
  }

  if (!isDrawing || !currentShape) return

  const pos = toCanvasCoords(event)
  currentShape.onDrawPoint?.(pos.x, pos.y, Date.now() - startTime)
  engine.value?.updateShape(pos.x, pos.y)
}

function onPointerUp(event: PointerEvent) {
  if (!event.isPrimary) return

  if (isPanning) {
    isPanning = false
    return
  }

  if (isDuplicatingShape) {
    isDuplicatingShape = false
    if (store.selectedShapeId) {
      const newId = engine.value?.duplicateShape(store.selectedShapeId) ?? null
      store.selectedShapeId = newId
    }
    store.syncFromEngine()
    return
  }

  if (isMovingShape) {
    isMovingShape = false
    if (canvasEl.value) canvasEl.value.style.cursor = ''
    engine.value?.saveLocal()
    store.syncFromEngine()
    return
  }

  if (!isDrawing) return
  isDrawing = false
  if (currentShape) {
    engine.value?.endShape()
    store.syncFromEngine()
    currentShape = null
  }
}

// ── Watchers ─────────────────────────────────────────────────────────────────

// Bezier : propagé directement à l'engine
watch(() => store.tool.bezier, (val) => {
  if (engine.value) engine.value.bezier = val
})

// Annule un dessin en cours si l'utilisateur change d'outil
watch(() => store.tool.tool, (newTool) => {
  if (isMultiClickDrawing || isPhase1Active) {
    engine.value?.cancelShape()
    isMultiClickDrawing = false
    isPhase1Active = false
    currentShape = null
  }
  if (newTool !== 'select' && store.selectedShapeId) {
    store.highlightShape(null)
  }
})

// Remonte le changement d'outil au parent (prop publique de la lib)
watch(() => ({ ...store.tool }), (val) => {
  emit('tool-change', val)
}, { deep: true })

// Synchronise les props externes vers le store
watch(() => props.background, (bg) => {
  store.setBackground(bg)
  engine.value?.setBackground(bg)
}, { deep: true })

watch(() => props.snapGridSize, (size) => {
  store.snapGrid.size = size
  if (engine.value) engine.value.snapGridSize = size
})

watch(() => props.snapGridEnabled, (enabled) => {
  store.snapGrid.enabled = enabled
  if (engine.value) engine.value.snapGridEnabled = enabled
})

// ── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
  if (!canvasEl.value) return

  // Annule tout dessin en cours si un 2e doigt arrive (pinch → zoom)
  canvasEl.value.addEventListener('touchstart', (e) => {
    if (e.touches.length >= 2) {
      if (isDrawing || isMultiClickDrawing || isPhase1Active) {
        engine.value?.cancelShape()
        isDrawing = false
        isMultiClickDrawing = false
        isPhase1Active = false
        currentShape = null
      }
    }
  }, { passive: true })

  // Initialise l'engine avec les props
  engine.value = new Engine(canvasEl.value, props.background)
  engine.value.bezier = store.tool.bezier
  engine.value.snapGridEnabled = props.snapGridEnabled
  engine.value.snapGridSize = props.snapGridSize

  // Donne l'engine au store, puis initialise la session multi-page
  store.engine = engine.value
  store.initSession()

  store.title = engine.value.title
  store.backgroundState = engine.value.backgroundState
  store.snapGrid.enabled = props.snapGridEnabled
  store.snapGrid.size = props.snapGridSize
  store.layers = engine.value.layers.map(l => l.name as import('../types').LayerName)
  store.syncFromEngine()

  // Enregistre les fonctions de zoom dans le store
  store.registerZoom({
    zoomIn,
    zoomOut,
    resetView,
    fitView: () => fitView(engine.value?.shapes ?? []),
  })
})

onUnmounted(() => {
  engine.value?.destroy()
})

// Expose Engine au parent si nécessaire
defineExpose({ engine })
</script>

<template>
	<div class="note-canvas-wrapper">
		<!-- Zone de dessin -->
		<div
			ref="canvasEl"
			class="note-canvas"
			:class="{
				'cursor-grab': store.tool.tool === 'move' && !isPanning,
				'cursor-grabbing': store.tool.tool === 'move' && isPanning,
			}"
			@pointerdown.prevent="onPointerDown"
			@pointermove.prevent="onPointerMove"
			@pointerup.prevent="onPointerUp"
			@pointerleave.prevent="onPointerUp"
			@pointercancel="onPointerUp"
			@contextmenu.prevent
		/>

		<!-- Indication contextuelle de l'outil actif -->
		<tool-hint />

		<!-- Barre d'outils -->
		<note-tools />

		<!-- Mini panel quand sidebar fermé -->
		<transition name="mini">
			<div
				v-if="!store.sidebarOpen"
				class="mini-panel"
			>
				<button
					class="btn"
					:disabled="!store.canUndo"
					title="Annuler"
					@click="store.undo()"
				>
					↩
				</button>
				<button
					class="btn"
					:disabled="!store.canRedo"
					title="Rétablir"
					@click="store.redo()"
				>
					↪
				</button>
				<button
					class="btn mini-open"
					title="Ouvrir le panneau"
					@click="store.sidebarOpen = true"
				>
					›
				</button>
			</div>
		</transition>

		<!-- Mini panel zoom quand sidebar fermé -->
			<transition name="mini-zoom">
				<div
					v-if="!store.sidebarOpen"
					class="mini-panel mini-panel-zoom"
				>
					<button
						class="btn"
						title="Zoom +"
						@click="store.zoomIn()"
					>
						+
					</button>
					<button
						class="btn"
						title="Zoom −"
						@click="store.zoomOut()"
					>
						−
					</button>
					<button
						class="btn"
						title="Tout afficher"
						@click="store.fitView()"
					>
						⤢
					</button>
					<button
						class="btn"
						title="Réinitialiser"
						@click="store.resetView()"
					>
						⊙
					</button>
				</div>
			</transition>

			<!-- Sidebar -->
			<div
			class="sidebar-wrapper"
			:class="{ closed: !store.sidebarOpen }"
		>
			<note-sidebar />
		</div>
	</div>
</template>

