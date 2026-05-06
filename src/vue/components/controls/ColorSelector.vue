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

