# FIFA World Cup 2026 Interactive Bracket — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React + Vite interactive bracket for the 2026 FIFA World Cup knockout stage, with live data from football-data.org, win probabilities from The Odds API, and LocalStorage persistence.

**Architecture:** Flat `Match[]` state array drives all rendering; pure functions handle winner propagation and LocalStorage merge; SVG connector lines use layout constants (no DOM measurement). Two external APIs are called on page load only — football-data.org for bracket data, The Odds API once for all odds cached client-side.

**Tech Stack:** React 18, Vite 5, TypeScript, Vitest, React Testing Library, gh-pages

## Global Constraints

- Node 18+; React 18; Vite 5; TypeScript strict mode
- API keys in `.env` as `VITE_FOOTBALL_DATA_API_KEY` and `VITE_ODDS_API_KEY`; `.env` is gitignored; `.env.example` is committed
- `vite.config.ts` must set `base: '/cup26/'` for GitHub Pages
- Dark background `#1a1f2e`; match box background `#242938`; gold accent `#c9a84c`
- Round enum values: `'R32' | 'R16' | 'QF' | 'SF' | 'FINAL' | 'THIRD'`
- Slot propagation: winner of slot `n` → next round slot `Math.floor(n/2)`, home if `n` even, away if `n` odd
- Deploy command: `npm run deploy` (runs `gh-pages -d dist`)

---

## File Map

```
src/
  types.ts                  — Team, Match, Round types + OddsPayload
  constants.ts              — ROUNDS, LAYOUT (heights, widths, colors)
  bracketLogic.ts           — buildInitialBracket, advanceWinner, clearDownstream
  api/
    footballData.ts         — fetchBracket(): Promise<Match[]>
    oddsApi.ts              — fetchAllOdds(), lookupOdds(), decimalToImpliedProb()
  storage.ts                — saveProjection(), loadProjection(), clearProjection()
  mergeState.ts             — mergeApiWithProjection()
  App.tsx                   — root: state, data fetching, handlers
  main.tsx                  — ReactDOM.createRoot
  test/setup.ts             — vitest + testing-library setup
  components/
    Header.tsx              — title, status indicator, reset button
    BracketView.tsx         — full bracket layout (left + center + right)
    BracketHalf.tsx         — one side: renders 4 RoundColumns
    RoundColumn.tsx         — column of MatchBoxes with correct vertical spacing
    CenterColumn.tsx        — Final + Third Place match boxes
    MatchBox.tsx            — two TeamRows + match label
    TeamRow.tsx             — crest + name + prob bar + click handler
    ProbBar.tsx             — colored probability bar
    ConnectorLines.tsx      — SVG overlay of L-shaped bracket connectors
  styles/
    index.css               — global dark theme, CSS custom properties
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`
- Create: `.env.example`, `.gitignore`
- Create: `src/main.tsx`, `src/test/setup.ts`
- Create: `src/styles/index.css`

- [ ] **Step 1: Scaffold Vite + React + TypeScript project**

```bash
cd /Users/agoyal/ws/personal/cup26
npm create vite@latest . -- --template react-ts
```

When prompted "Current directory is not empty. Remove existing files and continue?" — select **Yes**.

- [ ] **Step 2: Install dependencies**

```bash
npm install
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
npm install -D gh-pages
```

- [ ] **Step 3: Configure vite.config.ts**

Replace the generated `vite.config.ts` with:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/cup26/',
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
```

- [ ] **Step 4: Configure tsconfig.json**

Replace `tsconfig.json` with:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals"]
  },
  "include": ["src"]
}
```

- [ ] **Step 5: Add deploy script to package.json**

In `package.json`, add to the `"scripts"` section:

```json
"deploy": "gh-pages -d dist"
```

Full scripts block:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "deploy": "gh-pages -d dist"
}
```

- [ ] **Step 6: Create test setup file**

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 7: Create .env.example**

```
VITE_FOOTBALL_DATA_API_KEY=your_key_here
VITE_ODDS_API_KEY=your_key_here
```

- [ ] **Step 8: Update .gitignore**

Ensure `.gitignore` includes:

```
node_modules
dist
.env
```

- [ ] **Step 9: Clear generated boilerplate**

Delete `src/App.css` and `src/assets/` (generated by the template — we'll replace them).

```bash
rm -f src/App.css
rm -rf src/assets
```

Replace `src/App.tsx` with a minimal placeholder:

```tsx
export default function App() {
  return <div>FIFA World Cup 2026</div>
}
```

Replace `src/main.tsx` with:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

Create `src/styles/index.css`:

```css
:root {
  --bg-primary: #1a1f2e;
  --bg-card: #242938;
  --border-color: #333a52;
  --text-primary: #e8eaf0;
  --text-muted: #6b7280;
  --accent-gold: #c9a84c;
  --winner-projected: #3b82f6;
  --winner-confirmed: #22c55e;
  --connector-color: rgba(255, 255, 255, 0.25);
  --match-box-width: 180px;
  --match-box-height: 72px;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  min-height: 100vh;
}

#root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
```

- [ ] **Step 10: Verify dev server starts**

```bash
npm run dev
```

Expected: Vite dev server starts at `http://localhost:5173/cup26/` with no errors.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: scaffold React + Vite project with TypeScript and test setup"
```

---

## Task 2: Types, Constants, and Bracket Logic

**Files:**
- Create: `src/types.ts`
- Create: `src/constants.ts`
- Create: `src/bracketLogic.ts`
- Create: `src/bracketLogic.test.ts`

**Interfaces:**
- Produces: `Team`, `Match`, `Round`, `Side`, `OddsCache` types used by all other files
- Produces: `LAYOUT` constants used by `ConnectorLines` and `RoundColumn`
- Produces: `buildInitialBracket(apiMatches)`, `advanceWinner(matches, matchId, winner)`, `clearDownstream(matches, matchId, side)` used by `App.tsx`

- [ ] **Step 1: Write src/types.ts**

```ts
export type Round = 'R32' | 'R16' | 'QF' | 'SF' | 'FINAL' | 'THIRD'
export type Side = 'left' | 'right' | 'center'

export interface Team {
  id: number
  name: string
  shortName: string
  crest: string
}

export interface Match {
  id: string
  round: Round
  slot: number      // 0-indexed within the round+side
  side: Side
  home: Team | null
  away: Team | null
  winner: Team | null
  homeProb: number | null   // 0–1
  awayProb: number | null
  isProjected: boolean      // true = user picked, false = live API result
}

// Raw response item from The Odds API (h2h market)
export interface OddsEvent {
  id: string
  home_team: string
  away_team: string
  bookmakers: Array<{
    markets: Array<{
      key: string
      outcomes: Array<{ name: string; price: number }>
    }>
  }>
}

export type OddsCache = OddsEvent[]

