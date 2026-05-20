<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, reactive, ref} from 'vue'
import ToolSelector from '@pi-vue/components/controls/ToolSelector.vue'
import ColorSelector from '@pi-vue/components/controls/ColorSelector.vue'
import WidthSelector from '@pi-vue/components/controls/WidthSelector.vue'
import {useNoteStore} from '../store/useNoteStore'
import type {LayerName, ToolType} from '../types'
import PiIcon from '@pi-vue/components/PiIcon.vue'
import ZoomControls from '@pi-vue/components/ZoomControls.vue'
import Popover from '@pi-vue/components/Popover.vue'

const store = useNoteStore()

// ── Onglets ──────────────────────────────────────────────────────────────────

type Tab = 'drawing' | 'widgets'
const activeTab = ref<Tab>('drawing')

const drawingMeta: ToolType[] = ['select', 'move', 'eraser']
const drawingMain: ToolType[] = ['pen', 'highlighter', 'line', 'segment', 'vector', 'circle', 'rectangle', 'polygon', 'arc']
const widgetsMeta: ToolType[] = ['select', 'move']
const widgetsMain: ToolType[] = ['text', 'graph']

const tabs: { id: Tab; label: string; icon: string }[] = [
	{id: 'drawing', label: 'Dessin',  icon: 'pen-nib'},
	{id: 'widgets', label: 'Widgets', icon: 'tool-graph'},
]

const metaTools = computed<ToolType[]>(() => activeTab.value === 'drawing' ? drawingMeta : widgetsMeta)
const mainTools = computed<ToolType[]>(() => activeTab.value === 'drawing' ? drawingMain : widgetsMain)
const currentTools = computed<ToolType[]>(() => [...metaTools.value, ...mainTools.value])

function selectTab(tab: Tab) {
	activeTab.value = tab
	if (!currentTools.value.includes(store.tool.tool)) {
		store.selectTool(currentTools.value[0])
	}
}

// ── Détection mobile / tactile ────────────────────────────────────────────────

const isMobile = ref(false)

function updateMobile() {
	isMobile.value = window.matchMedia('(max-width: 600px)').matches
}

onMounted(() => {
	updateMobile()
	window.addEventListener('resize', updateMobile)
})
onBeforeUnmount(() => window.removeEventListener('resize', updateMobile))

const MOBILE_VISIBLE_MAIN = 2

const visibleMainTools = computed<ToolType[]>(() => {
	if (isMobile.value && mainTools.value.length > MOBILE_VISIBLE_MAIN) {
		return mainTools.value.slice(0, MOBILE_VISIBLE_MAIN)
	}
	return mainTools.value
})

const overflowTools = computed<ToolType[]>(() => {
	if (isMobile.value && mainTools.value.length > MOBILE_VISIBLE_MAIN) {
		return mainTools.value.slice(MOBILE_VISIBLE_MAIN)
	}
	return []
})

// ── Popovers ─────────────────────────────────────────────────────────────────

type PopoverName = 'color' | 'width' | 'layer' | 'zoom' | 'clear' | 'moreTools'

const popover = reactive<Record<PopoverName, boolean>>({
	color: false, width: false, layer: false,
	zoom: false, clear: false, moreTools: false,
})

function openPopover(name: PopoverName) {
	for (const k of Object.keys(popover) as PopoverName[]) {
		popover[k] = (k === name)
	}
}

// ── Couleurs : deux slots (global + dynamique) ───────────────────────────────

const globalColor = computed(() => store.primaryColor)
const dynamicColor = computed(() => store.toolMemory[store.tool.tool].color)

function onColorChipClick(slot: 'global' | 'dynamic') {
	if (store.activeColorSlot === slot) {
		openPopover('color')
	} else {
		store.setActiveColorSlot(slot)
	}
}

const colorPopoverTitle = computed(() =>
	store.activeColorSlot === 'global' ? 'Couleur globale' : "Couleur de l'outil"
)

function onColorChange(v: string | undefined) {
	if (v === undefined) return
	store.setToolColor(v)
}

function onColorPick(v: string) {
	store.setToolColor(v)
	popover.color = false
}

function onWidthPick(v: number | undefined) {
	if (v === undefined) return
	store.setToolWidth(v)
	// Pas d'auto-close : le slider serait inutilisable.
}

function onLayerPick(v: LayerName | null) {
	store.tool.layer = v
	popover.layer = false
}

const layerOptions: { value: LayerName | null; letter: string; label: string }[] = [
	{value: null,    letter: 'T', label: 'Calque temporaire'},
	{value: 'LAYER', letter: 'L', label: 'Calque secondaire'},
	{value: 'MAIN',  letter: 'M', label: 'Calque principal'},
]

function onToolPick(tool: ToolType) {
	store.selectTool(tool)
	popover.moreTools = false
}

// ── Confirmation effacement ──────────────────────────────────────────────────

function confirmClear() {
	store.clearAll()
	popover.clear = false
}

// ── Pastilles : représentation visuelle de l'état courant ────────────────────

