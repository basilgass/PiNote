<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  hint?: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel:  []
}>()

const dialogEl = ref<HTMLDialogElement | null>(null)

onMounted(() => {
  if (props.open) dialogEl.value?.showModal()
})

watch(() => props.open, (open) => {
  if (open) {
    dialogEl.value?.showModal()
  } else {
    dialogEl.value?.close()
  }
})

function onDialogClick(e: MouseEvent) {
  if (e.target === dialogEl.value) emit('cancel')
}

function onDialogCancel(e: Event) {
  e.preventDefault()
  emit('cancel')
}
</script>

<template>
	<Teleport to="body">
		<dialog
			ref="dialogEl"
			class="pn-wd-dialog"
			@click="onDialogClick"
			@cancel="onDialogCancel"
		>
			<div
				class="pn-wd-container"
				@click.stop
			>
				<div class="pn-wd-body">
					<slot />
				</div>

				<div class="pn-wd-footer">
					<span class="pn-wd-hint">{{ hint ?? 'Ctrl+Entrée pour valider · Échap pour annuler' }}</span>
					<div class="pn-wd-footer-actions">
						<button
							class="btn btn-ghost"
							type="button"
							@click="emit('cancel')"
						>
							Annuler
						</button>
						<button
							class="btn"
							type="button"
							@click="emit('confirm')"
						>
							Valider
						</button>
					</div>
				</div>
			</div>
		</dialog>
	</Teleport>
</template>
