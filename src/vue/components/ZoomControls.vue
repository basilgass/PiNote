<script lang="ts" setup>
import {useNoteStore} from '../../store/useNoteStore'
import PiIcon from './PiIcon.vue'

const store = useNoteStore()
</script>

<template>
	<div>
		<button
			class="btn"
			title="Zoom +"
			@click="store.zoomIn()"
		>
			<PiIcon icon="magnifying-glass-plus" />
		</button>
		<button
			class="btn"
			title="Zoom −"
			@click="store.zoomOut()"
		>
			<PiIcon icon="magnifying-glass-minus" />
		</button>
		<button
			class="btn"
			title="Tout afficher"
			@click="store.fitView()"
		>
			<PiIcon icon="expand" />
		</button>
		<button
			class="btn"
			title="Réinitialiser"
			@click="store.resetView()"
		>
			<PiIcon icon="compress" />
		</button>
	</div>
</template>