const widthDotPx = computed(() => {
	const w = store.tool.width || 2
	return Math.max(2, Math.min(8, w / 3))
})

const layerLabel = computed(() => {
	const l = store.tool.layer
	if (l === null || l === undefined) return 'T'
	return l[0]
})
</script>

<template>
	<div class="note-tools">
		<!-- Rangée du haut : onglets + pastilles d'état + actions -->
		<div class="nt-row nt-row-top">
			<button
				v-for="t in tabs"
				:key="t.id"
				class="nt-tab"
				:class="{ active: activeTab === t.id }"
				:title="t.label"
				@click="selectTab(t.id)"
			>
				<PiIcon :icon="t.icon" />
				<span class="nt-tab-label">{{ t.label }}</span>
			</button>

			<div class="nt-spacer" />

			<button
				class="nt-chip nt-chip-color"
				:class="{ active: store.activeColorSlot === 'global' }"
				title="Couleur globale"
				@click="onColorChipClick('global')"
			>
				<span
					class="nt-chip-color-dot"
					:style="{ background: globalColor }"
				/>
			</button>

			<button
				class="nt-chip nt-chip-color"
				:class="{ active: store.activeColorSlot === 'dynamic' }"
				title="Couleur de l'outil"
				@click="onColorChipClick('dynamic')"
			>
				<span
					class="nt-chip-color-dot"
					:style="{ background: dynamicColor }"
				/>
			</button>

			<button
				class="nt-chip"
				title="Épaisseur"
				@click="openPopover('width')"
			>
				<span
					class="nt-chip-width-dot"
					:style="{ width: widthDotPx + 'px', height: widthDotPx + 'px' }"
				/>
			</button>

			<button
				class="nt-chip nt-chip-layer"
				title="Calque"
				@click="openPopover('layer')"
			>
				{{ layerLabel }}
			</button>

			<!-- Zoom : inline desktop, popover mobile -->
			<ZoomControls class="nt-zoom-inline" />
			<button
				class="nt-chip nt-chip-zoom-mobile"
				title="Zoom"
				@click="openPopover('zoom')"
			>
				<PiIcon icon="magnifying-glass-plus" />
			</button>

			<button
				class="nt-chip nt-chip-trash"
				title="Tout effacer"
				@click="openPopover('clear')"
			>
				<PiIcon icon="trash-can" />
			</button>
		</div>

		<!-- Rangée du bas : outils de l'onglet actif -->
		<div class="nt-row nt-row-tools">
			<ToolSelector
				class="nt-tools-meta"
				:tools="metaTools"
			/>
			<div class="nt-tools-divider" />
			<ToolSelector
				class="nt-tools-main"
				:tools="visibleMainTools"
			/>
			<button
				v-if="overflowTools.length > 0"
				class="nt-chip nt-chip-more"
				title="Plus d'outils"
				@click="openPopover('moreTools')"
			>
				…
			</button>
		</div>
	</div>

	<!-- POPOVERS -->

	<Popover
		v-model="popover.color"
		:title="colorPopoverTitle"
	>
		<ColorSelector
			:model-value="store.tool.color"
			:tool="store.tool.tool"
			@update:model-value="onColorChange"
			@pick="onColorPick"
		/>
	</Popover>

	<Popover
		v-model="popover.width"
		title="Épaisseur"
	>
		<WidthSelector
			:model-value="store.tool.width"
			:tool="store.tool.tool"
			:color="store.tool.color"
			:show-slider="true"
			@update:model-value="onWidthPick"
		/>
	</Popover>

	<Popover
		v-model="popover.layer"
		title="Calque"
	>
		<div class="nt-layer-list">
			<button
				v-for="opt in layerOptions"
				:key="opt.letter"
				class="nt-layer-item"
				:class="{ active: store.tool.layer === opt.value }"
				@click="onLayerPick(opt.value)"
			>
				<span class="nt-layer-letter">{{ opt.letter }}</span>
				<span class="nt-layer-label">{{ opt.label }}</span>
			</button>
		</div>
	</Popover>

	<Popover
		v-model="popover.zoom"
		title="Zoom"
	>
		<ZoomControls class="nt-zoom-popover" />
	</Popover>

	<Popover
		v-model="popover.clear"
		title="Tout effacer ?"
	>
		<div class="nt-confirm">
			<p class="nt-confirm-msg">
				Cette action effacera tout le contenu de la note.
			</p>
			<div class="nt-confirm-actions">
				<button
					class="btn"
					@click="popover.clear = false"
				>
					Annuler
				</button>
				<button
					class="btn btn-danger"
					@click="confirmClear"
				>
					Confirmer
				</button>
			</div>
		</div>
	</Popover>

	<Popover
		v-model="popover.moreTools"
		title="Plus d'outils"
	>
		<div class="nt-more-tools">
			<button
				v-for="tool in overflowTools"
				:key="tool"
				class="btn"
				@click="onToolPick(tool)"
			>
				{{ tool }}
			</button>
		</div>
	</Popover>
</template>
