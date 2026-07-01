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
      makeApiMatch(i + 1, 'LAST_32', `TeamA${i}`, `TeamB${i}`)
    )
    const matches = buildInitialBracket(apiMatches)
    const r32 = matches.filter(m => m.round === 'R32')
    expect(r32).toHaveLength(16)
    expect(r32.filter(m => m.side === 'left')).toHaveLength(8)
    expect(r32.filter(m => m.side === 'right')).toHaveLength(8)
  })

  it('sets winner from API score', () => {
    const apiMatches = [makeApiMatch(1, 'LAST_32', 'Brazil', 'Croatia', 'HOME_TEAM')]
    const matches = buildInitialBracket(apiMatches)
    expect(matches[0].winner?.name).toBe('Brazil')
    expect(matches[0].isProjected).toBe(false)
  })

  it('leaves winner null for unplayed matches', () => {
    const apiMatches = [makeApiMatch(1, 'LAST_32', 'Brazil', 'Croatia', null)]
    const matches = buildInitialBracket(apiMatches)
    expect(matches[0].winner).toBeNull()
  })

  it('handles null homeTeam (TBD slot)', () => {
    const apiMatches = [makeApiMatch(1, 'LAST_32', null, 'Croatia', null)]
    const matches = buildInitialBracket(apiMatches)
    expect(matches[0].home).toBeNull()
  })
})

describe('advanceWinner', () => {
  it('sets winner on a match and places team in next round', () => {
    const apiMatches = Array.from({ length: 16 }, (_, i) =>
      makeApiMatch(i + 1, 'LAST_32', `TeamA${i}`, `TeamB${i}`)
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
      makeApiMatch(i + 1, 'LAST_32', `TeamA${i}`, `TeamB${i}`)
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
      makeApiMatch(i + 1, 'LAST_32', `TeamA${i}`, `TeamB${i}`)
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

  it('clears stale winner downstream when sibling slot is still filled', () => {
    const apiMatches = Array.from({ length: 16 }, (_, i) =>
      makeApiMatch(i + 1, 'LAST_32', `TeamA${i}`, `TeamB${i}`)
    )
    const initial = buildInitialBracket(apiMatches)
    // Advance slot 0 and slot 1 to fill R16 slot 0
    const r32s0 = initial.find(m => m.round === 'R32' && m.side === 'left' && m.slot === 0)!
    const r32s1 = initial.find(m => m.round === 'R32' && m.side === 'left' && m.slot === 1)!
    const afterS0 = advanceWinner(initial, r32s0.id, r32s0.home!)
    const afterS1 = advanceWinner(afterS0, r32s1.id, r32s1.home!)
    // Now advance R16 slot 0 winner
    const r16 = afterS1.find(m => m.round === 'R16' && m.side === 'left' && m.slot === 0)!
    const afterR16 = advanceWinner(afterS1, r16.id, r16.home!)
    // QF should have winner from R16
    const qf = afterR16.find(m => m.round === 'QF' && m.side === 'left' && m.slot === 0)!
    expect(qf.home?.name).toBe('TeamA0')

    // Now re-pick R32 slot 0 to the other team
    const cleared = clearDownstream(afterR16, r32s0.id)
    const r16After = cleared.find(m => m.round === 'R16' && m.side === 'left' && m.slot === 0)!
    const qfAfter = cleared.find(m => m.round === 'QF' && m.side === 'left' && m.slot === 0)!
    // R16 home should be cleared but away (from slot 1) should still be there
    expect(r16After.home).toBeNull()
    expect(r16After.away?.name).toBe('TeamA1')  // sibling slot preserved
    // Winner should be cleared because the cleared team (TeamA0) was the winner
    expect(r16After.winner).toBeNull()
    // QF should also be cleared downstream
    expect(qfAfter.home).toBeNull()
  })
})
