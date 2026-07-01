import type { Match, Team } from '../types'
import BracketHalf from './BracketHalf'
import CenterColumn from './CenterColumn'

interface BracketViewProps {
  matches: Match[]
  onAdvance: (matchId: string, winner: Team) => void
}

export default function BracketView({ matches, onAdvance }: BracketViewProps) {
  return (
    <div style={{ overflowX: 'auto', padding: '24px 32px', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32, minWidth: 'max-content' }}>
        <BracketHalf side="left" matches={matches} onAdvance={onAdvance} />
        <CenterColumn matches={matches} onAdvance={onAdvance} />
        <BracketHalf side="right" matches={matches} onAdvance={onAdvance} />
      </div>
    </div>
  )
}
