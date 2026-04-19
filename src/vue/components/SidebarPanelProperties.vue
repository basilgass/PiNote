<script setup lang="ts">
import { computed } from 'vue'
import ShapeProperties from './ShapeProperties.vue'
import { useNoteStore } from '../../store/useNoteStore'

const store = useNoteStore()

/** La shape sélectionnée, uniquement si l'outil select est actif */
const selectedShape = computed(() =>
  store.tool.tool === 'select' && store.selectedShapeId
    ? store.engine?.getShapeById(store.selectedShapeId) ?? null
    : null
)
</script>

<template>
	<div class="props-body">
		<div
			v-if="!selectedShape"
			class="msg-empty"
		>
			Aucune forme sélectionnée
		</div>
		<shape-properties
			v-else
			:key="store.selectedShapeId ?? ''"
			:shape="selectedShape"
			@update="(id, patch) => store.updateShapeProps(id, patch)"
		/>
	</div>
</template>

