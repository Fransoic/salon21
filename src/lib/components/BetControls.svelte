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
  const sliderBaseStep = 5

  $: sliderMax = Math.max(1, bankroll)
  $: sliderStep = sliderMax >= sliderBaseStep ? sliderBaseStep : 1
  $: sliderMin = sliderMax >= sliderBaseStep ? sliderBaseStep : 1
  $: sliderValue = normalizeSliderValue(currentBet)

  function normalizeSliderValue(amount: number) {
    const cappedAmount = Math.max(sliderMin, Math.min(amount, sliderMax))

    if (sliderStep === 1) {
      return cappedAmount
    }

    return Math.max(sliderMin, Math.floor(cappedAmount / sliderBaseStep) * sliderBaseStep)
  }

  function handleCustomBetInput(event: Event) {
    const nextAmount = Number((event.currentTarget as HTMLInputElement).value)

    if (!Number.isFinite(nextAmount)) {
      return
    }

    dispatch('select', nextAmount)
  }
</script>

<section class="bet-panel">
  <h3>{uiText(language, 'chooseStake')}</h3>

  <label class="bet-manual" for="custom-bet">
    <strong class="bet-manual-value">{formatMoney(sliderValue)}</strong>
    <input
      id="custom-bet"
      class="bet-manual-slider"
      type="range"
      min={sliderMin}
      max={sliderMax}
      step={sliderStep}
      value={sliderValue}
      disabled={disabled || bankroll <= 0}
      on:input={handleCustomBetInput}
    />
  </label>

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