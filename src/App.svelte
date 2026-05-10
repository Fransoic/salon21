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
  import { getRecommendedAction } from './lib/game/strategy'
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
  const optionsHash = '#options'
  const optionsRouteByTab: Record<OptionsTab, string> = {
    options: '#options/options',
    strategy: '#options/strategy',
    session: '#options/session',
  }

  type OptionsTab = 'options' | 'strategy' | 'session'
  type AppPage = 'table' | 'options'
  type RoundDeltaOverlayIntensity = 'small' | 'medium' | 'large'
  type RoundDeltaOverlayChip = {
    id: number
    x: string
    y: string
    size: string
    driftX: string
    driftY: string
    rotate: string
    delay: string
  }
  type RoundDeltaOverlay = {
    id: number
    value: number
    tone: 'win' | 'loss'
    intensity: RoundDeltaOverlayIntensity
    chips: RoundDeltaOverlayChip[]
  }

  const roundDeltaChipLayouts: RoundDeltaOverlayChip[] = [
    { id: 1, x: '-34%', y: '22%', size: '1.05rem', driftX: '-34px', driftY: '-70px', rotate: '-24deg', delay: '0ms' },
    { id: 2, x: '-22%', y: '-8%', size: '0.9rem', driftX: '-18px', driftY: '-82px', rotate: '-14deg', delay: '70ms' },
    { id: 3, x: '-8%', y: '30%', size: '1.2rem', driftX: '-10px', driftY: '-96px', rotate: '18deg', delay: '30ms' },
    { id: 4, x: '10%', y: '-18%', size: '1rem', driftX: '16px', driftY: '-88px', rotate: '22deg', delay: '120ms' },
    { id: 5, x: '26%', y: '20%', size: '1.15rem', driftX: '34px', driftY: '-74px', rotate: '28deg', delay: '40ms' },
    { id: 6, x: '34%', y: '-6%', size: '0.96rem', driftX: '28px', driftY: '-84px', rotate: '-18deg', delay: '150ms' },
    { id: 7, x: '-40%', y: '-18%', size: '0.88rem', driftX: '-42px', driftY: '-58px', rotate: '12deg', delay: '110ms' },
    { id: 8, x: '42%', y: '10%', size: '0.88rem', driftX: '40px', driftY: '-62px', rotate: '-28deg', delay: '180ms' },
  ]

  let game = createInitialState()
  let hydrated = false
  let currentPage: AppPage = 'table'
  let activeOptionsTab: OptionsTab = 'strategy'
  let openedOptionsFromApp = false
  let preferences: AppPreferences = { ...defaultPreferences }
  let lastPlayerAction: PlayerActionName | null = null
  let roundDeltaOverlay: RoundDeltaOverlay | null = null
  let roundDeltaOverlayTimer: ReturnType<typeof setTimeout> | null = null
  let roundDeltaOverlayId = 0

  $: availability = getActionAvailability(game, { allowSurrender: preferences.allowSurrender })
  $: strategyHandCards =
    game.phase === 'insurance' || game.phase === 'player-turn' ? (game.playerHands[game.activeHandIndex]?.cards ?? []) : []
  $: strategyDealerUpcard =
    game.phase === 'insurance' || game.phase === 'player-turn' ? (game.dealerHand[0]?.rank ?? null) : null
  $: recommendedAction =
    preferences.showStrategyHint && game.phase === 'player-turn'
      ? getRecommendedAction(strategyHandCards, strategyDealerUpcard, availability, {
          allowSurrender: preferences.allowSurrender,
        })
      : null
  $: if (hydrated && shouldPersistProfile(game)) {
    saveProfile(game)
  }

  onMount(() => {
    game = createInitialState(loadProfile() ?? undefined)
    preferences = loadPreferences()
    setSoundVolume(preferences.volume)
    applyLanguage(preferences.language)
    syncPageFromLocation()
    hydrated = true

    const handleHashChange = () => {
      syncPageFromLocation()
    }

    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
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

  function handleSurrenderToggle(event: Event) {
    const allowSurrender = (event.currentTarget as HTMLInputElement).checked
    updatePreferences({ ...preferences, allowSurrender })
  }

  function handleStrategyHintToggle(event: Event) {
    const showStrategyHint = (event.currentTarget as HTMLInputElement).checked
    updatePreferences({ ...preferences, showStrategyHint })
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

  function clearRoundDeltaOverlay() {
    if (roundDeltaOverlayTimer) {
      clearTimeout(roundDeltaOverlayTimer)
      roundDeltaOverlayTimer = null
    }

    roundDeltaOverlay = null
  }

  function roundDeltaOverlayIntensity(delta: number, referenceBet: number): RoundDeltaOverlayIntensity {
    const baseline = Math.max(referenceBet, betOptions[0])
    const ratio = Math.abs(delta) / baseline

    if (ratio >= 3) {
      return 'large'
    }

    if (ratio >= 1.5) {
      return 'medium'
    }

    return 'small'
  }

  function roundDeltaOverlayChips(intensity: RoundDeltaOverlayIntensity): RoundDeltaOverlayChip[] {
    switch (intensity) {
      case 'large':
        return roundDeltaChipLayouts
      case 'medium':
        return roundDeltaChipLayouts.slice(0, 6)
      case 'small':
        return roundDeltaChipLayouts.slice(0, 4)
    }
  }

  function showRoundDeltaOverlay(delta: number, referenceBet: number) {
    clearRoundDeltaOverlay()

    if (delta === 0) {
      return
    }

    const intensity = roundDeltaOverlayIntensity(delta, referenceBet)

    roundDeltaOverlayId += 1
    roundDeltaOverlay = {
      id: roundDeltaOverlayId,
      value: delta,
      tone: delta > 0 ? 'win' : 'loss',
      intensity,
      chips: roundDeltaOverlayChips(intensity),
    }

    roundDeltaOverlayTimer = setTimeout(() => {
      roundDeltaOverlay = null
      roundDeltaOverlayTimer = null
    }, 1800)
  }

  function commitGame(nextGame: GameState, action?: PlayerActionName) {
    const previousGame = game
    lastPlayerAction = action ?? null
    game = nextGame
    if (previousGame.phase !== 'round-over' && nextGame.phase === 'round-over') {
      showRoundDeltaOverlay(nextGame.lastRoundDelta, nextGame.currentBet)
    } else if (previousGame.phase === 'round-over' && nextGame.phase !== 'round-over') {
      clearRoundDeltaOverlay()
    }
    playActionFeedback(previousGame, nextGame, action)
  }

  function handleBetChange(amount: number) {
    const nextGame = setBet(game, amount)

    if (nextGame.currentBet !== game.currentBet) {
      playSound('chip')
    }

    lastPlayerAction = null
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
        if (!preferences.allowSurrender) {
          return
        }
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
    lastPlayerAction = null
    game = resetProgress()
  }

  function formatDelta(delta: number, language: AppLanguage): string {
    if (delta === 0) {
      return uiText(language, 'evenRound')
    }

    const sign = delta > 0 ? '+' : '-'
    return `${sign}${formatMoney(Math.abs(delta))}`
  }

  function syncPageFromLocation() {
    if (typeof window === 'undefined') {
      return
    }

    const nextTab = optionsTabFromHash(window.location.hash)
    currentPage = nextTab ? 'options' : 'table'

    if (nextTab) {
      activeOptionsTab = nextTab
    }

    if (currentPage === 'table') {
      openedOptionsFromApp = false
    }
  }

  function openOptions() {
    const nextTab: OptionsTab = 'strategy'
    activeOptionsTab = nextTab
    currentPage = 'options'

    if (typeof window === 'undefined') {
      return
    }

    if (window.location.hash !== optionsRouteByTab[nextTab]) {
      openedOptionsFromApp = true
      window.location.hash = optionsRouteByTab[nextTab]
    }
  }

  function closeOptions() {
    currentPage = 'table'

    if (typeof window === 'undefined') {
      return
    }

    if (openedOptionsFromApp && optionsTabFromHash(window.location.hash)) {
      window.history.back()
      return
    }

    window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`)
  }

  function optionsTabFromHash(hash: string): OptionsTab | null {
    if (hash === optionsHash || hash === `${optionsHash}/`) {
      return 'strategy'
    }

    if (!hash.startsWith(`${optionsHash}/`)) {
      return null
    }

    const segment = hash.slice(optionsHash.length + 1)

    switch (segment) {
      case 'options':
      case 'strategy':
      case 'session':
        return segment
      default:
        return null
    }
  }

  function goToOptionsTab(tab: OptionsTab) {
    activeOptionsTab = tab

    if (typeof window === 'undefined') {
      return
    }

    const nextHash = optionsRouteByTab[tab]

    if (window.location.hash === nextHash) {
      return
    }

    window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}${nextHash}`)
    syncPageFromLocation()
  }

  function optionsHeading(tab: OptionsTab): 'tableControls' | 'basicStrategy' | 'tableSnapshot' {
    switch (tab) {
      case 'strategy':
        return 'basicStrategy'
      case 'session':
        return 'tableSnapshot'
      default:
        return 'tableControls'
    }
  }

  function optionsDescription(tab: OptionsTab): 'optionsControlsHint' | 'optionsStrategyHint' | 'optionsSessionHint' {
    switch (tab) {
      case 'strategy':
        return 'optionsStrategyHint'
      case 'session':
        return 'optionsSessionHint'
      default:
        return 'optionsControlsHint'
    }
  }
</script>

<svelte:head>
  <title>
    {currentPage === 'options'
      ? `${uiText(preferences.language, optionsHeading(activeOptionsTab))} - ${uiText(preferences.language, 'appTitle')}`
      : uiText(preferences.language, 'appTitle')}
  </title>
</svelte:head>

<main class:app-shell--options={currentPage === 'options'} class="app-shell">
  {#if currentPage === 'table'}
    <section class="play-surface">
      <div class="stage-stack">
        <GameTable
          dealerHand={game.dealerHand}
          playerHands={game.playerHands}
          activeHandIndex={game.activeHandIndex}
          phase={game.phase}
          lastRoundDelta={game.lastRoundDelta}
          lastPlayerAction={lastPlayerAction}
          language={preferences.language}
        />

        {#if roundDeltaOverlay}
          {#key roundDeltaOverlay.id}
            <div
              class={`round-delta-overlay round-delta-overlay--${roundDeltaOverlay.tone} round-delta-overlay--${roundDeltaOverlay.intensity}`}
              aria-hidden="true"
            >
              <div class="round-delta-overlay__burst"></div>
              <div class="round-delta-overlay__chips">
                {#each roundDeltaOverlay.chips as chip (chip.id)}
                  <span
                    class="round-delta-chip"
                    style={`--chip-x:${chip.x}; --chip-y:${chip.y}; --chip-size:${chip.size}; --chip-drift-x:${chip.driftX}; --chip-drift-y:${chip.driftY}; --chip-rotate:${chip.rotate}; --chip-delay:${chip.delay};`}
                  ></span>
                {/each}
              </div>
              <strong>{formatDelta(roundDeltaOverlay.value, preferences.language)}</strong>
            </div>
          {/key}
        {/if}
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
          allowSurrender={preferences.allowSurrender}
          recommendedAction={recommendedAction}
          on:action={(event) => handleAction(event.detail)}
        />
      </div>
    </section>
  {:else}
    <section class="play-surface" aria-label={uiText(preferences.language, 'options')}>
      <div class="stage-stack">
        <div class="options-page">
          <div class="options-tabs" role="tablist" aria-label={uiText(preferences.language, 'optionsSections')}>
            <button
              type="button"
              role="tab"
              class:active={activeOptionsTab === 'strategy'}
              class="options-tab"
              aria-label={uiText(preferences.language, 'strategy')}
              aria-selected={activeOptionsTab === 'strategy'}
              title={uiText(preferences.language, 'strategy')}
              on:click={() => goToOptionsTab('strategy')}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M6.5 5.5h11a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 17V7a1.5 1.5 0 0 1 1.5-1.5Z"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                />
                <path d="M9 9.5h6M9 12h6M9 14.5h3.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" />
              </svg>
            </button>
            <button
              type="button"
              role="tab"
              class:active={activeOptionsTab === 'options'}
              class="options-tab"
              aria-label={uiText(preferences.language, 'options')}
              aria-selected={activeOptionsTab === 'options'}
              title={uiText(preferences.language, 'options')}
              on:click={() => goToOptionsTab('options')}
            >
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
            <button
              type="button"
              role="tab"
              class:active={activeOptionsTab === 'session'}
              class="options-tab"
              aria-label={uiText(preferences.language, 'localSession')}
              aria-selected={activeOptionsTab === 'session'}
              title={uiText(preferences.language, 'localSession')}
              on:click={() => goToOptionsTab('session')}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 18.5h12" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" />
                <path d="M8.5 16V11.5M12 16V7.5M15.5 16v-5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" />
                <circle cx="8.5" cy="10" r="1.2" fill="currentColor" />
                <circle cx="12" cy="6" r="1.2" fill="currentColor" />
                <circle cx="15.5" cy="9.5" r="1.2" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="control-dock" aria-label={uiText(preferences.language, 'optionsSections')}>
      <div class="control-stack">
        {#if activeOptionsTab === 'options'}
          <div class="options-tab-panel" role="tabpanel" aria-label={uiText(preferences.language, 'options')}>
            <div class="settings-grid">
              <article class="setting-card">
                <div class="setting-head">
                  <h3>{uiText(preferences.language, 'volume')}</h3>
                  <strong class="volume-readout">{Math.round(preferences.volume * 100)}%</strong>
                </div>
                <input
                  id="volume-control"
                  class="range-control"
                  aria-label={uiText(preferences.language, 'volume')}
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
                  <h3>{uiText(preferences.language, 'language')}</h3>
                </div>
                <select
                  id="language-control"
                  class="select-control"
                  aria-label={uiText(preferences.language, 'language')}
                  value={preferences.language}
                  on:change={handleLanguageChange}
                >
                  {#each languageOptions as option}
                    <option value={option}>{languageOptionLabel(preferences.language, option)}</option>
                  {/each}
                </select>
              </article>

              <article class="setting-card">
                <div class="setting-head">
                  <h3>{uiText(preferences.language, 'lateSurrender')}</h3>
                  <input
                    id="surrender-control"
                    class="checkbox-control"
                    type="checkbox"
                    checked={preferences.allowSurrender}
                    on:change={handleSurrenderToggle}
                  />
                </div>
                <label class="setting-copy" for="surrender-control">{uiText(preferences.language, 'lateSurrenderHint')}</label>
              </article>

              <article class="setting-card">
                <div class="setting-head">
                  <h3>{uiText(preferences.language, 'strategyAssist')}</h3>
                  <input
                    id="strategy-hint-control"
                    class="checkbox-control"
                    type="checkbox"
                    checked={preferences.showStrategyHint}
                    on:change={handleStrategyHintToggle}
                  />
                </div>
                <label class="setting-copy" for="strategy-hint-control">{uiText(preferences.language, 'strategyAssistHint')}</label>
              </article>
            </div>
          </div>
        {:else if activeOptionsTab === 'strategy'}
          <div class="options-tab-panel" role="tabpanel" aria-label={uiText(preferences.language, 'strategy')}>
            <StrategyPanel
              language={preferences.language}
              allowSurrender={preferences.allowSurrender}
              activeHandCards={strategyHandCards}
              dealerUpcard={strategyDealerUpcard}
            />
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
    </section>
  {/if}

  <header class="top-strip" aria-label="Current step">
    <div class="top-strip-main">
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
    </div>

    <div class="top-strip-status">
      <p class="step-copy">
        {#if currentPage === 'table'}
          {translateDynamic(preferences.language, game.message)}
        {:else}
          {uiText(preferences.language, optionsDescription(activeOptionsTab))}
        {/if}
      </p>
      <div class="step-meta">
        <div class="phase-badge">
          {#if currentPage === 'table'}
            {phaseLabel(preferences.language, game.phase)}
          {:else}
            {uiText(preferences.language, 'options')}
          {/if}
        </div>

        {#if currentPage === 'table'}
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
        {:else}
          <button type="button" class="options-close" aria-label={uiText(preferences.language, 'close')} on:click={closeOptions}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6l-12 12"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-width="1.8"
              />
            </svg>
          </button>
        {/if}
      </div>
    </div>
  </header>
</main>
