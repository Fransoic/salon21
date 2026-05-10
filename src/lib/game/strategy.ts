import { scoreHand } from './rules'
import type { ActionAvailability, Card, PlayerActionName, Rank } from './types'

export type StrategyCode = 'H' | 'S' | 'Dh' | 'Ds' | 'P' | 'Rh'
export type StrategySectionKey = 'hard' | 'soft' | 'pairs'

export type StrategyRow = {
    label: string
    moves: StrategyCode[]
}

type DealerHeader = (typeof dealerHeaders)[number]

export type StrategyFocus = {
    section: StrategySectionKey
    rowLabel: string
    dealerHeader: DealerHeader
}

export const dealerHeaders = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'] as const

export const strategyRows: Record<StrategySectionKey, StrategyRow[]> = {
    hard: [
        { label: '5-8', moves: ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'] },
        { label: '9', moves: ['H', 'Dh', 'Dh', 'Dh', 'Dh', 'H', 'H', 'H', 'H', 'H'] },
        { label: '10', moves: ['Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'H', 'H'] },
        { label: '11', moves: ['Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh'] },
        { label: '12', moves: ['H', 'H', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'] },
        { label: '13-14', moves: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'] },
        { label: '15', moves: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'Rh', 'H'] },
        { label: '16', moves: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'Rh', 'Rh', 'Rh'] },
        { label: '17+', moves: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'] },
    ],
    soft: [
        { label: 'A,2-A,3', moves: ['H', 'H', 'H', 'Dh', 'Dh', 'H', 'H', 'H', 'H', 'H'] },
        { label: 'A,4-A,5', moves: ['H', 'H', 'Dh', 'Dh', 'Dh', 'H', 'H', 'H', 'H', 'H'] },
        { label: 'A,6', moves: ['H', 'Dh', 'Dh', 'Dh', 'Dh', 'H', 'H', 'H', 'H', 'H'] },
        { label: 'A,7', moves: ['S', 'Ds', 'Ds', 'Ds', 'Ds', 'S', 'S', 'H', 'H', 'H'] },
        { label: 'A,8', moves: ['S', 'S', 'S', 'S', 'Ds', 'S', 'S', 'S', 'S', 'S'] },
        { label: 'A,9', moves: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'] },
    ],
    pairs: [
        { label: 'A,A', moves: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'] },
        { label: '10,10', moves: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'] },
        { label: '9,9', moves: ['P', 'P', 'P', 'P', 'P', 'S', 'P', 'P', 'S', 'S'] },
        { label: '8,8', moves: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'] },
        { label: '7,7', moves: ['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'] },
        { label: '6,6', moves: ['P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H', 'H'] },
        { label: '5,5', moves: ['Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'H', 'H'] },
        { label: '4,4', moves: ['H', 'H', 'H', 'P', 'P', 'H', 'H', 'H', 'H', 'H'] },
        { label: '3,3', moves: ['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'] },
        { label: '2,2', moves: ['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'] },
    ],
}

const tenValueRanks = new Set<Rank>(['10', 'J', 'Q', 'K'])

function dealerHeaderForRank(rank: Rank | null): DealerHeader | null {
    if (!rank) {
        return null
    }

    switch (rank) {
        case 'K':
        case 'Q':
        case 'J':
            return '10'
        default:
            return rank
    }
}

function pairRowLabel(cards: Card[]): string | null {
    if (cards.length !== 2 || cards[0]?.rank !== cards[1]?.rank) {
        return null
    }

    const rank = cards[0].rank
    if (tenValueRanks.has(rank)) {
        return '10,10'
    }

    return `${rank},${rank}`
}

function softRowLabel(total: number): string | null {
    if (total <= 14) {
        return 'A,2-A,3'
    }

    if (total <= 16) {
        return 'A,4-A,5'
    }

    switch (total) {
        case 17:
            return 'A,6'
        case 18:
            return 'A,7'
        case 19:
            return 'A,8'
        case 20:
            return 'A,9'
        default:
            return null
    }
}

function hardRowLabel(total: number): string | null {
    if (total >= 5 && total <= 8) {
        return '5-8'
    }

    if (total === 13 || total === 14) {
        return '13-14'
    }

    if (total >= 17) {
        return '17+'
    }

    if (total >= 9 && total <= 16) {
        return String(total)
    }

    return null
}

function strategyFocusFor(cards: Card[], upcard: Rank | null, preferPair = true): StrategyFocus | null {
    const dealerHeader = dealerHeaderForRank(upcard)
    if (!cards.length || !dealerHeader) {
        return null
    }

    if (preferPair) {
        const pairLabel = pairRowLabel(cards)
        if (pairLabel) {
            return { section: 'pairs', rowLabel: pairLabel, dealerHeader }
        }
    }

    const score = scoreHand(cards)
    if (score.isBust || score.total >= 21) {
        return null
    }

    const rowLabel = score.isSoft ? softRowLabel(score.total) : hardRowLabel(score.total)
    if (!rowLabel) {
        return null
    }

    return {
        section: score.isSoft ? 'soft' : 'hard',
        rowLabel,
        dealerHeader,
    }
}

function strategyCodeFor(focus: StrategyFocus | null, allowSurrender: boolean): StrategyCode | null {
    if (!focus) {
        return null
    }

    const row = strategyRows[focus.section].find((candidate) => candidate.label === focus.rowLabel)
    const columnIndex = dealerHeaders.indexOf(focus.dealerHeader)
    const move = row?.moves[columnIndex] ?? null

    if (!move) {
        return null
    }

    return move === 'Rh' && !allowSurrender ? 'H' : move
}

function resolveRecommendedAction(code: StrategyCode | null, availability: ActionAvailability): PlayerActionName | null {
    switch (code) {
        case 'H':
            return availability.hit.enabled ? 'hit' : null
        case 'S':
            return availability.stand.enabled ? 'stand' : null
        case 'Dh':
            return availability.double.enabled ? 'double' : availability.hit.enabled ? 'hit' : null
        case 'Ds':
            return availability.double.enabled ? 'double' : availability.stand.enabled ? 'stand' : null
        case 'Rh':
            return availability.surrender.enabled ? 'surrender' : availability.hit.enabled ? 'hit' : null
        case 'P':
            return availability.split.enabled ? 'split' : null
        default:
            return null
    }
}

export function getStrategyFocus(cards: Card[], upcard: Rank | null): StrategyFocus | null {
    return strategyFocusFor(cards, upcard)
}

export function getRecommendedAction(
    cards: Card[],
    upcard: Rank | null,
    availability: ActionAvailability,
    options: { allowSurrender?: boolean } = {},
): PlayerActionName | null {
    const allowSurrender = options.allowSurrender ?? false
    const preferredCode = strategyCodeFor(strategyFocusFor(cards, upcard), allowSurrender)
    const preferredAction = resolveRecommendedAction(preferredCode, availability)

    if (preferredAction || preferredCode !== 'P') {
        return preferredAction
    }

    const fallbackCode = strategyCodeFor(strategyFocusFor(cards, upcard, false), allowSurrender)
    return resolveRecommendedAction(fallbackCode, availability)
}