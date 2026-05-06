<script lang="ts" setup>
import type {Component} from 'vue'
import {computed, onMounted, onUnmounted, ref, shallowRef, watch} from 'vue'
import {createPinia, getActivePinia, setActivePinia} from 'pinia'
import {Engine} from '@core/Engine'
import type {Adaptable} from '../shapes/Adaptable'
import type {BackgroundState, ToolConfig, ToolType} from '../types'
import NoteTools from '@pi-vue/NoteTools.vue'
import NoteSidebar from '@pi-vue/components/Sidebar/NoteSidebar.vue'
import ToolHint from '@pi-vue/components/ToolHint.vue'
import TextEditDialog from '@pi-vue/components/Widget/TextEditDialog.vue'
import GraphEditDialog from '@pi-vue/components/Widget/GraphEditDialog.vue'
import {useCanvasTransform} from '../composables/useCanvasTransform'
import {useNoteStore} from '../store/useNoteStore'
import PiIcon from '@pi-vue/components/PiIcon.vue'
import {AbstractWidgetShape} from '../shapes/AbstractWidgetShape'

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
    grid: {size: 80, color: '#777777', lineWidth: 1},
    ruled: {spacing: 40, color: '#777777', lineWidth: 1},
  }),
  snapGridSize: 80,
  snapGridEnabled: false,
})

// ── Canvas & transform ───────────────────────────────────────────────────────

