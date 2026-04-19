<script setup lang="ts">
import {ref, watch} from 'vue'
import {useNoteStore} from '../../store/useNoteStore'
import SidebarPanelHistory from './SidebarPanelHistory.vue'
import SidebarPanelCanvas from './SidebarPanelCanvas.vue'
import SidebarPanelProperties from './SidebarPanelProperties.vue'
import SidebarPanelZoom from './SidebarPanelZoom.vue'
import SidebarPanelLayers from './SidebarPanelLayers.vue'

const store = useNoteStore()

const openHistory = ref(true)
const openCanvas  = ref(false)
const openProps   = ref(true)
const openLayers  = ref(true)

// Ouvre automatiquement le panel Propriétés quand une shape est sélectionnée
watch(() => store.selectedShapeId, (id) => {
  if (id) openProps.value = true
})
</script>

<template>
	<div class="sidebar">
		<!-- Topbar ──────────────────────────────────────── -->
		<div class="sidebar-topbar">
			<span class="sidebar-title">PiNote</span>

			<div class="sidebar-topbar-panel">
				<div class="undo-redo">
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
				</div>

				<button
					class="close-btn"
					title="Fermer le panneau"
					@click="store.sidebarOpen = false"
				>
					‹
				</button>
			</div>
		</div>

		<!-- 1. Historique ───────────────────────────────── -->
		<div class="sec sec-history">
			<div class="sec-header-row">
				<button
					class="sec-header-btn"
					@click="openHistory = !openHistory"
				>
					<span class="sec-title">Historique</span>
					<span
						class="chevron"
						:class="{ open: openHistory }"
					>›</span>
				</button>
			</div>
			<sidebar-panel-history v-show="openHistory" />
		</div>

		<!-- 2. Canvas ───────────────────────────────────── -->
		<div class="sec">
			<button
				class="sec-header"
				@click="openCanvas = !openCanvas"
			>
				<span class="sec-title">Canvas</span>
				<span
					class="chevron"
					:class="{ open: openCanvas }"
				>›</span>
			</button>
			<sidebar-panel-canvas v-show="openCanvas" />
		</div>

		<!-- 3. Calques ─────────────────────────────────── -->
		<div class="sec">
			<button
				class="sec-header"
				@click="openLayers = !openLayers"
			>
				<span class="sec-title">Calques</span>
				<span
					class="chevron"
					:class="{ open: openLayers }"
				>›</span>
			</button>
			<sidebar-panel-layers v-show="openLayers" />
		</div>

		<!-- 4. Propriétés ───────────────────────────────── -->
		<div class="sec sec-props">
			<button
				class="sec-header"
				@click="openProps = !openProps"
			>
				<span class="sec-title">Propriétés</span>
				<span
					class="chevron"
					:class="{ open: openProps }"
				>›</span>
			</button>
			<sidebar-panel-properties v-show="openProps" />
		</div>

		<!-- 4. Zoom ─────────────────────────────────────── -->
		<div class="sec-zoom">
			<div class="sec-row">
				<span class="sec-label">Zoom</span>
				<sidebar-panel-zoom />
			</div>
		</div>
	</div>
</template>

