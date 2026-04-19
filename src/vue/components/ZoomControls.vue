<script lang="ts" setup>
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
			+
		</button>
		<button
			title="Zoom −"
			@click="emit('zoom-out')"
		>
			−
		</button>
		<button
			title="Tout afficher"
			@click="emit('fit-view')"
		>
			⤢
		</button>
		<button
			title="Réinitialiser"
			@click="emit('reset-view')"
		>
			⊙
		</button>
	</div>
</template>

