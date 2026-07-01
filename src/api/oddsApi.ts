import type { OddsCache } from '../types'

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
