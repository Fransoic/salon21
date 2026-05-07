import {
    HOUSE_RULES,
    canDoubleHand,
    canHitHand,
    canSplitHand,
    createShoe,
    dealerShouldDraw,
    drawCard,
    resolveHand,
    scoreHand,
} from './rules'
import type {
    ActionAvailability,
    AvailableAction,
    Card,
    GameState,
    HandResult,
    GameStats,
    PlayerHand,
    StoredProfile,
} from './types'

const STARTING_BANKROLL = 500
const DEFAULT_BET = 25

let handCounter = 0

function nextHandId(): string {
    handCounter += 1
    return `hand-${handCounter}`
}

export function createDefaultStats(): GameStats {
    return {
        handsPlayed: 0,
        wins: 0,
        losses: 0,
        pushes: 0,
        blackjacks: 0,
        surrenders: 0,
        biggestWin: 0,
        peakBankroll: STARTING_BANKROLL,
    }
}

function mergeStats(stats?: Partial<GameStats>): GameStats {
    return {
        ...createDefaultStats(),
        ...stats,
    }
}

function makeHand(cards: Card[], bet: number, overrides?: Partial<PlayerHand>): PlayerHand {
    return {
        id: nextHandId(),
        cards,
        bet,
        isComplete: false,
        isDoubled: false,
        isSplitHand: false,
        isSplitAces: false,
        result: null,
        ...overrides,
    }
}

function cloneHands(hands: PlayerHand[]): PlayerHand[] {
    return hands.map((hand) => ({
        ...hand,
        cards: [...hand.cards],
        result: hand.result ? { ...hand.result } : null,
    }))
}

function ensureShoe(shoe: Card[], rng: () => number): Card[] {
    if (shoe.length >= 20) {
        return shoe
    }

    const toppedUp = createShoe(HOUSE_RULES.deckCount, rng)
    const existingCounts = new Map<string, number>()

    for (const card of shoe) {
        const key = `${card.rank}-${card.suit}`
        existingCounts.set(key, (existingCounts.get(key) ?? 0) + 1)
    }

    const refill: Card[] = []

    for (const card of toppedUp) {
        const key = `${card.rank}-${card.suit}`
        const count = existingCounts.get(key) ?? 0

        if (count > 0) {
            existingCounts.set(key, count - 1)
            continue
        }

        refill.push(card)
    }

    return [...shoe, ...refill]
}

function activeHand(state: GameState): PlayerHand | undefined {
    return state.playerHands[state.activeHandIndex]
}

function withUpdatedActiveHand(state: GameState, hand: PlayerHand): GameState {
    const playerHands = cloneHands(state.playerHands)
    playerHands[state.activeHandIndex] = hand
    return {
        ...state,
        playerHands,
    }
}

function finalizeStats(stats: GameStats, bankroll: number, hand: PlayerHand): GameStats {
    const next = {
        ...stats,
        handsPlayed: stats.handsPlayed + 1,
        peakBankroll: Math.max(stats.peakBankroll, bankroll),
    }

    if (!hand.result) {
        return next
    }

    if (hand.result.outcome === 'push') {
        next.pushes += 1
        return next
    }

    if (hand.result.outcome === 'loss') {
        next.losses += 1
        return next
    }

    if (hand.result.outcome === 'surrender') {
        next.losses += 1
        next.surrenders += 1
        return next
    }

    next.wins += 1
    next.biggestWin = Math.max(next.biggestWin, Math.max(0, hand.bet * (hand.result.payoutMultiplier - 1)))

    if (hand.result.outcome === 'blackjack') {
        next.blackjacks += 1
    }

    return next
}

function settleImmediate(state: GameState, hands: PlayerHand[], message: string): GameState {
    let bankroll = state.bankroll
    let stats = state.stats

    for (const hand of hands) {
        if (!hand.result) {
            continue
        }

        bankroll += hand.bet * hand.result.payoutMultiplier
        stats = finalizeStats(stats, bankroll, hand)
    }

    if (state.insuranceBet > 0 && scoreHand(state.dealerHand).isBlackjack) {
        bankroll += state.insuranceBet * 3
    }

    return {
        ...state,
        bankroll,
        stats,
        phase: 'round-over',
        playerHands: hands,
        activeHandIndex: 0,
        message,
        lastRoundDelta: state.roundStartBankroll === null ? 0 : bankroll - state.roundStartBankroll,
    }
}

