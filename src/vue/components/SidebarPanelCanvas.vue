<script setup lang="ts">
import {computed, ref, watch, watchEffect} from 'vue'
import type {BackgroundMode} from '../../types'
import {useNoteStore} from '../../store/useNoteStore'
import {usePdfStore} from '../../store/usePdfStore'
import {getConfig} from '../../config/PiNoteConfig'
import PiIcon from './PiIcon.vue'
import PagesDialog from './PagesDialog.vue'

const store = useNoteStore()
const pdfStore = usePdfStore()

// ── Référence PDF ─────────────────────────────────────────────────────────────
const pdfFileInput = ref<HTMLInputElement | null>(null)

const currentPage = ref(store.pages.find(p => p.id === store.currentPageId))
watchEffect(() => {
  currentPage.value = store.pages.find(p => p.id === store.currentPageId)
})

// Noms de fichiers PDF mémorisés côté client (non persistés, reconstruits à l'import)
const pdfNames = ref<Record<string, string>>({})

async function onPdfImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = ''

  const { pdfId, pageCount } = await pdfStore.importPdf(file)
  pdfNames.value[pdfId] = file.name
  store.appendPdfPages(pdfId, pageCount, 'Page')
}

function detachPdf() {
  if (!currentPage.value) return
  store.setPdfReference(currentPage.value.id, undefined, undefined)
  pdfStore.clearReference()
}
const fileInput = ref<HTMLInputElement | null>(null)

async function onFileLoad(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  await store.importJSON(file)
  input.value = ''
}

// ── Pages ────────────────────────────────────────────────────────────────────
const showPagesDialog = ref(false)

function confirmNewDocument() {
  if (confirm('Nouveau document : toutes les pages seront supprimées. Continuer ?')) {
    store.newDocument()
  }
}

// ── Sync distante ─────────────────────────────────────────────────────────────
const syncUrlLocal = ref(store.remoteUrl)
watch(syncUrlLocal, (u) => { store.remoteUrl = u })

const syncLabel = computed(() => {
  if (store.syncStatus === 'syncing') return 'En cours…'
  if (store.syncStatus === 'ok') return 'Synchronisé'
  if (store.syncStatus === 'error') return 'Erreur'
  return 'Synchroniser'
})

const BG_LABEL: Record<BackgroundMode, string> = {
  none: 'blanc', ruled: 'réglé', grid: 'grille', hex: 'hex',
}

const COLOR_PRESETS = getConfig().colorPresets

// Copie locale du snap pour éviter de déclencher le store à chaque frappe
const snapEnabled = ref(store.snapGrid.enabled)
const snapSize    = ref(store.snapGrid.size)

watch(() => store.snapGrid, (sg) => {
  snapEnabled.value = sg.enabled
  snapSize.value    = sg.size
}, { deep: true })

function toggleSnapGrid() {
  snapEnabled.value = !snapEnabled.value
  store.setSnapGrid({ enabled: snapEnabled.value, size: snapSize.value })
}

function onSnapSizeInput(value: number) {
  snapSize.value = value
  store.setSnapGrid({ enabled: snapEnabled.value, size: snapSize.value })
}

function patchBackground(patch: Record<string, unknown>, section: 'grid' | 'ruled' | 'hex') {
  store.setBackground({ ...store.backgroundState, [section]: { ...store.backgroundState[section], ...patch } })
}
</script>

