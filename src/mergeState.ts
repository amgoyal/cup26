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
      home: apiMatch.home ?? storedMatch.home,
      away: apiMatch.away ?? storedMatch.away,
      winner: storedMatch.winner,
      isProjected: storedMatch.isProjected,
      homeProb: storedMatch.homeProb,
      awayProb: storedMatch.awayProb,
    }
  })
}
