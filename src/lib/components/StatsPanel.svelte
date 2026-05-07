<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import { formatMoney } from '../format'
  import { uiText } from '../i18n'
  import type { GameStats, RoundPhase } from '../game/types'
  import type { AppLanguage } from '../storage'

  export let bankroll: number
  export let currentBet: number
  export let stats: GameStats
  export let phase: RoundPhase
  export let language: AppLanguage = 'en'

  const dispatch = createEventDispatcher<{ reset: void }>()
</script>

<aside class="stats-panel">
  <div class="stats-head">
    <p class="panel-kicker">{uiText(language, 'localSession')}</p>
    <h3>{uiText(language, 'tableSnapshot')}</h3>
  </div>

  <div class="bankroll-card">
    <div>
      <p class="muted-label">{uiText(language, 'currentBankroll')}</p>
      <strong class="bankroll-value">{formatMoney(bankroll)}</strong>
    </div>
    <div>
      <p class="muted-label">{uiText(language, 'tableBet')}</p>
      <strong class="stat-value">{formatMoney(currentBet)}</strong>
    </div>
  </div>

  <div class="stats-strip">
    <div class="stat-pill">
      <span class="stat-label">{uiText(language, 'wins')}</span>
      <strong class="stat-value">{stats.wins}</strong>
    </div>
    <div class="stat-pill">
      <span class="stat-label">{uiText(language, 'losses')}</span>
      <strong class="stat-value">{stats.losses}</strong>
    </div>
    <div class="stat-pill">
      <span class="stat-label">{uiText(language, 'pushes')}</span>
      <strong class="stat-value">{stats.pushes}</strong>
    </div>
    <div class="stat-pill">
      <span class="stat-label">{uiText(language, 'blackjacks')}</span>
      <strong class="stat-value">{stats.blackjacks}</strong>
    </div>
  </div>

  <details class="info-drawer" open={phase === 'round-over'}>
    <summary>{uiText(language, 'sessionStats')}</summary>
    <div class="stats-grid drawer-grid">
      <div class="stat-box">
        <span class="stat-label">{uiText(language, 'handsPlayed')}</span>
        <strong class="stat-value">{stats.handsPlayed}</strong>
      </div>
      <div class="stat-box">
        <span class="stat-label">{uiText(language, 'peakBankroll')}</span>
        <strong class="stat-value">{formatMoney(stats.peakBankroll)}</strong>
      </div>
    </div>
  </details>

  <details class="info-drawer">
    <summary>{uiText(language, 'houseRules')}</summary>
    <div class="rules-grid">
      <article class="rule-card">
        <h4>{uiText(language, 'houseRulesCoreTitle')}</h4>
        <p>{uiText(language, 'houseRulesCoreBody')}</p>
      </article>
      <article class="rule-card">
        <h4>{uiText(language, 'houseRulesAdvancedTitle')}</h4>
        <p>{uiText(language, 'houseRulesAdvancedBody')}</p>
      </article>
      <article class="rule-card rule-card--utility">
        <h4>{uiText(language, 'houseRulesPersistenceTitle')}</h4>
        <p>{uiText(language, 'houseRulesPersistenceBody')}</p>
      </article>
    </div>
  </details>

  <div class="stats-footer">
    <button type="button" class="reset-button" disabled={phase === 'player-turn' || phase === 'insurance'} on:click={() => dispatch('reset')}>
      {uiText(language, 'resetLocalProgress')}
    </button>
  </div>
</aside>