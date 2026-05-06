---
name: sync-doc
description: >
  Skill PiNote pour synchroniser la documentation d'architecture `.claude/docs/pinote.md`
  avec l'état réel du code. Invoquer avec `/sync-doc`.
  Utiliser quand : la session a modifié des fichiers structurants (types, shapes, store, composants,
  snap, icônes), ou quand l'utilisateur dit "mets à jour la doc", "synchronise pinote.md",
  "la doc est à jour ?". Ne pas invoquer pour de simples corrections de bugs sans impact architectural.
---

# Skill : sync-doc

## Objectif

Comparer `C:\websites\PiNote\.claude\docs\pinote.md` avec l'état réel du code source
et corriger toute divergence — sans réécrire ce qui est encore exact.

## Langue

Toujours répondre en français. Les identifiants de code restent en anglais.

---

## Processus

### Étape 1 — Lire la doc actuelle

Lire intégralement `C:\websites\PiNote\.claude\docs\pinote.md`.

### Étape 2 — Auditer les sections sensibles

Lire les fichiers source correspondant à chaque section de la doc.
Faire les lectures en parallèle autant que possible.

| Section doc | Fichiers à lire |
|---|---|
| §2 Types | `src/types/index.ts` |
| §3 Pipeline | `src/core/Engine.ts` (début — couches, layers) |
| §4 Engine | `src/core/Engine.ts` (méthodes publiques) |
| §6 ShapeFactory | `src/core/ShapeFactory.ts` |
| §7 Shapes | `src/shapes/` — liste des fichiers + `AbstractShape.ts` |
| §8 Snap | `src/snap/strategies/` — liste + statut implémentation |
| §9 Icônes | `src/vue/icons.ts` — liste des clés |
| §10 Store | `src/store/useNoteStore.ts` — état + actions |
| §11 PDF Store | `src/store/usePdfStore.ts` |
| §12 Config | `src/config/PiNoteConfig.ts` |
| §13 Vue | `src/vue/NoteTools.vue`, `src/vue/components/NoteSidebar.vue`, liste composants |
| §15 Background | `src/core/helper.ts` — fonctions exportées |

### Étape 3 — Identifier les écarts

Pour chaque section, noter précisément :
- Ce qui a changé dans le code mais pas dans la doc
- Ce qui est dans la doc mais n'existe plus dans le code
- Ce qui manque dans la doc

Ne pas noter les différences de formulation si le sens est correct.

### Étape 4 — Présenter le bilan à l'utilisateur

Lister les écarts trouvés sous forme concise :
```
§2 Types : 'axes' absent de BackgroundMode → présent dans le code ?
§6 ShapeFactory : outil 'spiral' manquant dans le tableau
§9 Icônes : 3 nouvelles clés non documentées
...
```

Poser la question : **"Souhaites-tu que je corrige tous ces écarts ?"**

### Étape 5 — Corriger la doc

Si l'utilisateur confirme :

- Éditer `pinote.md` section par section avec des `Edit` ciblés
- Ne jamais réécrire une section entière si seul un détail a changé
- Conserver le style et la structure existants
- Mettre à jour les numéros de section si des sections ont été ajoutées ou supprimées

### Étape 6 — Confirmer

Lister les modifications effectuées et signaler si des points restent incertains
(ex : comportement non lisible directement depuis le code).

---

## Règles

- **Lire avant d'écrire** : toujours lire le fichier cible avant tout Edit.
- **Édits chirurgicaux** : préférer plusieurs petits Edit à une réécriture globale.
- **Pas d'invention** : si un comportement n'est pas visible dans le code, ne pas l'ajouter à la doc — le signaler à l'utilisateur.
- **Numéros de section** : vérifier la cohérence après toute addition/suppression de section.
