<script lang="ts" setup>
import type {Component} from 'vue'
import {computed, onMounted, onUnmounted, ref, shallowRef, watch} from 'vue'
import {createPinia, getActivePinia, setActivePinia} from 'pinia'
import {Engine} from '@core/Engine'
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

// Déplacement / duplication de shape sélectionnée
let isMovingShape = false
let isDuplicatingShape = false
let movePrevPos = {x: 0, y: 0}

// Pan manuel (outil 'move')
let isPanning = false
let panStart = {x: 0, y: 0}

// ── Long-press tactile sur le 1er point ─────────────────────────────────────
const HOLD_DELAY_MS = 500          // durée de remplissage de l'anneau
const HOLD_VISUAL_DELAY_MS = 200   // délai avant d'afficher l'anneau (évite le flash sur tap court)
const HOLD_TOTAL_MS = HOLD_VISUAL_DELAY_MS + HOLD_DELAY_MS  // 700ms total avant 'adjusting'
const HOLD_TOLERANCE_PX = 6
const HOLD_EXCLUDED_TOOLS = new Set<ToolType>([
  'pen', 'highlighter', 'eraser', 'move', 'select', 'text',
])

type HoldPhase = 'idle' | 'pending' | 'adjusting'
let holdPhase: HoldPhase = 'idle'
let holdTimer: ReturnType<typeof setTimeout> | null = null
let holdVisualTimer: ReturnType<typeof setTimeout> | null = null
let holdStartClient = { x: 0, y: 0 }
let holdStartCanvas = { x: 0, y: 0 }

function isHoldEligible(tool: ToolType): boolean {
  return !HOLD_EXCLUDED_TOOLS.has(tool)
}

function cancelHold() {
  if (holdTimer !== null) {
    clearTimeout(holdTimer)
    holdTimer = null
  }
  if (holdVisualTimer !== null) {
    clearTimeout(holdVisualTimer)
    holdVisualTimer = null
  }
  holdPhase = 'idle'
  engine.value?.clearHoldIndicator()
}

function startNewShape() {
  if (!engine.value) return
  engine.value.beginDraw({
    layer: store.tool.layer,
    color: store.tool.color ?? 'black',
    width: store.tool.width ?? 2,
    tool: store.tool.tool,
    createdAt: Date.now(),
    x: 0,
    y: 0,
    toolMode: store.tool.toolModes[store.tool.tool],
  })
}

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

  // Premier pointerdown d'un dessin : long-press tactile sur le 1er point
  if (!engine.value.currentShape && isHoldEligible(store.tool.tool)) {
    holdPhase = 'pending'
    holdStartClient = { x: event.clientX, y: event.clientY }
    holdStartCanvas = pos
    // L'indicateur visuel n'apparaît qu'après HOLD_VISUAL_DELAY_MS sans bouger,
    // pour éviter le flash sur tap court. Sa durée d'animation est réduite pour
    // qu'il atteigne 100% au même instant que la transition vers 'adjusting'.
    holdVisualTimer = setTimeout(() => {
      holdVisualTimer = null
      if (holdPhase !== 'pending') return
      engine.value!.startHoldIndicator(holdStartCanvas.x, holdStartCanvas.y, HOLD_DELAY_MS)
    }, HOLD_VISUAL_DELAY_MS)
    holdTimer = setTimeout(() => {
      holdTimer = null
      if (holdPhase !== 'pending') return
      holdPhase = 'adjusting'
      engine.value!.completeHoldIndicator()
      engine.value!.hoverSnap(holdStartCanvas.x, holdStartCanvas.y, store.tool.tool)
    }, HOLD_TOTAL_MS)
    return
  }

  // Premier pointerdown d'un dessin (outils exclus du long-press) : crée la shape
  if (!engine.value.currentShape) {
    startNewShape()
  }

  const result = engine.value.pointerDown(pos.x, pos.y)
  if (result === 'closed' || result === 'finished') {
    store.syncFromEngine()
  } else if (result === 'dialog') {
    openWidgetDialog()
  }
}

