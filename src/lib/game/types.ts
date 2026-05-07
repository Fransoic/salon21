export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'

export type Rank =
    | 'A'
    | 'K'
    | 'Q'
    | 'J'
    | '10'
    | '9'
    | '8'
    | '7'
    | '6'
    | '5'
    | '4'
    | '3'
    | '2'

export type RoundPhase = 'betting' | 'insurance' | 'player-turn' | 'dealer-turn' | 'round-over'

export type HandOutcome = 'blackjack' | 'win' | 'loss' | 'push' | 'surrender'

export type PlayerActionName =
    | 'deal'
    | 'hit'
    | 'stand'
    | 'double'
    | 'split'
    | 'insurance'
    | 'decline-insurance'
    | 'surrender'
    | 'next-round'

export interface Card {
    id: string
    rank: Rank
    suit: Suit
}

export interface HandScore {
    total: number
    isSoft: boolean
    isBlackjack: boolean
    isBust: boolean
}

export interface HandResult {
    outcome: HandOutcome
    payoutMultiplier: number
    label: string
}

export interface PlayerHand {
    id: string
    cards: Card[]
    bet: number
    isComplete: boolean
    isDoubled: boolean
    isSplitHand: boolean
    isSplitAces: boolean
    result: HandResult | null
}

export interface GameStats {
    handsPlayed: number
    wins: number
    losses: number
    pushes: number
    blackjacks: number
    surrenders: number
    biggestWin: number
    peakBankroll: number
}

export interface AvailableAction {
    enabled: boolean
    reason?: string
}

export interface ActionAvailability {
    deal: AvailableAction
    hit: AvailableAction
    stand: AvailableAction
    double: AvailableAction
    split: AvailableAction
    insurance: AvailableAction
    declineInsurance: AvailableAction
    surrender: AvailableAction
    nextRound: AvailableAction
}

export interface GameState {
    bankroll: number
    currentBet: number
    deckCount: number
    stats: GameStats
    phase: RoundPhase
    shoe: Card[]
    dealerHand: Card[]
    playerHands: PlayerHand[]
    activeHandIndex: number
    insuranceBet: number
    message: string
    lastRoundDelta: number
    roundStartBankroll: number | null
}

export interface StoredProfile {
    bankroll: number
    currentBet: number
    stats: GameStats
}