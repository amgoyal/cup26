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
