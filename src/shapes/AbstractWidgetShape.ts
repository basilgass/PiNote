import { AbstractPointShape } from './AbstractPointShape'
import type { ShapeOptions } from './Adaptable'

export abstract class AbstractWidgetShape extends AbstractPointShape {
    readonly needsDialog = true as const

    /** Tous les widgets actuels sont des bounding-box à 2 points (coin haut-gauche / coin bas-droit). */
    readonly minPoints = 2
    readonly maxPoints = 2

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
