import type { GameState, GameStats, StoredProfile } from './game/types'

const LEGACY_STORAGE_KEY = 'simbj.blackjack.profile.v1'
const LEGACY_SETTINGS_KEY = 'simbj.blackjack.settings.v1'
const STORAGE_KEY = 'salon21.blackjack.profile.v1'
const SETTINGS_KEY = 'salon21.blackjack.settings.v1'

export type AppLanguage = 'en' | 'fr'

export interface AppPreferences {
    volume: number
    language: AppLanguage
    allowSurrender: boolean
}

export const defaultPreferences: AppPreferences = {
    volume: 0.7,
    language: 'en',
    allowSurrender: false,
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}

function isStats(value: unknown): value is GameStats {
    if (!isRecord(value)) {
        return false
    }

    const numericKeys: Array<keyof GameStats> = [
        'handsPlayed',
        'wins',
        'losses',
        'pushes',
        'blackjacks',
        'surrenders',
        'biggestWin',
        'peakBankroll',
    ]

    return numericKeys.every((key) => typeof value[key] === 'number' && Number.isFinite(value[key]))
}

function isLanguage(value: unknown): value is AppLanguage {
    return value === 'en' || value === 'fr'
}

function parsePreferences(value: unknown): AppPreferences | null {
    if (!isRecord(value)) {
        return null
    }

    if (typeof value.volume !== 'number' || value.volume < 0 || value.volume > 1 || !isLanguage(value.language)) {
        return null
    }

    if ('allowSurrender' in value && typeof value.allowSurrender !== 'boolean') {
        return null
    }

    return {
        volume: value.volume,
        language: value.language,
        allowSurrender: typeof value.allowSurrender === 'boolean' ? value.allowSurrender : defaultPreferences.allowSurrender,
    }
}

export function loadProfile(): StoredProfile | null {
    if (typeof localStorage === 'undefined') {
        return null
    }

    try {
        const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)
        if (!raw) {
            return null
        }

        const parsed = JSON.parse(raw) as unknown
        if (!isRecord(parsed) || typeof parsed.bankroll !== 'number' || typeof parsed.currentBet !== 'number' || !isStats(parsed.stats)) {
            localStorage.removeItem(STORAGE_KEY)
            return null
        }

        const profile = {
            bankroll: parsed.bankroll,
            currentBet: parsed.currentBet,
            stats: parsed.stats,
        }

        if (!localStorage.getItem(STORAGE_KEY)) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
            localStorage.removeItem(LEGACY_STORAGE_KEY)
        }

        return profile
    } catch {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(LEGACY_STORAGE_KEY)
        return null
    }
}

export function saveProfile(state: GameState): void {
    if (typeof localStorage === 'undefined') {
        return
    }

    const payload: StoredProfile = {
        bankroll: state.bankroll,
        currentBet: state.currentBet,
        stats: state.stats,
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function clearProfile(): void {
    if (typeof localStorage === 'undefined') {
        return
    }

    localStorage.removeItem(STORAGE_KEY)
}

export function loadPreferences(): AppPreferences {
    if (typeof localStorage === 'undefined') {
        return { ...defaultPreferences }
    }

    try {
        const raw = localStorage.getItem(SETTINGS_KEY) ?? localStorage.getItem(LEGACY_SETTINGS_KEY)
        if (!raw) {
            return { ...defaultPreferences }
        }

        const preferences = parsePreferences(JSON.parse(raw) as unknown)
        if (!preferences) {
            localStorage.removeItem(SETTINGS_KEY)
            localStorage.removeItem(LEGACY_SETTINGS_KEY)
            return { ...defaultPreferences }
        }

        localStorage.setItem(SETTINGS_KEY, JSON.stringify(preferences))
        localStorage.removeItem(LEGACY_SETTINGS_KEY)

        return preferences
    } catch {
        localStorage.removeItem(SETTINGS_KEY)
        localStorage.removeItem(LEGACY_SETTINGS_KEY)
        return { ...defaultPreferences }
    }
}

export function savePreferences(preferences: AppPreferences): void {
    if (typeof localStorage === 'undefined') {
        return
    }

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(preferences))
}