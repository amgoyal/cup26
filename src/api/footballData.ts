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
