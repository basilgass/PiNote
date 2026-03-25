<script setup lang="ts">
import NoteCanvas from "@pi-vue/NoteCanvas.vue"
import {ref} from "vue"
import NotePreview from "@pi-vue/NotePreview.vue"

const edit = ref(true)
</script>

<template>
	<div class="canvasWrapper">
		<div
			class="btn"
			@click="edit=!edit"
		>
			{{ edit ? 'edit' : 'preview' }}
		</div>
		<NoteCanvas v-if="edit" />
		<NotePreview v-else />
	</div>
</template>

<style>
.canvasWrapper{
  height: 100vh;
  position: relative;
}

.btn {
  position: fixed;
  top: 0;
  left:0;
  background-color: white;
  z-index: 10;
}
</style>