function resolveNaturals(state: GameState): GameState {
    const [playerHand] = state.playerHands
    const playerScore = scoreHand(playerHand.cards)
    const dealerScore = scoreHand(state.dealerHand)

    if (dealerScore.isBlackjack) {
        const result: HandResult = playerScore.isBlackjack
            ? { outcome: 'push', payoutMultiplier: 1, label: 'Blackjack push' }
            : { outcome: 'loss', payoutMultiplier: 0, label: 'Dealer blackjack' }

        return settleImmediate(
            state,
            [{ ...playerHand, isComplete: true, result }],
            state.insuranceBet > 0 ? 'Dealer blackjack. Insurance pays.' : 'Dealer blackjack.',
        )
    }

    if (playerScore.isBlackjack) {
        return settleImmediate(
            state,
            [
                {
                    ...playerHand,
                    isComplete: true,
                    result: { outcome: 'blackjack', payoutMultiplier: 1 + HOUSE_RULES.blackjackPayout, label: 'Blackjack' },
                },
            ],
            'Blackjack pays 3:2.',
        )
    }

    return {
        ...state,
        phase: 'player-turn',
        message: 'Play your hand.',
    }
}

function moveToNextHandOrDealer(state: GameState, rng: () => number): GameState {
    const nextIndex = state.playerHands.findIndex((hand, index) => index > state.activeHandIndex && !hand.isComplete)

    if (nextIndex !== -1) {
        return {
            ...state,
            activeHandIndex: nextIndex,
            phase: 'player-turn',
            message: `Hand ${nextIndex + 1} to play.`,
        }
    }

    let dealerHand = [...state.dealerHand]
    let shoe = [...state.shoe]

    while (dealerShouldDraw(dealerHand)) {
        const draw = drawCard(shoe)
        dealerHand = [...dealerHand, draw.card]
        shoe = draw.shoe
    }

    let bankroll = state.bankroll
    let stats = state.stats
    const settledHands = cloneHands(state.playerHands).map((hand) => {
        const result = resolveHand(hand, dealerHand)
        bankroll += hand.bet * result.payoutMultiplier
        const settled = { ...hand, isComplete: true, result }
        stats = finalizeStats(stats, bankroll, settled)
        return settled
    })

    return {
        ...state,
        shoe,
        dealerHand,
        playerHands: settledHands,
        activeHandIndex: 0,
        bankroll,
        stats,
        phase: 'round-over',
        message: 'Round settled.',
        lastRoundDelta: state.roundStartBankroll === null ? 0 : bankroll - state.roundStartBankroll,
    }
}

export function createInitialState(profile?: StoredProfile, rng: () => number = Math.random): GameState {
    const bankroll = profile?.bankroll ?? STARTING_BANKROLL
    const currentBet = Math.min(profile?.currentBet ?? DEFAULT_BET, bankroll)

    return {
        bankroll,
        currentBet: Math.max(10, currentBet),
        deckCount: HOUSE_RULES.deckCount,
        stats: mergeStats(profile?.stats),
        phase: 'betting',
        shoe: createShoe(HOUSE_RULES.deckCount, rng),
        dealerHand: [],
        playerHands: [],
        activeHandIndex: 0,
        insuranceBet: 0,
        message: 'Choose a bet and deal a new round.',
        lastRoundDelta: 0,
        roundStartBankroll: null,
    }
}

export function setBet(state: GameState, amount: number): GameState {
    if (state.phase !== 'betting' || amount > state.bankroll || amount <= 0) {
        return state
    }

    return {
        ...state,
        currentBet: amount,
    }
}

