# Migration vers FSM unique + contrat point-based

Document de référence pour reprendre la refactorisation entamée. À lire en premier dans les sessions suivantes.

## Objectif global

Remplacer les trois protocoles d'interaction actuels (`drag`, `multi-click`, `two-phase`) et leurs hooks éparpillés (`onDrawStart`, `onDrawMove`, `onDrawClick`, `onPhaseTransition`, `onDrawPoint`, `onDrawEnd`, `update`, `isIncremental`, `doubleClickTimeout`) par un seul protocole point-based piloté par une FSM dans l'Engine.

Spec utilisateur :
- pointerdown → stage un point
- pointermove (drag) → preview avec le point pending qui suit le curseur
- pointerup → commit du point pending
- pointerdown sur le 1er point validé (≥ minPoints) → finalize(closed=true) — polygone fermé
- pointerdown sur le dernier point validé (≥ minPoints) → finalize(closed=false) — ligne brisée
- atteindre maxPoints → finalize(closed=false) automatique
- Esc / changement d'outil → cancel

Stroke (pen, highlighter, eraser) est **hors contrat** point-based — geste continu, pression future.

## État actuel (checkpoint)

### Fait

- **Contrat point-based** dans `src/shapes/Adaptable.ts` :
  - `PointBasedShape` (interface)
  - `StrokeBasedShape` (interface)
  - `isPointBased()`, `isStrokeBased()` (type guards)
  - Anciens hooks marqués `@deprecated`
- **Type `Point`** ajouté dans `src/shapes/GeometryTypes.ts`
- **`AbstractPointShape`** (`src/shapes/AbstractPointShape.ts`) : classe abstraite intermédiaire avec `commitPoint`, `previewWith`, `finalize`, gestion de `_points`, et `_syncFromPoints()` à implémenter par les sous-classes
- **Shapes migrées vers `AbstractPointShape`** :
  - `Stroke` — n'utilise pas AbstractPointShape mais implémente `StrokeBasedShape`. Hooks renommés : `onDrawStart`→`onStart`, `onDrawMove`→`onMove`, `onDrawEnd`→`onEnd`. `onDrawPoint`/`update` supprimés (l'engine appellera directement `addPoint`).
  - `Line` (minPoints=2, maxPoints=2)
  - `Segment` (minPoints=2, maxPoints=2)
  - `Rectangle` (minPoints/maxPoints = 2 ou 3 selon mode)

### Reste à faire

#### A. Migrer les shapes restantes vers `AbstractPointShape`

Pour chaque shape : extends `AbstractPointShape`, ajouter `minPoints`, `maxPoints`, implémenter `_syncFromPoints()`, retirer les hooks dépréciés (`onDrawStart`, `onDrawMove`, `onDrawClick`, `onPhaseTransition`, `onDrawEnd`, `update`, `drawingMode`, `doubleClickTimeout`), corriger `translate` pour aussi mettre à jour `_points`, ajuster `isEmpty` pour respecter `minPoints`. Le constructeur doit pouvoir être appelé avec une config "vide" (drawing mode) ou non triviale (fromJSON).

| Shape       | minPts | maxPts | `_syncFromPoints()` |
|-------------|--------|--------|---------------------|
| Circle (cr) | 2      | 2      | `cx,cy = points[0]; radius = dist(p0,p1)` |
| Circle (3pts)| 3     | 3      | `_circumcircle(p0,p1,p2)` (logique existante dans la classe) |
| Polygon     | 3      | ∞      | `points` directement; `finalize(closed)` stocke `this.closed` |
| Arc         | 3      | 3      | p0=centre; p1 fixe startAngle et radius; p2 fixe endAngle et radius |
| TextShape   | 2      | 2      | bounding box : `x=p0.x, y=p0.y, maxWidth=|p1.x-p0.x|` |
| GraphShape  | 2      | 2      | `_cfg.x=p0.x, _cfg.y=p0.y, width=|p1.x-p0.x|, height=|p1.y-p0.y|` |

