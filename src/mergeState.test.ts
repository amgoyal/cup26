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

  it('preserves stored home/away when API slot is null', () => {
    const api = [makeMatch('R16-left-0', { home: null, away: null, winner: null })]
    const stored = [makeMatch('R16-left-0', { home: brazil, away: croatia, winner: brazil, isProjected: true })]
    const result = mergeApiWithProjection(api, stored)
    const m = result.find(m => m.id === 'R16-left-0')!
    expect(m.home?.name).toBe('Brazil')
    expect(m.away?.name).toBe('Croatia')
    expect(m.winner?.name).toBe('Brazil')
  })
})
