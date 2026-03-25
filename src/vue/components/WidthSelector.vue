<script setup lang="ts">
import {computed} from 'vue'
import {ToolType} from "../../types"

const selectedWidth = defineModel<number>()

interface Props {
  tool: ToolType
  color?: string
}

const props = defineProps<Props>()

const widths = computed<number[]>(() => {
  switch (props.tool) {
    case 'highlighter':
      return [8, 12, 16]
    case 'eraser':
      return [10, 20, 30]
    default:
      return [2, 4, 6]
  }
})

const isEraser = computed(() => props.tool === 'eraser')
</script>

<template>
	<div class="width-selector">
		<button
			v-for="w in widths"
			:key="w"
			class="width-button"
			:class="{ active: selectedWidth === w }"
			@click="selectedWidth = w"
		>
			<!-- ERASER -->
			<span
				v-if="isEraser"
				class="width-circle"
				:style="{ width: w + 'px', height: w + 'px' }"
			/>

			<!-- PEN / MARKER -->
			<span
				v-else
				class="width-line"
				:style="{
					height: w / 2 + 'px',
					background: props.color || '#333'
				}"
			/>
		</button>
	</div>
</template>

<style scoped>
.width-selector {
  display: flex;
  gap: 10px;
  align-items: center;
}

.width-button {
  width: 46px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.width-button:hover {
  border-color: #d1d5db;
  background: #fafafa;
}

.width-button.active {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.08);
}

/* Trait */
.width-line {
  width: 60%;
  border-radius: 999px;
}

/* Cercle gomme */
.width-circle {
  border-radius: 50%;
  background: #999;
}

/* Actif */
.width-button.active .width-line {
  background: #3b82f6;
}

.width-button.active .width-circle {
  background: #3b82f6;
}
</style>