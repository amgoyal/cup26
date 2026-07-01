import { buildInitialBracket } from '../bracketLogic'
import type { ApiMatch, Match } from '../types'

// football-data.org doesn't support CORS — use Vite dev proxy in dev,
// corsproxy.io in production (GitHub Pages is static, no server-side proxy available)
const FOOTBALL_DATA_BASE = import.meta.env.DEV
  ? '/api/football-data'
  : 'https://corsproxy.io/?url=https://api.football-data.org'

export async function fetchBracket(): Promise<Match[]> {
  const key = import.meta.env.VITE_FOOTBALL_DATA_API_KEY
  const res = await fetch(`${FOOTBALL_DATA_BASE}/v4/competitions/WC/matches`, {
    headers: { 'X-Auth-Token': key },
  })
  if (!res.ok) throw new Error(`football-data.org error: ${res.status}`)
  const data = await res.json()
  return buildInitialBracket(data.matches as ApiMatch[])
}
