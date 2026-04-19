<script setup lang="ts">
import {computed} from 'vue'
import {ToolType} from "../../types"

const selectedWidth = defineModel<number>()

interface Props {
  tool: ToolType
  color?: string
  showSlider?: boolean
}

const props = defineProps<Props>()

const widths = computed<number[]>(() => {
  switch (props.tool) {
    case 'highlighter':
      return [16, 24, 32]
    case 'eraser':
      return [10, 20, 30]
    default:
      return [2, 4, 6]
  }
})

const maxWidth = computed(() => props.tool === 'eraser' ? 60 : 30)
const isEraser = computed(() => props.tool === 'eraser')

function onInput(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  if (v > 0) selectedWidth.value = v
}
</script>

<template>
	<div class="width-selector">
		<div class="presets">
			<button
				v-for="w in widths"
				:key="w"
				class="width-button"
				:class="{ active: selectedWidth === w }"
				@click="selectedWidth = w"
			>
				<span
					v-if="isEraser"
					class="width-circle"
					:style="{ width: w + 'px', height: w + 'px' }"
				/>
				<span
					v-else
					class="width-line"
					:style="{ height: w / 2 + 'px', background: props.color || '#333' }"
				/>
			</button>
		</div>

		<div
			v-if="showSlider"
			class="slider-row"
		>
			<input
				type="range"
				class="slider"
				:min="1"
				:max="maxWidth"
				:value="selectedWidth"
				@input="onInput"
			>
			<input
				type="number"
				class="number-input"
				:min="1"
				:max="maxWidth"
				:value="selectedWidth"
				@change="onInput"
			>
		</div>
	</div>
</template>

