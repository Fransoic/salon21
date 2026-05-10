<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import { translateDynamic, uiText } from '../i18n'
  import type { ActionAvailability, PlayerActionName, RoundPhase } from '../game/types'
  import type { AppLanguage } from '../storage'

  export let availability: ActionAvailability
  export let phase: RoundPhase
  export let language: AppLanguage = 'en'
  export let allowSurrender = true
  export let recommendedAction: PlayerActionName | null = null

  const dispatch = createEventDispatcher<{ action: PlayerActionName }>()

  type ActionConfig = {
    key: PlayerActionName
    label: string
    tone?: 'primary' | 'secondary' | 'danger'
  }

  function styleClassFor(key: PlayerActionName): string {
    switch (key) {
      case 'deal':
        return 'action-button--deal'
      case 'hit':
        return 'action-button--hit'
      case 'stand':
        return 'action-button--stand'
      case 'double':
        return 'action-button--double'
      case 'split':
        return 'action-button--split'
      case 'surrender':
        return 'action-button--surrender'
      default:
        return ''
    }
  }

  const actionSets = (currentLanguage: AppLanguage, surrenderEnabled: boolean): Record<RoundPhase, ActionConfig[]> => ({
    betting: [{ key: 'deal', label: uiText(currentLanguage, 'deal') }],
    insurance: [
      { key: 'insurance', label: uiText(currentLanguage, 'takeInsurance') },
      { key: 'decline-insurance', label: uiText(currentLanguage, 'noInsurance'), tone: 'secondary' },
    ],
    'player-turn': [
      { key: 'hit', label: uiText(currentLanguage, 'hit') },
      { key: 'stand', label: uiText(currentLanguage, 'stand'), tone: 'secondary' },
      { key: 'double', label: uiText(currentLanguage, 'double') },
      { key: 'split', label: uiText(currentLanguage, 'split') },
      ...(surrenderEnabled ? ([{ key: 'surrender', label: uiText(currentLanguage, 'surrender'), tone: 'danger' }] as ActionConfig[]) : []),
    ],
    'dealer-turn': [],
    'round-over': [{ key: 'next-round', label: uiText(currentLanguage, 'nextRound') }],
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
  {#if actionSets(language, allowSurrender)[phase].length === 0}
    <p class="bet-hint">{uiText(language, 'dealerResolving')}</p>
  {:else}
    <div class="action-grid">
      {#each actionSets(language, allowSurrender)[phase] as config}
        {@const status = stateFor(config)}
        <button
          type="button"
          class:secondary={config.tone === 'secondary'}
          class:danger={config.tone === 'danger'}
          class:recommended={config.key === recommendedAction && status.enabled}
          class={`action-button ${styleClassFor(config.key)}`}
          title={translateDynamic(language, status.reason ?? '')}
          disabled={!status.enabled}
          on:click={() => dispatch('action', config.key)}
        >
          {#if config.key === recommendedAction && status.enabled}
            <span class="strategy-indicator" aria-hidden="true"></span>
          {/if}
          <span class="button-title">{config.label}</span>
        </button>
      {/each}
    </div>
  {/if}
</section>