<template>
	<div class="canvas-body">
		<!-- Pages -->
		<div class="canvas-field pages-header">
			<button
				class="btn btn-sm"
				@click="store.createPage()"
			>
				+ Nouvelle
			</button>
			<button
				class="btn btn-sm btn-danger"
				title="Nouveau document vierge"
				@click="confirmNewDocument()"
			>
				Nouveau
			</button>
			<button
				class="btn btn-sm"
				title="Gérer toutes les pages"
				@click="showPagesDialog = true"
			>
				Pages…
			</button>
		</div>

		<PagesDialog
			:open="showPagesDialog"
			@close="showPagesDialog = false"
		/>

		<!-- Titre du canvas -->
		<div class="canvas-field">
			<span class="sec-label">Titre</span>
			<input
				class="title-input"
				type="text"
				placeholder="Sans titre"
				:value="store.title"
				@input="store.setTitle(($event.target as HTMLInputElement).value)"
			>
		</div>

		<!-- Mode de fond -->
		<div class="canvas-field">
			<span class="sec-label">Fond</span>
			<div class="bg-grid">
				<button
					v-for="m in (['none', 'ruled', 'grid', 'hex'] as BackgroundMode[])"
					:key="m"
					class="btn btn-sm btn-opt"
					:class="{ 'btn-active': store.backgroundState.mode === m }"
					@click="store.setBackground({ ...store.backgroundState, mode: m })"
				>
					{{ BG_LABEL[m] }}
				</button>
			</div>
		</div>

		<!-- Options grille -->
		<template v-if="store.backgroundState.mode === 'grid'">
			<div class="canvas-field">
				<span class="sec-label">Cellule</span>
				<input
					type="range"
					min="20"
					max="200"
					step="5"
					class="opt-slider"
					:value="store.backgroundState.grid?.size ?? 80"
					@input="patchBackground({ size: +($event.target as HTMLInputElement).value }, 'grid')"
				>
				<span class="opt-val">{{ store.backgroundState.grid?.size ?? 80 }}px</span>
			</div>
			<div class="canvas-field">
				<span class="sec-label">Trait</span>
				<input
					type="range"
					min="0.5"
					max="3"
					step="0.5"
					class="opt-slider"
					:value="store.backgroundState.grid?.lineWidth ?? 1"
					@input="patchBackground({ lineWidth: +($event.target as HTMLInputElement).value }, 'grid')"
				>
				<span class="opt-val">{{ store.backgroundState.grid?.lineWidth ?? 1 }}</span>
			</div>
			<div class="canvas-field">
				<span class="sec-label">Couleur</span>
				<div class="color-row">
					<button
						v-for="p in COLOR_PRESETS"
						:key="p.value"
						class="color-swatch"
						:style="{ background: p.value }"
						:class="{ active: (store.backgroundState.grid?.color ?? '#777777') === p.value }"
						:title="p.label"
						@click="patchBackground({ color: p.value }, 'grid')"
					/>
					<input
						type="color"
						class="color-pick"
						:value="store.backgroundState.grid?.color ?? '#777777'"
						@input="patchBackground({ color: ($event.target as HTMLInputElement).value }, 'grid')"
					>
				</div>
			</div>
		</template>

		<!-- Options réglé -->
		<template v-if="store.backgroundState.mode === 'ruled'">
			<div class="canvas-field">
				<span class="sec-label">Lignes</span>
				<input
					type="range"
					min="10"
					max="100"
					step="5"
					class="opt-slider"
					:value="store.backgroundState.ruled?.spacing ?? 40"
					@input="patchBackground({ spacing: +($event.target as HTMLInputElement).value }, 'ruled')"
				>
				<span class="opt-val">{{ store.backgroundState.ruled?.spacing ?? 40 }}px</span>
			</div>
			<div class="canvas-field">
				<span class="sec-label">Trait</span>
				<input
					type="range"
					min="0.5"
					max="3"
					step="0.5"
					class="opt-slider"
					:value="store.backgroundState.ruled?.lineWidth ?? 1"
					@input="patchBackground({ lineWidth: +($event.target as HTMLInputElement).value }, 'ruled')"
				>
				<span class="opt-val">{{ store.backgroundState.ruled?.lineWidth ?? 1 }}</span>
			</div>
			<div class="canvas-field">
				<span class="sec-label">Couleur</span>
				<div class="color-row">
					<button
						v-for="p in COLOR_PRESETS"
						:key="p.value"
						class="color-swatch"
						:style="{ background: p.value }"
						:class="{ active: (store.backgroundState.ruled?.color ?? '#777777') === p.value }"
						:title="p.label"
						@click="patchBackground({ color: p.value }, 'ruled')"
					/>
					<input
						type="color"
						class="color-pick"
						:value="store.backgroundState.ruled?.color ?? '#777777'"
						@input="patchBackground({ color: ($event.target as HTMLInputElement).value }, 'ruled')"
					>
				</div>
			</div>
		</template>

		<!-- Options hex -->
		<template v-if="store.backgroundState.mode === 'hex'">
			<div class="canvas-field">
				<span class="sec-label">Orient.</span>
				<div class="origin-row">
					<button
						class="btn btn-sm btn-opt"
						:class="{ 'btn-active': (store.backgroundState.hex?.orientation ?? 'pointy') === 'pointy' }"
						@click="patchBackground({ orientation: 'pointy' }, 'hex')"
					>
						sommet
					</button>
					<button
						class="btn btn-sm btn-opt"
						:class="{ 'btn-active': (store.backgroundState.hex?.orientation ?? 'pointy') === 'flat' }"
						@click="patchBackground({ orientation: 'flat' }, 'hex')"
					>
						arête
					</button>
				</div>
			</div>
			<div class="canvas-field">
				<span class="sec-label">Côté</span>
				<input
					type="range"
					min="10"
					max="150"
					step="5"
					class="opt-slider"
					:value="store.backgroundState.hex?.size ?? 40"
					@input="patchBackground({ size: +($event.target as HTMLInputElement).value }, 'hex')"
				>
				<span class="opt-val">{{ store.backgroundState.hex?.size ?? 40 }}px</span>
			</div>
			<div class="canvas-field">
				<span class="sec-label">Trait</span>
				<input
					type="range"
					min="0.5"
					max="3"
					step="0.5"
					class="opt-slider"
					:value="store.backgroundState.hex?.lineWidth ?? 1"
					@input="patchBackground({ lineWidth: +($event.target as HTMLInputElement).value }, 'hex')"
				>
				<span class="opt-val">{{ store.backgroundState.hex?.lineWidth ?? 1 }}</span>
			</div>
			<div class="canvas-field">
				<span class="sec-label">Couleur</span>
				<div class="color-row">
					<button
						v-for="p in COLOR_PRESETS"
						:key="p.value"
						class="color-swatch"
						:style="{ background: p.value }"
						:class="{ active: (store.backgroundState.hex?.color ?? '#777777') === p.value }"
						:title="p.label"
						@click="patchBackground({ color: p.value }, 'hex')"
					/>
					<input
						type="color"
						class="color-pick"
						:value="store.backgroundState.hex?.color ?? '#777777'"
						@input="patchBackground({ color: ($event.target as HTMLInputElement).value }, 'hex')"
					>
				</div>
			</div>
		</template>

		<!-- Référence PDF -->
		<div class="canvas-field pages-header">
			<span class="sec-label">PDF</span>
			<div style="display:flex;gap:4px;flex-wrap:wrap">
				<button
					class="btn btn-sm"
					:disabled="pdfStore.isRendering"
					title="Importer un PDF et créer une page par feuille"
					@click="pdfFileInput?.click()"
				>
					{{ pdfStore.isRendering ? 'Chargement…' : 'Importer' }}
				</button>
				<button
					v-if="currentPage?.pdfId"
					class="btn btn-sm btn-danger"
					title="Détacher le PDF de cette page"
					@click="detachPdf"
				>
					Détacher
				</button>
			</div>
			<input
				ref="pdfFileInput"
				type="file"
				accept="application/pdf"
				style="display:none"
				@change="onPdfImport"
			>
		</div>
		<div
			v-if="currentPage?.pdfId"
			class="canvas-field"
		>
			<span class="sec-label">Fichier</span>
			<span class="opt-val" style="font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
				{{ pdfNames[currentPage.pdfId] ?? currentPage.pdfId }}
				<template v-if="currentPage.pdfPageIndex !== undefined">
					(p.&nbsp;{{ currentPage.pdfPageIndex + 1 }})
				</template>
			</span>
		</div>

		<!-- Snap grille -->
		<div class="canvas-field">
			<span class="sec-label">Snap</span>
			<button
				class="btn btn-sm btn-opt snap-toggle"
				:class="{ 'btn-active': snapEnabled }"
				@click="toggleSnapGrid"
			>
				Grille
			</button>
			<span
				v-if="store.backgroundState.mode === 'grid'"
				class="opt-val linked-label"
			>lié</span>
		</div>
		<template v-if="snapEnabled && store.backgroundState.mode !== 'grid'">
			<div class="canvas-field">
				<span class="sec-label">Pas</span>
				<input
					type="range"
					min="10"
					max="200"
					step="5"
					class="opt-slider"
					:value="snapSize"
					@input="onSnapSizeInput(+($event.target as HTMLInputElement).value)"
				>
				<span class="opt-val">{{ snapSize }}px</span>
			</div>
		</template>
		<template v-if="snapEnabled && store.backgroundState.mode === 'grid'">
			<div class="canvas-field">
				<span class="sec-label">Pas</span>
				<span class="opt-val linked-size">{{ snapSize }}px (fond)</span>
			</div>
		</template>

		<!-- Enregistrer / Charger -->
		<div class="canvas-field export-field">
			<button
				class="btn btn-sm"
				title="Enregistrer en JSON"
				@click="store.exportJSON()"
			>
				Enregistrer
			</button>
			<button
				class="btn btn-sm"
				title="Charger un fichier .pinote.json"
				@click="fileInput?.click()"
			>
				Charger
			</button>
			<input
				ref="fileInput"
				type="file"
				accept=".json,.pinote.json"
				style="display:none"
				@change="onFileLoad"
			>
		</div>

		<!-- Export -->
		<div class="canvas-field export-field">
			<button
				class="btn btn-sm"
				title="Export résolution écran"
				@click="store.exportPNG('screen')"
			>
				PNG
			</button>
			<button
				class="btn btn-sm"
				title="A4 orientation automatique"
				@click="store.exportPNG('a4-auto')"
			>
				A4 auto
			</button>
			<button
				class="btn btn-sm"
				title="A4 portrait"
				@click="store.exportPNG('a4-portrait')"
			>
				A4 ↕
			</button>
			<button
				class="btn btn-sm"
				title="A4 paysage"
				@click="store.exportPNG('a4-landscape')"
			>
				A4 ↔
			</button>
		</div>

		<!-- Synchronisation distante -->
		<div class="canvas-field">
			<span class="sec-label">Sync</span>
			<input
				class="title-input"
				type="url"
				placeholder="https://…"
				:value="syncUrlLocal"
				@input="syncUrlLocal = ($event.target as HTMLInputElement).value"
			>
		</div>
		<div
			v-if="syncUrlLocal"
			class="canvas-field export-field"
		>
			<button
				class="btn btn-sm"
				:class="{ 'btn-active': store.syncStatus === 'ok' }"
				:disabled="store.syncStatus === 'syncing'"
				@click="store.syncRemote()"
			>
				{{ syncLabel }}
			</button>
		</div>
	</div>
</template>