// football-data.org match shape (only fields we use)
export interface ApiMatch {
  id: number
  stage: string
  homeTeam: { id: number; name: string; shortName: string; crest: string } | null
  awayTeam: { id: number; name: string; shortName: string; crest: string } | null
  score: { winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null }
}
```

- [ ] **Step 2: Write src/constants.ts**

```ts
import type { Round } from './types'

// Round order for left half (right half is reversed)
export const LEFT_ROUNDS: Round[] = ['R32', 'R16', 'QF', 'SF']
export const RIGHT_ROUNDS: Round[] = ['SF', 'QF', 'R16', 'R32']

// Matches per side per round
export const SLOTS_PER_ROUND: Record<Round, number> = {
  R32: 8,
  R16: 4,
  QF: 2,
  SF: 1,
  FINAL: 1,
  THIRD: 1,
}

// football-data.org stage name → our Round
export const STAGE_TO_ROUND: Record<string, Round> = {
  ROUND_OF_32: 'R32',
  ROUND_OF_16: 'R16',
  QUARTER_FINALS: 'QF',
  SEMI_FINALS: 'SF',
  FINAL: 'FINAL',
  THIRD_PLACE: 'THIRD',
}

// Layout constants (px) used by RoundColumn and ConnectorLines
export const LAYOUT = {
  MATCH_BOX_HEIGHT: 72,
  MATCH_BOX_WIDTH: 180,
  COLUMN_WIDTH: 220,   // match box + gap between columns
  BRACKET_HEIGHT: 704, // 8 * 88px slots
  SLOT_BASE: 88,       // base slot height at R32; doubles each round
}
```

- [ ] **Step 3: Write failing tests for bracket logic**

Create `src/bracketLogic.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildInitialBracket, advanceWinner, clearDownstream } from './bracketLogic'
import type { ApiMatch, Team } from './types'

const makeApiMatch = (
  id: number,
  stage: string,
  homeName: string | null,
  awayName: string | null,
  winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null = null
): ApiMatch => ({
  id,
  stage,
  homeTeam: homeName ? { id: id * 10, name: homeName, shortName: homeName, crest: '' } : null,
  awayTeam: awayName ? { id: id * 10 + 1, name: awayName, shortName: awayName, crest: '' } : null,
  score: { winner },
})

const brazil: Team = { id: 1, name: 'Brazil', shortName: 'Brazil', crest: '' }
const croatia: Team = { id: 2, name: 'Croatia', shortName: 'Croatia', crest: '' }

describe('buildInitialBracket', () => {
  it('maps 16 R32 API matches to left (slots 0-7) and right (slots 0-7)', () => {
    const apiMatches = Array.from({ length: 16 }, (_, i) =>
      makeApiMatch(i + 1, 'ROUND_OF_32', `TeamA${i}`, `TeamB${i}`)
    )
    const matches = buildInitialBracket(apiMatches)
    const r32 = matches.filter(m => m.round === 'R32')
    expect(r32).toHaveLength(16)
    expect(r32.filter(m => m.side === 'left')).toHaveLength(8)
    expect(r32.filter(m => m.side === 'right')).toHaveLength(8)
  })

  it('sets winner from API score', () => {
    const apiMatches = [makeApiMatch(1, 'ROUND_OF_32', 'Brazil', 'Croatia', 'HOME_TEAM')]
    const matches = buildInitialBracket(apiMatches)
    expect(matches[0].winner?.name).toBe('Brazil')
    expect(matches[0].isProjected).toBe(false)
  })

  it('leaves winner null for unplayed matches', () => {
    const apiMatches = [makeApiMatch(1, 'ROUND_OF_32', 'Brazil', 'Croatia', null)]
    const matches = buildInitialBracket(apiMatches)
    expect(matches[0].winner).toBeNull()
  })

  it('handles null homeTeam (TBD slot)', () => {
    const apiMatches = [makeApiMatch(1, 'ROUND_OF_32', null, 'Croatia', null)]
    const matches = buildInitialBracket(apiMatches)
    expect(matches[0].home).toBeNull()
  })
})

describe('advanceWinner', () => {
  it('sets winner on a match and places team in next round', () => {
    const apiMatches = Array.from({ length: 16 }, (_, i) =>
      makeApiMatch(i + 1, 'ROUND_OF_32', `TeamA${i}`, `TeamB${i}`)
    )
    const initial = buildInitialBracket(apiMatches)
    // advance slot 0 left → should fill R16 left slot 0 home
    const r32Match = initial.find(m => m.round === 'R32' && m.side === 'left' && m.slot === 0)!
    const updated = advanceWinner(initial, r32Match.id, r32Match.home!)
    const r32Updated = updated.find(m => m.id === r32Match.id)!
    expect(r32Updated.winner?.name).toBe('TeamA0')
    expect(r32Updated.isProjected).toBe(true)
    const r16 = updated.find(m => m.round === 'R16' && m.side === 'left' && m.slot === 0)!
    expect(r16.home?.name).toBe('TeamA0')
  })

  it('places winner in away slot when source slot is odd', () => {
    const apiMatches = Array.from({ length: 16 }, (_, i) =>
      makeApiMatch(i + 1, 'ROUND_OF_32', `TeamA${i}`, `TeamB${i}`)
    )
    const initial = buildInitialBracket(apiMatches)
    const r32Match = initial.find(m => m.round === 'R32' && m.side === 'left' && m.slot === 1)!
    const updated = advanceWinner(initial, r32Match.id, r32Match.home!)
    const r16 = updated.find(m => m.round === 'R16' && m.side === 'left' && m.slot === 0)!
    expect(r16.away?.name).toBe('TeamA1')
  })

  it('SF winner advances to FINAL', () => {
    const apiMatches: ApiMatch[] = []
    const initial = buildInitialBracket(apiMatches)
    // manually create SF left match
    const withSF = initial.map(m =>
      m.round === 'SF' && m.side === 'left'
        ? { ...m, home: brazil, away: croatia }
        : m
    )
    const updated = advanceWinner(withSF, withSF.find(m => m.round === 'SF' && m.side === 'left')!.id, brazil)
    const final = updated.find(m => m.round === 'FINAL')!
    expect(final.home?.name).toBe('Brazil')
    const third = updated.find(m => m.round === 'THIRD')!
    expect(third.home?.name).toBe('Croatia')
  })
})

describe('clearDownstream', () => {
  it('clears projected winners downstream of a changed match', () => {
    const apiMatches = Array.from({ length: 16 }, (_, i) =>
      makeApiMatch(i + 1, 'ROUND_OF_32', `TeamA${i}`, `TeamB${i}`)
    )
    const initial = buildInitialBracket(apiMatches)
    const r32Match = initial.find(m => m.round === 'R32' && m.side === 'left' && m.slot === 0)!
    // advance once to populate R16
    const afterFirst = advanceWinner(initial, r32Match.id, r32Match.home!)
    // now clear downstream
    const cleared = clearDownstream(afterFirst, r32Match.id)
    const r16 = cleared.find(m => m.round === 'R16' && m.side === 'left' && m.slot === 0)!
    expect(r16.home).toBeNull()
  })
})
```

- [ ] **Step 4: Run tests to confirm they fail**

```bash
npm test
```

Expected: FAIL — `bracketLogic` module not found.

- [ ] **Step 5: Write src/bracketLogic.ts**

```ts
import { STAGE_TO_ROUND, SLOTS_PER_ROUND } from './constants'
import type { ApiMatch, Match, Round, Side, Team } from './types'

