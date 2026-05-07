import { describe, expect, it } from 'vitest'

import { createCard } from './rules'
import {
    createInitialState,
    dealRound,
    declineInsurance,
    doubleDown,
    hit,
    resetProgress,
    shouldPersistProfile,
    split,
    stand,
    surrender,
    takeInsurance,
} from './state'
import type { Card } from './types'

function forceShoe(cards: Card[]) {
    return cards
}

describe('state transitions', () => {
    it('offers insurance and resolves dealer blackjack correctly', () => {
        const starting = {
            ...createInitialState(),
            currentBet: 50,
            shoe: forceShoe([
                createCard('K', 'spades'),
                createCard('A', 'hearts'),
                createCard('9', 'clubs'),
                createCard('K', 'diamonds'),
            ]),
        }

        const dealt = dealRound(starting)
        const insured = takeInsurance(dealt)

        expect(dealt.phase).toBe('insurance')
        expect(insured.phase).toBe('round-over')
        expect(insured.bankroll).toBe(500)
        expect(insured.playerHands[0].result?.outcome).toBe('loss')
    })

    it('advances to the second hand after a split and double', () => {
        const starting = {
            ...createInitialState(),
            currentBet: 25,
            shoe: forceShoe([
                createCard('8', 'spades'),
                createCard('6', 'hearts'),
                createCard('8', 'clubs'),
                createCard('5', 'diamonds'),
                createCard('3', 'spades'),
                createCard('2', 'hearts'),
                createCard('K', 'clubs'),
            ]),
        }

        const dealt = dealRound(starting)
        const splitRound = split(dealt)
        const doubled = doubleDown(splitRound)

        expect(splitRound.playerHands).toHaveLength(2)
        expect(splitRound.bankroll).toBe(450)
        expect(doubled.activeHandIndex).toBe(1)
        expect(doubled.playerHands[0].bet).toBe(50)
        expect(doubled.bankroll).toBe(425)
    })

    it('lets the player decline insurance and continue playing', () => {
        const starting = {
            ...createInitialState(),
            shoe: forceShoe([
                createCard('9', 'spades'),
                createCard('A', 'hearts'),
                createCard('7', 'clubs'),
                createCard('5', 'diamonds'),
            ]),
        }

        const dealt = dealRound(starting)
        const continued = declineInsurance(dealt)

        expect(continued.phase).toBe('player-turn')
        expect(continued.bankroll).toBe(475)
    })

    it('returns half the wager on surrender', () => {
        const starting = {
            ...createInitialState(),
            currentBet: 20,
            shoe: forceShoe([
                createCard('9', 'spades'),
                createCard('6', 'hearts'),
                createCard('7', 'clubs'),
                createCard('5', 'diamonds'),
            ]),
        }

        const surrendered = surrender(dealRound(starting))

        expect(surrendered.phase).toBe('round-over')
        expect(surrendered.bankroll).toBe(490)
        expect(surrendered.playerHands[0].result?.outcome).toBe('surrender')
    })

    it('settles a completed round after standing', () => {
        const starting = {
            ...createInitialState(),
            currentBet: 25,
            shoe: forceShoe([
                createCard('10', 'spades'),
                createCard('6', 'hearts'),
                createCard('9', 'clubs'),
                createCard('8', 'diamonds'),
                createCard('9', 'hearts'),
            ]),
        }

        const finished = stand(dealRound(starting))

        expect(finished.phase).toBe('round-over')
        expect(finished.dealerHand).toHaveLength(3)
        expect(finished.playerHands[0].result?.outcome).toBe('win')
    })

    it('rejects invalid actions without mutating the round', () => {
        const starting = {
            ...createInitialState(),
            currentBet: 25,
            shoe: forceShoe([
                createCard('10', 'spades'),
                createCard('6', 'hearts'),
                createCard('4', 'clubs'),
                createCard('8', 'diamonds'),
                createCard('2', 'hearts'),
            ]),
        }

        const dealt = dealRound(starting)
        const afterHit = hit(dealt)
        const illegalDouble = doubleDown(afterHit)

        expect(illegalDouble).toEqual(afterHit)
    })

    it('resets progress back to the table defaults', () => {
        const reset = resetProgress()

        expect(reset.phase).toBe('betting')
        expect(reset.bankroll).toBe(500)
        expect(reset.currentBet).toBe(25)
        expect(reset.stats.handsPlayed).toBe(0)
    })

    it('persists only on safe table states', () => {
        const initial = createInitialState()
        const inRound = dealRound(initial)
        const finished = stand(inRound)

        expect(shouldPersistProfile(initial)).toBe(true)
        expect(shouldPersistProfile(inRound)).toBe(false)
        expect(shouldPersistProfile(finished)).toBe(true)
    })
})