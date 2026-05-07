<script lang="ts">
  import { cubicOut, quintOut } from 'svelte/easing'
  import { fade, fly } from 'svelte/transition'
  import type { TransitionConfig } from 'svelte/transition'

  import { formatMoney } from '../format'
  import { translateDynamic, uiText } from '../i18n'
  import { scoreHand } from '../game/rules'
  import type { Card, PlayerHand, RoundPhase, Suit } from '../game/types'
  import type { AppLanguage } from '../storage'

  export let dealerHand: Card[] = []
  export let playerHands: PlayerHand[] = []
  export let activeHandIndex = 0
  export let phase: RoundPhase = 'betting'
  export let lastRoundDelta = 0
  export let language: AppLanguage = 'en'

  const suitGlyphs: Record<Suit, string> = {
    spades: '♠',
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
  }

  function isRed(suit: Suit) {
    return suit === 'hearts' || suit === 'diamonds'
  }

  function resultText(hand: PlayerHand, currentLanguage: AppLanguage): string {
    if (hand.result) {
      return translateDynamic(currentLanguage, hand.result.label)
    }

    const score = scoreHand(hand.cards)
    if (score.isBust) {
      return translateDynamic(currentLanguage, 'Bust')
    }

    if (score.isBlackjack && !hand.isSplitHand) {
      return translateDynamic(currentLanguage, 'Blackjack')
    }

    return translateDynamic(currentLanguage, hand.isSplitAces ? `${score.total} split aces` : `${score.total}${score.isSoft ? ' soft' : ''}`)
  }

  function dealerText(cards: Card[], currentPhase: RoundPhase, currentLanguage: AppLanguage): string {
    if (!cards.length) {
      return translateDynamic(currentLanguage, 'Waiting for deal')
    }

    if (currentPhase !== 'round-over') {
      return cards.length > 1 ? `${scoreHand([cards[0]]).total}+` : `${scoreHand(cards).total}`
    }

    const score = scoreHand(cards)
    return score.isBust ? translateDynamic(currentLanguage, 'Dealer busts') : translateDynamic(currentLanguage, `${score.total}${score.isSoft ? ' soft' : ''}`)
  }

  function dealerCardMotion(index: number) {
    return {
      x: -18,
      y: -30,
      duration: 260,
      delay: index * 120,
    }
  }

  function playerCardMotion(index: number) {
    return {
      x: -12,
      y: 26,
      duration: 240,
      delay: index * 90,
    }
  }

  function dealCard(
    _node: Element,
    params: { delay?: number; duration?: number; x?: number; y?: number; rotate?: number; scale?: number } = {},
  ): TransitionConfig {
    const { delay = 0, duration = 420, x = -24, y = -42, rotate = -14, scale = 0.78 } = params

    return {
      delay,
      duration,
      easing: cubicOut,
      css: (t) => {
        const translateX = (1 - t) * x
        const translateY = (1 - t) * y
        const cardRotate = (1 - t) * rotate
        const cardScale = scale + (1 - scale) * t
        const blur = (1 - t) * 8

        return `
          opacity: ${Math.min(1, t * 1.3)};
          transform: translate(${translateX}px, ${translateY}px) rotate(${cardRotate}deg) scale(${cardScale});
          filter: blur(${blur}px);
        `
      },
    }
  }

  function revealDealerCard(_node: Element, params: { delay?: number; duration?: number } = {}): TransitionConfig {
    const { delay = 0, duration = 520 } = params

    return {
      delay,
      duration,
      easing: quintOut,
      css: (t) => {
        const rotation = (1 - t) * -88
        const translateY = (1 - t) * -10
        const cardScale = 0.86 + 0.14 * t
        const brightness = 0.84 + 0.16 * t

        return `
          opacity: ${t};
          transform: perspective(640px) rotateY(${rotation}deg) translateY(${translateY}px) scale(${cardScale});
          filter: brightness(${brightness});
          transform-origin: center center;
        `
      },
    }
  }

  function dealerVisibleCardTransition(
    node: Element,
    params: { index: number; reveal?: boolean },
  ): TransitionConfig {
    if (params.reveal) {
      return revealDealerCard(node, { delay: 80, duration: 520 })
    }

    return dealCard(node, { ...dealerCardMotion(params.index), rotate: -16, scale: 0.76 })
  }

  function resultTone(hand: PlayerHand) {
    switch (hand.result?.outcome) {
      case 'blackjack':
        return 'result-blackjack'
      case 'win':
        return 'result-win'
      case 'loss':
      case 'surrender':
        return 'result-loss'
      case 'push':
        return 'result-push'
      default:
        return ''
    }
  }
