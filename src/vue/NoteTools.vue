<script setup lang="ts">
import {ref, watch} from "vue"
import ToolSelector from "@pi-vue/components/ToolSelector.vue"
import ColorSelector from "@pi-vue/components/ColorSelector.vue"
import WidthSelector from "@pi-vue/components/WidthSelector.vue"
import LayerSelector from "@pi-vue/components/LayerSelector.vue"
import {ToolConfig, ToolMemory, ToolType} from "../types"

const selectedTool = defineModel<ToolConfig>('modelValue', {
  default: {
    tool: "pen",
    color: "black",
    width: 2,
    layer: "background"
  }
})

// --- Onglets ---
type Tab = 'drawing' | 'shapes'
const activeTab = ref<Tab>('drawing')

const drawingTools: ToolType[] = ['pen', 'highlighter', 'eraser', 'move']
const shapeTools: ToolType[] = ['line', 'segment', 'circle', 'rectangle', 'polygon']

function selectTab(tab: Tab) {
  activeTab.value = tab
  const tools = tab === 'drawing' ? drawingTools : shapeTools
  if (!tools.includes(selectedTool.value.tool)) {
    selectedTool.value.tool = tools[0]
  }
}

// Sync onglet si le tool change de l'extérieur
watch(() => selectedTool.value.tool, (tool) => {
  if (drawingTools.includes(tool)) activeTab.value = 'drawing'
  else if (shapeTools.includes(tool)) activeTab.value = 'shapes'
})

// --- Mémoire par tool ---
const toolMemory: ToolMemory = {
  pen:         { color: selectedTool.value.color, width: selectedTool.value.width },
  highlighter: { color: "#eab308", width: 12 },
  eraser:      { color: "", width: 2 },
  move:        { color: "", width: 0 },
  line:        { color: "", width: 2 },
  segment:     { color: "", width: 2 },
  circle:      { color: "", width: 2 },
  rectangle:   { color: "", width: 2 },
  polygon:     { color: "", width: 2 }
}

watch(() => selectedTool.value.tool, (newTool) => {
  const memory = toolMemory[newTool]
  selectedTool.value.color = memory.color
  selectedTool.value.width = memory.width
})

watch(() => selectedTool.value.width, (newWidth) => {
  toolMemory[selectedTool.value.tool].width = newWidth
})

watch(() => selectedTool.value.color, (newColor) => {
  if (selectedTool.value.tool !== 'eraser') {
    toolMemory[selectedTool.value.tool].color = newColor
  }
})
</script>

<template>
	<div class="note-tools">
		<div class="tabs">
			<button
				class="tab-btn"
				:class="{ active: activeTab === 'drawing' }"
				@click="selectTab('drawing')"
			>
				Dessin
			</button>
			<button
				class="tab-btn"
				:class="{ active: activeTab === 'shapes' }"
				@click="selectTab('shapes')"
			>
				Formes
			</button>
		</div>

		<div class="tools-row">
			<tool-selector
				v-model="selectedTool.tool"
				:tools="activeTab === 'drawing' ? drawingTools : shapeTools"
			/>

			<div class="divider" />

			<color-selector
				v-model="selectedTool.color"
				:tool="selectedTool.tool"
			/>

			<width-selector
				v-model="selectedTool.width"
				:tool="selectedTool.tool"
			/>

			<layer-selector
				v-model="selectedTool.layer"
			/>
		</div>
	</div>
</template>

<style scoped>
.note-tools {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 16px 12px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 1000;
}

.tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 6px;
}

.tab-btn {
  padding: 4px 14px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 12px;
  color: #888;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  color: #555;
  background: #f3f4f6;
}

.tab-btn.active {
  background: #eff6ff;
  color: #3b82f6;
}

.tools-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.divider {
  width: 1px;
  height: 32px;
  background: #e5e7eb;
  flex-shrink: 0;
}
</style>