export function dealRound(state: GameState, rng: () => number = Math.random): GameState {
    if (state.phase !== 'betting' || state.currentBet > state.bankroll) {
        return {
            ...state,
            message: 'Your bankroll does not cover that bet.',
        }
    }

    let shoe = ensureShoe(state.shoe, rng)
    const first = drawCard(shoe)
    shoe = first.shoe
    const second = drawCard(shoe)
    shoe = second.shoe
    const third = drawCard(shoe)
    shoe = third.shoe
    const fourth = drawCard(shoe)
    shoe = fourth.shoe

    const playerHands = [makeHand([first.card, third.card], state.currentBet)]
    const dealerHand = [second.card, fourth.card]
    const nextState: GameState = {
        ...state,
        bankroll: state.bankroll - state.currentBet,
        phase: second.card.rank === 'A' ? 'insurance' : 'player-turn',
        shoe,
        dealerHand,
        playerHands,
        activeHandIndex: 0,
        insuranceBet: 0,
        roundStartBankroll: state.bankroll,
        message: second.card.rank === 'A' ? 'Dealer shows an ace. Insurance?' : 'Round dealt.',
        lastRoundDelta: 0,
    }

    if (second.card.rank === 'A') {
        return nextState
    }

    return resolveNaturals(nextState)
}

export function takeInsurance(state: GameState): GameState {
    if (state.phase !== 'insurance') {
        return state
    }

    const premium = state.currentBet / 2
    if (state.bankroll < premium) {
        return {
            ...state,
            message: 'Not enough bankroll to buy insurance.',
        }
    }

    return resolveNaturals({
        ...state,
        bankroll: state.bankroll - premium,
        insuranceBet: premium,
        message: 'Insurance taken.',
    })
}

export function declineInsurance(state: GameState): GameState {
    if (state.phase !== 'insurance') {
        return state
    }

    return resolveNaturals({
        ...state,
        message: 'Insurance declined.',
    })
}

export function hit(state: GameState, rng: () => number = Math.random): GameState {
    const hand = activeHand(state)
    if (state.phase !== 'player-turn' || !hand || !canHitHand(hand)) {
        return state
    }

    const draw = drawCard(ensureShoe(state.shoe, rng))
    const updatedHand = { ...hand, cards: [...hand.cards, draw.card] }
    const nextState = withUpdatedActiveHand({ ...state, shoe: draw.shoe }, updatedHand)
    const score = scoreHand(updatedHand.cards)

    if (!score.isBust && score.total < 21) {
        return {
            ...nextState,
            message: `Hand ${state.activeHandIndex + 1} hits ${score.total}.`,
        }
    }

    return moveToNextHandOrDealer(
        withUpdatedActiveHand(nextState, {
            ...updatedHand,
            isComplete: true,
            result: score.isBust ? { outcome: 'loss', payoutMultiplier: 0, label: 'Bust' } : null,
        }),
        rng,
    )
}

export function stand(state: GameState, rng: () => number = Math.random): GameState {
    const hand = activeHand(state)
    if (state.phase !== 'player-turn' || !hand) {
        return state
    }

    return moveToNextHandOrDealer(
        withUpdatedActiveHand(state, {
            ...hand,
            isComplete: true,
        }),
        rng,
    )
}

export function doubleDown(state: GameState, rng: () => number = Math.random): GameState {
    const hand = activeHand(state)
    if (state.phase !== 'player-turn' || !hand || !canDoubleHand(hand) || state.bankroll < hand.bet) {
        return state
    }

    const draw = drawCard(ensureShoe(state.shoe, rng))
    const doubledHand: PlayerHand = {
        ...hand,
        bet: hand.bet * 2,
        isDoubled: true,
        isComplete: true,
        cards: [...hand.cards, draw.card],
    }

    return moveToNextHandOrDealer(
        withUpdatedActiveHand(
            {
                ...state,
                bankroll: state.bankroll - hand.bet,
                shoe: draw.shoe,
            },
            doubledHand,
        ),
        rng,
    )
}

