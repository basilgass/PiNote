<script setup lang="ts">
import { ToolType } from "../../types"
import { useNoteStore } from "../../store/useNoteStore"
import PiIcon from "./PiIcon.vue"

const store = useNoteStore()

const props = withDefaults(defineProps<{ tools?: ToolType[] }>(), {
  tools: () => ['pen', 'highlighter', 'eraser', 'line', 'segment', 'circle', 'rectangle']
})

const TOOL_ICON: Record<string, string> = {
  select:      'arrow-pointer',
  pen:         'pen-nib',
  highlighter: 'highlighter',
  eraser:      'eraser',
  move:        'arrows-up-down-left-right',
  line:        'tool-line',
  segment:     'tool-segment',
  vector:      'tool-vector',
  circle:      'circle',
  polygon:     'draw-polygon',
}

function toolIcon(tool: string): string {
  if (tool === 'rectangle') {
    return store.tool.tool === 'rectangle' && store.tool.rectMode === '3pts'
      ? 'tool-rect-3pts'
      : 'tool-rect-2pts'
  }
  return TOOL_ICON[tool] ?? tool
}
</script>

<template>
	<div class="tool-selector">
		<button
			v-for="tool in props.tools"
			:key="tool"
			class="tool-button"
			:class="{ active: store.tool.tool === tool }"
			@click="store.selectTool(tool)"
		>
			<span class="icon-wrapper">
				<PiIcon :icon="toolIcon(tool)" />
			</span>
		</button>
	</div>
</template>