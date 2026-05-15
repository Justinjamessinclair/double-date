import { useData } from '../../hooks/useData.jsx'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function AlmanacTab() {
  const { moments, prompts, circles } = useData()
  const now = new Date()
  const places = moments.filter(m => m.type === 'place')
  const promptsAnswered = prompts.filter(p => p.responses && p.responses.length > 0)

  // Group moments by year-month
  const byMonth = {}
  moments.forEach(m => {
    const d = new Date(m.createdAt)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!byMonth[key]) byMonth[key] = { year: d.getFullYear(), month: d.getMonth(), moments: [] }
    byMonth[key].moments.push(m)
  })
  const sortedKeys = Object.keys(byMonth).sort().reverse()

  return (
    <div className="tab-view active" id="tab-almanac">
      <div className="stagger">
        <div className="almanac-year-header">
          <div className="almanac-year">{now.getFullYear() - 1} — {now.getFullYear()}</div>
          <h2 className="almanac-headline">Your year,<br /><em>together</em></h2>
        </div>

        <div className="almanac-stats">
          <div className="stat-card">
            <div className="stat-num">{moments.length}</div>
            <div className="stat-label">Moments</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{promptsAnswered.length}</div>
            <div className="stat-label">Prompts</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{places.length}</div>
            <div className="stat-label">Places</div>
          </div>
        </div>

        <div className="almanac-chapters">
          {sortedKeys.length === 0 ? (
            <div className="empty-state">
              <svg className="empty-icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="8" y="8" width="48" height="48" rx="6"/>
                <line x1="20" y1="24" x2="44" y2="24"/>
                <line x1="20" y1="34" x2="44" y2="34"/>
                <line x1="20" y1="44" x2="32" y2="44"/>
              </svg>
              <div className="empty-title">The Almanac is waiting</div>
              <div className="empty-body">As you share moments, they'll compile into monthly chapters here — your year together, written down.</div>
            </div>
          ) : (
            sortedKeys.map(k => {
              const ch = byMonth[k]
              const n = ch.moments.length
              const thumbs = ch.moments.slice(0, 3).map((m, i) => {
                const circle = m.circleId ? circles.find(c => c.id === m.circleId) : null
                const color = circle?.color || '#ccc'
                const icon = m.type === 'voice' ? '♪' : m.type === 'place' ? '⌖' : '✦'
                return (
                  <div key={i} className="chapter-thumbnail" style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
                    <span style={{ fontSize: 16, opacity: 0.5 }}>{icon}</span>
                  </div>
                )
              })

              return (
                <div key={k} className="chapter-card">
                  <div className="chapter-header">
                    <div className="chapter-month-badge">{MONTH_NAMES[ch.month].slice(0, 3).toUpperCase()}</div>
                    <div>
                      <div className="chapter-title">{MONTH_NAMES[ch.month]} {ch.year}</div>
                      <div className="chapter-subtitle">{n} moment{n !== 1 ? 's' : ''} shared</div>
                    </div>
                  </div>
                  <div className="chapter-preview">{thumbs}</div>
                </div>
              )
            })
          )}
        </div>
      </div>
      <div style={{ height: 'var(--s9)' }} />
    </div>
  )
}
