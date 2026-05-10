import { describe, expect, it } from 'vitest'

import { createCard } from './rules'
import { getRecommendedAction } from './strategy'
import type { ActionAvailability, Card } from './types'

function cards(...items: Array<[Card['rank'], Card['suit']]>) {
    return items.map(([rank, suit]) => createCard(rank, suit))
}

function available(enabled = true) {
    return { enabled }
}

function availability(overrides: Partial<ActionAvailability> = {}): ActionAvailability {
    return {
        deal: available(false),
        hit: available(),
        stand: available(),
        double: available(),
        split: available(false),
        insurance: available(false),
        declineInsurance: available(false),
        surrender: available(false),
        nextRound: available(false),
        ...overrides,
    }
}

describe('basic strategy recommendation', () => {
    it('recommends double or its hit fallback for hard totals', () => {
        const hand = cards(['5', 'spades'], ['6', 'hearts'])

        expect(getRecommendedAction(hand, '6', availability({ double: available() }))).toBe('double')
        expect(getRecommendedAction(hand, '6', availability({ double: available(false) }))).toBe('hit')
    })

    it('falls back to the non-pair line when split is unavailable', () => {
        const hand = cards(['8', 'spades'], ['8', 'hearts'])

        expect(getRecommendedAction(hand, '10', availability({ split: available() }))).toBe('split')
        expect(getRecommendedAction(hand, '10', availability({ split: available(false) }))).toBe('hit')
    })

    it('uses surrender fallback rules when surrender is disabled', () => {
        const hand = cards(['10', 'spades'], ['6', 'hearts'])

        expect(
            getRecommendedAction(hand, 'A', availability({ surrender: available() }), { allowSurrender: true }),
        ).toBe('surrender')
        expect(getRecommendedAction(hand, 'A', availability({ surrender: available(false) }), { allowSurrender: false })).toBe('hit')
    })
})