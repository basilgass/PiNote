<script setup lang="ts">
import {ShapeFactory} from "@core/ShapeFactory"
import PiIcon from "../PiIcon.vue"
import {useNoteStore} from "../../../store/useNoteStore"
import {ToolType} from "../../../types"

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
  text:        'tool-text',
  line:        'tool-line',
  segment:     'tool-segment',
  vector:      'tool-vector',
  polygon:     'draw-polygon',
  arc:         'arc',
  graph:       'tool-graph',
}

function toolIcon(tool: string): string {
  const modes = ShapeFactory.getModes(tool as ToolType)
  if (modes.length > 1) {
    const cur = store.tool.toolModes[tool as ToolType] ?? modes[0].id
    return modes.find(m => m.id === cur)?.icon ?? tool
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