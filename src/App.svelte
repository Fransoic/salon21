<script lang="ts">
  import { onMount } from 'svelte'

  import ActionBar from './lib/components/ActionBar.svelte'
  import BetControls from './lib/components/BetControls.svelte'
  import GameTable from './lib/components/GameTable.svelte'
  import StatsPanel from './lib/components/StatsPanel.svelte'
  import StrategyPanel from './lib/components/StrategyPanel.svelte'
  import { getSoundVolume, playSound, setSoundVolume } from './lib/audio'
  import { formatMoney } from './lib/format'
  import { languageOptionLabel, phaseLabel, translateDynamic, uiText } from './lib/i18n'
  import {
    createInitialState,
    dealRound,
    declineInsurance,
    doubleDown,
    getActionAvailability,
    hit,
    nextRound,
    resetProgress,
    setBet,
    shouldPersistProfile,
    split,
    stand,
    surrender,
    takeInsurance,
  } from './lib/game/state'
  import type { GameState, PlayerActionName } from './lib/game/types'
  import {
    clearProfile,
    defaultPreferences,
    loadPreferences,
    loadProfile,
    savePreferences,
    saveProfile,
    type AppLanguage,
    type AppPreferences,
  } from './lib/storage'

  const betOptions = [10, 25, 50, 100]
  const languageOptions: AppLanguage[] = ['en', 'fr']

  let game = createInitialState()
  let hydrated = false
  let showOptions = false
  let activeOptionsTab: 'options' | 'strategy' | 'session' = 'strategy'
  let preferences: AppPreferences = { ...defaultPreferences }

  $: availability = getActionAvailability(game)
  $: if (hydrated && shouldPersistProfile(game)) {
    saveProfile(game)
  }

  onMount(() => {
    game = createInitialState(loadProfile() ?? undefined)
    preferences = loadPreferences()
    setSoundVolume(preferences.volume)
    applyLanguage(preferences.language)
    hydrated = true
  })

  function applyLanguage(language: AppLanguage) {
    if (typeof document === 'undefined') {
      return
    }

    document.documentElement.lang = language
  }

  function updatePreferences(nextPreferences: AppPreferences) {
    preferences = nextPreferences
    savePreferences(nextPreferences)
  }

  function handleVolumeInput(event: Event) {
    const volume = Number((event.currentTarget as HTMLInputElement).value)
    const nextPreferences = { ...preferences, volume }

    updatePreferences(nextPreferences)
    setSoundVolume(volume)
  }

  function previewVolume() {
    playSound('chip')
  }

  function handleLanguageChange(event: Event) {
    const language = (event.currentTarget as HTMLSelectElement).value as AppLanguage
    const nextPreferences = { ...preferences, language }

    updatePreferences(nextPreferences)
    applyLanguage(language)
  }

  function outcomeSound(nextGame: GameState) {
    if (nextGame.playerHands.some((hand) => hand.result?.outcome === 'blackjack')) {
      return 'blackjack' as const
    }

    if (nextGame.lastRoundDelta > 0) {
      return 'win' as const
    }

    if (nextGame.lastRoundDelta < 0) {
      return 'loss' as const
    }

    if (nextGame.playerHands.some((hand) => hand.result?.outcome === 'push')) {
      return 'push' as const
    }

    return null
  }

  function playActionFeedback(previousGame: GameState, nextGame: GameState, action?: PlayerActionName) {
    switch (action) {
      case 'deal':
        playSound('deal')
        break
      case 'hit':
        playSound('hit')
        break
      case 'stand':
        playSound('stand')
        break
      case 'double':
        playSound('double')
        break
      case 'split':
        playSound('split')
        break
      case 'insurance':
        playSound('insurance')
        break
      case 'decline-insurance':
        playSound('declineInsurance')
        break
      case 'surrender':
        playSound('surrender')
        break
      case 'next-round':
        playSound('nextRound')
        break
    }

    if (previousGame.phase !== 'round-over' && nextGame.phase === 'round-over') {
      const cue = outcomeSound(nextGame)

      if (cue) {
        playSound(cue, 0.16)
      }
    }
  }

  function commitGame(nextGame: GameState, action?: PlayerActionName) {
    const previousGame = game
    game = nextGame
    playActionFeedback(previousGame, nextGame, action)
  }

  function handleBetChange(amount: number) {
    const nextGame = setBet(game, amount)

    if (nextGame.currentBet !== game.currentBet) {
      playSound('chip')
    }

    game = nextGame
  }

  function handleAction(action: PlayerActionName) {
    switch (action) {
      case 'deal':
        commitGame(dealRound(game), action)
        return
      case 'insurance':
        commitGame(takeInsurance(game), action)
        return
      case 'decline-insurance':
        commitGame(declineInsurance(game), action)
        return
      case 'hit':
        commitGame(hit(game), action)
        return
      case 'stand':
        commitGame(stand(game), action)
        return
      case 'double':
        commitGame(doubleDown(game), action)
        return
      case 'split':
        commitGame(split(game), action)
        return
      case 'surrender':
        commitGame(surrender(game), action)
        return
      case 'next-round':
        commitGame(nextRound(game), action)
        return
    }
  }

  function handleReset() {
    if (!window.confirm(uiText(preferences.language, 'resetConfirm'))) {
      return
    }

    clearProfile()
    playSound('reset')
    game = resetProgress()
  }

  function formatDelta(delta: number, language: AppLanguage): string {
    if (delta === 0) {
      return uiText(language, 'evenRound')
    }

    const sign = delta > 0 ? '+' : '-'
    return `${sign}${formatMoney(Math.abs(delta))}`
  }

  function openOptions() {
    activeOptionsTab = 'strategy'
    showOptions = true
  }

  function closeOptions() {
    showOptions = false
  }

  function optionsHeading(tab: 'options' | 'strategy' | 'session'): 'tableControls' | 'basicStrategy' | 'tableSnapshot' {
    switch (tab) {
      case 'strategy':
        return 'basicStrategy'
      case 'session':
        return 'tableSnapshot'
      default:
        return 'tableControls'
    }
  }
