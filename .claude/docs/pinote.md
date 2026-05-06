# PiNote — Architecture & référence

Bibliothèque Vue 3 de dessin canvas pour notes mathématiques. Construite en mode lib Vite (UMD + ES), Vue est une peer dependency non bundlée.

---

## 1. Points d'entrée

| Fichier | Exporte |
|---|---|
| `src/index.ts` | Tout le core + vue |
| `src/vue/index.ts` | `NoteCanvas` uniquement |
| `dist/pi-note.js` | Build ES lib |
| `dist/pi-note.umd.cjs` | Build UMD lib |

**Aliases Vite :**
- `@core` → `src/core/`
- `@pi-vue` → `src/vue/`

---

## 2. Types (`src/types/index.ts`)

```
ToolType   = 'pen' | 'highlighter' | 'eraser' | 'select' | 'move' | 'vector'
           | 'line' | 'segment' | 'circle' | 'rectangle' | 'polygon'
LayerName  = 'BACKGROUND' | 'REFERENCE' | 'OVERLAY' | 'MAIN' | 'LAYER'
BackgroundMode = 'grid' | 'ruled' | 'hex' | 'none'
ArrowStyle = 'filled' | 'open'
LineStyle  = 'solid' | 'dashed' | 'dotted'
GeomType   = 'line' | 'segment' | 'rectangle' | 'circle' | 'polygon'
```

