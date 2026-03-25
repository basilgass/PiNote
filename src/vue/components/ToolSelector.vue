<script setup lang="ts">

import {ToolType} from "../../types"

const selectedTool = defineModel<ToolType>({
  default: 'pen'
})

const props = withDefaults(defineProps<{ tools?: ToolType[] }>(), {
  tools: () => ['pen', 'highlighter', 'eraser', 'line', 'segment', 'circle', 'rectangle']
})

function onSelect(tool: ToolType) {
  selectedTool.value = tool
}
</script>

<template>
	<div class="tool-selector">
		<button
			v-for="tool in props.tools"
			:key="tool"
			class="tool-button"
			:class="{ active: selectedTool === tool }"
			@click="onSelect(tool)"
		>
			<span class="icon-wrapper">

				<!-- PEN -->
				<svg
					v-if="tool === 'pen'"
					viewBox="0 0 24 24"
				>
					<path d="M3 21l3-1 11-11-2-2L4 18l-1 3z" />
				</svg>

				<!-- HIGHLIGHTER -->
				<svg
					v-else-if="tool === 'highlighter'"
					viewBox="0 0 24 24"
				>
					<rect
						x="3"
						y="14"
						width="18"
						height="6"
					/>
					<path d="M7 14L17 4l3 3-10 10" />
				</svg>

				<!-- ERASER -->
				<svg
					v-else-if="tool === 'eraser'"
					viewBox="0 0 24 24"
				>
					<path d="M16 3l5 5-9 9H7L2 12l9-9h5z" />
				</svg>

				<!-- MOVE -->
				<svg
					v-else-if="tool === 'move'"
					viewBox="0 0 24 24"
					fill="none"
				>
					<path
						d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>

				<!-- LINE (droite infinie) : ligne bord à bord, points au milieu -->
				<svg
					v-else-if="tool === 'line'"
					viewBox="0 0 24 24"
				>
					<line
						x1="2"
						y1="22"
						x2="22"
						y2="2"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
					<circle cx="8" cy="16" r="2.5" fill="currentColor" />
					<circle cx="16" cy="8" r="2.5" fill="currentColor" />
				</svg>

				<!-- SEGMENT : ligne bornée, points aux extrémités -->
				<svg
					v-else-if="tool === 'segment'"
					viewBox="0 0 24 24"
				>
					<line
						x1="4"
						y1="20"
						x2="20"
						y2="4"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
					<circle cx="4" cy="20" r="2.5" fill="currentColor" />
					<circle cx="20" cy="4" r="2.5" fill="currentColor" />
				</svg>

				<!-- CIRCLE -->
				<svg
					v-else-if="tool === 'circle'"
					viewBox="0 0 24 24"
				>
					<circle
						cx="12"
						cy="12"
						r="7"
						stroke="currentColor"
						stroke-width="2"
						fill="none"
					/>
				</svg>

				<!-- RECTANGLE -->
				<svg
					v-else-if="tool === 'rectangle'"
					viewBox="0 0 24 24"
				>
					<rect
						x="5"
						y="7"
						width="14"
						height="10"
						rx="2"
						stroke="currentColor"
						stroke-width="2"
						fill="none"
					/>
				</svg>

			</span>
		</button>
	</div>
</template>

<style scoped>
.tool-selector {
  display: flex;
  gap: 10px;
}

.tool-button {
  border: none;
  background: transparent;
  padding: 4px;
  cursor: pointer;
}

.icon-wrapper {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.tool-button svg {
  width: 18px;
  height: 18px;
  color: #555; /* pour currentColor */
  fill: currentColor; /* utile pour pen / eraser */
  transition: all 0.15s ease;
}

.tool-button.active svg {
  color: #3b82f6;
}

/* Hover */
.tool-button:hover .icon-wrapper {
  border-color: #d1d5db;
  background: #fafafa;
}

/* Active */
.tool-button.active .icon-wrapper {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.08);
}

.tool-button.active svg {
  fill: #3b82f6;
}
</style>