import { createApp } from 'vue'
import App from './App.vue'
import '../src/styles/pi-note.css'
import { setConfig, getConfig } from '../src/config/PiNoteConfig'
import type { PiNoteConfig } from '../src/config/PiNoteConfig'
import { initPdfWorker } from '../src/services/PdfRenderer'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

initPdfWorker(workerUrl)

async function bootstrap() {
  try {
    const res = await fetch('/pinote.config.json')
    if (res.ok) {
      const json: Partial<PiNoteConfig> = await res.json()
      setConfig(json)
    }
  } catch { /* utilise les valeurs par défaut */ }

  const config = getConfig()
  document.title = config.appTitle
  document.body.dataset.theme = config.theme

  createApp(App).mount('#app')
}

bootstrap()