**Interfaces clés :**
- `StrokePoint` — `{x, y, t, pressure}`
- `ToolMode` — `{id: string; icon: string}` (un mode d'outil : identifiant + clé icône)
- `ToolConfig` — `{tool, color, width, layer, bezier, toolModes: Partial<Record<ToolType, string>>}`
- `ToolMemory` — `Record<ToolType, {color, width}>` (mémoire par outil)
- `BackgroundState` — `{mode, grid?, ruled?, hex?}`
- `GridOptions` — `{size, color?, lineWidth?, majorEvery?, majorColor?, majorWidth?}`
- `RuledOptions` — `{spacing, color?, lineWidth?, marginTop?}`
- `HexOptions` — `{size, orientation?: 'pointy'|'flat', color?, lineWidth?}`
- `ShapeStartConfig` — paramètres passés à `Engine.startShape()`

---

## 3. Pipeline de rendu

```
NoteCanvas.vue  (events pointer)
    └─► Engine
          ├─ ShapeFactory.create()       ← instancie le bon shape
          ├─ SnapManager.snap()          ← ajuste les coordonnées
          │     └─ SpatialIndex.query()  ← lookup spatial O(1)
          │         └─ Strategy[].snap() ← décide le snap
          ├─ Shape.draw(ctx)             ← rendu canvas
          └─ _drawSelectionOverlay()     ← handles UI sur overlay
```

**Layers (z-index) :**

| Layer | Z | Transform | Fond | Rôle |
|---|---|---|---|---|
| BACKGROUND | 1 | non | blanc | fond (grille, réglé, hex) |
| REFERENCE | 2 | oui | transparent | image PDF de référence |
| OVERLAY | 3 | oui | transparent | calque utilisateur supplémentaire |
| MAIN | 4 | oui | transparent | calque principal |
| LAYER | 5 | oui | transparent | calque secondaire |
| _tempLayer | 6 | oui | transparent | preview en cours de dessin |
| overlay | 99 | oui | transparent | snap, handles de sélection |

Le BACKGROUND ne subit pas le `translate/scale` — il est rendu en coordonnées écran direct. Tous les autres layers sont transformés (pan/zoom).

---

## 4. Engine (`src/core/Engine.ts`)

**Constantes :**
- `NO_SNAP_TOOLS` = `{pen, highlighter, eraser}` → pas de snap pour ces outils

**État interne :**
- `_layers` — map name → Layer
- `_shapes: Adaptable[]` — toutes les shapes persistées
- `_currentShape` — shape en cours de dessin
- `_selectedShapeId` — sélection courante (handles UI)
- `_undoStack` — shapes supprimées (pour redo)
- `_viewTransform` — `{x, y, scale}`
- `bezier` — lissage Catmull-Rom pour Stroke

**Méthodes publiques importantes :**

```
startShape(config)           → crée + snap du point de départ
updateShape(x, y)            → met à jour + snap + redessine sur _tempLayer
endShape()                   → finalise, push dans _shapes, saveLocal
cancelShape()                → annule sans sauvegarder

phaseTransition(x, y)        → transition phase 1 → phase 2 (ex: rectangle)
handleDrawClick(x, y)        → multi-click (polygone), retourne 'continue'|'done'

highlightShape(id)           → dessine overlay de sélection
clearHighlight()             → efface overlay
isOverMoveHandle(x, y)       → hit-test handle déplacement
isOverDuplicateHandle(x, y)  → hit-test handle duplication
isOverDeleteHandle(x, y)     → hit-test handle suppression

moveShape(id, dx, dy)        → translate shape + redessine + saveLocal
duplicateShape(id)           → clone JSON + offset 15px + saveLocal
destroyById(id)              → supprime de _shapes + saveLocal
toggleVisibility(id)         → hidden toggle + redessine
updateShapeProps(id, patch)  → patch partiel d'une shape + redessine

findShapeAt(x, y)            → hit-test du plus récent au plus ancien
undo() / redo()              → pile undo/redo

setPageId(id)                → change la clé localStorage (multi-page)
saveLocal() / loadLocal()    → localStorage key = 'pi_note_draft_<pageId>'
toJSONData() / loadFromJSONData(parsed) → sérialisation complète
setBackground(state)         → met à jour le fond
setReferenceBitmap(bitmap)   → image PDF sur le layer REFERENCE
syncRemote(url)              → POST JSON vers une URL distante
setViewTransform(x, y, scale)→ met à jour la transform pan/zoom

getLayer(name) / setLayerVisibility / setLayerOpacity
clearLayer(name) / clearAll()
exportPNG() / exportA4()     → export PNG écran ou format A4
```

**Handles de sélection** (positions en coordonnées monde) :
- Haut-gauche du bounding box + padding 8px
- Move ✛ bleu — `(hx, hy)`
- Duplicate ⧉ bleu — `(hx + 20/scale, hy)`
- Delete ✕ rouge — `(hx + 40/scale, hy)`
- Hit radius : 14px écran

**LocalStorage :** sauvegarde automatique à chaque `endShape`, `moveShape`, `duplicateShape`, `destroyById`. Rollback silencieux si erreur.

**Undo/Redo :** pile simple — undo retire le dernier shape vers `_undoStack`, redo le remet. Toute nouvelle shape invalide `_undoStack`.

---

## 5. Layer (`src/core/Layer.ts`)

Wrapper `<canvas>` avec `position: absolute`, `pointerEvents: none`. Chaque layer possède `visible`, `opacity`, `locked`, `blendMode`. Méthodes : `resize(container)`, `clear()`, `exportPNG()`.

---

## 6. ShapeFactory (`src/core/ShapeFactory.ts`)

Factory statique. Génère les IDs `shape-N` (compteur statique).

| ToolType | Classe | Notes |
|---|---|---|
| pen, highlighter, eraser | `Stroke` | |
| line | `Line` | droite infinie |
| segment | `Segment` | |
| vector | `Segment` | avec `arrowEnd: true` pré-appliqué |
| circle | `Circle` | mode via `config.toolMode ?? 'center-radius'` |
| rectangle | `Rectangle` | mode via `config.toolMode ?? '2pts'` |
| polygon | `Polygon` | |
| text | `TextShape` | |

`fromJSON(data)` — désérialisation pour `loadLocal()`.

`getModes(tool): ToolMode[]` — retourne les modes disponibles pour un outil (`Rectangle.modes`, `Circle.modes`, ou `[]`).

---

## 7. Système de shapes (`src/shapes/`)

### Interface `Adaptable`

Tout shape implémente :
```typescript
id, tool, layer, color, hidden, isIncremental?
draw(ctx)
update?(x, y)
translate(dx, dy)
hitTest(x, y, tolerance): boolean
getSnapPoints(): SnapCandidate[]
getSegments(): Segment[]
getCircles(): CircleGeom[]
getBounds(): Bounds | null
toJSON(): any
```

### `AbstractShape` — base

Contient les champs communs (`id`, `createdAt`, `tool`, `layer`, `color`, `width`, `hidden`) et la méthode statique `distToSegment()`.

### Capacités des shapes

Ces propriétés sont des **champs propres** (`readonly` sur l'instance), pas des getters de prototype — requis pour la réactivité Vue.

| Shape | `canHaveArrows` | `canBeFilled` |
|---|---|---|
| `AbstractShape` (base) | `false` | `false` |
| `Stroke` (pen, highlighter, eraser) | `false` | — |
| `Line` | `false` | — |
| `Segment` | `true` | — |
| `Circle` | — | `true` |
| `Rectangle` | — | `true` |
| `Polygon` | — | `true` |
| `TextShape` | `false` | `false` |

### Shapes concrètes

**`Stroke`** (pen, highlighter, eraser)
- `points: StrokePoint[]`, `isIncremental: true`
- Filtre de distance min 1.2px + lissage moyenne mobile (fenêtre 3) — **cache invalidé** à chaque `addPoint`/`translate`
- Rendu Bézier : Catmull-Rom avec points fantômes aux extrémités
- Eraser : `destination-out`; Highlighter : alpha 0.2
- Snap points : premier + dernier point; Segments : toutes les 5 paires

**`Line`** — droite infinie
- Rendu coupé aux bords canvas (intersection ray-canvas)
- Snap points : `x1,y1` et `x2,y2`

**`Segment`** — segment fini
- Snap points : endpoints + midpoint

**`Circle`** — deux modes
- `cx, cy, radius` (format de stockage commun aux deux modes)
- Mode `'center-radius'` (défaut) : `drawingMode = 'drag'`, `update()` met à jour le rayon
- Mode `'3pts'` : `drawingMode = 'multi-click'`, 3 clics (P1→P2→P3), preview segment pointillé puis cercle pointillé, circumcercle calculé par `_circumcircle()`
- `static modes: ToolMode[]` = `[{id:'center-radius', icon:'circle'}, {id:'3pts', icon:'circle-3pts'}]`
- Snap points : centre + 4 cardinaux (N/S/E/W)

**`Rectangle`** — parallélogramme aligné sur une arête, deux modes
- `p1, p2` (arête), `w` (largeur perpendiculaire signée)
- Mode `'2pts'` (défaut) : `drawingMode = 'drag'`, un seul drag
- Mode `'3pts'` : `drawingMode = 'two-phase'`, phase 1 = arête, phase 2 = largeur
- `static modes: ToolMode[]` = `[{id:'2pts', icon:'tool-rect-2pts'}, {id:'3pts', icon:'tool-rect-3pts'}]`
- `getCorners()` retourne 4 coins

**`TextShape`** — zone de texte avec rendu LaTeX/MathJax
- `x, y, source, fontSize, fontFamily, maxWidth`
- `source` : texte brut + LaTeX inline (`$...$`) et display (`$$...$$`)
- `scheduleRender()` : rendu async via `parseContent` → `renderParagraphs` → cache `_renderedLines`
- `update(x, y)` : redimensionne `maxWidth` lors du drag initial
- Pendant le drag : rectangle en pointillés (placeholder) ; après : texte rendu
- Édition : `TextEditDialog.vue` s'ouvre via double-clic sur la shape
- Snap points : 4 coins + centre de la bounding box
- `isEmpty()` : `source.trim() === ''`
- `static redrawCallback` : injecté par l'Engine/NoteCanvas pour déclencher un re-rendu après le rendu async

**`Polygon`**
- `points[]`, `closed`, `cursorPos?`
- Auto-fermeture si distance ≤ 15px écran du 1er sommet
- Snap points : tous les sommets (corner) + midpoints des arêtes

### Système de modes d'outils

Certaines shapes exposent plusieurs modes de dessin (ex : Rectangle 2pts/3pts, Circle center-radius/3pts). Le mécanisme est entièrement générique.

**Côté shape** — chaque shape avec modes déclare :
```typescript
static readonly modes: ToolMode[] = [
  { id: 'mode-a', icon: 'icon-key-a' },
  { id: 'mode-b', icon: 'icon-key-b' },
]
```
Le constructeur accepte un paramètre `mode` et initialise `drawingMode` en conséquence.

**Côté factory** — `ShapeFactory.getModes(tool)` retourne `Shape.modes` ou `[]`.

**Côté store** — `selectTool(tool)` : si l'outil est déjà actif et a des modes, cycle vers le mode suivant en mettant à jour `tool.toolModes[tool]`.

**Côté UI** — `ToolSelector.vue` appelle `ShapeFactory.getModes(tool)` pour choisir l'icône à afficher (icône du mode courant).

**Côté NoteCanvas** — `startShape()` reçoit `toolMode: store.tool.toolModes[tool]` ; un watch sur `toolModes` annule tout dessin en cours lors d'un changement de mode.

**Pour ajouter un mode à un outil existant :**
1. Ajouter `{ id, icon }` dans `static modes` de la shape
2. Enregistrer dans `ShapeFactory.getModes()`
3. Ajouter l'icône dans `src/vue/icons.ts`
4. Le store, NoteCanvas et ToolSelector fonctionnent sans modification

---

## 8. Système de snap (`src/snap/`)

### `SnapManager`

À chaque update, collecte la géométrie de toutes les shapes (via `SnapWorkerClient` — web worker), puis essaie les stratégies par ordre de priorité décroissante.

**Stratégies actives :**

| Stratégie | Priorité | Comportement |
|---|---|---|
| `PointSnap` | 20 | snap sur endpoints/centres/coins |
| `GridSnap` | 10 | arrondi sur grille (désactivé par défaut) |
| `MidpointSnap` | 5 | snap sur milieux de segments |

**Stratégies stub (non implémentées) :** `AngleSnap`, `AxisSnap`, `IntersectionSnap`, `ProjectionSnap`

Filtre optionnel par `activeLayer` — snaps cross-layer possibles si `layer = null`.

### `SnapWorkerClient` + `snap.worker.ts`

La collecte de géométrie depuis toutes les shapes est déléguée à un Web Worker (`src/snap/snap.worker.ts`) via `SnapWorkerClient`. L'Engine marque la géométrie "dirty" à chaque modification, déclenche un recalcul async, et met en cache `_cachedGeometry` jusqu'au prochain changement.

### `SpatialIndex`

Hash spatial 100px/cellule. Stocke `snapPoints[]`, `segments[]`, `circles[]` par cellule. Méthode `query(x, y)` retourne la cellule contenant le point.

### Feedback visuel

`SnapRenderer` dessine sur l'overlay :
- `point` → cercle
- `midpoint` → croix
- `grid` → carré 8×8

---

## 9. Système d'icônes

### `src/vue/icons.ts`

Catalogue centralisé de toutes les icônes FontAwesome utilisées dans l'UI. Chaque entrée :

```typescript
interface IconDef { viewBox: string; content: string }
export const ICONS: Record<string, IconDef> = { ... }
```

Le `content` est le SVG path brut copié depuis FontAwesome (pas de dépendance npm). **Pour ajouter une icône** : copier le SVG FontAwesome (viewBox + `<path d="..."/>`) et l'ajouter dans ce fichier.

**Clés disponibles :** `arrow-pointer`, `pen-nib`, `highlighter`, `eraser`, `arrows-up-down-left-right`, `draw-polygon`, `rotate-left`, `rotate-right`, `chevron-right/left/up/down`, `xmark`, `magnifying-glass-plus/minus`, `expand`, `compress`, `arrow-left/right`, `play`, `angle-right`, `eye`, `eye-slash`, `trash-can`, `circle`, `circle-3pts`, `square`, `file-arrow-down`, `tool-text`, `tool-line`, `tool-segment`, `tool-vector`, `tool-rect-2pts`, `tool-rect-3pts`.

### `src/vue/components/PiIcon.vue`

```vue
<PiIcon icon="nom-de-licone" />
```

Rendu SVG inline via `v-html` depuis `ICONS[props.icon]`. L'icône hérite de `fill="currentColor"` → contrôlée par CSS `color`.

### `ToolSelector.vue` — `TOOL_ICON`

Mappe chaque `ToolType` à un nom d'icône. **À mettre à jour** lors de l'ajout d'un outil.

---

## 10. Store Pinia (`src/store/useNoteStore.ts`)

PiNote utilise Pinia pour centraliser tout l'état UI. Le store est instancié dans `NoteCanvas.vue` et accessible dans tous les composants enfants via `useNoteStore()` sans prop drilling.

**Initialisation library-safe** dans `NoteCanvas.vue` :
```ts
if (!getActivePinia()) setActivePinia(createPinia())
const store = useNoteStore()
```
Si l'app hôte a déjà un Pinia actif, on le réutilise. Sinon on en crée un local.

**État du store :**

| Clé | Type | Description |
|---|---|---|
| `engine` | `shallowRef<Engine \| null>` | Référence à l'Engine, initialisée par NoteCanvas après `onMounted` |
| `tool` | `reactive<ToolConfig>` | Outil actif (tool, color, width, layer, bezier) |
| `toolMemory` | `reactive<ToolMemory>` | Mémoire couleur/largeur par outil |
| `shapes` | `ref<Adaptable[]>` | Formes persistées (miroir de `engine._shapes`) |
| `selectedShapeId` | `ref<string \| null>` | Shape actuellement sélectionnée |
| `canUndo / canRedo` | `ref<boolean>` | État de la pile undo/redo |
| `layers` | `ref<LayerName[]>` | Noms des calques |
| `backgroundState` | `ref<BackgroundState>` | Config du fond courant |
| `title` | `ref<string>` | Titre du canvas |
| `snapGrid` | `reactive<{enabled, size}>` | Config snap grille |
| `sidebarOpen` | `ref<boolean>` | Visibilité du sidebar |

**Actions principales :**
- `syncFromEngine()` — resynchronise `shapes`, `canUndo`, `canRedo` depuis l'engine
- `selectTool(tool)` — change d'outil en sauvegardant la mémoire couleur/largeur
- `setToolColor(c)` / `setToolWidth(w)` — met à jour et mémorise
- `undo()` / `redo()` / `clearAll()`
- `destroyShape(id)` / `toggleShapeVisibility(id)` / `highlightShape(id|null)`
- `updateShapeProps(id, patch)` — patch d'une shape existante
- `toggleLayerVisibility(name)`
- `setBackground(state)` / `setTitle(v)` / `setSnapGrid(state)`
- `exportPNG(format)` — téléchargement PNG (screen / a4-portrait / a4-landscape / a4-auto)
- `exportJSON()` / `importJSON(file)` — sauvegarde/chargement fichier JSON
- `zoomIn()` / `zoomOut()` / `resetView()` / `fitView()` — délégués à `useCanvasTransform` via `registerZoom()`
- **Multi-page :** `initSession()` · `createPage(name?)` · `switchPage(id)` · `deletePage(id)` · `renamePage(id, name)` · `dismissExpiredPages()`
- **Multi-page PDF :** `appendPdfPages(pdfId, count, baseName)` · `setPdfReference(pageId, pdfId, index)` · `newDocument()`
- **Sync distante :** `syncRemote()` — POST vers `remoteUrl`

**État multi-page :**
- `currentPageId` / `pages: PageEntry[]` — liste `{id, name, updatedAt}`
- `expiredPages: PageEntry[]` — pages non modifiées depuis > 30 jours
- `remoteUrl` / `syncStatus: 'idle'|'syncing'|'ok'|'error'`

**localStorage multi-page :**
- Index : `pi_note_index` = `PageEntry[]`
- Par page : `pi_note_draft_<id>`
- Page courante : `pi_note_current`
- Migration automatique depuis l'ancien `pi_note_draft` (copié vers `pi_note_draft_default`)
- `initSession()` doit être appelé depuis `NoteCanvas.vue` après `store.engine = engine`

---

## 11. Store Pinia (`src/store/usePdfStore.ts`)

Gère le cycle de vie des PDFs importés comme référence.

- `importPdf(file)` — importe un PDF, le stocke dans IndexedDB via `PdfStorage`
- `renderPageForCurrentPage()` — rendu de la page PDF courante → `ImageBitmap` → `engine.setReferenceBitmap()`
- `getThumbnail(pdfId, pageIndex)` / `ensureThumbnail(...)` — cache de miniatures
- `getPdfCanvasSize(pdfId, pageIndex)` — dimensions de la page PDF
- `clearReference()` / `clearCacheForPdf(pdfId)`

**Services associés (`src/services/`) :**
- `PdfRenderer.ts` — rendu d'une page PDF en `ImageBitmap` (via `pdf.js`)
- `PdfStorage.ts` — stockage des fichiers PDF dans IndexedDB
- `PdfThumbnailDb.ts` — cache des miniatures en IndexedDB
- `PageExporter.ts` — export PNG de pages (screen / A4)

---

## 12. Configuration globale (`src/config/PiNoteConfig.ts`)

```typescript
interface PiNoteConfig {
  backendUrl: string
  storageRetentionDays: number   // défaut: 30
  appTitle: string               // défaut: 'PiNote'
  theme: 'light' | 'dark'
  defaults: {
    tool: ToolType               // défaut: 'pen'
    color: string                // défaut: '#000000'
    width: number                // défaut: 2
    background: Partial<BackgroundState>
    snapEnabled: boolean         // défaut: false
    snapSize: number             // défaut: 80
    bezier: boolean              // défaut: true
  }
  colorPresets: { value: string; label: string }[]
  maxPages: number               // défaut: 0 = illimité
}
```

---

## 13. Vue layer (`src/vue/`)

### Organisation des composants

Les composants sont organisés en sous-dossiers par domaine dans `src/vue/components/` :

| Dossier | Contenu |
|---|---|
| `Sidebar/` | Composants de la barre latérale : `NoteSidebar`, `SidebarPanel*`, `ShapeProperties` |
| `Widget/` | Dialogues et sous-composants des widgets : `WidgetDialog`, `GraphEditDialog`, `GraphPanel`, `TextEditDialog` |
| `controls/` | Sélecteurs de contrôle réutilisables : `ToolSelector`, `ColorSelector`, `WidthSelector`, `LayerSelector` |
| (racine) | Composants isolés et pages : `PiIcon`, `ToolHint`, `UtilityMenu`, `PageCard`, `PagePreview`, `PagesDialog`, `ZoomControls` |

### `NoteCanvas.vue`

**Props :** `background`, `snapGridSize`, `snapGridEnabled`
**Emits :** `tool-change`
**Expose :** `engine` (accès direct à l'instance Engine)

Initialise le store, crée l'Engine, enregistre les fonctions de zoom. Contient uniquement la logique de dessin (pointer events) — plus aucun prop/emit vers les composants enfants.

**Flux events :**
```
pointerdown → onPointerDown
pointermove → onPointerMove
pointerup   → onPointerUp
pointerleave/cancel → onPointerUp
```

**Cas spéciaux :**
- Rectangle 3pts : 2 phases (clic P1 → clic P2 → drag largeur) via `two-phase`
- Circle 3pts : 3 clics (P1, P2, P3) via `multi-click`, preview segment puis cercle en pointillés
- Polygon : clic par clic, double-clic ou auto-close
- Text : pointerdown pose l'origine, drag fixe `maxWidth`, double-clic sur shape existante ouvre `TextEditDialog`
- Select : gestion des 3 handles (move/duplicate/delete) via store
- `touchstart` ≥ 2 doigts → annule le dessin en cours

**Composable :** `useCanvasTransform` — zoom/pan souris + touch (pinch)

### `NoteTools.vue`

2 onglets : Dessin / Formes. Branché directement sur le store (`store.selectTool`, `store.setToolColor`, `store.setToolWidth`). La `ToolMemory` est gérée dans le store.

### `NoteSidebar.vue`

Shell accordéon uniquement (topbar + 4 sections). Chaque section délègue à un panel dédié.

| Panel | Fichier | Contenu |
|---|---|---|
| Historique | `Sidebar/SidebarPanelHistory.vue` | Liste des formes + undo/redo (`TOOL_LABEL`) |
| Canvas | `Sidebar/SidebarPanelCanvas.vue` | Titre, fond, snap, export |
| Propriétés | `Sidebar/SidebarPanelProperties.vue` | `Sidebar/ShapeProperties` de la shape sélectionnée |
| Calques | `Sidebar/SidebarPanelLayers.vue` | Visibilité et opacité des calques |
| Zoom | `Sidebar/SidebarPanelZoom.vue` | Boutons zoom/fit/reset |

Tous les panels lisent et écrivent le store directement — aucun prop ni emit.

### `NoteHistory.vue`

Composant autonome (non utilisé dans `NoteCanvas`). Panel fixe haut-droite, rétractable. Conservé pour usage externe éventuel.

### Sub-components

| Composant | Dossier | Rôle |
|---|---|---|
| `ToolSelector` | `controls/` | Grille d'outils avec icônes SVG via `PiIcon` |
| `ColorSelector` | `controls/` | Palette + picker custom (`input[type=color]`) |
| `WidthSelector` | `controls/` | Presets largeur selon outil actif |
| `LayerSelector` | `controls/` | Sélecteur MAIN / LAYER |
| `ShapeProperties` | `Sidebar/` | Formulaire de propriétés d'une shape sélectionnée |
| `GraphEditDialog` | `Widget/` | Dialogue d'édition de graphique |
| `TextEditDialog` | `Widget/` | Dialogue d'édition de texte LaTeX |
| `WidgetDialog` | `Widget/` | Conteneur générique pour dialogues de widget |
| `GraphPanel` | `Widget/` | Panneau de configuration graphique (sous-composant) |
| `ZoomControls` | — | Boutons zoom/fit/reset (bas-droite) |
| `ToolHint` | — | Indice contextuel (raccourcis clavier par outil) |
| `PiIcon` | — | Rendu SVG inline depuis `icons.ts` |
| `PagesDialog` | — | Dialogue de gestion multi-page |
| `PageCard` | — | Carte d'une page dans le dialogue |
| `PagePreview` | — | Miniature d'une page |

### `NotePreview.vue`

Vue lecture seule. Désérialise via `ShapeFactory.fromJSON`, zoom/pan mais pas d'édition.

---

## 14. Composable `useCanvasTransform`

- **Transform state :** `{x, y, scale}` — scale clampé 0.1–10
- `zoomIn/Out` : × 1.15 / × 0.85 centré sur canvas
- `zoomAt(pivotX, pivotY, factor)` : zoom avec pivot (wheel)
- `fitView(shapes)` : calcule le bounding box de toutes les shapes + padding, ajuste scale et position
- `resetView()` : `{x:0, y:0, scale:1}`
- Touch : 1 doigt = pan, 2 doigts = pinch-zoom

---

## 15. Background (`src/core/helper.ts`)

| Fonction | Mode |
|---|---|
| `drawGrid` | grille carrée, support major lines |
| `drawRuled` | lignes horizontales (papier réglé) |
| `drawHex` | grille hexagonale (`pointy` ou `flat`) |

---

## 16. CSS — règles de style pour les composants Vue

**Source unique :** `src/styles/pi-note.css` — compilé par Vite en `dist/pi-note.css`. C'est l'**unique endroit** où ajouter des styles. La bibliothèque étant portable sur d'autres frameworks que Vue, **aucun style ne doit vivre dans les composants**.

**Règles absolues :**
- **Zéro `<style>` dans les fichiers `.vue`** — ni `scoped`, ni global. Tout style va dans `src/styles/pi-note.css`.
- **Toujours utiliser les classes existantes en priorité** avant d'en créer une nouvelle.
- Si une classe manque vraiment, l'ajouter dans `src/styles/pi-note.css` avec un commentaire de section.
- Les variables CSS (`--pn-*`) sont disponibles partout : `--pn-primary`, `--pn-border`, `--pn-text`, `--pn-bg`, etc.

**Classes réutilisables clés :**

| Classe | Usage |
|---|---|
| `.h-row` / `.h-row.active` | Ligne de liste avec état actif (fond bleu clair + bordure gauche) |
| `.h-label` / `.h-label.hidden` | Libellé de ligne (barré + opacité si `.hidden`) |
| `.h-color` | Pastille couleur 10×10px |
| `.btn-icon` / `.btn-icon.del` | Bouton icône discret (emoji/icon), rouge au hover pour `.del` |
| `.msg-empty` | Message "vide" en italique grisé |
| `.history-body` | Conteneur scrollable pour liste de lignes |
| `.btn` / `.btn-active` / `.btn-ghost` / `.btn-sm` / `.btn-danger` | Boutons génériques |
| `.sec-header` / `.sec-title` / `.chevron` / `.chevron.open` | Accordéon sidebar |
| `.text-edit-overlay` | Textarea overlay édition texte (positionnée en absolu sur le canvas) |

---

## 17. Règles de conduite

- **Pas de snap** pour `pen`, `highlighter`, `eraser`
- **Snaps cross-layer** autorisés si `layer = null`
- **BACKGROUND** : jamais de transform canvas
- **Undo/Redo** : pile simple, toute nouvelle shape vide le redo
- **IDs** : compteur statique `ShapeFactory`, format `shape-N` — ne pas manuellement assigner sauf pour `fromJSON`
- **Cache Stroke** : invalider via `addPoint` ou `translate`, jamais manuellement
- **localStorage** clé par page `'pi_note_draft_<pageId>'`, index `'pi_note_index'` — rollback silencieux
- **shallowRef** pour Engine dans NoteCanvas (éviter la réactivité profonde)
- **Handles** : toujours en coordonnées monde, hit radius = 14px écran
- **`canHaveArrows` / `canBeFilled`** : toujours déclarés comme `readonly` sur l'instance (pas de getter de prototype) — requis pour que Vue les détecte dans `ShapeProperties`
- **Pinia** : le store est initialisé dans `NoteCanvas.vue`. Tous les composants enfants appellent `useNoteStore()` sans argument — aucun prop drilling.
- **Store en priorité** : dans les composants Vue de PiNote, toujours préférer `useNoteStore()` pour lire et écrire l'état partagé. Éviter les props et emits sauf pour des données vraiment locales au composant. Exemple : `ToolSelector` lit `store.tool.tool` et appelle `store.selectTool()` directement — pas de `modelValue` ni `@update`.