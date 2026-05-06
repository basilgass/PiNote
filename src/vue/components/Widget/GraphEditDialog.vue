<script setup lang="ts">
import {ref, watch, watchEffect} from 'vue'
import WidgetDialog from './WidgetDialog.vue'
import GraphPanel from './GraphPanel.vue'
import {GraphConfig, GraphShape} from "../../../shapes/GraphShape"

const props = defineProps<{
  open:          boolean
  initialConfig: GraphConfig
}>()

const emit = defineEmits<{
  confirm: [config: GraphConfig]
  cancel:  []
}>()

const config    = ref<GraphConfig>({ ...props.initialConfig })
const canvasEl  = ref<HTMLCanvasElement | null>(null)
let _dummyShape: GraphShape | null = null

watch(() => props.open, (open) => {
  if (open) config.value = { ...props.initialConfig }
})

// Re-render preview quand la config change
watchEffect(() => {
  const canvas = canvasEl.value
  if (!canvas) return

  const cfg = config.value
  canvas.width  = cfg.width  || 300
  canvas.height = cfg.height || 200

  if (!_dummyShape) {
    _dummyShape = new GraphShape({ ...cfg, x: 0, y: 0 })
  } else {
    _dummyShape.applyConfig({ ...cfg, x: 0, y: 0 })
  }

  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  _dummyShape.draw(ctx)
})

function onConfirm() { emit('confirm', { ...config.value }) }
function onCancel()  { emit('cancel') }
</script>

<template>
	<WidgetDialog
		:open="open"
		@confirm="onConfirm"
		@cancel="onCancel"
	>
		<!-- Colonne gauche : configuration -->
		<div class="pn-ged-left">
			<GraphPanel
				v-model="config"
			/>
		</div>

		<!-- Colonne droite : preview canvas -->
		<div class="pn-ged-right">
			<div class="pn-ged-preview-label">
				Aperçu
			</div>
			<div class="pn-ged-preview-wrap">
				<canvas
					ref="canvasEl"
					class="pn-ged-canvas"
				/>
			</div>
		</div>
	</WidgetDialog>
</template>
