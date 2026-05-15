import { formatRelDate } from '../../utils/date.js'

export default function MomentCard({ moment: m, circles, user }) {
  const circle = m.circleId ? circles.find(c => c.id === m.circleId) : null
  const isMe = m.authorId === user?.id
  const authorColor = isMe ? user?.color : (circle?.color || '#888')
  const authorName = isMe ? (user?.name || 'You') : (m.authorName || circle?.name || 'Them')
  const via = circle ? `via ${circle.name}` : ''
  const date = formatRelDate(m.createdAt)
  const typeBadge = m.type === 'voice' ? 'voice' : m.type === 'place' ? 'place' : 'text'
  const typeLabel = m.type === 'voice' ? 'Voice' : m.type === 'place' ? 'Place' : m.type === 'photo' ? 'Photo' : 'Text'

  return (
    <div className="moment-card">
      <div className="moment-header">
        <div className="moment-author-row">
          {isMe && user?.profilePic ? (
            <div style={{ width: 24, height: 24, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
              <img src={user.profilePic} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            </div>
          ) : (
            <div className="moment-avatar-sm" style={{ background: authorColor }}>{authorName[0]}</div>
          )}
          <span className="moment-author">{authorName}</span>
          {via && <span className="moment-via">· {via}</span>}
        </div>
        <span className="moment-date">{date}</span>
      </div>

      <div className={`moment-type-badge ${typeBadge}`}>{typeLabel}</div>

      {m.type === 'photo' ? (
        <>
          <div className="moment-photo">
            <img src={m.photoUrl || m.photoDataUrl} alt={m.content || 'Photo'} loading="lazy" />
          </div>
          {m.content && m.content !== 'Photo' && (
            <div className="moment-text" style={{ marginTop: 'var(--s2)' }}>{m.content}</div>
          )}
        </>
      ) : m.type !== 'place' ? (
        <div className="moment-text truncate">{m.content || ''}</div>
      ) : null}

      {m.type === 'voice' && (
        <div className="moment-voice-player">
          <button className="play-btn">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
              <polygon points="3,2 11,7 3,12"/>
            </svg>
          </button>
          <div className="waveform">
            {Array(12).fill(0).map((_, i) => (
              <div key={i} className="wave-bar" style={{ height: 6 + Math.sin(i) * 8, animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <span className="voice-duration">0:{m.duration || '32'}</span>
        </div>
      )}

      {m.type === 'place' && (
        <div className="moment-location">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="7" cy="5" r="2.5"/>
            <path d="M7 1C4.8 1 3 2.8 3 5c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4z"/>
          </svg>
          {m.location || m.content}
        </div>
      )}
    </div>
  )
}
