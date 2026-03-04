<script setup lang="ts">

import {ToolType} from "../../types"
import {ref, useTemplateRef} from "vue"

const selectedColor = defineModel<string>()

interface Props {
  tool: ToolType
}

const props = defineProps<Props>()

const baseColors = [
  '#000000',
  '#ef4444',
  '#3b82f6',
  '#22c55e',
  '#eab308'
]

function isDisabled(color?: string):boolean{
  if(props.tool==='eraser') return true

  if(color===undefined) return false
  
  if(props.tool==='highlighter' && color==='#000000') return true

  return false
}

function selectColor(color: string) {
  selectedColor.value = color
  customActive.value = (color === customColor.value)
}

const picker = useTemplateRef('picker')
const customColor = ref<string>('#34cd34')
const customActive = ref<boolean>(false)

function openPicker(){
  if(!customActive.value){
    selectedColor.value = customColor.value
    customActive.value = true
    return
  }

  picker.value?.click()
}

function onCustomColorChange(event: Event) {
  const target = event.target as HTMLInputElement
  const color = target.value
  customColor.value = color
  selectedColor.value = color
}

</script>

<template>
	<div
		class="color-selector"
	>
		<button
			v-for="color in baseColors"
			:key="color"
			class="color-button"
			:class="{
				active: selectedColor === color,
				disabled: isDisabled(color)
			}"
			:style="{ backgroundColor: color }"
			@click="selectColor(color)"
		/>

		<!-- Custom color -->
		<button
			class="color-btn"
			@click="openPicker"
		>
			<div
				:style="{ backgroundColor: customColor }"
				class="circle"
			/>
			<input
				ref="picker"
				v-model="customColor"
				type="color"
				@change="onCustomColorChange"
				@input="onCustomColorChange"
			>
		</button>
	</div>
</template>

<style scoped>
.color-selector {
  display: flex;
  gap: 10px;
  align-items: center;
}

.color-button {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.color-button:hover {
  transform: scale(1.1);
}

.color-button.active {
  border-color: #111;
}

.color-btn {
  border: none;
  padding: 0;
  background: transparent;
  position: relative;
  width: 22px;
  height: 22px;
  cursor: pointer;
}

.color-btn input[type="color"] {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 1px solid #ccc;
}

.disabled {
  opacity: 0.2;
  pointer-events: none;
}

</style>