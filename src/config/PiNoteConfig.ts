import type {BackgroundState, ToolType} from '../types'

export interface PiNoteConfig {
    /** URL du backend pour la sync distante. `false` = mode local (pas de sync). */
    backendUrl: string | false
    storageRetentionDays: number
    appTitle: string
    theme: 'light' | 'dark'
    defaults: {
        tool: ToolType
        colors: {
            /** Couleur globale (slot 1, partagée entre tous les outils) */
            global: string
            /** Couleur par défaut attribuée à chaque outil pour son slot dynamique */
            tool: string
        }
        width: number
        background: Partial<BackgroundState>
        snapEnabled: boolean
        snapSize: number
        bezier: boolean
    }
    colorPresets: { value: string; label: string }[]
    maxPages: number
    /** Flags de debug — utilisés pour tester les interactions sur device sans devtools */
    debug: {
        /** Affiche un HUD fixed en haut listant les derniers pointer events (type, button, aire, classification, override). */
        pointerHud: boolean
        /** Affiche un petit point rose sur chaque point composant un Stroke (pour visualiser la densité). */
        showPoints: boolean
    }
    /** Seuils de classification des pointers par aire de contact (px²) */
    pointerThresholds: {
        /** Aire max en deçà de laquelle un contact est classé `pen` */
        penMaxArea: number
        /** Aire min à partir de laquelle un contact est classé `palm` */
        palmMinArea: number
        /** Multiplicateur appliqué au diamètre équivalent pour obtenir la largeur de la gomme paume */
        palmEraserScale: number
        /** Largeur min (px) de la gomme paume après calibration */
        palmEraserMinWidth: number
        /** Largeur max (px) de la gomme paume après calibration */
        palmEraserMaxWidth: number
    }
}

export const defaultConfig: PiNoteConfig = {
    backendUrl: false,
    storageRetentionDays: 30,
    appTitle: 'PiNote',
    theme: 'light',
    defaults: {
        tool: 'pen',
        colors: {
            global: '#000000',
            tool: '#1e88e5',
        },
        width: 2,
        background: {mode: 'none'},
        snapEnabled: false,
        snapSize: 80,
        bezier: true,
    },
    colorPresets: [
        {value: '#000000', label: 'Noir'},
        {value: '#e53935', label: 'Rouge'},
        {value: '#1e88e5', label: 'Bleu'},
        {value: '#43a047', label: 'Vert'},
    ],
    maxPages: 0,
    debug: {
        pointerHud: false,
        showPoints: false,
    },
    pointerThresholds: {
        penMaxArea: 10,
        palmMinArea: 400,
        palmEraserScale: 2,
        palmEraserMinWidth: 30,
        palmEraserMaxWidth: 200,
    },
}

let _config: PiNoteConfig = {
    ...defaultConfig,
    defaults: {...defaultConfig.defaults},
    debug: {...defaultConfig.debug},
    pointerThresholds: {...defaultConfig.pointerThresholds},
}

export function setConfig(c: Partial<PiNoteConfig>): void {
    _config = {
        ...defaultConfig,
        ...c,
        defaults: {
            ...defaultConfig.defaults,
            ...(c.defaults ?? {}),
            colors: {...defaultConfig.defaults.colors, ...(c.defaults?.colors ?? {})},
        },
        debug: {...defaultConfig.debug, ...(c.debug ?? {})},
        pointerThresholds: {...defaultConfig.pointerThresholds, ...(c.pointerThresholds ?? {})},
    }
}

export function getConfig(): PiNoteConfig {
    return _config
}
