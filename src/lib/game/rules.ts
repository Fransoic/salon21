import type { Card, HandResult, HandScore, PlayerHand, Rank, Suit } from './types'

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs']
const RANKS: Rank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2']
const TEN_VALUE_RANKS = new Set<Rank>(['10', 'J', 'Q', 'K'])

export const HOUSE_RULES = {
    deckCount: 6,
    dealerStandsOnSoft17: true,
    blackjackPayout: 1.5,
    insurancePayout: 2,
    maxHands: 4,
} as const

export function cardValue(rank: Rank): number {
    if (rank === 'A') {
        return 11
    }

    return TEN_VALUE_RANKS.has(rank) ? 10 : Number(rank)
}

export function scoreHand(cards: Card[]): HandScore {
    let total = 0
    let aces = 0

    for (const card of cards) {
        total += cardValue(card.rank)
        if (card.rank === 'A') {
            aces += 1
        }
    }

    while (total > 21 && aces > 0) {
        total -= 10
        aces -= 1
    }

    const isBlackjack = cards.length === 2 && total === 21
    return {
        total,
        isSoft: aces > 0,
        isBlackjack,
        isBust: total > 21,
    }
}

export function createCard(rank: Rank, suit: Suit, id?: string): Card {
    return {
        id: id ?? `${rank}-${suit}-${Math.random().toString(36).slice(2, 10)}`,
        rank,
        suit,
    }
}

export function createShoe(deckCount = HOUSE_RULES.deckCount, rng: () => number = Math.random): Card[] {
    const cards: Card[] = []

    for (let deck = 0; deck < deckCount; deck += 1) {
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                cards.push(createCard(rank, suit, `${deck}-${rank}-${suit}`))
            }
        }
    }

    for (let index = cards.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(rng() * (index + 1))
            ;[cards[index], cards[swapIndex]] = [cards[swapIndex], cards[index]]
    }

    return cards
}

export function drawCard(shoe: Card[]): { card: Card; shoe: Card[] } {
    const [card, ...rest] = shoe

    if (!card) {
        throw new Error('Cannot draw from an empty shoe')
    }

    return { card, shoe: rest }
}

export function isSameRankPair(cards: Card[]): boolean {
    return cards.length === 2 && cards[0].rank === cards[1].rank
}

export function canSplitHand(hand: PlayerHand, totalHands: number): boolean {
    return hand.cards.length === 2 && isSameRankPair(hand.cards) && totalHands < HOUSE_RULES.maxHands
}

export function canDoubleHand(hand: PlayerHand): boolean {
    return hand.cards.length === 2 && !hand.isComplete && !hand.isSplitAces
}

export function canHitHand(hand: PlayerHand): boolean {
    const score = scoreHand(hand.cards)
    return !hand.isComplete && !hand.isSplitAces && !score.isBust && score.total < 21
}

export function dealerShouldDraw(cards: Card[]): boolean {
    const score = scoreHand(cards)

    if (score.total < 17) {
        return true
    }

    if (score.total > 17) {
        return false
    }

    return !HOUSE_RULES.dealerStandsOnSoft17 && score.isSoft
}

export function resolveHand(hand: PlayerHand, dealerCards: Card[]): HandResult {
    if (hand.result?.outcome === 'surrender') {
        return hand.result
    }

    const player = scoreHand(hand.cards)
    const dealer = scoreHand(dealerCards)

    if (player.isBust) {
        return { outcome: 'loss', payoutMultiplier: 0, label: 'Bust' }
    }

    if (dealer.isBust) {
        return { outcome: 'win', payoutMultiplier: 2, label: 'Dealer busts' }
    }

    if (player.isBlackjack && !hand.isSplitHand && !dealer.isBlackjack) {
        return { outcome: 'blackjack', payoutMultiplier: 1 + HOUSE_RULES.blackjackPayout, label: 'Blackjack' }
    }

    if (dealer.isBlackjack && !player.isBlackjack) {
        return { outcome: 'loss', payoutMultiplier: 0, label: 'Dealer blackjack' }
    }

    if (dealer.isBlackjack && player.isBlackjack) {
        return { outcome: 'push', payoutMultiplier: 1, label: 'Blackjack push' }
    }

    if (player.total > dealer.total) {
        return { outcome: 'win', payoutMultiplier: 2, label: 'Player wins' }
    }

    if (player.total < dealer.total) {
        return { outcome: 'loss', payoutMultiplier: 0, label: 'Dealer wins' }
    }

    return { outcome: 'push', payoutMultiplier: 1, label: 'Push' }
}