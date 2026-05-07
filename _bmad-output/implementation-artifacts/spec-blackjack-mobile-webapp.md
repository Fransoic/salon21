---
title: 'Mobile Blackjack Webapp'
type: 'feature'
created: '2026-05-05'
status: 'done'
baseline_commit: 'NO_VCS'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The project does not yet provide a playable browser game. The requested outcome is a polished mobile-first blackjack webapp that feels fast on phones, covers the full core rule set expected by players, and stores lightweight progress locally without requiring an account or backend.

**Approach:** Build a lightweight client-side application at the repository root, optimized for mobile browsers and touch interaction, with a deterministic blackjack rules engine, a responsive table-style interface, and localStorage-backed persistence for bankroll, basic stats, and player preferences.

## Boundaries & Constraints

**Always:** Create the app at the project root; optimize for mobile browsers first while remaining usable on desktop; implement single-player blackjack with betting, deal, hit, stand, double, split, insurance, late surrender, dealer play, settlement, and reset; use documented house rules; persist bankroll, basic stats, and last selected bet in localStorage; keep the app fully local with touch-friendly controls; keep rules logic separated from UI so edge cases are testable.

**Ask First:** Halt only if implementation would overwrite unrelated root files, require a backend or third-party account system, or expand scope into multiplayer, real-money, or online leaderboards.

**Never:** Do not add authentication, remote APIs, analytics, ads, multiplayer, or server persistence; do not rely on untestable randomness; do not ship a desktop-only layout; do not expose unsupported actions; do not add side bets beyond insurance; do not include unfinished-round restore in v1.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Deal and play | Player has bankroll, selects a valid bet, and taps Deal | Cards are dealt, valid actions are enabled, and the round progresses without reload | Invalid deal attempts are blocked safely |
| Blackjack and insurance | Initial blackjack or insurance window occurs | Payout, push, and insurance rules resolve correctly | Insurance is only offered in the eligible state |
| Split, double, surrender | Player takes an advanced action on a legal hand | Hand order, wagers, and settlement remain correct per hand | Illegal actions are disabled or rejected safely |
| Reset progress | Player clears local progress | Bankroll, stats, and bet preference return to defaults | Reset requires explicit confirmation |

</frozen-after-approval>

## Code Map

- `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html` -- root scaffold, scripts, and build configuration.
- `src/App.svelte`, `src/main.ts`, `src/app.css` -- application shell and mobile-first visual system.
- `src/lib/game/types.ts`, `src/lib/game/rules.ts`, `src/lib/game/state.ts` -- rules engine and gameplay state.
- `src/lib/storage.ts` -- localStorage persistence for bankroll, basic stats, bet preference, and reset.
- `src/lib/components/*` -- table, betting, actions, and stats UI.
- `src/lib/game/*.test.ts` -- coverage for advanced blackjack branches.

## Tasks & Acceptance

**Execution:**
- [x] `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html` -- scaffold a lightweight Svelte + Vite + TypeScript app at the repo root with build, dev, and test scripts -- establishes a fast mobile-friendly baseline with minimal runtime overhead.
- [x] `src/lib/game/types.ts`, `src/lib/game/rules.ts` -- implement the pure blackjack domain model, house rules constants, scoring, dealer automation, action gating, and payout resolution -- keeps complete game logic deterministic and independently testable.
- [x] `src/lib/game/state.ts`, `src/lib/storage.ts` -- implement state transitions, active-hand progression, bankroll/stat updates, bet preference persistence, and reset behavior -- connects gameplay flow to durable local persistence.
- [x] `src/App.svelte`, `src/lib/components/GameTable.svelte`, `src/lib/components/ActionBar.svelte`, `src/lib/components/BetControls.svelte`, `src/lib/components/StatsPanel.svelte`, `src/app.css`, `src/main.ts` -- deliver a mobile-first casino-style interface with strong visual feedback, large tap targets, and clear disabled/action states -- makes the full ruleset usable on touch devices.
- [x] `src/lib/game/rules.test.ts`, `src/lib/game/state.test.ts` -- cover settlement, insurance, split-hand sequencing, surrender, reset, and invalid-action rejection -- protects the high-risk branches of the feature.