</script>

<svelte:head>
  <title>{uiText(preferences.language, 'appTitle')}</title>
</svelte:head>

<main class="app-shell">
  <header class="top-strip">
    <h1>{uiText(preferences.language, 'appTitle')}</h1>

    <div class="hero-stats simple-stats">
      <div class="top-stat">
        <span>{uiText(preferences.language, 'bankroll')}</span>
        <strong>{formatMoney(game.bankroll)}</strong>
      </div>
      <div class="top-stat">
        <span>{uiText(preferences.language, 'bet')}</span>
        <strong>{formatMoney(game.currentBet)}</strong>
      </div>
      <div class="top-stat">
        <span>{uiText(preferences.language, 'swing')}</span>
        <strong class:last-win={game.lastRoundDelta > 0} class:last-loss={game.lastRoundDelta < 0}>
          {formatDelta(game.lastRoundDelta, preferences.language)}
        </strong>
      </div>
      <div class="top-stat">
        <span>{uiText(preferences.language, 'hands')}</span>
        <strong>{game.stats.handsPlayed}</strong>
      </div>
    </div>
  </header>

  <section class="step-strip" aria-label="Current step">
    <p class="step-copy">{translateDynamic(preferences.language, game.message)}</p>
    <div class="step-meta">
      <div class="phase-badge">{phaseLabel(preferences.language, game.phase)}</div>
      <button type="button" class="options-icon" aria-label={uiText(preferences.language, 'openOptions')} on:click={openOptions}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 7h10M18 7h2M8 12h12M4 12h2M4 17h14M20 17h0"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-width="1.8"
          />
          <circle cx="16" cy="7" r="2.2" fill="currentColor" />
          <circle cx="8" cy="12" r="2.2" fill="currentColor" />
          <circle cx="18" cy="17" r="2.2" fill="currentColor" />
        </svg>
      </button>
    </div>
  </section>

  <section class="play-surface">
    <div class="stage-stack">
      <GameTable
        dealerHand={game.dealerHand}
        playerHands={game.playerHands}
        activeHandIndex={game.activeHandIndex}
        phase={game.phase}
        lastRoundDelta={game.lastRoundDelta}
        language={preferences.language}
      />
    </div>
  </section>

  <section class="control-dock">
    <div class="control-stack">
      {#if game.phase === 'betting'}
        <BetControls
          bankroll={game.bankroll}
          currentBet={game.currentBet}
          betOptions={betOptions}
          disabled={false}
          language={preferences.language}
          on:select={(event) => handleBetChange(event.detail)}
        />
      {/if}

      <ActionBar
        phase={game.phase}
        availability={availability}
        language={preferences.language}
        on:action={(event) => handleAction(event.detail)}
      />
    </div>
  </section>
</main>

{#if showOptions}
  <div class="options-layer" role="dialog" aria-modal="true" aria-label={uiText(preferences.language, 'options')}>
    <div class="options-page">
      <div class="options-head">
        <div>
          <p class="panel-kicker">{uiText(preferences.language, 'options')}</p>
          <h2>{uiText(preferences.language, optionsHeading(activeOptionsTab))}</h2>
        </div>
        <button type="button" class="options-close" on:click={closeOptions}>{uiText(preferences.language, 'close')}</button>
      </div>

      <div class="options-tabs" role="tablist" aria-label={uiText(preferences.language, 'optionsSections')}>
        <button
          type="button"
          role="tab"
          class:active={activeOptionsTab === 'options'}
          class="options-tab"
          aria-selected={activeOptionsTab === 'options'}
          on:click={() => (activeOptionsTab = 'options')}
        >
          {uiText(preferences.language, 'options')}
        </button>
        <button
          type="button"
          role="tab"
          class:active={activeOptionsTab === 'strategy'}
          class="options-tab"
          aria-selected={activeOptionsTab === 'strategy'}
          on:click={() => (activeOptionsTab = 'strategy')}
        >
          {uiText(preferences.language, 'strategy')}
        </button>
        <button
          type="button"
          role="tab"
          class:active={activeOptionsTab === 'session'}
          class="options-tab"
          aria-selected={activeOptionsTab === 'session'}
          on:click={() => (activeOptionsTab = 'session')}
        >
          {uiText(preferences.language, 'localSession')}
        </button>
      </div>

      {#if activeOptionsTab === 'options'}
        <div class="options-tab-panel" role="tabpanel" aria-label={uiText(preferences.language, 'options')}>
          <div class="settings-grid">
            <article class="setting-card">
              <div class="setting-head">
                <div>
                  <p class="panel-kicker">{uiText(preferences.language, 'sound')}</p>
                  <h3>{uiText(preferences.language, 'volume')}</h3>
                </div>
                <strong class="volume-readout">{Math.round(preferences.volume * 100)}%</strong>
              </div>
              <label class="setting-copy" for="volume-control">{uiText(preferences.language, 'volumeHint')}</label>
              <input
                id="volume-control"
                class="range-control"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={preferences.volume}
                on:input={handleVolumeInput}
                on:change={previewVolume}
              />
            </article>

            <article class="setting-card">
              <div class="setting-head">
                <div>
                  <p class="panel-kicker">{uiText(preferences.language, 'interface')}</p>
                  <h3>{uiText(preferences.language, 'language')}</h3>
                </div>
              </div>
              <label class="setting-copy" for="language-control">{uiText(preferences.language, 'languageHint')}</label>
              <select id="language-control" class="select-control" value={preferences.language} on:change={handleLanguageChange}>
                {#each languageOptions as option}
                  <option value={option}>{languageOptionLabel(preferences.language, option)}</option>
                {/each}
              </select>
            </article>
          </div>
        </div>
      {:else if activeOptionsTab === 'strategy'}
        <div class="options-tab-panel" role="tabpanel" aria-label={uiText(preferences.language, 'strategy')}>
          <StrategyPanel language={preferences.language} />
        </div>
      {:else}
        <div class="options-tab-panel" role="tabpanel" aria-label={uiText(preferences.language, 'localSession')}>
          <StatsPanel
            bankroll={game.bankroll}
            currentBet={game.currentBet}
            stats={game.stats}
            phase={game.phase}
            language={preferences.language}
            on:reset={handleReset}
          />
        </div>
      {/if}
    </div>
  </div>
{/if}
