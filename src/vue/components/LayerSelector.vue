<script setup lang="ts">

import {LayerName} from "../../types"

const selectedLayer = defineModel<LayerName>()

const layers: LayerName[] = ['MAIN', 'LAYER']

function selectLayer(layer: LayerName) {
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
			:class="['layer-btn', { active: selectedLayer === null }]"
			@click="selectLayer(null)"
		>
			T
		</button>
	</div>
</template>

<style scoped>
.layer-selector {
  display: flex;
  gap: 8px;
  padding: 6px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  font-family: sans-serif;
}

.layer-btn {
  border: 1px solid #ccc;
  background: #f9f9f9;
  border-radius: 6px;
  padding: 4px 12px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.layer-btn:hover {
  background: #eaeaea;
}

.layer-btn.active {
  border-color: #007aff;
  background: #e6f0ff;
}
</style>