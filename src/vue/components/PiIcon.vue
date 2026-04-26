<script setup lang="ts">
import { computed } from 'vue'
import { ICONS } from '../icons'

const props = defineProps<{ icon: string }>()

const def = computed(() => ICONS[props.icon])
</script>

<template>
	<svg
		v-if="def"
		:viewBox="def.viewBox"
		fill="currentColor"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
		v-html="def.content"
	/>
</template>