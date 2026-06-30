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
