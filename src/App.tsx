import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchBracket } from './api/footballData'
import { fetchAllOdds, lookupOdds } from './api/oddsApi'
import { advanceWinner, buildInitialBracket, clearDownstream } from './bracketLogic'
import { clearProjection, loadProjection, saveProjection } from './storage'
import { mergeApiWithProjection } from './mergeState'
import type { Match, OddsCache, Team } from './types'
import Header from './components/Header'
import BracketView from './components/BracketView'

type ApiStatus = 'loading' | 'ok' | 'error'

export default function App() {
  const [matches, setMatches] = useState<Match[]>(() => buildInitialBracket([]))
  const [apiStatus, setApiStatus] = useState<ApiStatus>('loading')
  const oddsCacheRef = useRef<OddsCache>([])

  const applyOdds = useCallback((ms: Match[], cache: OddsCache): Match[] => {
    return ms.map(m => {
      if (!m.home || !m.away) return m
      const odds = lookupOdds(cache, m.home.name, m.away.name)
      if (!odds) return m
      return { ...m, homeProb: odds.homeProb, awayProb: odds.awayProb }
    })
  }, [])

  const loadData = useCallback(async () => {
    setApiStatus('loading')
    try {
      const [apiMatches, odds] = await Promise.all([fetchBracket(), fetchAllOdds()])
      oddsCacheRef.current = odds
      const stored = loadProjection() ?? []
      const merged = mergeApiWithProjection(apiMatches, stored)
      const withOdds = applyOdds(merged, odds)
      setMatches(withOdds)
      setApiStatus('ok')
    } catch {
      setApiStatus('error')
    }
  }, [applyOdds])

  useEffect(() => { loadData() }, [loadData])

  const handleAdvance = useCallback((matchId: string, winner: Team) => {
    setMatches(prev => {
      const cleared = clearDownstream(prev, matchId)
      const advanced = advanceWinner(cleared, matchId, winner)
      const withOdds = applyOdds(advanced, oddsCacheRef.current)
      saveProjection(withOdds)
      return withOdds
    })
  }, [applyOdds])

  const handleReset = useCallback(() => {
    clearProjection()
    loadData()
  }, [loadData])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header apiStatus={apiStatus} onReset={handleReset} />
      <BracketView matches={matches} onAdvance={handleAdvance} />
    </div>
  )
}