function openWidgetDialog() {
  if (!engine.value) return
  const shape = engine.value.currentShape
  if (!(shape instanceof AbstractWidgetShape)) return
  const dialogComp = WIDGET_DIALOGS[shape.tool]
  if (!dialogComp) {
    engine.value.cancelDraw()
    return
  }
  _activeWidget.value = shape
  _activeWidgetIsNew = true
  activeWidgetDialogComponent.value = dialogComp
  isWidgetEditing.value = true
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

  // Long-press : phase 'pending' (timer en cours)
  if (holdPhase === 'pending') {
    const dx = event.clientX - holdStartClient.x
    const dy = event.clientY - holdStartClient.y
    if (dx * dx + dy * dy > HOLD_TOLERANCE_PX * HOLD_TOLERANCE_PX) {
      // L'utilisateur a directement entamé un drag : annule le long-press,
      // démarre la shape au point initial et tombe dans le flux pointerMove normal.
      cancelHold()
      startNewShape()
      engine.value!.pointerDown(holdStartCanvas.x, holdStartCanvas.y)
      // Tombe dans le pointerMove normal ci-dessous
    } else {
      return
    }
  }

  // Long-press : phase 'adjusting' (drag pour chercher un snap)
  if (holdPhase === 'adjusting') {
    const pos = toCanvasCoords(event)
    engine.value!.updateHoldIndicator(pos.x, pos.y)
    engine.value!.hoverSnap(pos.x, pos.y, store.tool.tool)
    return
  }

  const pos = toCanvasCoords(event)

  // Curseur selon la proximité des handles, premier/dernier point, ou outil select
  if (canvasEl.value) {
    if (engine.value?.currentShape && engine.value.isOverFirstPoint(pos.x, pos.y)) {
      canvasEl.value.style.cursor = 'pointer'
    } else if (engine.value?.currentShape && engine.value.isOverLastPoint(pos.x, pos.y)) {
      canvasEl.value.style.cursor = 'pointer'
    } else if (store.selectedShapeId && engine.value?.isOverMoveHandle(pos.x, pos.y)) {
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

  if (engine.value?.currentShape) {
    engine.value.pointerMove(pos.x, pos.y)
    return
  }

  engine.value?.hoverSnap(pos.x, pos.y, store.tool.tool)
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

  // Long-press : tap court (relâché avant 500ms sans bouger)
  if (holdPhase === 'pending') {
    cancelHold()
    const pos = toCanvasCoords(event)
    startNewShape()
    engine.value!.pointerDown(pos.x, pos.y)
    const status = engine.value!.pointerUp(pos.x, pos.y)
    if (status === 'finished') store.syncFromEngine()
    else if (status === 'dialog') openWidgetDialog()
    return
  }

  // Long-press : commit du 1er point à la position snappée (ou brute)
  if (holdPhase === 'adjusting') {
    const pos = toCanvasCoords(event)
    const snapped = engine.value!.resolveSnap(pos.x, pos.y, store.tool.tool) ?? pos
    cancelHold()
    startNewShape()
    engine.value!.pointerDown(snapped.x, snapped.y)
    const status = engine.value!.pointerUp(snapped.x, snapped.y)
    if (status === 'finished') store.syncFromEngine()
    else if (status === 'dialog') openWidgetDialog()
    return
  }

  if (!engine.value?.currentShape) {
    engine.value?.clearHoverSnap()
    return
  }

  const pos = toCanvasCoords(event)
  const status = engine.value.pointerUp(pos.x, pos.y)
  if (status === 'finished') {
    store.syncFromEngine()
  } else if (status === 'dialog') {
    openWidgetDialog()
  }
  // 'continue' : la FSM attend d'autres clics (polygone, multi-points)
}

function commitWidget(config: unknown) {
  if (!_activeWidget.value || !engine.value) return
  _activeWidget.value.applyConfig(config)
  if (_activeWidgetIsNew) {
    engine.value.finalizeWidget()
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
  if (_activeWidgetIsNew) engine.value.cancelDraw()
  _activeWidget.value = null
  activeWidgetDialogComponent.value = null
  isWidgetEditing.value = false
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (holdPhase !== 'idle') cancelHold()
    if (engine.value?.currentShape) engine.value.cancelDraw()
  }
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
  if (engine.value?.currentShape) engine.value.cancelDraw()
}, { deep: true })

watch(() => store.tool.tool, (newTool) => {
  if (holdPhase !== 'idle') cancelHold()
  if (engine.value?.currentShape) engine.value.cancelDraw()
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
      if (holdPhase !== 'idle') cancelHold()
      if (engine.value?.currentShape) engine.value.cancelDraw()
    }
  }, {passive: true})

  window.addEventListener('keydown', onKeyDown)

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
  window.removeEventListener('keydown', onKeyDown)
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

