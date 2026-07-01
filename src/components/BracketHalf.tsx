import { LEFT_ROUNDS, RIGHT_ROUNDS } from '../constants'
import type { Match, Team } from '../types'
import RoundColumn from './RoundColumn'
import ConnectorLines from './ConnectorLines'
import { LAYOUT } from '../constants'

interface BracketHalfProps {
  side: 'left' | 'right'
  matches: Match[]
  onAdvance: (matchId: string, winner: Team) => void
}

export default function BracketHalf({ side, matches, onAdvance }: BracketHalfProps) {
  const rounds = side === 'left' ? LEFT_ROUNDS : RIGHT_ROUNDS

  return (
    <div style={{ position: 'relative', display: 'flex', gap: LAYOUT.COLUMN_WIDTH - LAYOUT.MATCH_BOX_WIDTH }}>
      <ConnectorLines side={side} matches={matches} />
      {rounds.map(round => (
        <RoundColumn
          key={round}
          round={round}
          side={side}
          matches={matches}
          onAdvance={onAdvance}
          label={round}
        />
      ))}
    </div>
  )
}
