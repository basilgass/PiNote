<script setup lang="ts">
import {ref} from 'vue'
import ToolSelector from '@pi-vue/components/ToolSelector.vue'
import ColorSelector from '@pi-vue/components/ColorSelector.vue'
import WidthSelector from '@pi-vue/components/WidthSelector.vue'
import LayerSelector from '@pi-vue/components/LayerSelector.vue'
import {useNoteStore} from '../store/useNoteStore'
import type {ToolType} from '../types'
import PiIcon from '@pi-vue/components/PiIcon.vue'

const store = useNoteStore()

// ── Onglets ──────────────────────────────────────────────────────────────────

type Tab = 'drawing' | 'shapes'
const activeTab = ref<Tab>('drawing')

const drawingTools: ToolType[] = ['select', 'move', 'pen', 'highlighter', 'eraser']
const shapeTools: ToolType[]   = ['select', 'move', 'line', 'segment', 'vector', 'circle', 'rectangle', 'polygon']

/** Change d'onglet et bascule sur le premier outil de l'onglet si nécessaire */
function selectTab(tab: Tab) {
  activeTab.value = tab
  const tools = tab === 'drawing' ? drawingTools : shapeTools
  if (!tools.includes(store.tool.tool)) {
    store.selectTool(tools[0])
  }
}

// ── Bouton "Tout effacer" avec double-confirmation ───────────────────────────

const clearPending = ref(false)
let clearTimer: ReturnType<typeof setTimeout> | null = null

/** Premier clic : demande confirmation. Deuxième clic dans les 2,5 s : efface. */
function requestClear() {
  if (clearPending.value) {
    if (clearTimer) clearTimeout(clearTimer)
    clearPending.value = false
    store.clearAll()
  } else {
    clearPending.value = true
    clearTimer = setTimeout(() => { clearPending.value = false }, 2500)
  }
}
</script>

<template>
	<div class="note-tools">
		<div class="tabs">
			<button
				class="btn btn-ghost"
				:class="{ 'btn-active': activeTab === 'drawing' }"
				@click="selectTab('drawing')"
			>
				Dessin
			</button>
			<button
				class="btn btn-ghost"
				:class="{ 'btn-active': activeTab === 'shapes' }"
				@click="selectTab('shapes')"
			>
				Formes
			</button>

			<div class="clear tabs-row">
				<div class="mini-panel-row">
					<button
						class="btn"
						title="Zoom +"
						@click="store.zoomIn()"
					>
						<PiIcon icon="magnifying-glass-plus" />
					</button>
					<button
						class="btn"
						title="Zoom −"
						@click="store.zoomOut()"
					>
						<PiIcon icon="magnifying-glass-minus" />
					</button>
					<button
						class="btn"
						title="Tout afficher"
						@click="store.fitView()"
					>
						<PiIcon icon="expand" />
					</button>
					<button
						class="btn"
						title="Réinitialiser"
						@click="store.resetView()"
					>
						<PiIcon icon="compress" />
					</button>
				</div>

				<button
					class="btn btn-ghost"
					:class="{ pending: clearPending }"
					:title="clearPending ? 'Cliquer à nouveau pour confirmer' : 'Tout effacer'"
					@click="requestClear"
				>
					<template v-if="clearPending">
						Confirmer ?
					</template>
					<PiIcon
						v-else
						icon="trash-can"
					/>
				</button>
			</div>
		</div>

		<div class="tools-row">
			<tool-selector
				:tools="activeTab === 'drawing' ? drawingTools : shapeTools"
			/>

			<div class="divider" />

			<color-selector
				:model-value="store.tool.color"
				:tool="store.tool.tool"
				@update:model-value="(v) => v !== undefined && store.setToolColor(v)"
			/>

			<width-selector
				:model-value="store.tool.width"
				:tool="store.tool.tool"
				@update:model-value="(v) => v !== undefined && store.setToolWidth(v)"
			/>

			<layer-selector
				:model-value="store.tool.layer"
				@update:model-value="(v) => { store.tool.layer = v ?? null }"
			/>
		</div>
	</div>
</template>