const canvasEl = ref<HTMLDivElement | null>(null)
const {transform, zoomIn, zoomOut, resetView, fitView} = useCanvasTransform(canvasEl, {
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

// Mode two-phase (ex: rectangle 3pts) : deux drags successifs
let isPhase1Dragging = false   // premier drag en cours (on trace l'arête)
let isPhase2Ready = false       // entre les deux drags (en attente du 2e pointerdown)

// Déplacement / duplication de shape sélectionnée
let isMovingShape = false
let isDuplicatingShape = false
let movePrevPos = {x: 0, y: 0}

// Pan manuel (outil 'move')
let isPanning = false
let panStart = {x: 0, y: 0}

// Widget dialog générique
const WIDGET_DIALOGS: Partial<Record<ToolType, Component>> = {
  text:  TextEditDialog,
  graph: GraphEditDialog,
}

const isWidgetEditing = ref(false)
const activeWidgetDialogComponent = shallowRef<Component | null>(null)
const _activeWidget = shallowRef<AbstractWidgetShape | null>(null)
const activeWidgetProps = computed(() => _activeWidget.value?.getDialogProps() ?? {})
let _activeWidgetIsNew = true

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convertit les coordonnées client d'un PointerEvent en coordonnées canvas (avec transform) */
function toCanvasCoords(event: PointerEvent): { x: number; y: number } {
  if (!canvasEl.value) return {x: 0, y: 0}
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
  if (isWidgetEditing.value) return

  if (store.tool.tool === 'move') {
    isPanning = true
    panStart = {x: event.clientX - transform.x, y: event.clientY - transform.y}
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

  // Phase 2 : deuxième drag (rectangle 3pts)
  if (isPhase2Ready && currentShape) {
    isPhase2Ready = false
    isDrawing = true
    startTime = Date.now()
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
    toolMode: store.tool.toolModes[store.tool.tool],
  })

  const mode = currentShape.drawingMode ?? 'drag'
  if (mode === 'two-phase') {
    isPhase1Dragging = true
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

  if (isPhase1Dragging || isPhase2Ready || isMultiClickDrawing) {
    engine.value?.updateShape(toCanvasCoords(event).x, toCanvasCoords(event).y)
    return
  }

  if (!isDrawing || !currentShape) {
    const pos = toCanvasCoords(event)
    engine.value?.hoverSnap(pos.x, pos.y, store.tool.tool)
    return
  }

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

  // Fin du premier drag (two-phase) : verrouille l'arête, attend le 2e drag
  if (isPhase1Dragging && currentShape) {
    const pos = toCanvasCoords(event)
    isPhase1Dragging = false
    engine.value?.phaseTransition(pos.x, pos.y)
    isPhase2Ready = true
    return
  }

  if (!isDrawing) {
    engine.value?.clearHoverSnap()
    return
  }
  isDrawing = false
  if (currentShape) {
    // Widget : on n'appelle pas endShape() tout de suite — on ouvre le dialog
    const dialogComp = WIDGET_DIALOGS[currentShape.tool]
    if (dialogComp && currentShape instanceof AbstractWidgetShape) {
      if (!currentShape.hasSufficientSize()) {
        engine.value?.cancelShape()
        currentShape = null
        return
      }
      _activeWidget.value = currentShape
      _activeWidgetIsNew = true
      activeWidgetDialogComponent.value = dialogComp
      isWidgetEditing.value = true
      currentShape = null
      return
    }
    engine.value?.endShape()
    store.syncFromEngine()
    currentShape = null
  }
}

function commitWidget(config: unknown) {
  if (!_activeWidget.value || !engine.value) return
  _activeWidget.value.applyConfig(config)
  if (_activeWidgetIsNew) {
    engine.value.endShape()
    store.syncFromEngine()
  } else {
    engine.value.draw()
    try { engine.value.saveLocal() } catch { /* ignore */ }
  }
  _activeWidget.value = null
  activeWidgetDialogComponent.value = null
  isWidgetEditing.value = false
}

function cancelWidget() {
  if (!engine.value) return
  if (_activeWidgetIsNew) engine.value.cancelShape()
  _activeWidget.value = null
  activeWidgetDialogComponent.value = null
  isWidgetEditing.value = false
}

function onDblClick(event: MouseEvent) {
  if (!engine.value || isWidgetEditing.value) return
  const rect = canvasEl.value!.getBoundingClientRect()
  const x = (event.clientX - rect.left - transform.x) / transform.scale
  const y = (event.clientY - rect.top  - transform.y) / transform.scale
  const id = engine.value.findShapeAt(x, y)
  if (!id) return
  const shape = engine.value.getShapeById(id)
  if (!(shape instanceof AbstractWidgetShape)) return
  const dialogComp = WIDGET_DIALOGS[shape.tool]
  if (!dialogComp) return
  _activeWidget.value = shape
  _activeWidgetIsNew = false
  activeWidgetDialogComponent.value = dialogComp
  isWidgetEditing.value = true
}

// ── Watchers ─────────────────────────────────────────────────────────────────

// Bezier : propagé directement à l'engine
watch(() => store.tool.bezier, (val) => {
  if (engine.value) engine.value.bezier = val
})

// Annule un dessin en cours si l'utilisateur change de mode
watch(() => store.tool.toolModes, () => {
  if (isPhase1Dragging || isPhase2Ready || isMultiClickDrawing) {
    engine.value?.cancelShape()
    isPhase1Dragging = false
    isPhase2Ready = false
    isMultiClickDrawing = false
    isDrawing = false
    currentShape = null
  }
}, { deep: true })

watch(() => store.tool.tool, (newTool) => {
  if (isMultiClickDrawing || isPhase1Dragging || isPhase2Ready) {
    engine.value?.cancelShape()
    isMultiClickDrawing = false
    isPhase1Dragging = false
    isPhase2Ready = false
    currentShape = null
  }
  if (newTool !== 'select' && store.selectedShapeId) {
    store.highlightShape(null)
  }
})

// Remonte le changement d'outil au parent (prop publique de la lib)
watch(() => ({...store.tool}), (val) => {
  emit('tool-change', val)
}, {deep: true})

// Synchronise les props externes vers le store
watch(() => props.background, (bg) => {
  store.setBackground(bg)
  engine.value?.setBackground(bg)
}, {deep: true})

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
      if (isDrawing || isMultiClickDrawing || isPhase1Dragging || isPhase2Ready) {
        engine.value?.cancelShape()
        isDrawing = false
        isMultiClickDrawing = false
        isPhase1Dragging = false
        isPhase2Ready = false
        currentShape = null
      }
    }
  }, {passive: true})

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
    fitView: () => {
      const shapes = engine.value?.shapes ?? []
      const bitmap = engine.value?.referenceBitmap
      if (bitmap) {
        const pdfShape = { getBounds: () => ({ minX: 0, minY: 0, maxX: bitmap.width, maxY: bitmap.height }) }
        fitView([...shapes, pdfShape])
      } else {
        fitView(shapes)
      }
    },
  })
})

onUnmounted(() => {
  engine.value?.destroy()
})

// Expose Engine au parent si nécessaire
defineExpose({engine})
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
			@dblclick.prevent="onDblClick"
			@contextmenu.prevent
		/>

		<!-- Dialog widget (texte, graphe, etc.) -->
		<component
			:is="activeWidgetDialogComponent"
			v-if="isWidgetEditing && activeWidgetDialogComponent"
			:open="isWidgetEditing"
			v-bind="activeWidgetProps"
			@confirm="commitWidget"
			@cancel="cancelWidget"
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
				<div class="mini-panel-row">
					<button
						class="btn"
						:disabled="!store.canUndo"
						title="Annuler"
						@click="store.undo()"
					>
						<PiIcon icon="rotate-left" />
					</button>
					<button
						class="btn"
						:disabled="!store.canRedo"
						title="Rétablir"
						@click="store.redo()"
					>
						<PiIcon icon="rotate-right" />
					</button>
				</div>
				<button
					class="btn mini-open"
					title="Ouvrir le panneau"
					@click="store.sidebarOpen = true"
				>
					<PiIcon icon="chevron-left" />
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

