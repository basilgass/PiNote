---
name: create-tool
description: >
  Skill PiNote pour créer un nouvel outil de dessin. Invoquer avec `/create-tool #name`.
  Utiliser impérativement ce skill dès que l'utilisateur veut ajouter un outil à PiNote,
  mentionner un todo de type "outil", ou dire "créer l'outil X" dans le contexte PiNote.
  Le skill entre en mode plan, propose des options lettrées, décrit l'interaction canvas,
  pose toutes les questions nécessaires, puis propose d'exécuter une fois les réponses reçues.
---

# Skill : create-tool

## Contexte à lire en premier

Avant de générer quoi que ce soit, lire :
- `C:\websites\PiNote\.claude\docs\pinote.md` — architecture complète (pipeline, shapes, snap, types, système de modes §7)
- `C:\websites\PiNote\src\shapes\AbstractShape.ts` — contrat à implémenter (méthodes obligatoires et optionnelles)
- `C:\websites\PiNote\src\shapes\Segment.ts` — exemple de référence pour un outil 2-clics (drag)
- `C:\websites\PiNote\src\shapes\Circle.ts` — référence pour un outil multi-mode avec `multi-click`
- `C:\websites\PiNote\src\types\index.ts` — `ToolType`, `ToolMode`, `ToolMemory`, `ToolConfig`

## Langue

Toujours répondre en français. Les identifiants de code restent en anglais.

---

## Processus (à suivre dans l'ordre)

### Étape 1 — Entrer en mode plan

Appeler `EnterPlanMode` immédiatement. Tout le travail de cette skill se fait en mode plan jusqu'à la confirmation finale de l'utilisateur.

### Étape 2 — Présenter l'outil

En une phrase : nom de l'outil (tiré de ARGUMENTS) et son rôle dans PiNote.

### Étape 3 — Modes ou outil unique ?

Avant de lister les options, déterminer si l'outil a plusieurs **modes de dessin** (interactions canvas différentes, icônes distinctes) ou s'il est monolithique.

**Quand créer un mode plutôt qu'un nouvel outil :**
- Le résultat final est le même type de shape (ex : deux façons de dessiner un cercle → même `Circle`)
- L'interaction change mais les propriétés visuelles restent identiques (couleur, épaisseur, remplissage)
- L'utilisateur bascule entre les modes en recliquant sur le même bouton d'outil

**Quand créer un outil séparé :**
- Le résultat est une shape de nature différente (ex : `Line` ≠ `Segment`)
- Les propriétés visuelles ou le comportement post-dessin diffèrent

**Si l'outil a des modes :**
- Déclarer `static readonly modes: ToolMode[]` sur la shape (voir §7 de pinote.md)
- Enregistrer dans `ShapeFactory.getModes()`
- Ajouter une icône par mode dans `src/vue/icons.ts`
- Le store, NoteCanvas et ToolSelector fonctionnent sans modification

**Si l'outil est unique :**
- Pas de `static modes` nécessaire

Ensuite, lister les aspects configurables sous forme de choix lettrés (A, B, C…).

Pour chaque option :
- Décrire ce qu'elle fait
- Indiquer la valeur recommandée par défaut et pourquoi
- Laisser l'utilisateur confirmer, modifier ou rejeter

Exemples d'aspects à couvrir selon le type d'outil :
- Variantes visuelles (ex : type de tête de flèche : triangle plein, ouvert, cercle…)
- Présence aux deux extrémités (start / end)
- Style de trait (plein, pointillé, tirets)
- Remplissage éventuel
- Toute option spécifique au domaine mathématique (ex : double flèche ↔ pour vecteur)

Ne pas inventer des options superflues : rester centré sur ce qui a une vraie valeur pour les notes mathématiques.

### Étape 4 — Décrire l'interaction canvas

Expliquer pas à pas comment l'outil se dessine :
- Nombre de clics / phases
- Ce qui se passe à chaque événement pointer (down, move, up)
- Analog existant dans PiNote (ex : "identique à Segment : pointerdown = P1, pointermove = preview, pointerup = P2 validé")
- Cas limites : que se passe-t-il si les deux points sont confondus ? annulation ?

### Étape 5 — Suggestions constructives

#### Checklist outil complet (nouvel outil = nouvelle shape)

Lister les points techniques à ne pas oublier lors de l'implémentation :