const ROUND_ORDER: Round[] = ['R32', 'R16', 'QF', 'SF', 'FINAL']

function nextRound(round: Round): Round | null {
  const idx = ROUND_ORDER.indexOf(round)
  return idx >= 0 && idx < ROUND_ORDER.length - 1 ? ROUND_ORDER[idx + 1] : null
}

function makeMatchId(round: Round, side: Side, slot: number): string {
  return `${round}-${side}-${slot}`
}

export function buildInitialBracket(apiMatches: ApiMatch[]): Match[] {
  const matches: Match[] = []

  // Build empty bracket structure
  const roundsWithSides: Array<{ round: Round; side: Side }> = [
    { round: 'R32', side: 'left' },
    { round: 'R32', side: 'right' },
    { round: 'R16', side: 'left' },
    { round: 'R16', side: 'right' },
    { round: 'QF', side: 'left' },
    { round: 'QF', side: 'right' },
    { round: 'SF', side: 'left' },
    { round: 'SF', side: 'right' },
    { round: 'FINAL', side: 'center' },
    { round: 'THIRD', side: 'center' },
  ]

  for (const { round, side } of roundsWithSides) {
    const slots = round === 'FINAL' || round === 'THIRD' ? 1 : SLOTS_PER_ROUND[round]
    for (let slot = 0; slot < slots; slot++) {
      matches.push({
        id: makeMatchId(round, side, slot),
        round,
        slot,
        side,
        home: null,
        away: null,
        winner: null,
        homeProb: null,
        awayProb: null,
        isProjected: false,
      })
    }
  }

  // Group API matches by stage
  const byStage: Record<string, ApiMatch[]> = {}
  for (const m of apiMatches) {
    if (!byStage[m.stage]) byStage[m.stage] = []
    byStage[m.stage].push(m)
  }

  // Overlay API data onto bracket slots
  for (const [stage, stageMates] of Object.entries(byStage)) {
    const round = STAGE_TO_ROUND[stage]
    if (!round) continue

    if (round === 'FINAL' || round === 'THIRD') {
      const target = matches.find(m => m.round === round)
      if (target && stageMates[0]) overlayApiMatch(target, stageMates[0])
      continue
    }

    // First half → left side, second half → right side
    const leftMatches = stageMates.slice(0, Math.ceil(stageMates.length / 2))
    const rightMatches = stageMates.slice(Math.ceil(stageMates.length / 2))

    for (const [slot, apiMatch] of leftMatches.entries()) {
      const target = matches.find(m => m.round === round && m.side === 'left' && m.slot === slot)
      if (target) overlayApiMatch(target, apiMatch)
    }
    for (const [slot, apiMatch] of rightMatches.entries()) {
      const target = matches.find(m => m.round === round && m.side === 'right' && m.slot === slot)
      if (target) overlayApiMatch(target, apiMatch)
    }
  }

  return matches
}

function overlayApiMatch(target: Match, apiMatch: ApiMatch): void {
  target.home = apiMatch.homeTeam
    ? { id: apiMatch.homeTeam.id, name: apiMatch.homeTeam.name, shortName: apiMatch.homeTeam.shortName, crest: apiMatch.homeTeam.crest }
    : null
  target.away = apiMatch.awayTeam
    ? { id: apiMatch.awayTeam.id, name: apiMatch.awayTeam.name, shortName: apiMatch.awayTeam.shortName, crest: apiMatch.awayTeam.crest }
    : null

  if (apiMatch.score.winner === 'HOME_TEAM') {
    target.winner = target.home
    target.isProjected = false
  } else if (apiMatch.score.winner === 'AWAY_TEAM') {
    target.winner = target.away
    target.isProjected = false
  }
}

export function advanceWinner(matches: Match[], matchId: string, winner: Team): Match[] {
  const updated = matches.map(m => ({ ...m }))
  const source = updated.find(m => m.id === matchId)!
  const loser = source.home?.id === winner.id ? source.away : source.home

  source.winner = winner
  source.isProjected = true

  // Special case: SF → FINAL + THIRD
  if (source.round === 'SF') {
    const final = updated.find(m => m.round === 'FINAL')!
    const third = updated.find(m => m.round === 'THIRD')!
    if (source.side === 'left') {
      final.home = winner
      third.home = loser
    } else {
      final.away = winner
      third.away = loser
    }
    return updated
  }

  const next = nextRound(source.round)
  if (!next) return updated

  const nextSlot = Math.floor(source.slot / 2)
  const nextMatch = updated.find(m => m.round === next && m.side === source.side && m.slot === nextSlot)
  if (!nextMatch) return updated

  if (source.slot % 2 === 0) {
    nextMatch.home = winner
  } else {
    nextMatch.away = winner
  }

  return updated
}

export function clearDownstream(matches: Match[], matchId: string): Match[] {
  const updated = matches.map(m => ({ ...m }))
  const source = updated.find(m => m.id === matchId)!

  function clearFrom(round: Round, side: Side, slot: number): void {
    if (round === 'SF') {
      const final = updated.find(m => m.round === 'FINAL')!
      const third = updated.find(m => m.round === 'THIRD')!
      if (side === 'left') {
        final.home = null; final.homeProb = null
        third.home = null; third.homeProb = null
      } else {
        final.away = null; final.awayProb = null
        third.away = null; third.awayProb = null
      }
      return
    }

    const next = nextRound(round)
    if (!next) return

    const nextSlot = Math.floor(slot / 2)
    const nextMatch = updated.find(m => m.round === next && m.side === side && m.slot === nextSlot)
    if (!nextMatch || !nextMatch.isProjected) return

    if (slot % 2 === 0) {
      nextMatch.home = null; nextMatch.homeProb = null
    } else {
      nextMatch.away = null; nextMatch.awayProb = null
    }

    if (!nextMatch.home && !nextMatch.away) {
      nextMatch.winner = null
      nextMatch.isProjected = false
      clearFrom(next, side, nextSlot)
    }
  }

  clearFrom(source.round, source.side, source.slot)
  return updated
}
```

- [ ] **Step 6: Run tests to confirm they pass**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/types.ts src/constants.ts src/bracketLogic.ts src/bracketLogic.test.ts
git commit -m "feat: add types, constants, and bracket logic with tests"
```

---

## Task 3: API Clients