**Pattern type** (à dériver de `Line.ts` et `Segment.ts`) :

```ts
export class XXX extends AbstractPointShape {
    // Champs cache pour rendu / hitTest / toJSON existants
    public x1: number = 0
    // ...

    readonly minPoints = 2
    readonly maxPoints = 2

    constructor(config: XXXConfig, options) {
        super(options)
        // Pose les champs cache depuis config
        this.x1 = config.x1
        // ...
        // Si config non triviale (fromJSON), reconstruit _points
        if (/* config non triviale */) {
            this._points = [/* ... */]
        }
    }

    protected _syncFromPoints(): void {
        // Met à jour les champs cache depuis this._points
    }

    translate(dx, dy) {
        // Met à jour les champs cache ET _points
        for (const p of this._points) { p.x += dx; p.y += dy }
    }

    isEmpty() {
        if (this._points.length < this.minPoints) return true
        // ...
    }

    // draw, hitTest, toJSON, getSnapPoints, etc. : utilisent les champs cache
}
```

#### B. Refactor Engine (`src/core/Engine.ts`)

Remplacer le bloc "Shape creation" actuel (`startShape` / `phaseTransition` / `handleDrawClick` / `updateShape` / `endShape` / `cancelShape`) par la nouvelle FSM.

**État interne** :
```ts
private _drawState: 'idle' | 'drawing-points' | 'drawing-stroke' = 'idle'
private _currentShape: Adaptable | null = null
private _pendingPoint: Point | null = null
```

**Nouvelle API publique** :
```ts
beginDraw(config: ShapeStartConfig): Adaptable
pointerDown(x: number, y: number): 'staged' | 'closed' | 'noop'
pointerMove(x: number, y: number): void
pointerUp(x: number, y: number): 'continue' | 'finished' | 'dialog'
cancelDraw(): void
isOverFirstPoint(x: number, y: number): boolean
isOverLastPoint(x: number, y: number): boolean
finalizeWidget(): void  // utilisé par commitWidget de NoteCanvas
get currentShape(): Adaptable | null
```

**Logique pointerDown** (point-based) :
1. Si `_currentShape` && `points.length >= minPoints`, hit-test 1er/dernier point (tolérance écran 14px). Si hit → `finalize(closed=true|false)` + commit + `'closed'`. Hit-test prime sur snap.
2. Sinon, applique snap, set `_pendingPoint`, appelle `previewWith(currentShape.points, pendingPoint)`. Retourne `'staged'`.

**Logique pointerMove** (point-based) :
- Si `_pendingPoint` actif : applique snap, met à jour `_pendingPoint`, appelle `previewWith(currentShape.points, _pendingPoint)`, redessine overlay (snap + indicateurs points).

**Logique pointerUp** (point-based) :
- Commit : `currentShape.commitPoint(_pendingPoint)`, set `_pendingPoint = null`.
- Si `currentShape.points.length >= currentShape.maxPoints` : `finalize(false)` + commit dans le layer. Retourne `'finished'`.
- Si `currentShape` est un widget : retourne `'dialog'`.
- Sinon : retourne `'continue'`.

**Logique stroke** :
- pointerDown : crée Stroke via `beginDraw`, addPoint(p0), `onStart(ctx)`. État → `drawing-stroke`.
- pointerMove : `addPoint(p)`, `onMove(p)`, redessine overlay/temp layer (logique existante de `updateShape`).
- pointerUp : `onEnd()`, commit dans layer. Retourne `'finished'`.

**`_drawPointsOverlay()`** (nouveau) : dessine sur l'overlay les points validés (petits cercles gris) + 1er point en anneau vert + dernier point en anneau orange (seulement si `points.length >= minPoints`). Appelé après chaque pointerDown/Move pour les shapes point-based.

**`isOverFirstPoint` / `isOverLastPoint`** : prennent (x,y) en coords monde, hit-test contre `currentShape.points[0]` ou `points[points.length-1]` avec tolérance écran 14px (donc `14 / scale` en monde).

