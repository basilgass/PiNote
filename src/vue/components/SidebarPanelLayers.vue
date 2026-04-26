<script setup lang="ts">
import { reactive, ref, watchEffect } from 'vue'
import { useNoteStore } from '../../store/useNoteStore'
import { usePdfStore } from '../../store/usePdfStore'
import PiIcon from './PiIcon.vue'
import type { LayerName } from '../../types'

const store = useNoteStore()
const pdfStore = usePdfStore()

const LAYER_LABEL: Record<LayerName, string> = {
  BACKGROUND: 'Fond',
  REFERENCE:  'Référence',
  OVERLAY:    'Grille',
  MAIN:       'Principal',
  LAYER:      'Calque',
}

const DRAWABLE: LayerName[] = ['MAIN', 'LAYER']
const ALL_LAYERS: LayerName[] = ['REFERENCE', 'BACKGROUND', 'MAIN', 'LAYER']

const visibility = reactive<Record<LayerName, boolean>>({
  BACKGROUND: true,
  REFERENCE:  true,
  OVERLAY:    true,
  MAIN:       true,
  LAYER:      true,
})

const opacity = reactive<Record<LayerName, number>>({
  BACKGROUND: 1,
  REFERENCE:  1,
  OVERLAY:    1,
  MAIN:       1,
  LAYER:      1,
})

watchEffect(() => {
  const eng = store.engine
  if (!eng) return
  const names: LayerName[] = ['BACKGROUND', 'REFERENCE', 'OVERLAY', 'MAIN', 'LAYER']
  for (const name of names) {
    visibility[name] = eng.getLayer(name).visible
    opacity[name] = eng.getLayer(name).opacity
  }
})

function toggleVisible(name: LayerName) {
  store.engine?.setLayerVisibility(name, !visibility[name])
  visibility[name] = !visibility[name]
}

function setOpacity(name: LayerName, value: number) {
  opacity[name] = value
  store.engine?.setLayerOpacity(name, value)
}

function clearLayer(name: LayerName) {
  if (name === 'REFERENCE') {
    pdfStore.clearReference()
  } else {
    store.engine?.clearLayer(name)
  }
}

function setActiveLayer(name: LayerName) {
  store.tool.layer = name
}

const currentPage = ref(store.pages.find(p => p.id === store.currentPageId))
watchEffect(() => {
  currentPage.value = store.pages.find(p => p.id === store.currentPageId)
})

const hasReference = ref(false)
watchEffect(() => {
  hasReference.value = !!currentPage.value?.pdfId
})
</script>

<template>
	<div class="history-body">
		<div
			v-for="name in ALL_LAYERS"
			:key="name"
			class="h-row"
			:class="{ active: store.tool.layer === name }"
			:style="DRAWABLE.includes(name) ? { cursor: 'pointer' } : {}"
			@click="DRAWABLE.includes(name) && setActiveLayer(name)"
		>
			<span
				class="h-label"
				:class="{ hidden: !visibility[name] }"
			>
				{{ LAYER_LABEL[name] }}
			</span>

			<template v-if="name === 'REFERENCE'">
				<input
					v-if="hasReference"
					type="range"
					min="0"
					max="1"
					step="0.05"
					:value="opacity[name]"
					class="opt-slider"
					title="Opacité"
					@input="setOpacity(name, +($event.target as HTMLInputElement).value)"
					@click.stop
				/>
				<span v-else style="flex:1" />
			</template>

			<button
				class="btn-icon"
				:title="visibility[name] ? 'Cacher' : 'Afficher'"
				@click.stop="toggleVisible(name)"
			>
				<PiIcon :icon="visibility[name] ? 'eye' : 'eye-slash'" />
			</button>

			<button
				class="btn-icon del"
				title="Effacer le calque"
				:style="name === 'BACKGROUND' || (name === 'REFERENCE' && !hasReference) ? { visibility: 'hidden' } : {}"
				@click.stop="clearLayer(name)"
			>
				<PiIcon icon="trash-can" />
			</button>
		</div>
	</div>
</template>
