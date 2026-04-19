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
ToolType   = 'pen' | 'highlighter' | 'eraser' | 'select' | 'move'
           | 'line' | 'segment' | 'circle' | 'rectangle' | 'polygon'
LayerName  = 'BACKGROUND' | 'MAIN' | 'LAYER'
BackgroundMode = 'grid' | 'ruled' | 'axes' | 'none'
```

**Interfaces clés :**
- `StrokePoint` — `{x, y, t, pressure}`
- `ToolConfig` — `{tool, color, width, layer, bezier}`
- `ToolMemory` — `Record<ToolType, {color, width}>` (mémoire par outil)
- `BackgroundState` — `{mode, grid?, ruled?, axes?}`
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

| Layer | Z | Transform | Fond |
|---|---|---|---|
| BACKGROUND | 1 | non | blanc |
| MAIN | 2 | oui | transparent |
| LAYER | 3 | oui | transparent |
| overlay | 99 | oui | transparent |

Le BACKGROUND ne subit pas le `translate/scale` — il est rendu en coordonnées monde direct. Les autres layers sont transformés.

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
startShape(config)         → crée + snap du point de départ
updateShape(x, y)          → met à jour + snap + redessine
endShape()                 → finalise, push dans _shapes, saveLocal
cancelShape()              → annule sans sauvegarder

setRectP2(x, y)            → phase 2 rectangle
addPolygonVertex(x, y)     → ajoute sommet, retourne true si fermé

highlightShape(id)         → dessine overlay de sélection
clearHighlight()           → efface overlay
isOverMoveHandle(x, y)     → hit-test handle déplacement
isOverDuplicateHandle(x,y) → hit-test handle duplication
isOverDeleteHandle(x, y)   → hit-test handle suppression

moveShape(id, dx, dy)      → translate shape + redessine + saveLocal
duplicateShape(id)         → clone JSON + offset 15px + saveLocal
destroyById(id)            → supprime de _shapes + saveLocal
toggleVisibility(id)       → hidden toggle + redessine

findShapeAt(x, y)          → hit-test du plus récent au plus ancien
undo() / redo()            → pile undo/redo

saveLocal() / loadLocal()  → localStorage key = 'pi_note_draft'
setBackground(state)       → met à jour le fond
getLayer(name) / setLayerVisibility / setLayerOpacity
clearLayer(name) / clearAll()
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

| ToolType | Classe |
|---|---|
| pen, highlighter, eraser | `Stroke` |
| line | `Line` |
| segment | `Segment` |
| circle | `Circle` |
| rectangle | `Rectangle` |
| polygon | `Polygon` |

`fromJSON(data)` — désérialisation pour `loadLocal()`.

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

**`Circle`**
- `cx, cy, radius`
- Snap points : centre + 4 cardinaux (N/S/E/W)

**`Rectangle`** — parallélogramme aligné sur une arête
- `p1, p2` (arête), `w` (largeur perpendiculaire signée)
- Phase 1 : arête en pointillés; Phase 2 : rectangle complet
- `getCorners()` retourne 4 coins

**`Polygon`**
- `points[]`, `closed`, `cursorPos?`
- Auto-fermeture si distance ≤ 15px écran du 1er sommet
- Snap points : tous les sommets (corner) + midpoints des arêtes

---

## 8. Système de snap (`src/snap/`)

### `SnapManager`

À chaque update, rebuild le `SpatialIndex` depuis toutes les shapes, puis essaie les stratégies par ordre de priorité décroissante.

**Stratégies actives :**

| Stratégie | Priorité | Comportement |
|---|---|---|
| `PointSnap` | 20 | snap sur endpoints/centres/coins |
| `MidpointSnap` | 5 | snap sur milieux de segments |
| `GridSnap` | 10 | arrondi sur grille (par défaut désactivé) |

**Stratégies stub (non implémentées) :** `AngleSnap`, `AxisSnap`, `IntersectionSnap`, `ProjectionSnap`

Filtre optionnel par `activeLayer` — snaps cross-layer possibles si layer = null.

### `SpatialIndex`

Hash spatial 100px/cellule. Stocke `snapPoints[]`, `segments[]`, `circles[]` par cellule. Méthode `query(x, y)` retourne la cellule contenant le point.

### Feedback visuel

`SnapRenderer` dessine sur l'overlay :
- `point` → cercle
- `midpoint` → croix
- `grid` → carré 8×8

---

## 9. Store Pinia (`src/store/useNoteStore.ts`)

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

## 10. Vue layer (`src/vue/`)  <!-- anciennement §9 -->

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
- Rectangle : 2 phases (clic P1 → clic P2 → drag largeur)
- Polygon : clic par clic, double-clic ou auto-close
- Select : gestion des 3 handles (move/duplicate/delete) via store
- `touchstart` ≥ 2 doigts → annule le dessin en cours

**Composable :** `useCanvasTransform` — zoom/pan souris + touch (pinch)

### `NoteTools.vue`

2 onglets : Dessin / Formes. Branché directement sur le store (`store.selectTool`, `store.setToolColor`, `store.setToolWidth`). La `ToolMemory` est gérée dans le store.

### `NoteSidebar.vue`

Shell accordéon uniquement (topbar + 4 sections). Chaque section délègue à un panel dédié.

| Panel | Fichier | Contenu |
|---|---|---|
| Historique | `SidebarPanelHistory.vue` | Liste des formes + undo/redo |
| Canvas | `SidebarPanelCanvas.vue` | Titre, fond, snap, export |
| Propriétés | `SidebarPanelProperties.vue` | `ShapeProperties` de la shape sélectionnée |
| Zoom | `SidebarPanelZoom.vue` | Boutons zoom/fit/reset |

Tous les panels lisent et écrivent le store directement — aucun prop ni emit.

### `NoteHistory.vue`

Composant autonome (non utilisé dans `NoteCanvas`). Panel fixe haut-droite, rétractable. Conservé pour usage externe éventuel.

### Sub-components

| Composant | Rôle |
|---|---|
| `ToolSelector` | Grille d'outils avec icônes SVG |
| `ColorSelector` | Palette + picker custom (`input[type=color]`) |
| `WidthSelector` | Presets largeur selon outil actif |
| `LayerSelector` | Sélecteur MAIN / LAYER |
| `ZoomControls` | Boutons zoom/fit/reset (bas-droite) |
| `ShapeProperties` | Formulaire de propriétés d'une shape sélectionnée |

### `NotePreview.vue`

Vue lecture seule. Charge `'pi_note_draft'` du localStorage, désérialise via `ShapeFactory.fromJSON`, zoom/pan mais pas d'édition.

---

## 11. Composable `useCanvasTransform`

- **Transform state :** `{x, y, scale}` — scale clampé 0.1–10
- `zoomIn/Out` : × 1.15 / × 0.85 centré sur canvas
- `zoomAt(pivotX, pivotY, factor)` : zoom avec pivot (wheel)
- `fitView(shapes)` : calcule le bounding box de toutes les shapes + padding, ajuste scale et position
- `resetView()` : `{x:0, y:0, scale:1}`
- Touch : 1 doigt = pan, 2 doigts = pinch-zoom

---

## 12. Background (`src/core/helper.ts`)

| Fonction | Mode |
|---|---|
| `drawGrid` | grille carrée, support major lines |
| `drawRuled` | lignes horizontales (papier réglé) |
| `drawAxes` | axes X/Y avec flèches et graduations |

Modes d'origine pour axes : `'center'`, `'bottom'`, `'bottom-left'`, `'manual'`.

---

## 13. CSS — règles de style pour les composants Vue

Les classes globales PiNote sont définies dans `dist/pi-note.css` (source : les `<style>` non-scoped des composants, compilés par Vite). **Toujours utiliser ces classes en priorité** avant d'en créer de nouvelles.

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

**Règles :**
- **Pas de `<style scoped>`** dans les composants Vue de PiNote — utiliser les classes globales existantes.
- Si une classe manque vraiment, la demander avant de la créer.
- Les variables CSS (`--pn-*`) sont disponibles partout : `--pn-primary`, `--pn-border`, `--pn-text`, `--pn-bg`, etc.

---

## 14. Règles de conduite

- **Pas de snap** pour `pen`, `highlighter`, `eraser`
- **Snaps cross-layer** autorisés si `layer = null`
- **BACKGROUND** : jamais de transform canvas
- **Undo/Redo** : pile simple, toute nouvelle shape vide le redo
- **IDs** : compteur statique `ShapeFactory`, format `shape-N` — ne pas manuellement assigner sauf pour `fromJSON`
- **Cache Stroke** : invalider via `addPoint` ou `translate`, jamais manuellement
- **localStorage** clé fixe `'pi_note_draft'` — rollback silencieux
- **shallowRef** pour Engine dans NoteCanvas (éviter la réactivité profonde)
- **Handles** : toujours en coordonnées monde, hit radius = 14px écran
- **`canHaveArrows` / `canBeFilled`** : toujours déclarés comme `readonly` sur l'instance (pas de getter de prototype) — requis pour que Vue les détecte dans `ShapeProperties`
- **Pinia** : le store est initialisé dans `NoteCanvas.vue`. Tous les composants enfants appellent `useNoteStore()` sans argument — aucun prop drilling.
- **Store en priorité** : dans les composants Vue de PiNote, toujours préférer `useNoteStore()` pour lire et écrire l'état partagé. Éviter les props et emits sauf pour des données vraiment locales au composant. Exemple : `ToolSelector` lit `store.tool.tool` et appelle `store.selectTool()` directement — pas de `modelValue` ni `@update`.