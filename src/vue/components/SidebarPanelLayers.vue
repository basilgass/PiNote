<script setup lang="ts">
import { reactive, watchEffect } from 'vue'
import { useNoteStore } from '../../store/useNoteStore'
import type { LayerName } from '../../types'

const store = useNoteStore()

const LAYER_LABEL: Record<LayerName, string> = {
  BACKGROUND: 'Fond',
  MAIN:       'Principal',
  LAYER:      'Calque',
}

const DRAWABLE: LayerName[] = ['MAIN', 'LAYER']
const ALL_LAYERS: LayerName[] = ['BACKGROUND', 'MAIN', 'LAYER']

const visibility = reactive<Record<LayerName, boolean>>({
  BACKGROUND: true,
  MAIN:       true,
  LAYER:      true,
})

watchEffect(() => {
  const eng = store.engine
  if (!eng) return
  for (const name of ALL_LAYERS) {
    visibility[name] = eng.getLayer(name).visible
  }
})

function toggleVisible(name: LayerName) {
  store.engine?.setLayerVisibility(name, !visibility[name])
  visibility[name] = !visibility[name]
}

function clearLayer(name: LayerName) {
  store.engine?.clearLayer(name)
}

function setActiveLayer(name: LayerName) {
  store.tool.layer = name
}
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

			<button
				class="btn-icon"
				:title="visibility[name] ? 'Cacher' : 'Afficher'"
				@click.stop="toggleVisible(name)"
			>
				{{ visibility[name] ? '👁' : '🙈' }}
			</button>

			<button
				class="btn-icon del"
				title="Effacer le calque"
				:style="name === 'BACKGROUND' ? { visibility: 'hidden' } : {}"
				@click.stop="clearLayer(name)"
			>
				🗑
			</button>
		</div>
	</div>
</template>
