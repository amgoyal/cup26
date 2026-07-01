interface ProbBarProps {
  prob: number | null  // 0–1
  isLeading: boolean
}

export default function ProbBar({ prob, isLeading }: ProbBarProps) {
  if (prob === null) return null
  const pct = Math.round(prob * 100)
  return (
    <div style={{
      height: 3,
      borderRadius: 2,
      background: 'var(--border-color)',
      margin: '2px 0 4px',
    }}>
      <div style={{
        width: `${pct}%`,
        height: '100%',
        borderRadius: 2,
        background: isLeading ? 'var(--accent-gold)' : 'var(--text-muted)',
        transition: 'width 0.3s ease',
      }} />
    </div>
  )
}