**Files:**
- Create: `src/api/footballData.ts`
- Create: `src/api/oddsApi.ts`
- Create: `src/api/footballData.test.ts`
- Create: `src/api/oddsApi.test.ts`

**Interfaces:**
- Consumes: `ApiMatch`, `OddsCache`, `OddsEvent` from `src/types.ts`
- Consumes: `buildInitialBracket` from `src/bracketLogic.ts`
- Produces: `fetchBracket(): Promise<Match[]>` used by `App.tsx`
- Produces: `fetchAllOdds(): Promise<OddsCache>` used by `App.tsx`
- Produces: `lookupOdds(cache, homeTeam, awayTeam): { homeProb: number; awayProb: number } | null` used by `App.tsx`

- [ ] **Step 1: Write failing tests for footballData.ts**

Create `src/api/footballData.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchBracket } from './footballData'

const mockResponse = {
  matches: [
    {
      id: 1,
      stage: 'ROUND_OF_32',
      homeTeam: { id: 10, name: 'Brazil', shortName: 'Brazil', crest: 'https://example.com/br.svg' },
      awayTeam: { id: 11, name: 'Croatia', shortName: 'Croatia', crest: 'https://example.com/hr.svg' },
      score: { winner: 'HOME_TEAM' },
    },
  ],
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockResponse),
  }))
  vi.stubEnv('VITE_FOOTBALL_DATA_API_KEY', 'test-key')
})

describe('fetchBracket', () => {
  it('calls football-data.org with correct URL and auth header', async () => {
    await fetchBracket()
    expect(fetch).toHaveBeenCalledWith(
      'https://api.football-data.org/v4/competitions/WC/matches',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Auth-Token': 'test-key' }),
      })
    )
  })

  it('returns Match array built from API response', async () => {
    const matches = await fetchBracket()
    const r32 = matches.filter(m => m.round === 'R32')
    expect(r32.length).toBeGreaterThan(0)
    const brazil = r32.find(m => m.home?.name === 'Brazil')
    expect(brazil?.winner?.name).toBe('Brazil')
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403 }))
    await expect(fetchBracket()).rejects.toThrow('football-data.org error: 403')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test
```

Expected: FAIL — `footballData` module not found.

- [ ] **Step 3: Write src/api/footballData.ts**

```ts
import { buildInitialBracket } from '../bracketLogic'
import type { ApiMatch, Match } from '../types'

export async function fetchBracket(): Promise<Match[]> {
  const key = import.meta.env.VITE_FOOTBALL_DATA_API_KEY
  const res = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
    headers: { 'X-Auth-Token': key },
  })
  if (!res.ok) throw new Error(`football-data.org error: ${res.status}`)
  const data = await res.json()
  return buildInitialBracket(data.matches as ApiMatch[])
}
```

- [ ] **Step 4: Write failing tests for oddsApi.ts**

Create `src/api/oddsApi.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchAllOdds, lookupOdds } from './oddsApi'
import type { OddsCache } from '../types'

const mockOddsResponse: OddsCache = [
  {
    id: 'abc',
    home_team: 'Brazil',
    away_team: 'Croatia',
    bookmakers: [
      {
        markets: [
          {
            key: 'h2h',
            outcomes: [
              { name: 'Brazil', price: 1.65 },
              { name: 'Croatia', price: 4.50 },
              { name: 'Draw', price: 3.50 },
            ],
          },
        ],
      },
    ],
  },
]

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockOddsResponse),
  }))
  vi.stubEnv('VITE_ODDS_API_KEY', 'test-odds-key')
})

describe('fetchAllOdds', () => {
  it('calls The Odds API with correct URL', async () => {
    await fetchAllOdds()
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('soccer_fifa_world_cup'))
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('test-odds-key'))
  })

  it('returns the raw odds payload', async () => {
    const result = await fetchAllOdds()
    expect(result).toHaveLength(1)
    expect(result[0].home_team).toBe('Brazil')
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }))
    await expect(fetchAllOdds()).rejects.toThrow('Odds API error: 401')
  })
})

describe('lookupOdds', () => {
  it('returns normalized home/away win probabilities ignoring draw', () => {
    const result = lookupOdds(mockOddsResponse, 'Brazil', 'Croatia')
    expect(result).not.toBeNull()
    // home implied: 1/1.65 ≈ 0.606, away implied: 1/4.50 ≈ 0.222
    // normalized home: 0.606 / (0.606 + 0.222) ≈ 0.732
    expect(result!.homeProb).toBeCloseTo(0.732, 2)
    expect(result!.awayProb).toBeCloseTo(0.268, 2)
    expect(result!.homeProb + result!.awayProb).toBeCloseTo(1.0, 5)
  })

  it('returns null when match not found in cache', () => {
    expect(lookupOdds(mockOddsResponse, 'France', 'Germany')).toBeNull()
  })

  it('is case-insensitive for team name matching', () => {
    expect(lookupOdds(mockOddsResponse, 'brazil', 'CROATIA')).not.toBeNull()
  })
})
```

- [ ] **Step 5: Run tests to confirm they fail**

```bash
npm test
```

Expected: FAIL — `oddsApi` module not found.

- [ ] **Step 6: Write src/api/oddsApi.ts**

```ts
import type { OddsCache, OddsEvent } from '../types'

export async function fetchAllOdds(): Promise<OddsCache> {
  const key = import.meta.env.VITE_ODDS_API_KEY
  const url = `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds?apiKey=${key}&regions=us&markets=h2h&oddsFormat=decimal`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Odds API error: ${res.status}`)
  return res.json()
}

export function lookupOdds(
  cache: OddsCache,
  homeTeam: string,
  awayTeam: string
): { homeProb: number; awayProb: number } | null {
  const normalize = (s: string) => s.toLowerCase().trim()
  const h = normalize(homeTeam)
  const a = normalize(awayTeam)

  const event = cache.find(e => {
    const eh = normalize(e.home_team)
    const ea = normalize(e.away_team)
    return (eh === h && ea === a) || (eh === a && ea === h)
  })
  if (!event) return null

  const market = event.bookmakers[0]?.markets.find(m => m.key === 'h2h')
  if (!market) return null

  const isFlipped = normalize(event.home_team) !== h
  const homeOutcome = market.outcomes.find(o => normalize(o.name) === (isFlipped ? a : h))
  const awayOutcome = market.outcomes.find(o => normalize(o.name) === (isFlipped ? h : a))
  if (!homeOutcome || !awayOutcome) return null

  const rawHome = 1 / homeOutcome.price
  const rawAway = 1 / awayOutcome.price
  const total = rawHome + rawAway

  return { homeProb: rawHome / total, awayProb: rawAway / total }
}
```

- [ ] **Step 7: Run tests to confirm they pass**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 8: Commit**

```bash
git add src/api/
git commit -m "feat: add football-data.org and Odds API clients with tests"
```

---

## Task 4: Storage and State Merge

**Files:**
- Create: `src/storage.ts`
- Create: `src/mergeState.ts`
- Create: `src/storage.test.ts`
- Create: `src/mergeState.test.ts`

**Interfaces:**
- Consumes: `Match` from `src/types.ts`
- Produces: `saveProjection(matches)`, `loadProjection(): Match[] | null`, `clearProjection()` used by `App.tsx`
- Produces: `mergeApiWithProjection(apiMatches, stored): Match[]` used by `App.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/storage.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { saveProjection, loadProjection, clearProjection } from './storage'
import type { Match } from './types'

