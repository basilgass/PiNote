<script setup lang="ts">
import { ref, watch } from 'vue'
import { useNoteStore } from '../../store/useNoteStore'
import { TOOL_HINTS } from '../../core/toolHints'

const store = useNoteStore()
const visible = ref(false)
const hint = ref('')
let timer: ReturnType<typeof setTimeout> | null = null

watch(() => store.toolSelectCount, () => {
    hint.value = TOOL_HINTS[store.tool.tool] ?? ''
    if (!hint.value) return
    visible.value = true
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { visible.value = false }, 3000)
})
</script>

<template>
	<div
		v-if="visible"
		class="tool-hint"
	>
		{{ hint }}
	</div>
</template>

