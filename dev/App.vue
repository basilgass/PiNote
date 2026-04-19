<script setup lang="ts">
import NoteCanvas from "@pi-vue/NoteCanvas.vue"
import { ref } from "vue"
import NotePreview from "@pi-vue/NotePreview.vue"
import { getConfig } from "../src/config/PiNoteConfig"
import type { BackgroundState } from "../src/types"

const edit = ref(true)

const config = getConfig()
const background = config.defaults.background as BackgroundState
</script>

<template>
	<div class="canvasWrapper">
		<div
			class="dev-toggle"
			@click="edit=!edit"
		>
			{{ edit ? 'edit' : 'preview' }}
		</div>
		<NoteCanvas
			v-if="edit"
			:background="background"
			:snap-grid-enabled="config.defaults.snapEnabled"
			:snap-grid-size="config.defaults.snapSize"
		/>
		<NotePreview v-else />
	</div>
</template>

<style>
.canvasWrapper{
  height: 100vh;
  position: relative;
}

.dev-toggle {
  position: fixed;
  top: 0;
  left: 0;
  background-color: white;
  z-index: 10;
  cursor: pointer;
  padding: 4px 8px;
}
</style>
