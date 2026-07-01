import { LAYOUT } from '../constants'
import type { Match, Round, Side, Team } from '../types'
import MatchBox from './MatchBox'

interface RoundColumnProps {
  round: Round
  side: Side
  matches: Match[]
  onAdvance: (matchId: string, winner: Team) => void
  label: string
}

const ROUND_LABELS: Record<Round, string> = {
  R32: 'Round of 32',
  R16: 'Round of 16',
  QF: 'Quarter-finals',
  SF: 'Semi-finals',
  FINAL: 'Final',
  THIRD: '3rd Place',
}

export default function RoundColumn({ round, side, matches, onAdvance, label: _label }: RoundColumnProps) {
  const roundMatches = matches
    .filter(m => m.round === round && m.side === side)
    .sort((a, b) => a.slot - b.slot)

  const slotCount = roundMatches.length
  const slotHeight = slotCount > 0 ? LAYOUT.BRACKET_HEIGHT / slotCount : LAYOUT.BRACKET_HEIGHT

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        fontSize: 11,
        fontVariant: 'small-caps',
        letterSpacing: 1,
        color: 'var(--text-muted)',
        marginBottom: 8,
        whiteSpace: 'nowrap',
      }}>
        {ROUND_LABELS[round]}
      </div>
      <div style={{
        position: 'relative',
        height: LAYOUT.BRACKET_HEIGHT,
        width: LAYOUT.MATCH_BOX_WIDTH,
      }}>
        {roundMatches.map((match, idx) => {
          const centerY = (idx + 0.5) * slotHeight
          const top = centerY - LAYOUT.MATCH_BOX_HEIGHT / 2
          return (
            <div key={match.id} style={{
              position: 'absolute',
              top,
              left: 0,
              width: LAYOUT.MATCH_BOX_WIDTH,
              height: LAYOUT.MATCH_BOX_HEIGHT,
            }}>
              <MatchBox match={match} onAdvance={onAdvance} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
