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
}

let _config: PiNoteConfig = {...defaultConfig, defaults: {...defaultConfig.defaults}}

export function setConfig(c: Partial<PiNoteConfig>): void {
    _config = {
        ...defaultConfig,
        ...c,
        defaults: {...defaultConfig.defaults, ...(c.defaults ?? {})},
    }
}

export function getConfig(): PiNoteConfig {
    return _config
}
