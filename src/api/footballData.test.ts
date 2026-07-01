import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchBracket } from './footballData'

const mockResponse = {
  matches: [
    {
      id: 1,
      stage: 'ROUND_OF_32',
      homeTeam: { id: 10, name: 'Brazil', shortName: 'Brazil', crest: 'https://example.com/br.svg' },
      awayTeam: { id: 11, name: 'Croatia', shortName: 'Croatia', crest: 'https://example.com/hr.svg' },
      score: { winner: 'HOME_TEAM' },
    },
  ],
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockResponse),
  }))
  vi.stubEnv('VITE_FOOTBALL_DATA_API_KEY', 'test-key')
})

describe('fetchBracket', () => {
  it('calls football-data.org with correct URL and auth header', async () => {
    await fetchBracket()
    expect(fetch).toHaveBeenCalledWith(
      'https://api.football-data.org/v4/competitions/WC/matches',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Auth-Token': 'test-key' }),
      })
    )
  })

  it('returns Match array built from API response', async () => {
    const matches = await fetchBracket()
    const r32 = matches.filter(m => m.round === 'R32')
    expect(r32.length).toBeGreaterThan(0)
    const brazil = r32.find(m => m.home?.name === 'Brazil')
    expect(brazil?.winner?.name).toBe('Brazil')
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403 }))
    await expect(fetchBracket()).rejects.toThrow('football-data.org error: 403')
  })
})
