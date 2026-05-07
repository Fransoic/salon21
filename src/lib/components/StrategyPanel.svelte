<script lang="ts">
  import type { AppLanguage } from '../storage'

  export let language: AppLanguage = 'en'

  type StrategyCode = 'H' | 'S' | 'Dh' | 'Ds' | 'P' | 'Rh'
  type StrategyRow = {
    label: string
    moves: StrategyCode[]
  }

  const dealerHeaders = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A']

  const panelCopy = {
    en: {
      kicker: 'Strategy',
      title: 'Basic strategy chart',
      hint: 'Optimized for 6 decks, dealer stands on soft 17, double after split, and late surrender.',
      dealerUpcard: 'Dealer upcard',
      playerHand: 'Player hand',
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
      kicker: 'Strategie',
      title: 'Tableau de strategie de base',
      hint: 'Optimise pour 6 decks, croupier reste sur soft 17, double apres separation et abandon tardif.',
      dealerUpcard: 'Carte visible du croupier',
      playerHand: 'Main joueur',
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

  $: content = panelCopy[language]
  $: sections = [
    { title: content.hardTotals, rows: strategyRows[language].hard },
    { title: content.softTotals, rows: strategyRows[language].soft },
    { title: content.pairs, rows: strategyRows[language].pairs },
  ]
</script>

<aside class="strategy-panel">
  <div class="strategy-head">
    <div>
      <p class="panel-kicker">{content.kicker}</p>
      <h3>{content.title}</h3>
    </div>
    <p class="strategy-hint">{content.hint}</p>
  </div>

  <div class="strategy-legend" aria-label={content.legend}>
    {#each Object.entries(content.codes) as [code, label]}
      <div class="legend-item">
        <span class={`strategy-chip strategy-chip--${code}`}>{code}</span>
        <span>{label}</span>
      </div>
    {/each}
  </div>

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
                <th scope="col">{content.playerHand}</th>
                {#each dealerHeaders as header}
                  <th scope="col">{header}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each section.rows as row}
                <tr>
                  <th scope="row">{row.label}</th>
                  {#each row.moves as move}
                    <td>
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
</aside>

<style>
  .strategy-panel {
    display: grid;
    gap: 14px;
  }

  .strategy-head {
    display: grid;
    gap: 8px;
    padding: 14px;
    border-radius: 20px;
    border: 1px solid rgba(242, 227, 183, 0.08);
    background: rgba(242, 227, 183, 0.06);
    box-shadow: var(--shadow-sm);
  }

  .strategy-hint {
    color: rgba(246, 240, 223, 0.76);
    max-width: 58ch;
  }

  .strategy-legend,
  .strategy-sections {
    display: grid;
    gap: 12px;
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
  }

  .strategy-table tbody th {
    text-align: left;
    white-space: nowrap;
    color: var(--ink-100);
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
    .strategy-legend {
      grid-template-columns: 1fr;
    }

    .strategy-block-head {
      align-items: start;
      flex-direction: column;
    }

    .strategy-table {
      min-width: 560px;
    }
  }
</style>