</script>

<section class="table-panel">
  <div class="dealer-zone">
    <div class="seat-head">
      <div>
        <p class="hand-caption">{uiText(language, 'dealer')}</p>
        <h3>{uiText(language, 'houseHand')}</h3>
      </div>
      <span class="dealer-total">{dealerText(dealerHand, phase, language)}</span>
    </div>

    <div class="seat-cards">
      {#if dealerHand.length === 0}
        <div class="playing-card--hidden" aria-hidden="true" in:fade={{ duration: 180 }}></div>
        <div class="playing-card--hidden" aria-hidden="true" in:fade={{ duration: 180, delay: 80 }}></div>
      {/if}

      {#each dealerHand as card, index}
        {#if phase !== 'round-over' && index === 1}
          <div
            class="playing-card--hidden"
            aria-label={uiText(language, 'hiddenDealerCard')}
            in:dealCard={{ ...dealerCardMotion(index), rotate: -18, scale: 0.74 }}
            out:fade={{ duration: 120 }}
          ></div>
        {:else}
          <article
            class:red={isRed(card.suit)}
            class:dealer-reveal={index === 1 && phase === 'round-over'}
            class="playing-card"
            in:dealerVisibleCardTransition={{ index, reveal: index === 1 && phase === 'round-over' }}
          >
            <div class="card-corner">
              <span>{card.rank}</span>
              <span>{suitGlyphs[card.suit]}</span>
            </div>
            <div class="card-footer">
              <span>{suitGlyphs[card.suit]}</span>
            </div>
          </article>
        {/if}
      {/each}
    </div>
  </div>

  <div class="player-zone">
    {#if playerHands.length === 0}
      <div class="seat-card" in:fade={{ duration: 180 }}>
        <div class="seat-head">
          <div>
            <p class="hand-caption">{uiText(language, 'player')}</p>
            <h3>{uiText(language, 'waitingNextRound')}</h3>
          </div>
          <span class="phase-pill">{uiText(language, 'tapDeal')}</span>
        </div>
        <p class="bet-hint">{uiText(language, 'persistenceHint')}</p>
      </div>
    {/if}

    {#each playerHands as hand, index}
      <article
        class:active={index === activeHandIndex && phase === 'player-turn'}
        class:resolved-win={hand.result?.outcome === 'win'}
        class:resolved-blackjack={hand.result?.outcome === 'blackjack'}
        class:resolved-loss={hand.result?.outcome === 'loss' || hand.result?.outcome === 'surrender'}
        class:resolved-push={hand.result?.outcome === 'push'}
        class="seat-card"
        in:fly={{ y: 16, duration: 220, delay: index * 80 }}
      >
        <div class="seat-head">
          <div>
            <p class="hand-caption">{uiText(language, 'playerHand')} {index + 1}</p>
            <h3>{formatMoney(hand.bet)} {uiText(language, 'onFelt')}</h3>
          </div>
          <span class={`result-pill ${resultTone(hand)}`}>{resultText(hand, language)}</span>
        </div>

        <div class="seat-cards">
          {#each hand.cards as card, cardIndex (card.id)}
            <article
              class:red={isRed(card.suit)}
              class="playing-card"
              in:dealCard={{ ...playerCardMotion(cardIndex), rotate: -8, scale: 0.8 }}
            >
              <div class="card-corner">
                <span>{card.rank}</span>
                <span>{suitGlyphs[card.suit]}</span>
              </div>
              <div class="card-footer">
                <span>{suitGlyphs[card.suit]}</span>
              </div>
            </article>
          {/each}
        </div>

        <div class="status-line">
          <span class="muted-label">
            {hand.isSplitHand ? uiText(language, 'splitHand') : uiText(language, 'openingHand')}
            {#if hand.isDoubled}
              · {uiText(language, 'doubled')}
            {/if}
          </span>
          <span
            class:last-win={lastRoundDelta > 0 && phase === 'round-over'}
            class:last-loss={lastRoundDelta < 0 && phase === 'round-over'}
            class={`status-result ${resultTone(hand)}`}
          >
            {hand.result?.outcome === 'push' ? uiText(language, 'returned') : hand.result ? translateDynamic(language, hand.result.label) : uiText(language, 'inPlay')}
          </span>
        </div>
      </article>
    {/each}
  </div>
</section>