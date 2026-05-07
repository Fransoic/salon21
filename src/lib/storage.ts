import type { GameState, GameStats, StoredProfile } from './game/types'

const STORAGE_KEY = 'simbj.blackjack.profile.v1'
const SETTINGS_KEY = 'simbj.blackjack.settings.v1'

export type AppLanguage = 'en' | 'fr'

export interface AppPreferences {
    volume: number
    language: AppLanguage
}

export const defaultPreferences: AppPreferences = {
    volume: 0.7,
    language: 'en',
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

function isPreferences(value: unknown): value is AppPreferences {
    return isRecord(value)
        && typeof value.volume === 'number'
        && value.volume >= 0
        && value.volume <= 1
        && isLanguage(value.language)
}

export function loadProfile(): StoredProfile | null {
    if (typeof localStorage === 'undefined') {
        return null
    }

    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) {
            return null
        }

        const parsed = JSON.parse(raw) as unknown
        if (!isRecord(parsed) || typeof parsed.bankroll !== 'number' || typeof parsed.currentBet !== 'number' || !isStats(parsed.stats)) {
            localStorage.removeItem(STORAGE_KEY)
            return null
        }

        return {
            bankroll: parsed.bankroll,
            currentBet: parsed.currentBet,
            stats: parsed.stats,
        }
    } catch {
        localStorage.removeItem(STORAGE_KEY)
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
        const raw = localStorage.getItem(SETTINGS_KEY)
        if (!raw) {
            return { ...defaultPreferences }
        }

        const parsed = JSON.parse(raw) as unknown
        if (!isPreferences(parsed)) {
            localStorage.removeItem(SETTINGS_KEY)
            return { ...defaultPreferences }
        }

        return parsed
    } catch {
        localStorage.removeItem(SETTINGS_KEY)
        return { ...defaultPreferences }
    }
}

export function savePreferences(preferences: AppPreferences): void {
    if (typeof localStorage === 'undefined') {
        return
    }

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(preferences))
}