export function split(state: GameState, rng: () => number = Math.random): GameState {
    const hand = activeHand(state)
    if (state.phase !== 'player-turn' || !hand || !canSplitHand(hand, state.playerHands.length) || state.bankroll < hand.bet) {
        return state
    }

    const isAceSplit = hand.cards[0].rank === 'A'
    let shoe = ensureShoe(state.shoe, rng)
    const firstDraw = drawCard(shoe)
    shoe = firstDraw.shoe
    const secondDraw = drawCard(shoe)
    shoe = secondDraw.shoe

    const currentHand = makeHand([hand.cards[0], firstDraw.card], hand.bet, {
        isSplitHand: true,
        isSplitAces: isAceSplit,
        isComplete: isAceSplit,
    })
    const splitHand = makeHand([hand.cards[1], secondDraw.card], hand.bet, {
        isSplitHand: true,
        isSplitAces: isAceSplit,
        isComplete: isAceSplit,
    })

    const playerHands = cloneHands(state.playerHands)
    playerHands.splice(state.activeHandIndex, 1, currentHand, splitHand)
    const nextState = {
        ...state,
        bankroll: state.bankroll - hand.bet,
        shoe,
        playerHands,
        message: isAceSplit ? 'Aces split and receive one card each.' : 'Hand split.',
    }

    if (!isAceSplit) {
        return nextState
    }

    return moveToNextHandOrDealer(
        {
            ...nextState,
            activeHandIndex: 0,
        },
        rng,
    )
}

export function surrender(state: GameState): GameState {
    const hand = activeHand(state)
    if (state.phase !== 'player-turn' || !hand || state.playerHands.length > 1 || hand.cards.length !== 2 || hand.isSplitHand) {
        return state
    }

    const surrenderedHand: PlayerHand = {
        ...hand,
        isComplete: true,
        result: { outcome: 'surrender', payoutMultiplier: 0.5, label: 'Surrender' },
    }

    return settleImmediate(
        {
            ...state,
            message: 'Hand surrendered.',
        },
        [surrenderedHand],
        'Late surrender returns half the wager.',
    )
}

export function nextRound(state: GameState): GameState {
    if (state.phase !== 'round-over') {
        return state
    }

    return {
        ...state,
        phase: 'betting',
        dealerHand: [],
        playerHands: [],
        activeHandIndex: 0,
        insuranceBet: 0,
        roundStartBankroll: null,
        message: 'Choose a bet and deal the next round.',
    }
}

export function resetProgress(rng: () => number = Math.random): GameState {
    return createInitialState(undefined, rng)
}

export function shouldPersistProfile(state: GameState): boolean {
    return state.phase === 'betting' || state.phase === 'round-over'
}

function disabled(reason: string): AvailableAction {
    return { enabled: false, reason }
}

function enabled(): AvailableAction {
    return { enabled: true }
}

export function getActionAvailability(state: GameState, options: { allowSurrender?: boolean } = {}): ActionAvailability {
    const hand = activeHand(state)
    const allowSurrender = options.allowSurrender ?? true

    return {
        deal:
            state.phase === 'betting' && state.currentBet <= state.bankroll
                ? enabled()
                : disabled('Select a valid bet before dealing.'),
        hit: state.phase === 'player-turn' && hand && canHitHand(hand) ? enabled() : disabled('Hit is unavailable.'),
        stand: state.phase === 'player-turn' && hand ? enabled() : disabled('Stand is unavailable.'),
        double:
            state.phase === 'player-turn' && hand && canDoubleHand(hand) && state.bankroll >= hand.bet
                ? enabled()
                : disabled('Double is only available on the first decision with enough bankroll.'),
        split:
            state.phase === 'player-turn' && hand && canSplitHand(hand, state.playerHands.length) && state.bankroll >= hand.bet
                ? enabled()
                : disabled('Split requires a pair and a matching wager.'),
        insurance:
            state.phase === 'insurance' && state.bankroll >= state.currentBet / 2
                ? enabled()
                : disabled('Insurance is only offered against an ace up-card.'),
        declineInsurance: state.phase === 'insurance' ? enabled() : disabled('No insurance to decline.'),
        surrender:
            !allowSurrender
                ? disabled('Late surrender is disabled in table controls.')
                : state.phase === 'player-turn' && hand && state.playerHands.length === 1 && hand.cards.length === 2 && !hand.isSplitHand
                    ? enabled()
                    : disabled('Late surrender is only available on the opening hand.'),
        nextRound: state.phase === 'round-over' ? enabled() : disabled('Finish the current round first.'),
    }
}