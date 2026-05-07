<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import { translateDynamic, uiText } from '../i18n'
  import type { ActionAvailability, PlayerActionName, RoundPhase } from '../game/types'
  import type { AppLanguage } from '../storage'

  export let availability: ActionAvailability
  export let phase: RoundPhase
  export let language: AppLanguage = 'en'

  const dispatch = createEventDispatcher<{ action: PlayerActionName }>()

  type ActionConfig = {
    key: PlayerActionName
    label: string
    caption: string
    tone?: 'primary' | 'secondary' | 'danger'
  }

  const actionSets = (currentLanguage: AppLanguage): Record<RoundPhase, ActionConfig[]> => ({
    betting: [{ key: 'deal', label: uiText(currentLanguage, 'deal'), caption: uiText(currentLanguage, 'startNextHand') }],
    insurance: [
      { key: 'insurance', label: uiText(currentLanguage, 'takeInsurance'), caption: uiText(currentLanguage, 'sideBetHalfStake') },
      { key: 'decline-insurance', label: uiText(currentLanguage, 'noInsurance'), caption: uiText(currentLanguage, 'continueWithoutCover'), tone: 'secondary' },
    ],
    'player-turn': [
      { key: 'hit', label: uiText(currentLanguage, 'hit'), caption: uiText(currentLanguage, 'takeOneCard') },
      { key: 'stand', label: uiText(currentLanguage, 'stand'), caption: uiText(currentLanguage, 'lockThisHand'), tone: 'secondary' },
      { key: 'double', label: uiText(currentLanguage, 'double'), caption: uiText(currentLanguage, 'doubleStakeOneCard') },
      { key: 'split', label: uiText(currentLanguage, 'split'), caption: uiText(currentLanguage, 'breakPairTwoHands') },
      { key: 'surrender', label: uiText(currentLanguage, 'surrender'), caption: uiText(currentLanguage, 'foldForHalfBack'), tone: 'danger' },
    ],
    'dealer-turn': [],
    'round-over': [{ key: 'next-round', label: uiText(currentLanguage, 'nextRound'), caption: uiText(currentLanguage, 'clearTable') }],
  })

  function stateFor(config: ActionConfig) {
    switch (config.key) {
      case 'deal':
        return availability.deal
      case 'hit':
        return availability.hit
      case 'stand':
        return availability.stand
      case 'double':
        return availability.double
      case 'split':
        return availability.split
      case 'insurance':
        return availability.insurance
      case 'decline-insurance':
        return availability.declineInsurance
      case 'surrender':
        return availability.surrender
      case 'next-round':
        return availability.nextRound
    }
  }
</script>

<section class="actions-panel">
  <p class="panel-kicker">{uiText(language, 'tableActions')}</p>
  <h3>{uiText(language, 'playHand')}</h3>

  {#if actionSets(language)[phase].length === 0}
    <p class="bet-hint">{uiText(language, 'dealerResolving')}</p>
  {:else}
    <div class="action-grid">
      {#each actionSets(language)[phase] as config}
        {@const status = stateFor(config)}
        <button
          type="button"
          class:secondary={config.tone === 'secondary'}
          class:danger={config.tone === 'danger'}
          class="action-button"
          title={translateDynamic(language, status.reason ?? '')}
          disabled={!status.enabled}
          on:click={() => dispatch('action', config.key)}
        >
          <span class="button-title">{config.label}</span>
          <span class="button-caption">{config.caption}</span>
        </button>
      {/each}
    </div>
  {/if}
</section>