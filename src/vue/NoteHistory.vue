<script lang="ts" setup>
import {ref, watch} from "vue"
import {LayerName} from "../types"
import {Adaptable} from "../shapes/Adaptable"

const props = defineProps<{
  shapes: Adaptable[]
  layers: LayerName[]
  canUndo: boolean
  canRedo: boolean
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
  pen: 'Stylo', highlighter: 'Surligneur', eraser: 'Gomme',
  line: 'Droite', segment: 'Segment', circle: 'Cercle',
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
					class="nh-btn"
					:disabled="!canUndo"
					title="Annuler"
					@click="emit('undo')"
				>
					↩
				</button>
				<button
					class="nh-btn"
					:disabled="!canRedo"
					title="Rétablir"
					@click="emit('redo')"
				>
					↪
				</button>
				<button
					class="nh-btn nh-toggle"
					@click="isOpen = !isOpen"
				>
					{{ isOpen ? '▲' : '▼' }}
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
					:class="{ selected: selectedId === shape.id }"
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
						{{ shape.hidden ? '🙈' : '👁' }}
					</button>
					<button
						class="nh-delete"
						title="Supprimer"
						@click="deleteShape($event, shape.id)"
					>
						🗑
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.nh-root {
  position: fixed;
  right: 12px;
  top: 12px;
  z-index: 1000;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.10);
  min-width: 180px;
  font-size: 13px;
  user-select: none;
}

.nh-root.closed {
  min-width: 0;
  width: fit-content;
}

.nh-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  gap: 6px;
}

.nh-title {
  font-weight: 600;
  color: #374151;
  flex: 1;
}

.nh-actions {
  display: flex;
  gap: 4px;
}

.nh-btn {
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  padding: 3px 7px;
  cursor: pointer;
  font-size: 13px;
  color: #374151;
  transition: background 0.15s;
}

.nh-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.nh-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.nh-toggle {
  font-size: 10px;
  padding: 3px 6px;
}

.nh-body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.25s ease;
  width: 0;
}

.nh-body.open {
  grid-template-rows: 1fr;
  width: auto;
}

.nh-body-inner {
  overflow: hidden;
  max-height: 400px;
  overflow-y: auto;
}

.nh-empty {
  padding: 10px 12px;
  color: #9ca3af;
  font-style: italic;
}

.nh-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  cursor: pointer;
  border-top: 1px solid #f3f4f6;
  transition: background 0.12s;
}

.nh-row:hover {
  background: #f9fafb;
}

.nh-row.selected {
  background: #eff6ff;
}

.nh-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  border: 1px solid rgba(0,0,0,0.1);
  flex-shrink: 0;
}

.nh-tool {
  flex: 1;
  color: #374151;
}

.nh-tool.hidden {
  opacity: 0.35;
  text-decoration: line-through;
}

.nh-icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 13px;
  opacity: 0.5;
  transition: opacity 0.12s;
}

.nh-icon-btn:hover {
  opacity: 1;
}

.nh-delete {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 13px;
  opacity: 0.4;
  transition: opacity 0.12s, background 0.12s;
}

.nh-delete:hover {
  opacity: 1;
  background: #fee2e2;
}
</style>
