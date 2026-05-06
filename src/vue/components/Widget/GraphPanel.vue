<script setup lang="ts">
import PiIcon from '../PiIcon.vue'
import {GraphConfig, GraphFunction} from "../../../shapes/GraphShape"

const props = defineProps<{
  modelValue: GraphConfig
}>()

const emit = defineEmits<{
  'update:modelValue': [config: GraphConfig]
}>()

function update(patch: Partial<GraphConfig>) {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}

function updateFn(index: number, patch: Partial<GraphFunction>) {
  const functions = props.modelValue.functions.map((f, i) =>
    i === index ? { ...f, ...patch } : f
  )
  update({ functions })
}

function addFunction() {
  const colors = ['#0066cc', '#cc0000', '#009900', '#cc6600', '#9900cc']
  const color = colors[props.modelValue.functions.length % colors.length]
  update({ functions: [...props.modelValue.functions, { expr: '', color }] })
}

function removeFunction(index: number) {
  update({ functions: props.modelValue.functions.filter((_, i) => i !== index) })
}
</script>

<template>
	<div class="pn-gp-panel">
		<!-- Axes X -->
		<section class="pn-gp-section">
			<h3 class="pn-gp-title">
				Axe X
			</h3>
			<div class="pn-gp-row">
				<label class="pn-gp-label">Min</label>
				<input
					type="number"
					class="pn-gp-input"
					:value="modelValue.xMin"
					@change="update({ xMin: +($event.target as HTMLInputElement).value })"
				>
				<label class="pn-gp-label">Max</label>
				<input
					type="number"
					class="pn-gp-input"
					:value="modelValue.xMax"
					@change="update({ xMax: +($event.target as HTMLInputElement).value })"
				>
			</div>
		</section>

		<!-- Axes Y -->
		<section class="pn-gp-section">
			<h3 class="pn-gp-title">
				Axe Y
			</h3>
			<label class="pn-gp-checkbox-row">
				<input
					type="checkbox"
					:checked="modelValue.orthonormal"
					@change="update({ orthonormal: ($event.target as HTMLInputElement).checked })"
				>
				<span>Orthonormé</span>
			</label>
			<div
				class="pn-gp-row"
				:class="{ 'pn-gp-disabled': modelValue.orthonormal }"
			>
				<label class="pn-gp-label">Min</label>
				<input
					type="number"
					class="pn-gp-input"
					:disabled="modelValue.orthonormal"
					:value="modelValue.yMin"
					@change="update({ yMin: +($event.target as HTMLInputElement).value })"
				>
				<label class="pn-gp-label">Max</label>
				<input
					type="number"
					class="pn-gp-input"
					:disabled="modelValue.orthonormal"
					:value="modelValue.yMax"
					@change="update({ yMax: +($event.target as HTMLInputElement).value })"
				>
			</div>
		</section>

		<!-- Affichage -->
		<section class="pn-gp-section">
			<h3 class="pn-gp-title">
				Affichage
			</h3>
			<label class="pn-gp-checkbox-row">
				<input
					type="checkbox"
					:checked="modelValue.showGrid"
					@change="update({ showGrid: ($event.target as HTMLInputElement).checked })"
				>
				<span>Grille</span>
			</label>
			<div class="pn-gp-label-mode">
				<span class="pn-gp-label">Labels</span>
				<label
					v-for="opt in [{ id: 'all', label: 'Tous' }, { id: 'unit', label: 'Unité' }, { id: 'none', label: 'Aucun' }]"
					:key="opt.id"
					class="pn-gp-radio-row"
				>
					<input
						type="radio"
						name="labelMode"
						:value="opt.id"
						:checked="modelValue.labelMode === opt.id"
						@change="update({ labelMode: opt.id as 'all' | 'unit' | 'none' })"
					>
					<span>{{ opt.label }}</span>
				</label>
			</div>
		</section>

		<!-- Fonctions -->
		<section class="pn-gp-section pn-gp-functions">
			<div class="pn-gp-functions-header">
				<h3 class="pn-gp-title">
					Fonctions
				</h3>
				<button
					class="btn btn-ghost pn-gp-add-btn"
					type="button"
					@click="addFunction"
				>
					<PiIcon icon="magnifying-glass-plus" />
					Ajouter
				</button>
			</div>
			<div
				v-for="(fn, i) in modelValue.functions"
				:key="i"
				class="pn-gp-fn-row"
			>
				<span class="pn-gp-fn-label">f(x) =</span>
				<input
					type="text"
					class="pn-gp-input pn-gp-fn-expr"
					placeholder="ex: sin(x)"
					:value="fn.expr"
					@input="updateFn(i, { expr: ($event.target as HTMLInputElement).value })"
				>
				<input
					type="color"
					class="pn-gp-color"
					:value="fn.color"
					@input="updateFn(i, { color: ($event.target as HTMLInputElement).value })"
				>
				<button
					class="btn btn-ghost pn-gp-remove-btn"
					type="button"
					@click="removeFunction(i)"
				>
					<PiIcon icon="xmark" />
				</button>
			</div>
			<p
				v-if="modelValue.functions.length === 0"
				class="pn-gp-empty"
			>
				Aucune fonction — cliquez sur Ajouter.
			</p>
		</section>
	</div>
</template>
