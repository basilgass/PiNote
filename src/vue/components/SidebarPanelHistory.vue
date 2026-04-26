<script setup lang="ts">
import { useNoteStore } from '../../store/useNoteStore'
import PiIcon from './PiIcon.vue'

const store = useNoteStore()

const TOOL_LABEL: Record<string, string> = {
  pen: 'Stylo', highlighter: 'Surligneur', eraser: 'Gomme', select: 'Sélection',
  line: 'Droite', segment: 'Segment', vector: 'Vecteur', circle: 'Cercle',
  rectangle: 'Rectangle', polygon: 'Polygone', move: 'Dépl.',
}
</script>

<template>
	<div class="history-body">
		<div
			v-if="store.shapes.length === 0"
			class="msg-empty"
		>
			Aucune forme
		</div>
		<div
			v-for="shape in [...store.shapes].reverse()"
			:key="shape.id"
			class="h-row"
			:class="{ active: store.selectedShapeId === shape.id }"
			@click="store.highlightShape(shape.id)"
		>
			<span
				v-if="shape.color"
				class="h-color"
				:style="{ background: shape.color }"
			/>
			<span
				class="h-label"
				:class="{ hidden: shape.hidden }"
			>
				{{ TOOL_LABEL[shape.tool] ?? shape.tool }}
			</span>
			<button
				class="btn-icon"
				:title="shape.hidden ? 'Afficher' : 'Cacher'"
				@click.stop="store.toggleShapeVisibility(shape.id)"
			>
				<PiIcon :icon="shape.hidden ? 'eye-slash' : 'eye'" />
			</button>
			<button
				class="btn-icon del"
				title="Supprimer"
				@click.stop="store.destroyShape(shape.id)"
			>
				<PiIcon icon="trash-can" />
			</button>
		</div>
	</div>
</template>

