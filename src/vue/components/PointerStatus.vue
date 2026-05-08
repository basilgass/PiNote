<script lang="ts" setup>
import { computed } from 'vue'
import { useNoteStore } from '../../store/useNoteStore'
import PiIcon from './PiIcon.vue'
import type { PointerKind } from '@core/PointerClassifier'

const store = useNoteStore()

const KIND_ICON: Record<PointerKind, string> = {
    pen: 'pen-nib',
    finger: 'hand-pointer',
    palm: 'hand',
    mouse: 'arrow-pointer',
    unknown: 'arrow-pointer',
}

const KIND_LABEL: Record<PointerKind, string> = {
    pen: 'Stylet',
    finger: 'Doigt',
    palm: 'Paume',
    mouse: 'Souris',
    unknown: 'Inactif',
}

const primaryKind = computed(() => store.pointerSnapshot.primaryKind)
const activeCount = computed(() => store.pointerSnapshot.activeCount)
const palmEnabled = computed(() => store.palmDetectionEnabled)

/** Décompte par kind (pen, finger, palm, mouse, unknown) */
const kindCounts = computed(() => {
    const counts: Record<PointerKind, number> = {
        pen: 0, finger: 0, palm: 0, mouse: 0, unknown: 0,
    }
    for (const info of store.pointerSnapshot.pointers.values()) {
        counts[info.kind]++
    }
    return counts
})

/** Nombre de pointers du même type que le primary (ce qu'affiche le badge) */
const primaryKindCount = computed(() => kindCounts.value[primaryKind.value])

/** Tooltip détaillé : ex. "1 stylet + 3 doigts" */
const breakdownLabel = computed(() => {
    const parts: string[] = []
    const c = kindCounts.value
    if (c.pen)     parts.push(`${c.pen} stylet${c.pen > 1 ? 's' : ''}`)
    if (c.finger)  parts.push(`${c.finger} doigt${c.finger > 1 ? 's' : ''}`)
    if (c.palm)    parts.push(`${c.palm} paume${c.palm > 1 ? 's' : ''}`)
    if (c.mouse)   parts.push(`${c.mouse} souris`)
    if (c.unknown) parts.push(`${c.unknown} inconnu`)
    return parts.length ? parts.join(' + ') : 'Aucun pointer actif'
})

/** Pointer correspondant au primaryKind — celui dont on affiche la taille */
const primaryPointer = computed(() => {
    const snap = store.pointerSnapshot
    for (const info of snap.pointers.values()) {
        if (info.kind === snap.primaryKind) return info
    }
    return null
})

const dimensionsLabel = computed(() => {
    const p = primaryPointer.value
    if (!p) return ''
    const area = p.width * p.height
    return `${Math.round(area)} px²`
})

const indicatorClass = computed(() => ({
    'pointer-status-indicator': true,
    'is-active': activeCount.value > 0,
    [`kind-${primaryKind.value}`]: true,
}))

function togglePalmDetection() {
    store.setPalmDetectionEnabled(!palmEnabled.value)
}
</script>

<template>
    <div class="pointer-status">
        <button
            class="pointer-status-toggle"
            :class="{ 'is-on': palmEnabled }"
            :title="palmEnabled ? 'Détection paume activée — cliquer pour désactiver' : 'Détection paume désactivée — cliquer pour activer'"
            @click="togglePalmDetection"
        >
            <PiIcon icon="hand" />
        </button>
        <div :class="indicatorClass" :title="breakdownLabel">
            <PiIcon :icon="KIND_ICON[primaryKind]" />
            <span class="pointer-status-count" v-if="primaryKindCount > 1">{{ primaryKindCount }}</span>
            <span class="pointer-status-total" v-if="activeCount > primaryKindCount">+{{ activeCount - primaryKindCount }}</span>
        </div>
        <span class="pointer-status-dims" v-if="primaryPointer">{{ dimensionsLabel }}</span>
    </div>
</template>
