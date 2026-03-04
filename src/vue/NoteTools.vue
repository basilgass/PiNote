<script setup lang="ts">
import ToolSelector from "@pi-vue/components/ToolSelector.vue"
import ColorSelector from "@pi-vue/components/ColorSelector.vue"
import WidthSelector from "@pi-vue/components/WidthSelector.vue"
import {ToolConfig, ToolMemory} from "../types"
import {watch} from "vue"
import LayerSelector from "@pi-vue/components/LayerSelector.vue"

const selectedTool = defineModel<ToolConfig>('modelValue', {
  default: {
    tool: "pen",
    color: "black",
    width: 2,
    layer: "background"
  }
})


/**
 * Mémoire interne par tool
 */
const toolMemory: ToolMemory = {
  pen: {
    color: selectedTool.value.color,
    width: selectedTool.value.width
  },
  highlighter: {
    color: "#eab308",
    width: 12
  },
  eraser: {
    color: "",
    width: 2
  },
  circle: {
    color: "",
    width: 2
  },
  rectangle: {
    color: "",
    width: 2
  },
  line: {
    color: "",
    width: 2
  }
}

/**
 * Quand on change de tool
 * → on restaure son état mémorisé
 */
watch(() => selectedTool.value.tool,
    (newTool) => {
      const memory = toolMemory[newTool]

      selectedTool.value.color = memory.color
      selectedTool.value.width = memory.width
    }
)

/**
 * Quand width change → on sauvegarde dans mémoire
 */
watch(() => selectedTool.value.width,
    (newWidth) => {
      toolMemory[selectedTool.value.tool].width = newWidth
    }
)

/**
 * Quand color change → on sauvegarde dans mémoire
 */
watch(() => selectedTool.value.color,
    (newColor) => {
      if (selectedTool.value.tool !== 'eraser') {
        toolMemory[selectedTool.value.tool].color = newColor
      }
    }
)
</script>

<template>
	<div class="note-tools">
		<tool-selector
			v-model="selectedTool.tool"
		/>

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
</template>

<style scoped>
.note-tools {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 24px;
  padding: 12px 18px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 1000;
}
</style>