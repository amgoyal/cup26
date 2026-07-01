interface HeaderProps {
  apiStatus: 'loading' | 'ok' | 'error'
  onReset: () => void
}

const STATUS_LABEL: Record<string, string> = {
  loading: '⏳ Loading...',
  ok: '● Live',
  error: '⚠ Offline',
}

const STATUS_COLOR: Record<string, string> = {
  loading: 'var(--text-muted)',
  ok: 'var(--winner-confirmed)',
  error: '#f59e0b',
}

export default function Header({ apiStatus, onReset }: HeaderProps) {
  return (
    <header style={{
      background: '#0f1623',
      borderBottom: '1px solid var(--border-color)',
      padding: '16px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
        <h1 style={{
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--accent-gold)',
          letterSpacing: 1,
        }}>
          FIFA World Cup 2026
        </h1>
        <span style={{ fontSize: 12, color: STATUS_COLOR[apiStatus] }}>
          {STATUS_LABEL[apiStatus]}
        </span>
      </div>
      <button
        onClick={onReset}
        style={{
          background: 'transparent',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          borderRadius: 6,
          padding: '8px 16px',
          cursor: 'pointer',
          fontSize: 13,
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-gold)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-color)')}
      >
        Reset to Live Standings
      </button>
    </header>
  )
}
