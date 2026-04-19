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
- `C:\websites\PiNote\.claude\docs\pinote.md` — architecture complète (pipeline, shapes, snap, types)
- `C:\websites\PiNote\src\shapes\AbstractShape.ts` — contrat à implémenter (méthodes obligatoires et optionnelles)
- `C:\websites\PiNote\src\shapes\Segment.ts` — exemple de référence pour un outil 2-clics
- `C:\websites\PiNote\src\types\index.ts` — `ToolType`, `ToolMemory`, `ToolConfig`

## Langue

Toujours répondre en français. Les identifiants de code restent en anglais.

---

## Processus (à suivre dans l'ordre)

### Étape 1 — Entrer en mode plan

Appeler `EnterPlanMode` immédiatement. Tout le travail de cette skill se fait en mode plan jusqu'à la confirmation finale de l'utilisateur.

### Étape 2 — Présenter l'outil

En une phrase : nom de l'outil (tiré de ARGUMENTS) et son rôle dans PiNote.

### Étape 3 — Proposer les options

Lister les aspects configurables de l'outil sous forme de choix lettrés (A, B, C…).

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

Lister les points techniques à ne pas oublier lors de l'implémentation :

- **ToolType** : comment étendre le type union dans `src/types/index.ts`
- **ToolMemory** : ajouter l'entrée dans `NoteTools.vue`
- **ShapeFactory** : ajouter le case dans `create()` et `fromJSON()`
- **Snap** : quels points exposer dans `getSnapPoints()` (endpoints, midpoint, etc.)
- **`getSegments()`** : exposer les segments pour que `MidpointSnap` et `IntersectionSnap` puissent les utiliser
- **`getBounds()`** : cas dégénéré si l'outil est un point unique
- **`hitTest()`** : stratégie (distance au segment, au contour, à la zone de la tête de flèche ?)
- **NoteHistory** : label à ajouter dans `TOOL_LABEL` de `NoteHistory.vue`
- **NoteTools** : onglet "Formes" ou "Dessin" ? position dans le tableau d'outils
- **Rendu overlay** : est-ce que la sélection (bounding box) couvre bien l'outil ?

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

À la fin de l'implémentation, ne pas cocher le todo correspondant dans `.claude/docs/todo.md` avant d'avoir posé : **"A-t-on fini avec le todo #titre ? oui / non"** et reçu **"oui"**.