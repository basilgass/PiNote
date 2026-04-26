<script setup lang="ts">
import { ref, computed } from 'vue'
import { useNoteStore } from '../../store/useNoteStore'
import { usePdfStore } from '../../store/usePdfStore'
import type { PageEntry } from '../../store/useNoteStore'
import { exportPageAsPdf } from '../../services/PageExporter'
import PiIcon from './PiIcon.vue'
import PagePreview from './PagePreview.vue'

const props = defineProps<{ page: PageEntry; pageNumber: number }>()
const emit = defineEmits<{ select: [] }>()

const store = useNoteStore()
const pdfStore = usePdfStore()
const previewRef = ref<InstanceType<typeof PagePreview> | null>(null)

const isActive = computed(() => props.page.id === store.currentPageId)
const canDelete = computed(() => store.pages.length > 1)

function deletePage(e: MouseEvent) {
	e.stopPropagation()
	if (!canDelete.value) return
	store.deletePage(props.page.id)
}

async function downloadPage(e: MouseEvent) {
	e.stopPropagation()
	const p = props.page
	const size = (p.pdfId !== undefined && p.pdfPageIndex !== undefined)
		? pdfStore.getPdfCanvasSize(p.pdfId, p.pdfPageIndex)
		: null
	const filename = (p.name || `page-${props.pageNumber}`) + '.pdf'
	await exportPageAsPdf(p, size, filename)
}

function render() {
	return previewRef.value?.render()
}

defineExpose({ render })
</script>

<template>
	<div
		class="pn-page-card"
		:class="{ active: isActive }"
		@click="emit('select')"
	>
		<div class="pn-card-header">
			<span class="pn-card-num">{{ pageNumber }}</span>
			<div class="pn-card-actions">
				<button
					class="btn-icon"
					:class="{ del: canDelete }"
					:disabled="!canDelete"
					:title="canDelete ? 'Supprimer la page' : 'Impossible (dernière page)'"
					@click="deletePage"
				>
					<PiIcon icon="trash-can" />
				</button>
				<button
					class="btn-icon"
					title="Télécharger en PDF"
					@click="downloadPage"
				>
					<PiIcon icon="file-arrow-down" />
				</button>
			</div>
		</div>
		<div class="pn-card-preview">
			<PagePreview
				ref="previewRef"
				:page="page"
			/>
		</div>
		<div class="pn-card-name">{{ page.name }}</div>
	</div>
</template>