**Acceptance Criteria:**
- Given a first-time visitor on a mobile browser, when the app loads, then the table UI fits a narrow viewport without horizontal scrolling and exposes bankroll, bet controls, and the primary deal action clearly.
- Given an active round, when the player selects hit, stand, double, split, insurance, or surrender in a legal state, then the game applies the correct blackjack rule outcome and updates the visible hand state immediately.
- Given an illegal action for the current hand or phase, when the player tries to take it, then the control is unavailable or safely rejected without corrupting the round.
- Given a round with dealer completion and settlement, when all hands resolve, then bankroll, per-result stats, and next-round availability are updated according to the configured house rules.
- Given the player reloads after completing prior rounds, when the app starts, then bankroll, basic stats, and the last chosen bet are restored from localStorage.
- Given the player chooses reset, when the reset is confirmed, then persisted bankroll, preferences, and aggregate stats are cleared and a fresh starting bankroll is restored.

## Spec Change Log

## Design Notes

Use a pure rules layer plus a thin state-transition layer rather than encoding gameplay directly in components. Baseline rules for v1: six-deck shoe, dealer stands on soft 17, blackjack pays 3:2, insurance pays 2:1, double after split allowed, late surrender allowed, resplit up to four hands except aces, and split aces receive one extra card only.

## Verification

**Commands:**
- `npm install` -- expected: dependencies install successfully at the repository root.
- `npm run test` -- expected: rules and state tests pass, including split, insurance, surrender, and reset edge cases.
- `npm run build` -- expected: production bundle completes without type or compile errors.

**Manual checks (if no CLI):**
- Open the app in a mobile-sized browser viewport and confirm that round flow, touch controls, and local persistence match the acceptance criteria.

## Suggested Review Order

**Entry Point & Persistence**

- App wiring centralizes actions, hydration, and safe persistence boundaries.
	[`App.svelte:47`](../../src/App.svelte#L47)

- Persist only at safe phases to avoid stranding in-flight wagers.
	[`state.ts:533`](../../src/lib/game/state.ts#L533)

- Stored profile stays intentionally small: bankroll, bet, and stats only.
	[`storage.ts:56`](../../src/lib/storage.ts#L56)

**Blackjack Engine**

- Deal flow establishes phases, natural checks, and round bankroll debits.
	[`state.ts:299`](../../src/lib/game/state.ts#L299)

- Split logic handles extra wagers, hand insertion, and split-ace limits.
	[`state.ts:443`](../../src/lib/game/state.ts#L443)

- Scoring stays pure so UI and tests share the same rules.
	[`rules.ts:23`](../../src/lib/game/rules.ts#L23)

- Settlement consolidates blackjack, bust, push, and dealer outcomes.
	[`rules.ts:116`](../../src/lib/game/rules.ts#L116)

**Mobile Table UI**

- Table rendering hides the hole card and surfaces hand outcomes clearly.
	[`GameTable.svelte:55`](../../src/lib/components/GameTable.svelte#L55)

- Action buttons map directly from phase-aware availability.
	[`ActionBar.svelte:18`](../../src/lib/components/ActionBar.svelte#L18)

- Bet chips lock cleanly once a round begins.
	[`BetControls.svelte:20`](../../src/lib/components/BetControls.svelte#L20)

- Session stats and reset controls stay visible beside play.
	[`StatsPanel.svelte:32`](../../src/lib/components/StatsPanel.svelte#L32)

**Verification**

- State tests cover settlement, illegal actions, reset, and safe persistence.
	[`state.test.ts:108`](../../src/lib/game/state.test.ts#L108)

- Scripts encode the review gates: check, test, then production build.
	[`package.json:8`](../../package.json#L8)