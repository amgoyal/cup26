import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchAllOdds, lookupOdds } from './oddsApi'
import type { OddsCache } from '../types'

const mockOddsResponse: OddsCache = [
  {
    id: 'abc',
    home_team: 'Brazil',
    away_team: 'Croatia',
    bookmakers: [
      {
        markets: [
          {
            key: 'h2h',
            outcomes: [
              { name: 'Brazil', price: 1.65 },
              { name: 'Croatia', price: 4.50 },
              { name: 'Draw', price: 3.50 },
            ],
          },
        ],
      },
    ],
  },
]

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockOddsResponse),
  }))
  vi.stubEnv('VITE_ODDS_API_KEY', 'test-odds-key')
})

describe('fetchAllOdds', () => {
  it('calls The Odds API with correct URL', async () => {
    await fetchAllOdds()
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('soccer_fifa_world_cup'))
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('test-odds-key'))
  })

  it('returns the raw odds payload', async () => {
    const result = await fetchAllOdds()
    expect(result).toHaveLength(1)
    expect(result[0].home_team).toBe('Brazil')
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }))
    await expect(fetchAllOdds()).rejects.toThrow('Odds API error: 401')
  })
})

describe('lookupOdds', () => {
  it('returns normalized home/away win probabilities ignoring draw', () => {
    const result = lookupOdds(mockOddsResponse, 'Brazil', 'Croatia')
    expect(result).not.toBeNull()
    // home implied: 1/1.65 ≈ 0.606, away implied: 1/4.50 ≈ 0.222
    // normalized home: 0.606 / (0.606 + 0.222) ≈ 0.732
    expect(result!.homeProb).toBeCloseTo(0.732, 2)
    expect(result!.awayProb).toBeCloseTo(0.268, 2)
    expect(result!.homeProb + result!.awayProb).toBeCloseTo(1.0, 5)
  })

  it('returns null when match not found in cache', () => {
    expect(lookupOdds(mockOddsResponse, 'France', 'Germany')).toBeNull()
  })

  it('is case-insensitive for team name matching', () => {
    expect(lookupOdds(mockOddsResponse, 'brazil', 'CROATIA')).not.toBeNull()
  })
})
