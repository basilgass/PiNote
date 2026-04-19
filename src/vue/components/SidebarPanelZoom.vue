<script setup lang="ts">
import { useNoteStore } from '../../store/useNoteStore'

const store = useNoteStore()
</script>

<template>
	<div class="zoom-row">
		<button
			class="btn"
			title="Zoom +"
			@click="store.zoomIn()"
		>
			+
		</button>
		<button
			class="btn"
			title="Zoom −"
			@click="store.zoomOut()"
		>
			−
		</button>
		<button
			class="btn"
			title="Tout afficher"
			@click="store.fitView()"
		>
			⤢
		</button>
		<button
			class="btn"
			title="Réinitialiser"
			@click="store.resetView()"
		>
			⊙
		</button>
	</div>
</template>