- **ToolType** : étendre le type union dans `src/types/index.ts` (et `GeomType` si c'est une forme géométrique)
- **ToolMemory** : ajouter `{ color: '', width: 2 }` dans `toolMemory` du store (`useNoteStore.ts`)
- **ShapeFactory** : ajouter le `case` dans `create()`
- **Snap** : quels points exposer dans `getSnapPoints()` (endpoints, midpoint, corners, etc.)
- **`getSegments()`** : exposer les segments pour que `MidpointSnap` et `IntersectionSnap` puissent les utiliser
- **`getBounds()`** : cas dégénéré si l'outil est un point unique
- **`hitTest()`** : stratégie (distance au segment, au contour, à la zone de la tête de flèche ?)
- **Icône** : ajouter l'entrée dans `src/vue/icons.ts` (`{ viewBox, content }` — chemin SVG) puis ajouter le nom dans `TOOL_ICON` de `ToolSelector.vue` ; rendu via `<PiIcon>`
- **NoteHistory** : label à ajouter dans `TOOL_LABEL` de `NoteHistory.vue` **et** de `SidebarPanelHistory.vue`
- **NoteTools** : onglet "Formes" ou "Dessin" ? position dans le tableau d'outils
- **Rendu overlay** : est-ce que la sélection (bounding box) couvre bien l'outil ?

#### Checklist mode d'outil (variante d'une shape existante)

Si l'étape 3 a conclu qu'il s'agit d'un **nouveau mode** d'un outil existant :

- **Shape** : ajouter `{ id, icon }` dans `static readonly modes: ToolMode[]` de la classe
- **Constructeur** : le 3e paramètre `mode` conditionne `drawingMode` et la logique `update/onDrawMove/onDrawClick`
- **Hooks** : implémenter les hooks nécessaires selon le `drawingMode` choisi :
  - `'drag'` : `update(x, y)` suffit
  - `'two-phase'` : `onPhaseTransition(x, y, ctx)` pour la transition
  - `'multi-click'` : `onDrawStart`, `onDrawMove` (retourne `true`), `onDrawClick` (retourne `'continue'|'done'`), `onDrawEnd`
- **Preview pointillés** : dans `draw()`, distinguer la phase de preview (état interne `_cursor != null`) pour dessiner en pointillés ; `onDrawEnd()` vide l'état temporaire
- **Sérialisation** : vérifier que `toJSON()` stocke le format final (ex : `{cx, cy, radius}`) indépendamment du mode de dessin
- **ShapeFactory.getModes()** : enregistrer la shape si ce n'est pas déjà fait
- **Icône** : une icône par mode dans `src/vue/icons.ts` (viewBox + content SVG)
- **Store, NoteCanvas, ToolSelector** : aucune modification nécessaire grâce au système générique

### Étape 6 — Questions ouvertes

Numéroter et poser toutes les questions encore sans réponse après les étapes précédentes. Attendre les réponses de l'utilisateur avant de passer à la suite.

Exemples de questions typiques :
1. Confirmes-tu les options A, B, C telles que proposées, ou des ajustements ?
2. L'outil doit-il être dans l'onglet "Formes" ou "Dessin" ?
3. Des contraintes de snap particulières (ex : forcer les angles à 45°) ?
4. Un comportement spécial à l'annulation (Échap) ?

### Étape 7 — Récapitulatif et proposition d'exécution

Une fois toutes les réponses reçues :

1. Résumer le plan final sous forme de liste structurée :
   - Fichiers à créer / modifier
   - Options retenues
   - Interaction canvas
   - Points techniques

2. Poser la question : **"Souhaites-tu que j'exécute ce plan ?"**

3. Si oui : quitter le mode plan (`ExitPlanMode`) et implémenter.  
   Si non : reprendre les points à ajuster.

---

## Rappel post-implémentation

À la fin de l'implémentation :

1. **Todo** : ne pas cocher le todo correspondant dans `.claude/docs/todo.md` avant d'avoir posé : **"A-t-on fini avec le todo #titre ? oui / non"** et reçu **"oui"**.

2. **Doc** : mettre à jour `C:\websites\PiNote\.claude\docs\pinote.md` pour refléter le nouvel outil. Sections à vérifier et corriger si nécessaire :

   *Nouvel outil (nouvelle shape) :*
   - §2 Types — ajouter le nouveau `ToolType` dans l'union (et `GeomType` si applicable)
   - §6 ShapeFactory — ajouter la ligne dans le tableau ToolType → Classe
   - §7 Shapes — tableau des capacités + description de la shape
   - §9 Icônes — ajouter la clé d'icône dans la liste des clés disponibles
   - §13 Vue layer — cas spécial si interaction non standard dans NoteCanvas

   *Nouveau mode d'un outil existant :*
   - §7 Shapes — mettre à jour la description de la shape (modes, drawingMode, hooks)
   - §9 Icônes — ajouter la clé d'icône du nouveau mode