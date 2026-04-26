<script lang="ts" setup>
import PiIcon from './PiIcon.vue'

const emit = defineEmits<{
  'zoom-in': []
  'zoom-out': []
  'fit-view': []
  'reset-view': []
}>()
</script>

<template>
	<div class="zoom-controls">
		<button
			title="Zoom +"
			@click="emit('zoom-in')"
		>
			<PiIcon icon="magnifying-glass-plus" />
		</button>
		<button
			title="Zoom −"
			@click="emit('zoom-out')"
		>
			<PiIcon icon="magnifying-glass-minus" />
		</button>
		<button
			title="Tout afficher"
			@click="emit('fit-view')"
		>
			<PiIcon icon="expand" />
		</button>
		<button
			title="Réinitialiser"
			@click="emit('reset-view')"
		>
			<PiIcon icon="compress" />
		</button>
	</div>
</template>