**À conserver tel quel** : tout le reste de l'Engine (snap, layers, draw, undo/redo, selection, drag/duplicate handles, etc.).

#### C. Refactor `ShapeFactory` (`src/core/ShapeFactory.ts`)

Aujourd'hui crée les shapes avec géométrie initiale degenerate (`{x1:x, y1:y, x2:x, y2:y}`). Pour les shapes point-based, créer avec config "vide" (les `_points` seront populés par l'engine via `commitPoint`).

- Pour Line/Segment : `new Line({x1:0, y1:0, x2:0, y2:0}, options)` — degenerate, _points reste vide.
- Pour Rectangle : `new Rectangle({p1:{x:0,y:0}, p2:{x:0,y:0}, w:0}, options, mode)`.
- Pour Circle : `new Circle({cx:0, cy:0, radius:0}, options, mode)`.
- Pour Polygon : `new Polygon({points:[]}, options)`.
- Pour Arc : `new Arc({cx:0, cy:0, radius:0, startAngle:0, endAngle:0, sector:false}, options)`.
- Pour TextShape, GraphShape : idem (config minimale, _points vide).
- Pour Stroke : inchangé.

Le paramètre `x, y` de `ShapeStartConfig` n'est plus utilisé pour les shapes point-based. Il reste utilisé par TextShape/GraphShape via leur config par défaut, mais ces valeurs seront écrasées par le 1er commitPoint. On peut soit :
- garder `x, y` dans `ShapeStartConfig` pour compat fromJSON,
- soit nettoyer ShapeFactory pour qu'il ait un mode `forDrawing` distinct du mode `fromJSON`.

`fromJSON` reste inchangé : il passe la `config` directement au constructeur, qui détecte une config non triviale et populate `_points`.

#### D. Refactor `NoteCanvas.vue` (`src/vue/NoteCanvas.vue`)

**Supprimer** :
- `currentShape: Adaptable | null` local
- `isDrawing`, `isMultiClickDrawing`, `isPhase1Dragging`, `isPhase2Ready`, `lastClickTime`
- Branches multi-click (double-clic, `handleDrawClick`)
- Branche two-phase (`phaseTransition`)
- Appels `currentShape.onDrawPoint(...)`
- Watcher `toolModes` qui réinitialise les flags

**Conserver** :
- `isPanning`, `isMovingShape`, `isDuplicatingShape`, `movePrevPos`
- Logique widget dialog (`_activeWidget`, `commitWidget`, `cancelWidget`)
- Watch sur `store.tool.tool` → `engine.cancelDraw()`
- Pinch-to-zoom → `engine.cancelDraw()`

**Ajouter** :
- Listener `keydown` sur Esc → `engine.cancelDraw()`
- Curseur réactif aux `isOverFirstPoint` / `isOverLastPoint` (vert/orange)

**Squelette nouveaux handlers** :
```ts
function onPointerDown(e) {
  // pan, select, handles : inchangés
  if (!engine.value!.currentShape) {
    engine.value!.beginDraw({ tool, layer, color, width, ... })
  }
  const result = engine.value!.pointerDown(pos.x, pos.y)
  if (result === 'closed') store.syncFromEngine()
}

function onPointerMove(e) {
  // pan, move-shape, hover-cursor : inchangés
  engine.value!.pointerMove(pos.x, pos.y)
}

function onPointerUp(e) {
  // pan, move, dup : inchangés
  const status = engine.value!.pointerUp(pos.x, pos.y)
  if (status === 'finished') store.syncFromEngine()
  else if (status === 'dialog') {
    // Ouvrir widget dialog comme actuellement
    const shape = engine.value!.currentShape
    if (shape instanceof AbstractWidgetShape) { /* ... */ }
  }
}
```

#### E. Cleanup final

Une fois tout migré et testé :

