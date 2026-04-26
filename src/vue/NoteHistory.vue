<script lang="ts" setup>
import {ref, watch} from "vue"
import {LayerName} from "../types"
import {Adaptable} from "../shapes/Adaptable"
import PiIcon from "./components/PiIcon.vue"

const props = defineProps<{
  shapes: Adaptable[]
  layers: LayerName[]
  canUndo: boolean
  canRedo: boolean
  activeId?: string | null
}>()

const emit = defineEmits<{
  destroy: [id: string]
  'layer-change': [name: LayerName]
  highlight: [id: string | null]
  toggleVisibility: [id: string]
  undo: []
  redo: []
}>()

const isOpen = ref(false)
const selectedId = ref<string | null>(null)

function selectShape(id: string) {
  if (selectedId.value === id) {
    selectedId.value = null
    emit('highlight', null)
  } else {
    selectedId.value = id
    emit('highlight', id)
  }
}

function deleteShape(event: Event, id: string) {
  event.stopPropagation()
  if (selectedId.value === id) {
    selectedId.value = null
    emit('highlight', null)
  }
  emit('destroy', id)
}

watch(() => props.shapes, (shapes) => {
  if (selectedId.value && !shapes.find(s => s.id === selectedId.value)) {
    selectedId.value = null
    emit('highlight', null)
  }
})

const TOOL_LABEL: Record<string, string> = {
  pen: 'Stylo', highlighter: 'Surligneur', eraser: 'Gomme', select: 'Sélection',
  line: 'Droite', segment: 'Segment', vector: 'Vecteur', circle: 'Cercle',
  rectangle: 'Rectangle', polygon: 'Polygone', move: 'Dépl.',
}
</script>

<template>
	<div
		class="nh-root"
		:class="{ closed: !isOpen }"
	>
		<div class="nh-header">
			<span
				v-if="isOpen"
				class="nh-title"
			>
				Historique
			</span>
			<div class="nh-actions">
				<button
					class="btn"
					:disabled="!canUndo"
					title="Annuler"
					@click="emit('undo')"
				>
					<PiIcon icon="rotate-left" />
				</button>
				<button
					class="btn"
					:disabled="!canRedo"
					title="Rétablir"
					@click="emit('redo')"
				>
					<PiIcon icon="rotate-right" />
				</button>
				<button
					class="btn btn-sm"
					@click="isOpen = !isOpen"
				>
					<PiIcon :icon="isOpen ? 'chevron-up' : 'chevron-down'" />
				</button>
			</div>
		</div>

		<div
			class="nh-body"
			:class="{ open: isOpen }"
		>
			<div class="nh-body-inner">
				<div
					v-if="shapes.length === 0"
					class="nh-empty"
				>
					Aucune forme
				</div>
				<div
					v-for="shape in [...shapes].reverse()"
					:key="shape.id"
					class="nh-row"
					:class="{
						selected: selectedId === shape.id || activeId === shape.id,
						active: activeId === shape.id
					}"
					@click="selectShape(shape.id)"
				>
					<span
						v-if="shape.color"
						class="nh-color"
						:style="{ background: shape.color }"
					/>
					<span
						class="nh-tool"
						:class="{ hidden: shape.hidden }"
					>{{ TOOL_LABEL[shape.tool] ?? shape.tool }}</span>
					<button
						class="nh-icon-btn"
						:title="shape.hidden ? 'Afficher' : 'Cacher'"
						@click.stop="emit('toggleVisibility', shape.id)"
					>
						<PiIcon :icon="shape.hidden ? 'eye-slash' : 'eye'" />
					</button>
					<button
						class="nh-delete"
						title="Supprimer"
						@click="deleteShape($event, shape.id)"
					>
						<PiIcon icon="trash-can" />
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

