import { defineStore } from 'pinia'
import { ref, reactive, shallowRef } from 'vue'
import type { Engine } from '@core/Engine'
import type { Adaptable, ShapePatch } from '../shapes/Adaptable'
import type { BackgroundState, LayerName, ToolConfig, ToolMemory, ToolType } from '../types'
import { getConfig } from '../config/PiNoteConfig'

export interface PageEntry {
  id: string
  name: string
  updatedAt: string
}

const INDEX_KEY = 'pi_note_index'
const CURRENT_KEY = 'pi_note_current'
const COUNTER_KEY = 'pi_note_page_counter'

function _nextPageNum(): number {
  const n = parseInt(localStorage.getItem(COUNTER_KEY) ?? '0', 10) + 1
  localStorage.setItem(COUNTER_KEY, String(n))
  return n
}

// ─── Store principal de PiNote ────────────────────────────────────────────────
export const useNoteStore = defineStore('note', () => {

  // ── Références vers l'engine et le canvas (initialisées par NoteCanvas) ──

  /** Référence à l'Engine canvas — définie par NoteCanvas après onMounted */
  const engine = shallowRef<Engine | null>(null)

  /** Fonctions de zoom fournies par useCanvasTransform — enregistrées par NoteCanvas */
  const _zoom = ref<{
    zoomIn: () => void
    zoomOut: () => void
    resetView: () => void
    fitView: () => void
  } | null>(null)

  /** Enregistre les fonctions de zoom depuis useCanvasTransform */
  function registerZoom(handlers: typeof _zoom.value) {
    _zoom.value = handlers
  }

  // ── Outil actif ──────────────────────────────────────────────────────────

  const _cfg = getConfig()
  const tool = reactive<ToolConfig>({
    layer: 'MAIN',
    tool: _cfg.defaults.tool,
    width: _cfg.defaults.width,
    color: _cfg.defaults.color,
    bezier: false,
  })

  /** Mémoire couleur/largeur par outil, pour restaurer la config au changement d'outil */
  const toolMemory = reactive<ToolMemory>({
    pen:         { color: _cfg.defaults.color, width: _cfg.defaults.width },
    highlighter: { color: '#eab308', width: 12 },
    eraser:      { color: '', width: 2 },
    move:        { color: '', width: 0 },
    select:      { color: '', width: 0 },
    line:        { color: '', width: 2 },
    segment:     { color: '', width: 2 },
    vector:      { color: '', width: 2 },
    circle:      { color: '', width: 2 },
    rectangle:   { color: '', width: 2 },
    polygon:     { color: '', width: 2 },
  })

  const toolSelectCount = ref(0)

  /** Change l'outil actif et restaure sa mémoire couleur/largeur */
  function selectTool(newTool: ToolType) {
    toolMemory[tool.tool].color = tool.color
    toolMemory[tool.tool].width = tool.width

    tool.tool = newTool
    tool.color = toolMemory[newTool].color
    tool.width = toolMemory[newTool].width
    toolSelectCount.value++
  }

  /** Met à jour la largeur de l'outil courant et la mémorise */
  function setToolWidth(width: number) {
    tool.width = width
    toolMemory[tool.tool].width = width
  }

  /** Met à jour la couleur de l'outil courant et la mémorise (sauf pour la gomme) */
  function setToolColor(color: string) {
    tool.color = color
    if (tool.tool !== 'eraser') toolMemory[tool.tool].color = color
  }

  // ── Formes et sélection ──────────────────────────────────────────────────

  const shapes = ref<Adaptable[]>([])
  const selectedShapeId = ref<string | null>(null)
  const canUndo = ref(false)
  const canRedo = ref(false)
  const layers = ref<LayerName[]>([])

  /** Resynchronise shapes, canUndo et canRedo depuis l'état de l'engine */
  function syncFromEngine() {
    shapes.value = engine.value?.shapes.slice() ?? []
    canUndo.value = engine.value?.canUndo ?? false
    canRedo.value = engine.value?.canRedo ?? false
  }

  function undo() {
    engine.value?.undo()
    syncFromEngine()
  }

  function redo() {
    engine.value?.redo()
    syncFromEngine()
  }

  /** Supprime une forme. Désélectionne si elle était active. */
  function destroyShape(id: string) {
    if (selectedShapeId.value === id) {
      selectedShapeId.value = null
      engine.value?.clearHighlight()
    }
    engine.value?.destroyById(id)
    syncFromEngine()
  }

  /** Bascule la visibilité d'une forme dans l'historique */
  function toggleShapeVisibility(id: string) {
    engine.value?.toggleVisibility(id)
    syncFromEngine()
  }

  /** Sélectionne et met en surbrillance une forme (null pour désélectionner) */
  function highlightShape(id: string | null) {
    selectedShapeId.value = id
    if (id) engine.value?.highlightShape(id)
    else engine.value?.clearHighlight()
  }

  /** Met à jour les propriétés d'une forme existante */
  function updateShapeProps(id: string, patch: ShapePatch) {
    engine.value?.updateShapeProps(id, patch)
    syncFromEngine()
  }

  /** Bascule la visibilité d'un calque entier */
  function toggleLayerVisibility(name: LayerName) {
    if (!engine.value) return
    engine.value.setLayerVisibility(name, !engine.value.getLayer(name).visible)
  }

  // ── Canvas — fond, titre, snap ───────────────────────────────────────────

  const backgroundState = ref<BackgroundState>({
    mode: 'none',
    grid: { size: 80, color: '#777777', lineWidth: 1 },
    ruled: { spacing: 40, color: '#777777', lineWidth: 1 },
    hex: { size: 40, color: '#777777', lineWidth: 1, orientation: 'pointy' },
  })

  const title = ref<string>('')
  const snapGrid = reactive({ enabled: _cfg.defaults.snapEnabled, size: _cfg.defaults.snapSize })

  function setBackground(state: BackgroundState) {
    backgroundState.value = state
    engine.value?.setBackground(state)
    if (state.mode === 'grid' && state.grid?.size) {
      snapGrid.size = state.grid.size
    }
  }

  function setTitle(value: string) {
    title.value = value
    if (engine.value) engine.value.title = value
  }

  function setSnapGrid(state: { enabled: boolean; size: number }) {
    const sizeChanged = state.size !== snapGrid.size
    snapGrid.enabled = state.enabled
    snapGrid.size = state.size
    if (engine.value) {
      engine.value.snapGridEnabled = state.enabled
      engine.value.snapGridSize = state.size
      if (sizeChanged) engine.value.showGridPreview()
    }
  }

  /** Efface toutes les formes et réinitialise la sélection */
  function clearAll() {
    engine.value?.resetAll()
    selectedShapeId.value = null
    syncFromEngine()
  }

  /** Exporte le canvas en fichier JSON via "Enregistrer sous" */
  async function exportJSON() {
    if (!engine.value) return
    const data = engine.value.toJSONData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const filename = (title.value || 'dessin') + '.pinote.json'

    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: 'PiNote JSON', accept: { 'application/json': ['.pinote.json', '.json'] } }],
        })
        const writable = await handle.createWritable()
        await writable.write(blob)
        await writable.close()
        return
      } catch (e: any) {
        if (e?.name === 'AbortError') return
      }
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  /** Charge un fichier JSON et remplace le canvas actuel */
  async function importJSON(file: File): Promise<void> {
    if (!engine.value) return
    const text = await file.text()
    let parsed: any
    try {
      parsed = JSON.parse(text)
    } catch {
      console.warn('[PiNote] importJSON: fichier JSON invalide')
      return
    }
    engine.value.loadFromJSONData(parsed)
    const bg = engine.value.backgroundState
    backgroundState.value = bg
    title.value = engine.value.title
    snapGrid.enabled = engine.value.snapGridEnabled
    snapGrid.size = engine.value.snapGridSize
    syncFromEngine()
  }

  /** Exporte le canvas en PNG (résolution écran ou format A4) */
  function exportPNG(format: 'screen' | 'a4-portrait' | 'a4-landscape' | 'a4-auto') {
    if (!engine.value) return
    const dataUrl =
      format === 'screen'
        ? engine.value.exportPNG()
        : engine.value.exportA4(
            format === 'a4-portrait' ? 'portrait' :
            format === 'a4-landscape' ? 'landscape' : 'auto'
          )
    if (!dataUrl) return
    const suffix = format === 'screen' ? '' : `-${format}`
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = (title.value || 'dessin') + suffix + '.png'
    a.click()
  }

  // ── Multi-page ───────────────────────────────────────────────────────────

  const currentPageId = ref('default')
  const pages = ref<PageEntry[]>([])
  const expiredPages = ref<PageEntry[]>([])

  function _savePageIndex() {
    localStorage.setItem(INDEX_KEY, JSON.stringify(pages.value))
  }

  function _touchPage(id: string) {
    const entry = pages.value.find(p => p.id === id)
    if (entry) {
      entry.updatedAt = new Date().toISOString()
      _savePageIndex()
    }
  }

  function _checkExpiry() {
    const threshold = getConfig().storageRetentionDays * 24 * 60 * 60 * 1000
    const now = Date.now()
    expiredPages.value = pages.value.filter(p => {
      return now - new Date(p.updatedAt).getTime() > threshold
    })
  }

  function _syncEngineState() {
    if (!engine.value) return
    backgroundState.value = engine.value.backgroundState
    title.value = engine.value.title
    selectedShapeId.value = null
    engine.value.clearHighlight()
    syncFromEngine()
  }

  function _applyPage(id: string) {
    currentPageId.value = id
    localStorage.setItem(CURRENT_KEY, id)
    if (!engine.value) return
    engine.value.resetState()
    engine.value.setPageId(id)
    engine.value.loadLocal()
    engine.value.onSave = () => _touchPage(currentPageId.value)
    _syncEngineState()
  }

  /**
   * Initialise la session multi-page.
   * À appeler depuis NoteCanvas.vue après avoir assigné store.engine.
   */
  function initSession() {
    let index: PageEntry[] = []
    try {
      const raw = localStorage.getItem(INDEX_KEY)
      if (raw) index = JSON.parse(raw)
    } catch { /* index invalide → repart de zéro */ }

    if (index.length === 0) {
      // Migration depuis l'ancien format clé fixe
      const oldData = localStorage.getItem('pi_note_draft')
      if (oldData) localStorage.setItem('pi_note_draft_default', oldData)

      // Compteur initialisé à 1 pour la première page
      localStorage.setItem(COUNTER_KEY, '1')
      const entry: PageEntry = { id: 'default', name: 'Page 1', updatedAt: new Date().toISOString() }
      index = [entry]
      localStorage.setItem(INDEX_KEY, JSON.stringify(index))
    } else if (!localStorage.getItem(COUNTER_KEY)) {
      // Compteur absent (upgrade depuis version sans compteur) : initialiser au max existant
      localStorage.setItem(COUNTER_KEY, String(index.length))
    }

    pages.value = index

    const savedId = localStorage.getItem(CURRENT_KEY)
    const targetId = (savedId && index.some(p => p.id === savedId)) ? savedId : index[0].id

    // Configure engine sans callback de sauvegarde (la migration ne doit pas toucher updatedAt)
    if (engine.value) {
      engine.value.resetState()
      engine.value.setPageId(targetId)
      engine.value.loadLocal()
      engine.value.onSave = () => _touchPage(currentPageId.value)
    }

    currentPageId.value = targetId
    localStorage.setItem(CURRENT_KEY, targetId)
    _syncEngineState()
    _checkExpiry()
  }

  function createPage(name?: string) {
    const max = getConfig().maxPages
    if (max > 0 && pages.value.length >= max) return
    const id = 'page-' + Date.now()
    const entry: PageEntry = {
      id,
      name: name ?? `Page ${_nextPageNum()}`,
      updatedAt: new Date().toISOString(),
    }
    pages.value = [...pages.value, entry]
    _savePageIndex()
    _applyPage(id)
  }

  function switchPage(id: string) {
    if (id === currentPageId.value) return
    _touchPage(currentPageId.value)
    _applyPage(id)
  }

  function deletePage(id: string) {
    if (pages.value.length <= 1) return
    localStorage.removeItem('pi_note_draft_' + id)
    pages.value = pages.value.filter(p => p.id !== id)
    expiredPages.value = expiredPages.value.filter(p => p.id !== id)
    _savePageIndex()
    if (id === currentPageId.value) {
      _applyPage(pages.value[0].id)
    }
  }

  function renamePage(id: string, name: string) {
    const entry = pages.value.find(p => p.id === id)
    if (entry) {
      entry.name = name
      _savePageIndex()
    }
  }

  function dismissExpiredPages() {
    expiredPages.value = []
  }

  /** Repart d'un document vierge : supprime toutes les pages et réinitialise le stockage. */
  function newDocument() {
    for (const p of pages.value) localStorage.removeItem('pi_note_draft_' + p.id)
    localStorage.removeItem(INDEX_KEY)
    localStorage.removeItem(CURRENT_KEY)
    localStorage.setItem(COUNTER_KEY, '1')

    const entry: PageEntry = { id: 'default', name: 'Page 1', updatedAt: new Date().toISOString() }
    pages.value = [entry]
    expiredPages.value = []
    localStorage.setItem(INDEX_KEY, JSON.stringify(pages.value))

    currentPageId.value = 'default'
    localStorage.setItem(CURRENT_KEY, 'default')

    if (engine.value) {
      engine.value.resetState()
      engine.value.setPageId('default')
      engine.value.onSave = () => _touchPage(currentPageId.value)
      // Sauvegarde l'état vide pour initialiser la clé
      engine.value.saveLocal()
    }
    selectedShapeId.value = null
    title.value = ''
    backgroundState.value = { mode: 'none', grid: { size: 80, color: '#777777', lineWidth: 1 }, ruled: { spacing: 40, color: '#777777', lineWidth: 1 }, hex: { size: 40, color: '#777777', lineWidth: 1, orientation: 'pointy' } }
    syncFromEngine()
  }

  // ── Synchronisation distante ─────────────────────────────────────────────

  const remoteUrl = ref(getConfig().backendUrl)
  const syncStatus = ref<'idle' | 'syncing' | 'ok' | 'error'>('idle')
  let _syncTimer: ReturnType<typeof setTimeout> | null = null

  async function syncRemote() {
    if (!engine.value || !remoteUrl.value) return
    syncStatus.value = 'syncing'
    try {
      await engine.value.syncRemote(remoteUrl.value)
      syncStatus.value = 'ok'
    } catch {
      syncStatus.value = 'error'
    }
    if (_syncTimer) clearTimeout(_syncTimer)
    _syncTimer = setTimeout(() => { syncStatus.value = 'idle' }, 3000)
  }

  // ── UI ───────────────────────────────────────────────────────────────────

  const sidebarOpen = ref(true)

  // ── Zoom (délégués au composable useCanvasTransform) ────────────────────

  function zoomIn()    { _zoom.value?.zoomIn() }
  function zoomOut()   { _zoom.value?.zoomOut() }
  function resetView() { _zoom.value?.resetView() }
  function fitView()   { _zoom.value?.fitView() }

  // ────────────────────────────────────────────────────────────────────────
  return {
    // Engine
    engine, registerZoom,
    // Outil
    tool, toolMemory, toolSelectCount, selectTool, setToolWidth, setToolColor,
    // Formes
    shapes, selectedShapeId, canUndo, canRedo, layers,
    syncFromEngine, undo, redo,
    destroyShape, toggleShapeVisibility, highlightShape, updateShapeProps,
    toggleLayerVisibility,
    // Canvas
    backgroundState, title, snapGrid,
    setBackground, setTitle, setSnapGrid, clearAll, exportPNG, exportJSON, importJSON,
    // Pages
    currentPageId, pages, expiredPages,
    initSession, createPage, switchPage, deletePage, renamePage, dismissExpiredPages, newDocument,
    // Sync distante
    remoteUrl, syncStatus, syncRemote,
    // UI
    sidebarOpen,
    // Zoom
    zoomIn, zoomOut, resetView, fitView,
  }
})
