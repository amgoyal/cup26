import { LAYOUT } from '../constants'
import type { Match, Team } from '../types'
import MatchBox from './MatchBox'

interface CenterColumnProps {
  matches: Match[]
  onAdvance: (matchId: string, winner: Team) => void
}

export default function CenterColumn({ matches, onAdvance }: CenterColumnProps) {
  const final = matches.find(m => m.round === 'FINAL')
  const third = matches.find(m => m.round === 'THIRD')

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
      height: LAYOUT.BRACKET_HEIGHT + 32, // +32 for the round label row
      paddingTop: 32,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 11,
          fontVariant: 'small-caps',
          letterSpacing: 1,
          color: 'var(--accent-gold)',
          marginBottom: 8,
        }}>
          Final
        </div>
        {final && <MatchBox match={final} onAdvance={onAdvance} />}
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 11,
          fontVariant: 'small-caps',
          letterSpacing: 1,
          color: 'var(--text-muted)',
          marginBottom: 8,
        }}>
          3rd Place
        </div>
        {third && <MatchBox match={third} onAdvance={onAdvance} />}
      </div>
    </div>
  )
}
