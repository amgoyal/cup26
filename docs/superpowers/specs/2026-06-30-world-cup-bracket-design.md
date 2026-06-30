# FIFA World Cup 2026 Interactive Bracket — Design Spec

**Date:** 2026-06-30
**Status:** Approved

---

## Overview

An interactive web page for the 2026 FIFA World Cup knockout stage. On load, it fetches the live bracket from a public API and displays all 32 teams across the knockout rounds. Users can click team names to project winners, which auto-advance through rounds to the Final. A Reset button restores the live standings.

---

## Tech Stack

- **Frontend:** React + Vite
- **Hosting:** GitHub Pages (static deploy via `gh-pages`)
- **Bracket data:** football-data.org free tier (`/v4/competitions/WC/matches`)
- **Win probabilities:** The Odds API free tier (`/v4/sports/soccer_fifa_world_cup/odds`)
- **Persistence:** Browser LocalStorage
- **API keys:** stored in `.env` (Vite `VITE_` prefix), exposed in client bundle — acceptable for 2–3 known users

---

## Bracket Structure

The 2026 World Cup knockout stage has an expanded format:

| Round | Teams | Matches |
|---|---|---|
| Round of 32 | 32 | 16 (8 left, 8 right) |
| Round of 16 | 16 | 8 (4 left, 4 right) |
| Quarter-finals | 8 | 4 (2 left, 2 right) |
| Semi-finals | 4 | 2 (1 left, 1 right) |
| Final | 2 | 1 (center) |
| Third Place | 2 | 1 (center, below Final) |

Visual flow: 16 teams on the left progress rightward toward the center; 16 teams on the right progress leftward toward the center, meeting at the Final.

---

## Data Model

```ts
interface Team {
  id: number;
  name: string;
  shortName: string;
  crest: string; // image URL from football-data.org
}

interface Match {
  id: string;
  round: 'R32' | 'R16' | 'QF' | 'SF' | 'FINAL' | 'THIRD';
  slot: number;                        // 0-indexed position within the round
  side: 'left' | 'right' | 'center';
  home: Team | null;
  away: Team | null;
  winner: Team | null;
  homeProb: number | null;             // 0–1 implied win probability
  awayProb: number | null;
  isProjected: boolean;                // true = user-set, false = live result
}
```

**Slot propagation rule:** winner of slot `n` advances to slot `Math.floor(n / 2)` of the next round, into the `home` position if `n` is even, `away` if `n` is odd.

**State:** flat `Match[]` array in React state. Serialized to LocalStorage on every change.

---

## Component Architecture

```
App
├── Header
│   ├── Title ("FIFA World Cup 2026")
│   └── StatusIndicator (API availability)
├── BracketView
│   ├── BracketHalf (side="left")  — rounds: R32 → R16 → QF → SF
│   │   └── RoundColumn (per round)
│   │       └── MatchBox (per match)
│   │           ├── TeamRow (home)
│   │           └── TeamRow (away)
│   ├── CenterColumn
│   │   ├── MatchBox (FINAL)
│   │   └── MatchBox (THIRD)
│   ├── BracketHalf (side="right") — rounds: SF → QF → R16 → R32
│   └── ConnectorLines (SVG overlay)
└── ResetButton
```

**MatchBox** displays:
- Team flag/crest (24px) + name + win probability % + colored bar
- Clicking a team name sets them as winner, highlights the row, triggers auto-advance
- Winner row: bold text, blue left border (projected) or green (confirmed live result)
- If one team slot is empty: "TBD" placeholder, probability hidden
- If API unavailable: probability shown as `—`

**ConnectorLines** — SVG `<path>` elements positioned as an overlay. Each match box's right edge (left half) or left edge (right half) connects to the next-round match box via an L-shaped right-angle path.

**RoundColumn** — vertically distributes match boxes with spacing that doubles each round to maintain correct connector alignment.

---

## Data Flow

### Page Load
1. Check LocalStorage for saved projection
2. Fetch bracket data from `football-data.org` — all WC 2026 knockout matches
3. Merge with LocalStorage: confirmed live results override stored data; user projections for unplayed matches are preserved
4. For all matches where both teams are known, fetch win probabilities from The Odds API (single batched request)
5. Render bracket

### Click to Advance
1. User clicks a team row in a MatchBox
2. Set `winner` on that match, `isProjected: true`
3. Write winner into the next-round match's correct slot (home/away by slot parity)
4. Clear all downstream projected matches on this path (stale projections wiped)
5. If next-round match now has both teams → look up their odds from the cached Odds API payload and populate `homeProb` / `awayProb`
6. Serialize updated state to LocalStorage

### Reset
1. Clear LocalStorage
2. Re-run page load sequence

---

## Probability Display

- Source: The Odds API, `soccer_fifa_world_cup`, `h2h` (head-to-head moneyline) market
- Conversion: bookmaker decimal odds → implied probability (`1 / odds`), normalized to sum to 100%
- Fetch strategy: **one request per page load** — The Odds API returns all available World Cup match odds in a single response; the app caches the full payload and filters client-side for matches with both teams known. When a user projection forms a new match, no additional API call is needed — the cached payload already contains all odds. Only a page refresh re-fetches.
- Budget: ~500 free requests/month; 1 request per page load = well within limits for 2–3 users even with frequent refreshes

---

## Visual Design

- **Background:** dark slate/charcoal (`#1a1f2e`)
- **Accent:** FIFA navy + gold header
- **Match box:** dark card (`#242938`), subtle border, rounded corners
- **Winner highlight (projected):** blue left border + bold name
- **Winner highlight (confirmed):** green left border + bold name
- **Probability bar:** gold bar for leading team, muted grey for trailing
- **Connector lines:** thin white/grey SVG on dark background
- **Round labels:** small caps column headers
- **Responsive:** desktop-first; horizontal scroll on small screens (no bracket reflow)

---

## API Configuration

| Variable | Purpose |
|---|---|
| `VITE_FOOTBALL_DATA_API_KEY` | football-data.org API key |
| `VITE_ODDS_API_KEY` | The Odds API key |

Both stored in `.env` (gitignored). A `.env.example` file is committed with placeholder values.

---

## Deployment

```bash
npm run build          # Vite production build → dist/
npm run deploy         # gh-pages -d dist → GitHub Pages
```

`vite.config.ts` sets `base` to the GitHub repo name for correct asset paths.

---

## Out of Scope

- Backend / API proxy (keys acceptable in client for this use case)
- Mobile reflow layout
- Multi-user shared state / real-time sync
- Group stage display
- Historical tournament data
