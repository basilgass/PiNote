import type {BackgroundState, ToolType} from '../types'

export interface PiNoteConfig {
    backendUrl: string
    storageRetentionDays: number
    appTitle: string
    theme: 'light' | 'dark'
    defaults: {
        tool: ToolType
        color: string
        width: number
        background: Partial<BackgroundState>
        snapEnabled: boolean
        snapSize: number
        bezier: boolean
    }
    colorPresets: { value: string; label: string }[]
    maxPages: number
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
    backendUrl: '',
    storageRetentionDays: 30,
    appTitle: 'PiNote',
    theme: 'light',
    defaults: {
        tool: 'pen',
        color: '#000000',
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
    pointerThresholds: {...defaultConfig.pointerThresholds},
}

export function setConfig(c: Partial<PiNoteConfig>): void {
    _config = {
        ...defaultConfig,
        ...c,
        defaults: {...defaultConfig.defaults, ...(c.defaults ?? {})},
        pointerThresholds: {...defaultConfig.pointerThresholds, ...(c.pointerThresholds ?? {})},
    }
}

export function getConfig(): PiNoteConfig {
    return _config
}
