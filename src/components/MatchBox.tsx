import TeamRow from './TeamRow'
import type { Match, Team } from '../types'

interface MatchBoxProps {
  match: Match
  onAdvance: (matchId: string, winner: Team) => void
}

export default function MatchBox({ match, onAdvance }: MatchBoxProps) {
  const { id, home, away, winner, homeProb, awayProb, isProjected } = match
  const isConfirmedMatch = !!winner && !isProjected

  const showProbs = home !== null && away !== null && homeProb !== null && awayProb !== null
  const homeLeads = (homeProb ?? 0) >= (awayProb ?? 0)

  return (
    <div style={{
      width: 'var(--match-box-width)',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 6,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}>
      <TeamRow
        team={home}
        prob={showProbs ? homeProb : null}
        isWinner={winner?.id === home?.id}
        isProjected={isProjected}
        isConfirmedMatch={isConfirmedMatch}
        isLeadingProb={homeLeads}
        onClick={() => home && onAdvance(id, home)}
      />
      <div style={{ height: 1, background: 'var(--border-color)' }} />
      <TeamRow
        team={away}
        prob={showProbs ? awayProb : null}
        isWinner={winner?.id === away?.id}
        isProjected={isProjected}
        isConfirmedMatch={isConfirmedMatch}
        isLeadingProb={!homeLeads}
        onClick={() => away && onAdvance(id, away)}
      />
    </div>
  )
}
