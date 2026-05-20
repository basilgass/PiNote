<script setup lang="ts">
import {onBeforeUnmount, watch} from 'vue'

const open = defineModel<boolean>({required: true})

defineProps<{ title?: string }>()

function close() {
  open.value = false
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) close()
}

watch(open, (v) => {
  if (v) window.addEventListener('keydown', onKey)
  else window.removeEventListener('keydown', onKey)
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
	<Teleport to="body">
		<Transition name="pn-pop">
			<div
				v-if="open"
				class="pn-popover-root"
				role="dialog"
				aria-modal="true"
			>
				<div
					class="pn-popover-backdrop"
					@click="close"
				/>
				<div
					class="pn-popover-sheet"
					@click.stop
				>
					<div class="pn-popover-handle" />
					<div
						v-if="title"
						class="pn-popover-title"
					>
						{{ title }}
					</div>
					<div class="pn-popover-body">
						<slot />
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>
