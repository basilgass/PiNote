# PiNote — Todo & améliorations

## Outils / fonctionnalités

- [ ] **A. Outil Texte** — Shape `Text` (outil `text`) : clic pour placer, saisie inline, rendu canvas, snap sur points existants
- [x] **B. Clear / Reset** — Exposer `engine.clearAll()` dans l'UI (bouton dans NoteHistory ou NoteTools) avec confirmation
- [ ] **C. Sélection multiple** — Drag-select ou Shift+clic pour grouper des shapes, puis déplacer/supprimer le groupe
- [x] **D. Outil Arrow** — Shape dérivée de Segment avec options `arrowStart`/`arrowEnd` (flèches aux extrémités)
- [x] **E. Export PNG/SVG** — Bouton export dans l'UI ; PNG via `Layer.exportPNG()` à agréger ; SVG = conversion shapes → SVG nodes

---

## Snap

- [ ] **F. IntersectionSnap** — Snap sur l'intersection calculée de deux segments/droites (stub en place dans `src/snap/strategies/`)
- [ ] **G. AngleSnap** — Contraindre les angles à 15°/30°/45°/90° lors du dessin de droites et segments (stub en place)
- [ ] **H. ProjectionSnap** — Snap sur la projection orthogonale d'un point sur un segment existant (stub en place)

---

## Persistance

- [x] **I. Multi-session localStorage** — Plusieurs "pages" nommées (`pi_note_draft_<id>` + index), actuellement une seule clé fixe
- [x] **J. Auto-expiry / timeout** — Sauvegarder un timestamp avec le draft ; warning si draft > N jours, proposition de suppression
- [x] **K. Export/Import JSON** — Télécharger le draft courant en `.json` / importer depuis fichier (backup manuel sans backend)
- [x] **L. Backend / database output** — `engine.syncRemote(url)` : POST JSON shapes vers URL configurable, sans changer l'architecture

---

## Performance / scalabilité

- [ ] **M. Rendu incrémental (dirty-flag)** — Ne redessiner que le layer modifié au lieu du `draw()` complet (`excludeLayer` existe mais non systématisé)
- [ ] **N. Web Worker pour le snap** — Déplacer `SnapManager.snap()` dans un Worker pour ne pas bloquer le thread UI sur canvas très chargé
- [ ] **O. Virtualisation historique** — NoteHistory lent avec beaucoup de shapes → virtualiser la liste (sliding window ou `@tanstack/virtual`)

---

## Workflow / UX

- [ ] **P. Raccourcis clavier** — `Ctrl+Z/Y` undo/redo, `Suppr` supprime la sélection, `D` duplique, `Échap` désélectionne / annule polygone en cours
- [ ] **Q. Grille visuelle toggleable** — Afficher/masquer la grille de snap dans le background (couplée à `snapGridEnabled`)
- [ ] **R. Propriétés de shape sélectionnée** — Panel contextuel sur sélection : modifier couleur, largeur, layer d'une shape existante
- [ ] **S. Verrouillage de shape** — Propriété `locked: boolean` sur `Adaptable` — shape non déplaçable/supprimable par l'UI
- [ ] **T. Snapshots nommés** — `saveSnapshot(name)` dans localStorage, liste et restauration d'états nommés

---

## Refactoring / dette technique

- [ ] **U. Snap strategies manquantes** — Implémenter `AngleSnap`, `AxisSnap`, `IntersectionSnap`, `ProjectionSnap` (stubs en place dans `src/snap/strategies/`)
- [ ] **V. Unifier `_handlePositions` et le rendu** — `_drawSelectionOverlay` recalcule `gap` localement alors que `_handlePositions` le fait déjà — dédupliquer
- [ ] **W. Tests unitaires shapes** — Vitest sur `hitTest`, `getBounds`, `getSnapPoints` pour chaque shape (actuellement non couverts)
- [ ] **X. Composable `useToolMemory`** — Extraire la logique de mémoire par outil de `NoteTools.vue` vers un composable dédié