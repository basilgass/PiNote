<script lang="ts" setup>

import {Drawable} from "../types"

defineProps<{
  shapes: Drawable[],
  layers: string[]
}>()

const emit = defineEmits<{
  destroy: [index: number],
  layerChange: [name: string]
}>()
</script>

<template>
	<div class="note-history-wrapper">
		<div>HISTORY {{ shapes.length }}</div>
		<div class="history-list">
			<div
				v-for="(shape, index) in shapes"
				:key="`history-${index}`"
				@click="emit('destroy', index)"
			>
				{{ index }} - {{ shape.points?.length }} - {{ shape.color }}
			</div>
		</div>

		<div class="layer-list">
			<div
				v-for="name in layers"
				:key="name"
				@click="emit('layerChange', name)"
			>
				{{ name }}
			</div>
		</div>
	</div>
</template>

<style scoped>
.note-history-wrapper {
  background-color: white;
  border: thin solid #ccc;
  border-radius: 1em;
  padding: 1em;
}

.history-list{
  display: flex;
  flex-direction: column;
  gap: 3px;
}
</style>