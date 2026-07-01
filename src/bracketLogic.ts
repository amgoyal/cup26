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
  // API sends { id: null, name: null, ... } for undetermined slots — treat as null
  target.home = apiMatch.homeTeam?.id != null
    ? { id: apiMatch.homeTeam.id!, name: apiMatch.homeTeam.name!, shortName: apiMatch.homeTeam.shortName!, crest: apiMatch.homeTeam.crest! }
    : null
  target.away = apiMatch.awayTeam?.id != null
    ? { id: apiMatch.awayTeam.id!, name: apiMatch.awayTeam.name!, shortName: apiMatch.awayTeam.shortName!, crest: apiMatch.awayTeam.crest! }
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
    if (!nextMatch) return

    const isHome = slot % 2 === 0
    const teamBeingCleared = isHome ? nextMatch.home : nextMatch.away
    if (!teamBeingCleared) return  // nothing to clear

    const wasWinner = nextMatch.winner?.id === teamBeingCleared.id

    if (isHome) {
      nextMatch.home = null; nextMatch.homeProb = null
    } else {
      nextMatch.away = null; nextMatch.awayProb = null
    }

    if (wasWinner) {
      nextMatch.winner = null
      nextMatch.isProjected = false
      clearFrom(next, side, nextSlot)
    } else if (!nextMatch.home && !nextMatch.away) {
      nextMatch.winner = null
      nextMatch.isProjected = false
      clearFrom(next, side, nextSlot)
    }
  }

  clearFrom(source.round, source.side, source.slot)
  return updated
}
