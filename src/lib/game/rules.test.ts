import { describe, expect, it } from 'vitest'

import { canSplitHand, createCard, dealerShouldDraw, resolveHand, scoreHand } from './rules'
import type { PlayerHand } from './types'

function makeHand(cards = [createCard('A', 'spades'), createCard('K', 'hearts')], overrides: Partial<PlayerHand> = {}): PlayerHand {
    return {
        id: 'test-hand',
        cards,
        bet: 25,
        isComplete: false,
        isDoubled: false,
        isSplitHand: false,
        isSplitAces: false,
        result: null,
        ...overrides,
    }
}

describe('rules', () => {
    it('scores a soft 17 correctly', () => {
        const score = scoreHand([createCard('A', 'spades'), createCard('6', 'hearts')])

        expect(score.total).toBe(17)
        expect(score.isSoft).toBe(true)
        expect(score.isBust).toBe(false)
    })

    it('stands on soft 17 for the dealer', () => {
        expect(dealerShouldDraw([createCard('A', 'spades'), createCard('6', 'clubs')])).toBe(false)
    })

    it('pays a natural blackjack at 3:2', () => {
        const result = resolveHand(
            makeHand([createCard('A', 'spades'), createCard('K', 'hearts')]),
            [createCard('9', 'clubs'), createCard('7', 'diamonds')],
        )

        expect(result.outcome).toBe('blackjack')
        expect(result.payoutMultiplier).toBe(2.5)
    })

    it('does not treat a split ace twenty-one as a natural blackjack', () => {
        const result = resolveHand(
            makeHand([createCard('A', 'spades'), createCard('K', 'hearts')], { isSplitHand: true }),
            [createCard('9', 'clubs'), createCard('7', 'diamonds')],
        )

        expect(result.outcome).toBe('win')
        expect(result.payoutMultiplier).toBe(2)
    })

    it('allows splitting only true pairs', () => {
        expect(canSplitHand(makeHand([createCard('8', 'spades'), createCard('8', 'hearts')]), 1)).toBe(true)
        expect(canSplitHand(makeHand([createCard('K', 'spades'), createCard('Q', 'hearts')]), 1)).toBe(false)
    })
})