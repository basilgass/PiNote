<script setup lang="ts">
import {computed, ref, watch} from 'vue'
import type {Adaptable, ShapePatch} from '../../shapes/Adaptable'
import type {ArrowStyle, LayerName, LineStyle} from '../../types'
import ColorSelector from './ColorSelector.vue'
import WidthSelector from './WidthSelector.vue'
import LayerSelector from './LayerSelector.vue'

const props = defineProps<{ shape: Adaptable }>()
const emit = defineEmits<{ update: [id: string, patch: ShapePatch] }>()

// Cast pour accéder aux props étendues sans TypeScript strict
const s = props.shape as any

// État local — initialisé depuis la shape (le composant remonte via :key à chaque changement)
const color  = ref<string>(s.color ?? '#000000')
const width  = ref<number>(s.width ?? 2)
const layer  = ref<LayerName>(s.layer ?? 'MAIN')
const lineStyle  = ref<LineStyle>(s.lineStyle ?? 'solid')
const arrowStart = ref<boolean>(s.arrowStart ?? false)
const arrowEnd   = ref<boolean>(s.arrowEnd ?? false)
const arrowStyle = ref<ArrowStyle>(s.arrowStyle ?? 'filled')
const bezier      = ref<boolean>(s.bezier ?? true)
const closed      = ref<boolean>(s.closed ?? false)
const fill        = ref<boolean>(s.fill ?? false)
const fillOpacity = ref<number>(s.fillOpacity ?? 0.3)

// Émet les changements vers NoteCanvas → Engine.updateShapeProps
watch(color,       val => emit('update', props.shape.id, { color: val }))
watch(width,       val => emit('update', props.shape.id, { width: val }))
watch(layer,       val => emit('update', props.shape.id, { layer: val }))
watch(lineStyle,   val => emit('update', props.shape.id, { lineStyle: val }))
watch(arrowStart,  val => emit('update', props.shape.id, { arrowStart: val }))
watch(arrowEnd,    val => emit('update', props.shape.id, { arrowEnd: val }))
watch(arrowStyle,  val => emit('update', props.shape.id, { arrowStyle: val }))
watch(bezier,      val => emit('update', props.shape.id, { bezier: val }))
watch(closed,      val => emit('update', props.shape.id, { closed: val }))
watch(fill,        val => emit('update', props.shape.id, { fill: val }))
watch(fillOpacity, val => emit('update', props.shape.id, { fillOpacity: val }))

const tool = props.shape.tool
const showColor      = tool !== 'eraser'
const showWidth      = !['move', 'select'].includes(tool)
const showLineStyle  = !['move', 'select', 'eraser'].includes(tool)
const showArrows     = computed(() => props.shape.canHaveArrows)
const showFill       = computed(() => props.shape.canBeFilled)
const showBezier     = tool === 'pen'
const showClosed     = tool === 'polygon'
const showArrowStyle = computed(() => arrowStart.value || arrowEnd.value)
</script>

<template>
	<div class="sp-root">
		<div class="sp-body">
			<section v-if="showColor">
				<div class="sp-label">
					Couleur
				</div>
				<color-selector
					v-model="color"
					:tool="tool"
				/>
			</section>

			<div
				v-if="showColor && showWidth"
				class="sp-divider"
			/>

			<section v-if="showWidth">
				<div class="sp-label">
					Épaisseur
				</div>
				<width-selector
					v-model="width"
					:tool="tool"
					:color="color"
					:show-slider="true"
				/>
			</section>

			<div class="sp-divider" />

			<section>
				<div class="sp-label">
					Calque
				</div>
				<layer-selector
					v-model="layer"
					:show-null="false"
				/>
			</section>

			<template v-if="showLineStyle">
				<div class="sp-divider" />
				<section>
					<div class="sp-label">
						Trait
					</div>
					<div class="sp-row-gap">
						<button
							class="btn btn-sm btn-toggle"
							:class="{ 'btn-active': lineStyle === 'solid' }"
							@click="lineStyle = 'solid'"
						>
							plein
						</button>
						<button
							class="btn btn-sm btn-toggle"
							:class="{ 'btn-active': lineStyle === 'dashed' }"
							@click="lineStyle = 'dashed'"
						>
							tirets
						</button>
						<button
							class="btn btn-sm btn-toggle"
							:class="{ 'btn-active': lineStyle === 'dotted' }"
							@click="lineStyle = 'dotted'"
						>
							points
						</button>
					</div>
				</section>
			</template>

			<template v-if="showArrows">
				<div class="sp-divider" />
				<section>
					<div class="sp-label">
						Flèche
					</div>
					<div class="sp-row-gap">
						<button
							class="btn btn-sm btn-toggle"
							:class="{ 'btn-active': arrowStart }"
							@click="arrowStart = !arrowStart"
						>
							← départ
						</button>
						<button
							class="btn btn-sm btn-toggle"
							:class="{ 'btn-active': arrowEnd }"
							@click="arrowEnd = !arrowEnd"
						>
							arrivée →
						</button>
					</div>
				</section>

				<template v-if="showArrowStyle">
					<div class="sp-divider" />
					<section>
						<div class="sp-label">
							Style
						</div>
						<div class="sp-row-gap">
							<button
								class="sp-toggle"
								:class="{ active: arrowStyle === 'filled' }"
								@click="arrowStyle = 'filled'"
							>
								▶ plein
							</button>
							<button
								class="sp-toggle"
								:class="{ active: arrowStyle === 'open' }"
								@click="arrowStyle = 'open'"
							>
								➤ ouvert
							</button>
						</div>
					</section>
				</template>
			</template>

			<template v-if="showBezier">
				<div class="sp-divider" />
				<section class="sp-row">
					<span class="sp-label">Lissage</span>
					<button
						class="sp-toggle"
						:class="{ active: bezier }"
						@click="bezier = !bezier"
					>
						{{ bezier ? 'oui' : 'non' }}
					</button>
				</section>
			</template>

			<template v-if="showClosed">
				<div class="sp-divider" />
				<section class="sp-row">
					<span class="sp-label">Fermé</span>
					<button
						class="sp-toggle"
						:class="{ active: closed }"
						@click="closed = !closed"
					>
						{{ closed ? 'oui' : 'non' }}
					</button>
				</section>
			</template>

			<template v-if="showFill">
				<div class="sp-divider" />
				<section class="sp-row">
					<span class="sp-label">Remplissage</span>
					<button
						class="sp-toggle"
						:class="{ active: fill }"
						@click="fill = !fill"
					>
						{{ fill ? 'oui' : 'non' }}
					</button>
				</section>
				<section v-if="fill">
					<div class="sp-label">
						Opacité
					</div>
					<div class="sp-opacity-row">
						<input
							type="range"
							min="0.05"
							max="1"
							step="0.05"
							:value="fillOpacity"
							class="sp-slider"
							@input="fillOpacity = parseFloat(($event.target as HTMLInputElement).value)"
						>
						<span class="sp-opacity-val">{{ Math.round(fillOpacity * 100) }}%</span>
					</div>
				</section>
			</template>
		</div>
	</div>
</template>

