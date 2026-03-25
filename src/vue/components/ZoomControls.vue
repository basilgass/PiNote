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

<style scoped>
.zoom-controls {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.zoom-controls button {
  width: 40px;
  height: 40px;
  border: 1px solid #ccc;
  border-radius: 50%;
  background: white;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.zoom-controls button:active {
  background: #f0f0f0;
}

@media (max-width: 768px) {
  .zoom-controls button {
    width: 44px;
    height: 44px;
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .zoom-controls {
    gap: 12px;
  }

  .zoom-controls button {
    width: 48px;
    height: 48px;
    font-size: 24px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
}
</style>