const sampleMatches: Match[] = [
  {
    id: 'R32-left-0',
    round: 'R32',
    slot: 0,
    side: 'left',
    home: { id: 1, name: 'Brazil', shortName: 'Brazil', crest: '' },
    away: null,
    winner: null,
    homeProb: 0.65,
    awayProb: null,
    isProjected: false,
  },
]

beforeEach(() => localStorage.clear())

describe('storage', () => {
  it('saves and loads matches from localStorage', () => {
    saveProjection(sampleMatches)
    const loaded = loadProjection()
    expect(loaded).toEqual(sampleMatches)
  })

  it('returns null when nothing is stored', () => {
    expect(loadProjection()).toBeNull()
  })

  it('clears stored matches', () => {
    saveProjection(sampleMatches)
    clearProjection()
    expect(loadProjection()).toBeNull()
  })
})
```

Create `src/mergeState.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { mergeApiWithProjection } from './mergeState'
import type { Match, Team } from './types'

const brazil: Team = { id: 1, name: 'Brazil', shortName: 'Brazil', crest: '' }
const croatia: Team = { id: 2, name: 'Croatia', shortName: 'Croatia', crest: '' }

function makeMatch(id: string, overrides: Partial<Match> = {}): Match {
  return {
    id, round: 'R32', slot: 0, side: 'left',
    home: null, away: null, winner: null,
    homeProb: null, awayProb: null, isProjected: false,
    ...overrides,
  }
}

