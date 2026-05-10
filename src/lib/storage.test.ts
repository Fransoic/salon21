import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { defaultPreferences, loadPreferences, savePreferences } from './storage'

type StorageShape = Pick<Storage, 'clear' | 'getItem' | 'removeItem' | 'setItem'>

function createStorage(): StorageShape {
    const values = new Map<string, string>()

    return {
        clear() {
            values.clear()
        },
        getItem(key) {
            return values.get(key) ?? null
        },
        removeItem(key) {
            values.delete(key)
        },
        setItem(key, value) {
            values.set(key, value)
        },
    }
}

describe('preferences storage', () => {
    beforeEach(() => {
        Object.defineProperty(globalThis, 'localStorage', {
            configurable: true,
            value: createStorage(),
        })
    })

    afterEach(() => {
        Reflect.deleteProperty(globalThis, 'localStorage')
    })

    it('defaults strategy hints to disabled', () => {
        expect(loadPreferences()).toEqual(defaultPreferences)
    })

    it('keeps strategy hints when preferences are saved', () => {
        const nextPreferences = {
            ...defaultPreferences,
            language: 'fr' as const,
            showStrategyHint: true,
        }

        savePreferences(nextPreferences)

        expect(loadPreferences()).toEqual(nextPreferences)
    })

    it('backfills missing strategy hint settings from older saved preferences', () => {
        globalThis.localStorage.setItem(
            'salon21.blackjack.settings.v1',
            JSON.stringify({
                volume: 0.5,
                language: 'en',
                allowSurrender: true,
            }),
        )

        expect(loadPreferences()).toEqual({
            volume: 0.5,
            language: 'en',
            allowSurrender: true,
            showStrategyHint: false,
        })
    })
})