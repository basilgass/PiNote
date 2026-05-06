<script setup lang="ts">

import {LayerName} from "../../types"

const selectedLayer = defineModel<LayerName | null>()

withDefaults(defineProps<{ showNull?: boolean }>(), { showNull: true })

const layers: LayerName[] = ['MAIN', 'LAYER']

function selectLayer(layer: LayerName | null) {
  selectedLayer.value = layer
}
</script>

<template>
	<div class="layer-selector">
		<button
			v-for="layer in layers"
			:key="layer"
			:class="['layer-btn', { active: selectedLayer === layer }]"
			@click="selectLayer(layer)"
		>
			{{ layer[0] }}
		</button>
		<button
			v-if="showNull"
			:class="['layer-btn', { active: selectedLayer === null }]"
			@click="selectLayer(null)"
		>
			T
		</button>
	</div>
</template>

