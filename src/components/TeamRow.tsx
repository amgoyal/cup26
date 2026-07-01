import ProbBar from './ProbBar'
import type { Team } from '../types'

interface TeamRowProps {
  team: Team | null
  prob: number | null
  isWinner: boolean
  isProjected: boolean
  isConfirmedMatch: boolean  // true if match has a confirmed (non-projected) winner
  isLeadingProb: boolean
  onClick: () => void
}

export default function TeamRow({
  team, prob, isWinner, isProjected, isConfirmedMatch, isLeadingProb, onClick,
}: TeamRowProps) {
  const borderColor = isWinner
    ? (isProjected ? 'var(--winner-projected)' : 'var(--winner-confirmed)')
    : 'transparent'

  return (
    <div
      onClick={isConfirmedMatch ? undefined : onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '4px 8px',
        borderLeft: `3px solid ${borderColor}`,
        cursor: isConfirmedMatch ? 'default' : 'pointer',
        borderRadius: '0 4px 4px 0',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => {
        if (!isConfirmedMatch) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.background = 'transparent'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {team?.crest && (
          <img src={team.crest} alt="" width={18} height={18} style={{ objectFit: 'contain' }} />
        )}
        <span style={{
          fontSize: 13,
          fontWeight: isWinner ? 700 : 400,
          color: team ? 'var(--text-primary)' : 'var(--text-muted)',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {team?.name ?? 'TBD'}
        </span>
        {prob !== null && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 28, textAlign: 'right' }}>
            {Math.round(prob * 100)}%
          </span>
        )}
      </div>
      <ProbBar prob={prob} isLeading={isLeadingProb} />
    </div>
  )
}
