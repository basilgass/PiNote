import { AbstractShape } from './AbstractShape'
import type { ShapeOptions } from './Adaptable'

export abstract class AbstractWidgetShape extends AbstractShape {
    readonly needsDialog = true as const

    constructor(options: Partial<ShapeOptions> = {}) {
        super(options)
    }

    /** Props passées au composant dialog via v-bind */
    abstract getDialogProps(): Record<string, unknown>

    /** Applique la config validée par l'utilisateur */
    abstract applyConfig(config: unknown): void

    /** Vérifie que la zone dessinée est suffisamment grande pour ouvrir le dialog */
    abstract hasSufficientSize(): boolean
}