describe('mergeApiWithProjection', () => {
  it('uses live result over stored projection', () => {
    const api = [makeMatch('R32-left-0', { home: brazil, winner: brazil, isProjected: false })]
    const stored = [makeMatch('R32-left-0', { home: croatia, winner: croatia, isProjected: true })]
    const result = mergeApiWithProjection(api, stored)
    expect(result.find(m => m.id === 'R32-left-0')?.winner?.name).toBe('Brazil')
    expect(result.find(m => m.id === 'R32-left-0')?.isProjected).toBe(false)
  })

  it('preserves stored user projection for unplayed matches', () => {
    const api = [makeMatch('R16-left-0', { home: null, away: null, winner: null })]
    const stored = [makeMatch('R16-left-0', { home: brazil, winner: brazil, isProjected: true })]
    const result = mergeApiWithProjection(api, stored)
    expect(result.find(m => m.id === 'R16-left-0')?.winner?.name).toBe('Brazil')
  })

  it('returns api matches that have no stored counterpart unchanged', () => {
    const api = [makeMatch('R32-left-0', { home: brazil })]
    const result = mergeApiWithProjection(api, [])
    expect(result[0].home?.name).toBe('Brazil')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test
```

Expected: FAIL.

- [ ] **Step 3: Write src/storage.ts**

```ts
import type { Match } from './types'

const KEY = 'wc2026_bracket'

export function saveProjection(matches: Match[]): void {
  localStorage.setItem(KEY, JSON.stringify(matches))
}

export function loadProjection(): Match[] | null {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Match[]
  } catch {
    return null
  }
}

export function clearProjection(): void {
  localStorage.removeItem(KEY)
}
```

- [ ] **Step 4: Write src/mergeState.ts**

```ts
import type { Match } from './types'

export function mergeApiWithProjection(apiMatches: Match[], stored: Match[]): Match[] {
  const storedById = new Map(stored.map(m => [m.id, m]))
  return apiMatches.map(apiMatch => {
    // Live result always wins
    if (apiMatch.winner && !apiMatch.isProjected) return apiMatch
    const storedMatch = storedById.get(apiMatch.id)
    if (!storedMatch) return apiMatch
    // Overlay stored projection onto api shell (preserves live team data from API)
    return {
      ...apiMatch,
      winner: storedMatch.winner,
      isProjected: storedMatch.isProjected,
      homeProb: storedMatch.homeProb,
      awayProb: storedMatch.awayProb,
    }
  })
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/storage.ts src/storage.test.ts src/mergeState.ts src/mergeState.test.ts
git commit -m "feat: add localStorage persistence and state merge with tests"
```

---

## Task 5: App State Orchestration

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `fetchBracket`, `fetchAllOdds`, `lookupOdds`, `saveProjection`, `loadProjection`, `clearProjection`, `advanceWinner`, `clearDownstream`, `mergeApiWithProjection`
- Produces: `matches` state + `handleAdvance(matchId, winner)` + `handleReset()` + `apiStatus` — passed as props to `BracketView` and `Header`

- [ ] **Step 1: Write src/App.tsx**

```tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchBracket } from './api/footballData'
import { fetchAllOdds, lookupOdds } from './api/oddsApi'
import { advanceWinner, buildInitialBracket, clearDownstream } from './bracketLogic'
import { clearProjection, loadProjection, saveProjection } from './storage'
import { mergeApiWithProjection } from './mergeState'
import type { Match, OddsCache, Team } from './types'
import Header from './components/Header'
import BracketView from './components/BracketView'

type ApiStatus = 'loading' | 'ok' | 'error'

export default function App() {
  const [matches, setMatches] = useState<Match[]>(() => buildInitialBracket([]))
  const [apiStatus, setApiStatus] = useState<ApiStatus>('loading')
  const oddsCacheRef = useRef<OddsCache>([])

  const applyOdds = useCallback((ms: Match[], cache: OddsCache): Match[] => {
    return ms.map(m => {
      if (!m.home || !m.away) return m
      const odds = lookupOdds(cache, m.home.name, m.away.name)
      if (!odds) return m
      return { ...m, homeProb: odds.homeProb, awayProb: odds.awayProb }
    })
  }, [])

  const loadData = useCallback(async () => {
    setApiStatus('loading')
    try {
      const [apiMatches, odds] = await Promise.all([fetchBracket(), fetchAllOdds()])
      oddsCacheRef.current = odds
      const stored = loadProjection() ?? []
      const merged = mergeApiWithProjection(apiMatches, stored)
      const withOdds = applyOdds(merged, odds)
      setMatches(withOdds)
      setApiStatus('ok')
    } catch {
      setApiStatus('error')
    }
  }, [applyOdds])

  useEffect(() => { loadData() }, [loadData])

  const handleAdvance = useCallback((matchId: string, winner: Team) => {
    setMatches(prev => {
      const cleared = clearDownstream(prev, matchId)
      const advanced = advanceWinner(cleared, matchId, winner)
      const withOdds = applyOdds(advanced, oddsCacheRef.current)
      saveProjection(withOdds)
      return withOdds
    })
  }, [applyOdds])

  const handleReset = useCallback(() => {
    clearProjection()
    loadData()
  }, [loadData])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header apiStatus={apiStatus} onReset={handleReset} />
      <BracketView matches={matches} onAdvance={handleAdvance} />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors (Header and BracketView don't exist yet, so expect import errors — that's OK for now).

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add App state orchestration with data fetching and handlers"
```

---

## Task 6: Core UI Components — TeamRow, ProbBar, MatchBox

**Files:**
- Create: `src/components/ProbBar.tsx`
- Create: `src/components/TeamRow.tsx`
- Create: `src/components/MatchBox.tsx`
- Create: `src/components/MatchBox.test.tsx`

**Interfaces:**
- Consumes: `Match`, `Team` from `src/types.ts`
- Produces: `<MatchBox match onAdvance />` used by `RoundColumn` and `CenterColumn`

- [ ] **Step 1: Write failing tests for MatchBox**

Create `src/components/MatchBox.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MatchBox from './MatchBox'
import type { Match } from '../types'

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 'R32-left-0', round: 'R32', slot: 0, side: 'left',
    home: { id: 1, name: 'Brazil', shortName: 'Brazil', crest: '' },
    away: { id: 2, name: 'Croatia', shortName: 'Croatia', crest: '' },
    winner: null, homeProb: 0.65, awayProb: 0.35, isProjected: false,
    ...overrides,
  }
}

describe('MatchBox', () => {
  it('renders both team names', () => {
    render(<MatchBox match={makeMatch()} onAdvance={vi.fn()} />)
    expect(screen.getByText('Brazil')).toBeTruthy()
    expect(screen.getByText('Croatia')).toBeTruthy()
  })

  it('calls onAdvance with match id and team when team is clicked', () => {
    const onAdvance = vi.fn()
    render(<MatchBox match={makeMatch()} onAdvance={onAdvance} />)
    fireEvent.click(screen.getByText('Brazil'))
    expect(onAdvance).toHaveBeenCalledWith('R32-left-0', expect.objectContaining({ name: 'Brazil' }))
  })

  it('does not call onAdvance when match has confirmed winner', () => {
    const onAdvance = vi.fn()
    const match = makeMatch({ winner: { id: 1, name: 'Brazil', shortName: 'Brazil', crest: '' }, isProjected: false })
    render(<MatchBox match={match} onAdvance={onAdvance} />)
    fireEvent.click(screen.getByText('Croatia'))
    expect(onAdvance).not.toHaveBeenCalled()
  })

  it('shows TBD when a team slot is empty', () => {
    render(<MatchBox match={makeMatch({ home: null })} onAdvance={vi.fn()} />)
    expect(screen.getByText('TBD')).toBeTruthy()
  })

  it('renders probability percentages', () => {
    render(<MatchBox match={makeMatch()} onAdvance={vi.fn()} />)
    expect(screen.getByText('65%')).toBeTruthy()
    expect(screen.getByText('35%')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test
```

Expected: FAIL.

- [ ] **Step 3: Write src/components/ProbBar.tsx**

```tsx
interface ProbBarProps {
  prob: number | null  // 0–1
  isLeading: boolean
}

export default function ProbBar({ prob, isLeading }: ProbBarProps) {
  if (prob === null) return null
  const pct = Math.round(prob * 100)
  return (
    <div style={{
      height: 3,
      borderRadius: 2,
      background: 'var(--border-color)',
      margin: '2px 0 4px',
    }}>
      <div style={{
        width: `${pct}%`,
        height: '100%',
        borderRadius: 2,
        background: isLeading ? 'var(--accent-gold)' : 'var(--text-muted)',
        transition: 'width 0.3s ease',
      }} />
    </div>
  )
}
```

- [ ] **Step 4: Write src/components/TeamRow.tsx**

```tsx
import ProbBar from './ProbBar'
import type { Team } from '../types'

interface TeamRowProps {
  team: Team | null
  prob: number | null
  isWinner: boolean
  isProjected: boolean
  isConfirmedMatch: boolean  // true if match has a confirmed (non-projected) winner
  isLeadingProb: boolean
  onClick: () => void
}

export default function TeamRow({
  team, prob, isWinner, isProjected, isConfirmedMatch, isLeadingProb, onClick,
}: TeamRowProps) {
  const borderColor = isWinner
    ? (isProjected ? 'var(--winner-projected)' : 'var(--winner-confirmed)')
    : 'transparent'

  return (
    <div
      onClick={isConfirmedMatch ? undefined : onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '4px 8px',
        borderLeft: `3px solid ${borderColor}`,
        cursor: isConfirmedMatch ? 'default' : 'pointer',
        borderRadius: '0 4px 4px 0',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => {
        if (!isConfirmedMatch) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.background = 'transparent'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {team?.crest && (
          <img src={team.crest} alt="" width={18} height={18} style={{ objectFit: 'contain' }} />
        )}
        <span style={{
          fontSize: 13,
          fontWeight: isWinner ? 700 : 400,
          color: team ? 'var(--text-primary)' : 'var(--text-muted)',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {team?.name ?? 'TBD'}
        </span>
        {prob !== null && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 28, textAlign: 'right' }}>
            {Math.round(prob * 100)}%
          </span>
        )}
      </div>
      <ProbBar prob={prob} isLeading={isLeadingProb} />
    </div>
  )
}
```

- [ ] **Step 5: Write src/components/MatchBox.tsx**

```tsx
import TeamRow from './TeamRow'
import type { Match, Team } from '../types'

interface MatchBoxProps {
  match: Match
  onAdvance: (matchId: string, winner: Team) => void
}

export default function MatchBox({ match, onAdvance }: MatchBoxProps) {
  const { id, home, away, winner, homeProb, awayProb, isProjected } = match
  const isConfirmedMatch = !!winner && !isProjected

  const showProbs = home !== null && away !== null && homeProb !== null && awayProb !== null
  const homeLeads = (homeProb ?? 0) >= (awayProb ?? 0)

  return (
    <div style={{
      width: 'var(--match-box-width)',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 6,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}>
      <TeamRow
        team={home}
        prob={showProbs ? homeProb : null}
        isWinner={winner?.id === home?.id}
        isProjected={isProjected}
        isConfirmedMatch={isConfirmedMatch}
        isLeadingProb={homeLeads}
        onClick={() => home && onAdvance(id, home)}
      />
      <div style={{ height: 1, background: 'var(--border-color)' }} />
      <TeamRow
        team={away}
        prob={showProbs ? awayProb : null}
        isWinner={winner?.id === away?.id}
        isProjected={isProjected}
        isConfirmedMatch={isConfirmedMatch}
        isLeadingProb={!homeLeads}
        onClick={() => away && onAdvance(id, away)}
      />
    </div>
  )
}
```

- [ ] **Step 6: Run tests to confirm they pass**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/ProbBar.tsx src/components/TeamRow.tsx src/components/MatchBox.tsx src/components/MatchBox.test.tsx
git commit -m "feat: add MatchBox, TeamRow, and ProbBar components with tests"
```

---

## Task 7: Bracket Layout Components

**Files:**
- Create: `src/components/RoundColumn.tsx`
- Create: `src/components/BracketHalf.tsx`
- Create: `src/components/CenterColumn.tsx`
- Create: `src/components/ConnectorLines.tsx`
- Create: `src/components/BracketView.tsx`

**Interfaces:**
- Consumes: `Match`, `Team` from `src/types.ts`; `LAYOUT`, `LEFT_ROUNDS`, `RIGHT_ROUNDS` from `src/constants.ts`
- Produces: `<BracketView matches onAdvance />` consumed by `App.tsx`

- [ ] **Step 1: Write src/components/RoundColumn.tsx**

Each match box is centered at `(slot + 0.5) * slotHeight` where `slotHeight = BRACKET_HEIGHT / slotsInRound`. The column height is always `BRACKET_HEIGHT` so all columns align.

```tsx
import { LAYOUT, LEFT_ROUNDS } from '../constants'
import type { Match, Round, Side, Team } from '../types'
import MatchBox from './MatchBox'

interface RoundColumnProps {
  round: Round
  side: Side
  matches: Match[]
  onAdvance: (matchId: string, winner: Team) => void
  label: string
}

const ROUND_LABELS: Record<Round, string> = {
  R32: 'Round of 32',
  R16: 'Round of 16',
  QF: 'Quarter-finals',
  SF: 'Semi-finals',
  FINAL: 'Final',
  THIRD: '3rd Place',
}

export default function RoundColumn({ round, side, matches, onAdvance, label }: RoundColumnProps) {
  const roundMatches = matches
    .filter(m => m.round === round && m.side === side)
    .sort((a, b) => a.slot - b.slot)

  const slotCount = roundMatches.length
  const slotHeight = slotCount > 0 ? LAYOUT.BRACKET_HEIGHT / slotCount : LAYOUT.BRACKET_HEIGHT

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        fontSize: 11,
        fontVariant: 'small-caps',
        letterSpacing: 1,
        color: 'var(--text-muted)',
        marginBottom: 8,
        whiteSpace: 'nowrap',
      }}>
        {ROUND_LABELS[round]}
      </div>
      <div style={{
        position: 'relative',
        height: LAYOUT.BRACKET_HEIGHT,
        width: LAYOUT.MATCH_BOX_WIDTH,
      }}>
        {roundMatches.map((match, idx) => {
          const centerY = (idx + 0.5) * slotHeight
          const top = centerY - LAYOUT.MATCH_BOX_HEIGHT / 2
          return (
            <div key={match.id} style={{
              position: 'absolute',
              top,
              left: 0,
              width: LAYOUT.MATCH_BOX_WIDTH,
              height: LAYOUT.MATCH_BOX_HEIGHT,
            }}>
              <MatchBox match={match} onAdvance={onAdvance} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write src/components/ConnectorLines.tsx**

SVG connectors for one bracket half. For each match in round `r` at slot `s`, draws an L-shaped path from the right edge of that match box to the left edge of the parent match in the next round.

```tsx
import { LAYOUT, LEFT_ROUNDS } from '../constants'
import type { Match, Round, Side } from '../types'

interface ConnectorLinesProps {
  side: Side
  matches: Match[]
}

const ROUNDS_IN_ORDER: Round[] = ['R32', 'R16', 'QF', 'SF']
const NEXT_ROUND: Partial<Record<Round, Round>> = { R32: 'R16', R16: 'QF', QF: 'SF' }

function slotCenterY(slot: number, totalSlots: number): number {
  return (slot + 0.5) * (LAYOUT.BRACKET_HEIGHT / totalSlots)
}

function roundSlotCount(round: Round): number {
  return { R32: 8, R16: 4, QF: 2, SF: 1 }[round] ?? 1
}

export default function ConnectorLines({ side, matches }: ConnectorLinesProps) {
  // Total SVG width = 4 columns * COLUMN_WIDTH (includes gaps)
  const totalWidth = 4 * LAYOUT.COLUMN_WIDTH
  const paths: string[] = []

  for (const round of ROUNDS_IN_ORDER) {
    const next = NEXT_ROUND[round]
    if (!next) continue

    const roundMatches = matches.filter(m => m.round === round && m.side === side)
    const roundIdx = ROUNDS_IN_ORDER.indexOf(round) // 0–3
    const colX = roundIdx * LAYOUT.COLUMN_WIDTH    // left edge of this round's column

    const srcSlots = roundSlotCount(round)
    const dstSlots = roundSlotCount(next)

    for (const match of roundMatches) {
      const srcY = slotCenterY(match.slot, srcSlots)
      const dstSlot = Math.floor(match.slot / 2)
      const dstY = slotCenterY(dstSlot, dstSlots)

      // Right edge of current match box
      const x1 = colX + LAYOUT.MATCH_BOX_WIDTH
      // Left edge of next match box
      const x2 = (roundIdx + 1) * LAYOUT.COLUMN_WIDTH
      // Midpoint for the vertical segment
      const mx = x1 + (x2 - x1) / 2

      paths.push(`M ${x1} ${srcY} H ${mx} V ${dstY} H ${x2}`)
    }
  }

  // For right side, mirror the SVG horizontally
  const transform = side === 'right' ? `scale(-1,1) translate(-${totalWidth},0)` : undefined

  return (
    <svg
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }}
      width={totalWidth}
      height={LAYOUT.BRACKET_HEIGHT}
    >
      <g transform={transform}>
        {paths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="var(--connector-color)" strokeWidth={1.5} />
        ))}
      </g>
    </svg>
  )
}
```

- [ ] **Step 3: Write src/components/BracketHalf.tsx**

```tsx
import { LEFT_ROUNDS, RIGHT_ROUNDS } from '../constants'
import type { Match, Side, Team } from '../types'
import RoundColumn from './RoundColumn'
import ConnectorLines from './ConnectorLines'
import { LAYOUT } from '../constants'

interface BracketHalfProps {
  side: 'left' | 'right'
  matches: Match[]
  onAdvance: (matchId: string, winner: Team) => void
}

export default function BracketHalf({ side, matches, onAdvance }: BracketHalfProps) {
  const rounds = side === 'left' ? LEFT_ROUNDS : RIGHT_ROUNDS

  return (
    <div style={{ position: 'relative', display: 'flex', gap: LAYOUT.COLUMN_WIDTH - LAYOUT.MATCH_BOX_WIDTH }}>
      <ConnectorLines side={side} matches={matches} />
      {rounds.map(round => (
        <RoundColumn
          key={round}
          round={round}
          side={side}
          matches={matches}
          onAdvance={onAdvance}
          label={round}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Write src/components/CenterColumn.tsx**

```tsx
import { LAYOUT } from '../constants'
import type { Match, Team } from '../types'
import MatchBox from './MatchBox'

interface CenterColumnProps {
  matches: Match[]
  onAdvance: (matchId: string, winner: Team) => void
}

export default function CenterColumn({ matches, onAdvance }: CenterColumnProps) {
  const final = matches.find(m => m.round === 'FINAL')
  const third = matches.find(m => m.round === 'THIRD')

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
      height: LAYOUT.BRACKET_HEIGHT + 32, // +32 for the round label row
      paddingTop: 32,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 11,
          fontVariant: 'small-caps',
          letterSpacing: 1,
          color: 'var(--accent-gold)',
          marginBottom: 8,
        }}>
          Final
        </div>
        {final && <MatchBox match={final} onAdvance={onAdvance} />}
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 11,
          fontVariant: 'small-caps',
          letterSpacing: 1,
          color: 'var(--text-muted)',
          marginBottom: 8,
        }}>
          3rd Place
        </div>
        {third && <MatchBox match={third} onAdvance={onAdvance} />}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Write src/components/BracketView.tsx**

```tsx
import type { Match, Team } from '../types'
import BracketHalf from './BracketHalf'
import CenterColumn from './CenterColumn'

interface BracketViewProps {
  matches: Match[]
  onAdvance: (matchId: string, winner: Team) => void
}

export default function BracketView({ matches, onAdvance }: BracketViewProps) {
  return (
    <div style={{ overflowX: 'auto', padding: '24px 32px', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32, minWidth: 'max-content' }}>
        <BracketHalf side="left" matches={matches} onAdvance={onAdvance} />
        <CenterColumn matches={matches} onAdvance={onAdvance} />
        <BracketHalf side="right" matches={matches} onAdvance={onAdvance} />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: Only missing `Header` component errors remain.

- [ ] **Step 7: Commit**

```bash
git add src/components/RoundColumn.tsx src/components/ConnectorLines.tsx src/components/BracketHalf.tsx src/components/CenterColumn.tsx src/components/BracketView.tsx
git commit -m "feat: add bracket layout components (RoundColumn, BracketHalf, CenterColumn, BracketView, ConnectorLines)"
```

---

## Task 8: Header, Final Wiring, and GitHub Pages Deploy

**Files:**
- Create: `src/components/Header.tsx`
- Modify: `src/App.tsx` (already imports Header — just needs the component to exist)

- [ ] **Step 1: Write src/components/Header.tsx**

```tsx
interface HeaderProps {
  apiStatus: 'loading' | 'ok' | 'error'
  onReset: () => void
}

const STATUS_LABEL: Record<string, string> = {
  loading: '⏳ Loading...',
  ok: '● Live',
  error: '⚠ Offline',
}

const STATUS_COLOR: Record<string, string> = {
  loading: 'var(--text-muted)',
  ok: 'var(--winner-confirmed)',
  error: '#f59e0b',
}

export default function Header({ apiStatus, onReset }: HeaderProps) {
  return (
    <header style={{
      background: '#0f1623',
      borderBottom: '1px solid var(--border-color)',
      padding: '16px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
        <h1 style={{
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--accent-gold)',
          letterSpacing: 1,
        }}>
          FIFA World Cup 2026
        </h1>
        <span style={{ fontSize: 12, color: STATUS_COLOR[apiStatus] }}>
          {STATUS_LABEL[apiStatus]}
        </span>
      </div>
      <button
        onClick={onReset}
        style={{
          background: 'transparent',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          borderRadius: 6,
          padding: '8px 16px',
          cursor: 'pointer',
          fontSize: 13,
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-gold)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-color)')}
      >
        Reset to Live Standings
      </button>
    </header>
  )
}
```

- [ ] **Step 2: Run full test suite**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 3: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Add your API keys to .env**

```
VITE_FOOTBALL_DATA_API_KEY=<your football-data.org key>
VITE_ODDS_API_KEY=<your the-odds-api.com key>
```

Sign up at:
- football-data.org → https://www.football-data.org/client/register
- The Odds API → https://the-odds-api.com/#get-access

- [ ] **Step 5: Start dev server and verify the bracket renders**

```bash
npm run dev
```

Open `http://localhost:5173/cup26/`. You should see:
- Dark header with gold "FIFA World Cup 2026" title
- Full bracket layout: 4 left columns, center Final/3rd columns, 4 right columns mirrored
- Match boxes with team names and probability bars
- Click a team → it highlights and the team appears in the next round's slot
- Reset button clears projections

- [ ] **Step 6: Commit**

```bash
git add src/components/Header.tsx
git commit -m "feat: add Header component — bracket UI complete"
```

- [ ] **Step 7: Create GitHub repository and push**

```bash
gh repo create cup26 --public --source=. --remote=origin --push
```

(Requires `gh` CLI — install with `brew install gh` if needed, then `gh auth login`.)

- [ ] **Step 8: Deploy to GitHub Pages**

```bash
npm run build
npm run deploy
```

Expected output ends with: `Published`

Your bracket is live at: `https://amitbg.github.io/cup26/`

- [ ] **Step 9: Final commit for any deploy config tweaks**

```bash
git add -A
git commit -m "chore: finalize deploy configuration for GitHub Pages"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ React + Vite + TypeScript scaffold
- ✅ football-data.org bracket data fetch
- ✅ The Odds API single-request fetch, cached client-side
- ✅ Click team → auto-advance through rounds
- ✅ Clear stale downstream projections on re-pick
- ✅ SF winner → FINAL, SF loser → THIRD (special case in `advanceWinner`)
- ✅ LocalStorage persistence (save on every state change, restore on load)
- ✅ Merge: live results override stored projections
- ✅ Reset button: clear localStorage + re-fetch
- ✅ SVG connector lines
- ✅ Dark theme (`#1a1f2e`, `#242938`, gold)
- ✅ Blue border for projected winners, green for confirmed
- ✅ Probability bars (gold for leader, muted for trailing)
- ✅ TBD placeholder for empty slots
- ✅ API error status shown in header; bracket still renders without probs
- ✅ GitHub Pages deploy with correct `base` path
- ✅ `.env.example` committed
- ✅ Desktop-first, horizontal scroll on small screens

**Type consistency:**
- `Match.id` format: `"${round}-${side}-${slot}"` — used consistently in `makeMatchId`, tests, and `advanceWinner`
- `onAdvance(matchId: string, winner: Team)` — consistent across `App`, `BracketView`, `BracketHalf`, `RoundColumn`, `CenterColumn`, `MatchBox`
- `OddsCache = OddsEvent[]` — consistent between `types.ts`, `oddsApi.ts`, and `App.tsx`