Dans `src/shapes/Adaptable.ts`, supprimer :
- `DrawingMode` et `drawingMode`
- `onDrawStart`, `onDrawMove`, `onDrawClick`, `onDrawPoint`, `onPhaseTransition`, `onDrawEnd`
- `update?(x, y)`, `isIncremental`, `doubleClickTimeout`

Dans `src/shapes/AbstractShape.ts` :
- Supprimer `update?(x, y)` et `isIncremental?: boolean`

## Pièges identifiés

1. **Coexistence `_points` ↔ champs cache (x1, y1, cx, cy, etc.)** : les shapes migrées maintiennent les deux. `_syncFromPoints()` met à jour les champs cache depuis `_points`. `translate()` doit mettre à jour les DEUX. `toJSON()` continue d'utiliser les champs cache (compat localStorage). Évite de modifier `_points` directement, passe toujours par `commitPoint`.

2. **Construction degenerate vs fromJSON** : le constructeur d'une shape doit gérer les deux cas. Pattern : initialiser les champs cache depuis config, puis SI config non triviale, populer `_points`. La détection "config non triviale" varie : Line teste `x2 !== x1 || y2 !== y1`, Rectangle teste la longueur de l'arête ou |w|.

3. **`_syncPreview` réécrit les champs cache à l'état preview** : pendant un drag, `x1/y1/cx/cy/...` reflètent l'état preview (validated + cursor), pas seulement le state validated. Si quelque chose lit ces champs hors du flux preview pendant le drawing, attention. Après `commitPoint`, les champs cache reviennent à l'état validated.

4. **Stroke et l'Engine** : Stroke n'a plus `onDrawStart`/`onDrawPoint`/`onDrawEnd`/`update`. L'Engine doit appeler `onStart` / `addPoint` / `onMove` / `onEnd` directement depuis sa branche stroke.

5. **Polygon — fermeture** : `finalize(closed)` reçoit `true` si l'utilisateur a cliqué sur le 1er point. La shape stocke ça dans `this.closed`. Sa méthode `draw` change selon `closed` (closePath ou non, fill ou non).

6. **Hit-test 1er/dernier point** : dans l'Engine, prend précédence sur le snap au pointerdown. La tolérance est en pixels écran (14px), donc `14 / viewTransform.scale` en coords monde.

7. **Widgets (TextShape, GraphShape)** : flow inchangé côté NoteCanvas — au pointerup final, l'engine retourne `'dialog'` au lieu de finaliser. NoteCanvas ouvre le dialog. À la confirmation, NoteCanvas appelle `engine.finalizeWidget()` (ou méthode équivalente) pour persister la shape dans le layer.

8. **Tests existants** : à inspecter quand on touche au comportement Engine. Probablement des tests qui exercent `startShape`/`endShape`/`phaseTransition`/`handleDrawClick` directement.

## Vérification finale (à exécuter après cleanup)

- `npm run build` passe sans erreur ni warning lié à la refacto
- `npm run test` passe (porter les tests cassés)
- Tests manuels via `npm run dev` :
  - Ligne, Segment : down → drag → up termine
  - Rectangle 2pts et 3pts : down → drag → up (×2 ou ×3 cycles)
  - Circle center-radius et 3pts : idem
  - Polygon : enchaîner down/up, anneau vert apparaît au 3e point, clic dessus ferme; clic sur dernier point termine ouvert
  - Pen / highlighter / eraser : tracé continu, identique à l'actuel
  - TextShape, GraphShape : down → drag → up ouvre dialog → confirm persiste
  - Esc pendant un dessin annule
  - Changement d'outil pendant un dessin annule
  - Snap fonctionne (pas pour pen/highlighter/eraser)
  - Reload : shapes existantes (sauvegardées avant la refacto) se rechargent correctement

## Fichiers de référence

- Plan d'origine : `C:\Users\basil\.claude\plans\curious-frolicking-iverson.md`
- Architecture projet : `.claude/docs/pinote.md`
- Cette doc : `.claude/docs/migration-fsm.md`