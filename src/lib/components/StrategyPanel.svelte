<script lang="ts">
  import { scoreHand } from '../game/rules'
  import type { Card, Rank } from '../game/types'
  import type { AppLanguage } from '../storage'

  export let language: AppLanguage = 'en'
  export let allowSurrender = false
  export let activeHandCards: Card[] = []
  export let dealerUpcard: Rank | null = null

  type StrategyCode = 'H' | 'S' | 'Dh' | 'Ds' | 'P' | 'Rh'
  type StrategySectionKey = 'hard' | 'soft' | 'pairs'
  type StrategyRow = {
    label: string
    moves: StrategyCode[]
  }
  type StrategyFocus = {
    section: StrategySectionKey
    rowLabel: string
    dealerHeader: string
  }
  type StrategySection = {
    key: StrategySectionKey
    title: string
    rows: StrategyRow[]
  }

  const dealerHeaders = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A']
  const tenValueRanks = new Set<Rank>(['10', 'J', 'Q', 'K'])

  const panelCopy = {
    en: {
      focus: 'Current focus',
      dealerUpcard: 'Dealer upcard',
      dealerUpcardCompact: 'Dealer',
      playerHand: 'Player hand',
      playerHandCompact: 'Hand',
      legend: 'Legend',
      hardTotals: 'Hard totals',
      softTotals: 'Soft totals',
      pairs: 'Pairs',
      codes: {
        H: 'Hit',
        S: 'Stand',
        Dh: 'Double if allowed, otherwise hit',
        Ds: 'Double if allowed, otherwise stand',
        P: 'Split',
        Rh: 'Surrender if allowed, otherwise hit',
      },
    },
    fr: {
      focus: 'Repere actif',
      dealerUpcard: 'Carte visible du croupier',
      dealerUpcardCompact: 'Croupier',
      playerHand: 'Main joueur',
      playerHandCompact: 'Main',
      legend: 'Legende',
      hardTotals: 'Totaux durs',
      softTotals: 'Totaux soft',
      pairs: 'Paires',
      codes: {
        H: 'Tirer',
        S: 'Rester',
        Dh: 'Doubler si possible, sinon tirer',
        Ds: 'Doubler si possible, sinon rester',
        P: 'Separer',
        Rh: 'Abandonner si possible, sinon tirer',
      },
    },
  } as const

  const strategyRows: Record<AppLanguage, { hard: StrategyRow[]; soft: StrategyRow[]; pairs: StrategyRow[] }> = {
    en: {
      hard: [
        { label: '5-8', moves: ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'] },
        { label: '9', moves: ['H', 'Dh', 'Dh', 'Dh', 'Dh', 'H', 'H', 'H', 'H', 'H'] },
        { label: '10', moves: ['Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'H', 'H'] },
        { label: '11', moves: ['Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh'] },
        { label: '12', moves: ['H', 'H', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'] },
        { label: '13-14', moves: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'] },
        { label: '15', moves: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'Rh', 'H'] },
        { label: '16', moves: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'Rh', 'Rh', 'Rh'] },
        { label: '17+', moves: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'] },
      ],
      soft: [
        { label: 'A,2-A,3', moves: ['H', 'H', 'H', 'Dh', 'Dh', 'H', 'H', 'H', 'H', 'H'] },
        { label: 'A,4-A,5', moves: ['H', 'H', 'Dh', 'Dh', 'Dh', 'H', 'H', 'H', 'H', 'H'] },
        { label: 'A,6', moves: ['H', 'Dh', 'Dh', 'Dh', 'Dh', 'H', 'H', 'H', 'H', 'H'] },
        { label: 'A,7', moves: ['S', 'Ds', 'Ds', 'Ds', 'Ds', 'S', 'S', 'H', 'H', 'H'] },
        { label: 'A,8', moves: ['S', 'S', 'S', 'S', 'Ds', 'S', 'S', 'S', 'S', 'S'] },
        { label: 'A,9', moves: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'] },
      ],
      pairs: [
        { label: 'A,A', moves: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'] },
        { label: '10,10', moves: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'] },
        { label: '9,9', moves: ['P', 'P', 'P', 'P', 'P', 'S', 'P', 'P', 'S', 'S'] },
        { label: '8,8', moves: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'] },
        { label: '7,7', moves: ['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'] },
        { label: '6,6', moves: ['P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H', 'H'] },
        { label: '5,5', moves: ['Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'H', 'H'] },
        { label: '4,4', moves: ['H', 'H', 'H', 'P', 'P', 'H', 'H', 'H', 'H', 'H'] },
        { label: '3,3', moves: ['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'] },
        { label: '2,2', moves: ['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'] },
      ],
    },
    fr: {
      hard: [
        { label: '5-8', moves: ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'] },
        { label: '9', moves: ['H', 'Dh', 'Dh', 'Dh', 'Dh', 'H', 'H', 'H', 'H', 'H'] },
        { label: '10', moves: ['Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'H', 'H'] },
        { label: '11', moves: ['Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh'] },
        { label: '12', moves: ['H', 'H', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'] },
        { label: '13-14', moves: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'] },
        { label: '15', moves: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'Rh', 'H'] },
        { label: '16', moves: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'Rh', 'Rh', 'Rh'] },
        { label: '17+', moves: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'] },
      ],
      soft: [
        { label: 'A,2-A,3', moves: ['H', 'H', 'H', 'Dh', 'Dh', 'H', 'H', 'H', 'H', 'H'] },
        { label: 'A,4-A,5', moves: ['H', 'H', 'Dh', 'Dh', 'Dh', 'H', 'H', 'H', 'H', 'H'] },
        { label: 'A,6', moves: ['H', 'Dh', 'Dh', 'Dh', 'Dh', 'H', 'H', 'H', 'H', 'H'] },
        { label: 'A,7', moves: ['S', 'Ds', 'Ds', 'Ds', 'Ds', 'S', 'S', 'H', 'H', 'H'] },
        { label: 'A,8', moves: ['S', 'S', 'S', 'S', 'Ds', 'S', 'S', 'S', 'S', 'S'] },
        { label: 'A,9', moves: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'] },
      ],
      pairs: [
        { label: 'A,A', moves: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'] },
        { label: '10,10', moves: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'] },
        { label: '9,9', moves: ['P', 'P', 'P', 'P', 'P', 'S', 'P', 'P', 'S', 'S'] },
        { label: '8,8', moves: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'] },
        { label: '7,7', moves: ['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'] },
        { label: '6,6', moves: ['P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H', 'H'] },
        { label: '5,5', moves: ['Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'H', 'H'] },
        { label: '4,4', moves: ['H', 'H', 'H', 'P', 'P', 'H', 'H', 'H', 'H', 'H'] },
        { label: '3,3', moves: ['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'] },
        { label: '2,2', moves: ['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'] },
      ],
    },
  }

  function rowsForSurrenderSetting(rows: StrategyRow[], surrenderEnabled: boolean): StrategyRow[] {
    if (surrenderEnabled) {
      return rows
    }

    return rows.map((row) => ({
      ...row,
      moves: row.moves.map((move) => (move === 'Rh' ? 'H' : move)),
    }))
  }

  function dealerHeaderForRank(rank: Rank | null): string | null {
    if (!rank) {
      return null
    }

    if (tenValueRanks.has(rank)) {
      return '10'
    }

    return rank
  }

  function pairRowLabel(cards: Card[]): string | null {
    if (cards.length !== 2 || cards[0]?.rank !== cards[1]?.rank) {
      return null
    }

    const rank = cards[0].rank
    if (tenValueRanks.has(rank)) {
      return '10,10'
    }

    return `${rank},${rank}`
  }

  function softRowLabel(total: number): string | null {
    if (total <= 14) {
      return 'A,2-A,3'
    }

    if (total <= 16) {
      return 'A,4-A,5'
    }

    switch (total) {
      case 17:
        return 'A,6'
      case 18:
        return 'A,7'
      case 19:
        return 'A,8'
      case 20:
        return 'A,9'
      default:
        return null
    }
  }

  function hardRowLabel(total: number): string | null {
    if (total >= 5 && total <= 8) {
      return '5-8'
    }

    if (total === 13 || total === 14) {
      return '13-14'
    }

    if (total >= 17) {
      return '17+'
    }

    if (total >= 9 && total <= 16) {
      return String(total)
    }

    return null
  }

  function strategyFocusFor(cards: Card[], upcard: Rank | null): StrategyFocus | null {
    const dealerHeader = dealerHeaderForRank(upcard)
    if (!cards.length || !dealerHeader) {
      return null
    }

    const pairLabel = pairRowLabel(cards)
    if (pairLabel) {
      return { section: 'pairs', rowLabel: pairLabel, dealerHeader }
    }

    const score = scoreHand(cards)
    if (score.isBust || score.total >= 21) {
      return null
    }

    const rowLabel = score.isSoft ? softRowLabel(score.total) : hardRowLabel(score.total)
    if (!rowLabel) {
      return null
    }

    return {
      section: score.isSoft ? 'soft' : 'hard',
      rowLabel,
      dealerHeader,
    }
  }

  function isActiveRow(sectionKey: StrategySectionKey, rowLabel: string): boolean {
    return strategyFocus?.section === sectionKey && strategyFocus.rowLabel === rowLabel
  }

  function isActiveDealerColumn(header: string): boolean {
    return strategyFocus?.dealerHeader === header
  }

  function isActiveCell(sectionKey: StrategySectionKey, rowLabel: string, header: string): boolean {
    return isActiveRow(sectionKey, rowLabel) && isActiveDealerColumn(header)
  }

  $: content = panelCopy[language]
  $: legendEntries = (Object.entries(content.codes) as Array<[StrategyCode, string]>).filter(([code]) => allowSurrender || code !== 'Rh')
  $: strategyFocus = strategyFocusFor(activeHandCards, dealerUpcard)
  $: sections = [
    { key: 'hard', title: content.hardTotals, rows: rowsForSurrenderSetting(strategyRows[language].hard, allowSurrender) },
    { key: 'soft', title: content.softTotals, rows: rowsForSurrenderSetting(strategyRows[language].soft, allowSurrender) },
    { key: 'pairs', title: content.pairs, rows: rowsForSurrenderSetting(strategyRows[language].pairs, allowSurrender) },
  ] satisfies StrategySection[]
</script>

<aside class="strategy-panel">
  {#if strategyFocus}
    <div class="strategy-focus-banner" aria-live="polite">
      <span class="strategy-focus-label">{content.focus}</span>
      <div class="strategy-focus-pills">
        <span class="strategy-focus-pill">
          <span>{content.playerHandCompact}</span>
          <strong>{strategyFocus.rowLabel}</strong>
        </span>
        <span class="strategy-focus-pill strategy-focus-pill--dealer">
          <span>{content.dealerUpcardCompact}</span>
          <strong>{strategyFocus.dealerHeader}</strong>
        </span>
      </div>
    </div>
  {/if}

  <div class="strategy-sections">
    {#each sections as section}
      <section class="strategy-block">
        <div class="strategy-block-head">
          <h4>{section.title}</h4>
          <p>{content.dealerUpcard}</p>
        </div>

        <div class="strategy-table-wrap">
          <table class="strategy-table">
            <thead>
              <tr>
                <th scope="col" class="strategy-row-header">
                  <span class="strategy-label-full">{content.playerHand}</span>
                  <span class="strategy-label-compact">{content.playerHandCompact}</span>
                </th>
                {#each dealerHeaders as header}
                  <th scope="col" class:strategy-axis--active={isActiveDealerColumn(header)}>{header}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each section.rows as row}
                <tr class:strategy-row--active={isActiveRow(section.key, row.label)}>
                  <th scope="row" class:strategy-axis--active={isActiveRow(section.key, row.label)}>{row.label}</th>
                  {#each row.moves as move, columnIndex}
                    <td
                      class:strategy-column--active={isActiveDealerColumn(dealerHeaders[columnIndex])}
                      class:strategy-cell--active={isActiveCell(section.key, row.label, dealerHeaders[columnIndex])}
                    >
                      <span class={`strategy-chip strategy-chip--${move}`} title={content.codes[move]}>{move}</span>
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>
    {/each}
  </div>

  <div class="strategy-legend" aria-label={content.legend}>
    {#each legendEntries as [code, label]}
      <div class="legend-item">
        <span class={`strategy-chip strategy-chip--${code}`}>{code}</span>
        <span>{label}</span>
      </div>
    {/each}
  </div>
</aside>

<style>
  .strategy-panel {
    display: grid;
    gap: 14px;
  }

  .strategy-legend,
  .strategy-sections {
    display: grid;
    gap: 12px;
  }

  .strategy-focus-banner {
    display: grid;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 18px;
    border: 1px solid rgba(255, 223, 138, 0.34);
    background:
      linear-gradient(135deg, rgba(233, 206, 134, 0.2), rgba(47, 148, 103, 0.12)),
      rgba(11, 18, 18, 0.58);
    box-shadow: inset 0 1px 0 rgba(255, 223, 138, 0.1), var(--shadow-sm);
  }

  .strategy-focus-label {
    color: rgba(246, 240, 223, 0.72);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .strategy-focus-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .strategy-focus-pill {
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    padding: 7px 10px;
    border-radius: 999px;
    background: rgba(6, 11, 11, 0.72);
    color: rgba(246, 240, 223, 0.96);
    box-shadow: inset 0 0 0 1px rgba(255, 223, 138, 0.18);
  }

  .strategy-focus-pill span {
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .strategy-focus-pill strong {
    color: var(--ink-100);
    font-size: 1rem;
    font-weight: 800;
    text-shadow: 0 1px 10px rgba(0, 0, 0, 0.28);
  }

  .strategy-focus-pill--dealer strong {
    color: #baf6d3;
  }

  .strategy-legend {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .legend-item,
  .strategy-block {
    border-radius: 20px;
    border: 1px solid rgba(242, 227, 183, 0.08);
    background: rgba(242, 227, 183, 0.06);
    box-shadow: var(--shadow-sm);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    color: rgba(246, 240, 223, 0.88);
  }

  .strategy-block {
    padding: 12px;
  }

  .strategy-block-head {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 12px;
    margin-bottom: 10px;
  }

  .strategy-block-head p {
    color: rgba(246, 240, 223, 0.62);
    font-size: 0.82rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .strategy-table-wrap {
    overflow-x: auto;
  }

  .strategy-table {
    width: 100%;
    min-width: 620px;
    border-collapse: collapse;
  }

  .strategy-row-header {
    min-width: 6.5rem;
  }

  .strategy-label-compact {
    display: none;
  }

  .strategy-table th,
  .strategy-table td {
    padding: 8px 6px;
    text-align: center;
    border-bottom: 1px solid rgba(242, 227, 183, 0.08);
  }

  .strategy-table thead th {
    color: rgba(246, 240, 223, 0.68);
    font-size: 0.78rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    transition: background-color 160ms ease, color 160ms ease, box-shadow 160ms ease;
  }

  .strategy-table tbody th {
    text-align: left;
    white-space: nowrap;
    color: var(--ink-100);
    transition: background-color 160ms ease, color 160ms ease, box-shadow 160ms ease;
  }

  .strategy-table td {
    position: relative;
    transition: background-color 160ms ease, box-shadow 160ms ease;
  }

  .strategy-row--active > th,
  .strategy-axis--active,
  .strategy-column--active {
    background: rgba(209, 141, 77, 0.2);
  }

  .strategy-row--active td {
    background: rgba(242, 227, 183, 0.08);
  }

  .strategy-axis--active {
    color: var(--ink-100);
    box-shadow: inset 0 0 0 1px rgba(255, 223, 138, 0.42);
  }

  .strategy-cell--active {
    background:
      radial-gradient(circle at center, rgba(255, 223, 138, 0.36), rgba(209, 141, 77, 0.16) 72%),
      rgba(242, 227, 183, 0.14);
    box-shadow: inset 0 0 0 2px rgba(255, 223, 138, 0.3), 0 0 0 1px rgba(255, 223, 138, 0.12);
    z-index: 1;
  }

  .strategy-cell--active::after {
    content: '';
    position: absolute;
    inset: 3px;
    border-radius: 12px;
    border: 1px solid rgba(255, 223, 138, 0.72);
    pointer-events: none;
  }

  .strategy-cell--active .strategy-chip {
    transform: scale(1.08);
    box-shadow: 0 0 0 2px rgba(255, 223, 138, 0.28), 0 10px 20px rgba(0, 0, 0, 0.24);
  }

  .strategy-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2.6rem;
    min-height: 2rem;
    padding: 0 0.45rem;
    border-radius: 999px;
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    border: 1px solid transparent;
    transition: transform 160ms ease, box-shadow 160ms ease;
  }

  .strategy-chip--H {
    color: #ffd7dd;
    background: rgba(180, 73, 95, 0.16);
    border-color: rgba(180, 73, 95, 0.28);
  }

  .strategy-chip--S {
    color: #c8f0d9;
    background: rgba(47, 148, 103, 0.18);
    border-color: rgba(47, 148, 103, 0.32);
  }

  .strategy-chip--Dh,
  .strategy-chip--Ds {
    color: #ffe0ab;
    background: rgba(209, 141, 77, 0.18);
    border-color: rgba(209, 141, 77, 0.32);
  }

  .strategy-chip--P {
    color: #ffe3a6;
    background: rgba(233, 206, 134, 0.14);
    border-color: rgba(233, 206, 134, 0.28);
  }

  .strategy-chip--Rh {
    color: #f2d0ff;
    background: rgba(132, 94, 194, 0.18);
    border-color: rgba(132, 94, 194, 0.3);
  }

  @media (max-width: 640px) {
    .strategy-focus-banner {
      padding: 10px;
      gap: 8px;
    }

    .strategy-focus-pill {
      width: 100%;
      justify-content: space-between;
    }

    .strategy-focus-pill strong {
      font-size: 0.92rem;
    }

    .strategy-legend {
      grid-template-columns: 1fr;
    }

    .legend-item {
      gap: 8px;
      padding: 10px;
      font-size: 0.84rem;
    }

    .strategy-block {
      padding: 10px;
    }

    .strategy-block-head {
      align-items: start;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 8px;
    }

    .strategy-table {
      min-width: 0;
      table-layout: fixed;
    }

    .strategy-table th,
    .strategy-table td {
      padding: 5px 2px;
    }

    .strategy-table thead th {
      font-size: 0.62rem;
      letter-spacing: 0.04em;
    }

    .strategy-table tbody th,
    .strategy-row-header {
      width: 3.55rem;
      min-width: 3.55rem;
      font-size: 0.66rem;
      line-height: 1.15;
    }

    .strategy-label-full {
      display: none;
    }

    .strategy-label-compact {
      display: inline;
    }

    .strategy-chip {
      min-width: 1.72rem;
      min-height: 1.45rem;
      padding: 0 0.22rem;
      border-radius: 12px;
      font-size: 0.62rem;
      letter-spacing: 0.02em;
    }
  }
</style>