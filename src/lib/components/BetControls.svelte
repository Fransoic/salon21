<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import { formatMoney } from '../format'
  import { uiText } from '../i18n'
  import type { AppLanguage } from '../storage'

  export let bankroll: number
  export let currentBet: number
  export let betOptions: number[] = []
  export let disabled = false
  export let language: AppLanguage = 'en'

  const dispatch = createEventDispatcher<{ select: number }>()
</script>

<section class="bet-panel">
  <p class="panel-kicker">{uiText(language, 'betting')}</p>
  <h3>{uiText(language, 'chooseStake')}</h3>

  <div class="bet-grid">
    {#each betOptions as amount}
      <button
        type="button"
        class:selected={amount === currentBet}
        class="bet-chip"
        disabled={disabled || amount > bankroll}
        on:click={() => dispatch('select', amount)}
      >
        <span class="bet-value">{formatMoney(amount)}</span>
      </button>
    {/each}
  </div>
</section>