<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { useNoteStore } from '../../store/useNoteStore'
import PiIcon from './PiIcon.vue'
import PageCard from './PageCard.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const store = useNoteStore()
const dialogEl = ref<HTMLDialogElement | null>(null)

// Map page.id → instance PageCard pour appeler render()
const cardMap = new Map<string, InstanceType<typeof PageCard>>()

function registerCard(id: string, el: unknown) {
	if (el) cardMap.set(id, el as InstanceType<typeof PageCard>)
	else cardMap.delete(id)
}

// ── Actions ───────────────────────────────────────────────────────────────────

function selectPage(id: string) {
	store.switchPage(id)
	emit('close')
}

function pageNumber(index: number): number {
	return index + 1
}

function onDialogClick(e: MouseEvent) {
	if (e.target === dialogEl.value) emit('close')
}

function onCancel(e: Event) {
	e.preventDefault()
	emit('close')
}

// ── Scroll capture ─────────────────────────────────────────────────────────────

function captureWheel(e: WheelEvent) {
	if (!dialogEl.value?.contains(e.target as Node)) {
		e.stopPropagation()
		e.preventDefault()
	}
}

// ── Rendu des previews ────────────────────────────────────────────────────────

async function renderAllCards() {
	for (const page of store.pages) {
		const card = cardMap.get(page.id)
		if (card) {
			await card.render()
			await new Promise(r => setTimeout(r, 0))
		}
	}
}

// ── Open / Close ──────────────────────────────────────────────────────────────

watch(() => props.open, async (open) => {
	if (open) {
		document.body.style.overflow = 'hidden'
		window.addEventListener('wheel', captureWheel, { capture: true, passive: false })
		dialogEl.value?.showModal()
		await nextTick()
		void renderAllCards()
	} else {
		document.body.style.overflow = ''
		window.removeEventListener('wheel', captureWheel, { capture: true })
		dialogEl.value?.close()
	}
})

onBeforeUnmount(() => {
	document.body.style.overflow = ''
	window.removeEventListener('wheel', captureWheel, { capture: true })
})
</script>

<template>
	<Teleport to="body">
		<dialog
			ref="dialogEl"
			class="pn-pages-dialog"
			@click="onDialogClick"
			@cancel="onCancel"
		>
			<div
				class="pn-pages-container"
				@click.stop
			>
				<header class="pn-pages-header">
					<span class="pn-pages-title">Pages</span>
					<button
						class="btn btn-ghost"
						style="padding: 4px 8px"
						@click="emit('close')"
					>
						<PiIcon icon="xmark" />
					</button>
				</header>

				<div class="pn-pages-body">
					<PageCard
						v-for="(page, index) in store.pages"
						:key="page.id"
						:ref="(el: unknown) => registerCard(page.id, el)"
						:page="page"
						:page-number="pageNumber(index)"
						@select="selectPage(page.id)"
					/>
				</div>
			</div>
		</dialog>
	</Teleport>
</template>
