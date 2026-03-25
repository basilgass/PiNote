# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Dev server (Vite)
npm run build    # Library build (outputs dist/pi-note.*)
npm run test     # Run tests (Vitest)
```

Run a single test file:
```bash
npx vitest run tests/path/to/file.test.ts
```

## Architecture

PiNote is a Vue 3 canvas library for drawing mathematical notes. It is built as a reusable library (UMD, entry: `src/index.ts`).

### Core rendering pipeline

`NoteCanvas.vue` → `Engine` → `Layer[]` → `CanvasRenderingContext2D`

- **Engine** (`src/core/Engine.ts`): Central orchestrator. Manages 3 named layers (`BACKGROUND`, `MAIN`, `LAYER`) plus an overlay. Handles shape lifecycle (`startShape` / `updateShape` / `endShape`), snap integration, background rendering (grid/ruled/axes), and LocalStorage persistence.
- **Layer** (`src/core/Layer.ts`): Thin wrapper over an HTML `<canvas>` with visibility, opacity, blend mode, resize, and PNG export.
- **ShapeFactory** (`src/core/ShapeFactory.ts`): Static factory that creates the right shape class from a `ToolType`. Assigns auto-incremented IDs (`shape-N`).

### Shape system

All shapes extend `AbstractShape` and implement `Adaptable`:

- `draw(ctx)` — render to canvas
- `getSnapPoints()` — expose snap candidate points
- `getSegments()` / `getCircles()` — expose geometry for snapping
- `toJSON()` — serialization
- `update?(x, y)` — optional interactive update (used during drawing)
- `isIncremental` — if true, shape is updated point-by-point (used by `Stroke`)

Shapes live in `src/shapes/`: `Stroke`, `Line`, `Circle`, `Rectangle`.

### Snap system (`src/snap/`)

Strategy pattern. `SnapManager` holds a list of `SnapStrategy` implementations, each with a `priority`. On each pointer move, it rebuilds the `SpatialIndex` from all existing shapes' snap points, then queries strategies in priority order until one returns a result.

- Strategies: `GridSnap` (priority 10), `MidpointSnap`, `PointSnap`, `AngleSnap`, `AxisSnap`, `IntersectionSnap`, `ProjectionSnap`
- `SnapRenderer` / `SnapIndicator` handle visual feedback on the overlay canvas
- `Engine.NO_SNAP_TOOLS`: pen, highlighter, and eraser bypass snapping

### Vue layer (`src/vue/`)

`NoteCanvas.vue` is the main component. It handles mouse/touch events, applies DPI scaling, and drives the Engine. Sub-components (`ToolSelector`, `ColorSelector`, `WidthSelector`, `LayerSelector`, `UtilityMenu`) are UI controls. `NoteHistory.vue` exposes undo/redo.

### Path aliases (vite.config.ts)

- `@core` → `src/core`
- `@pi-vue` → `src/vue`