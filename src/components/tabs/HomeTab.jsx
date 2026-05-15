import { useAuth } from '../../hooks/useAuth.jsx'
import { useData } from '../../hooks/useData.jsx'
import { weekKey } from '../../utils/date.js'
import { getCurrentPrompt } from '../../utils/prompts.js'
import Avatar from '../ui/Avatar.jsx'
import MomentCard from '../shared/MomentCard.jsx'
import CircleCard from '../shared/CircleCard.jsx'

export default function HomeTab({ onSwitchTab, onOpenCircle }) {
  const { user } = useAuth()
  const { circles, moments, prompts } = useData()

  const now = new Date()
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`

  const circle = circles[0]
  const wk = weekKey()
  const prompt = circle ? prompts.find(p => p.weekKey === wk && p.circleId === circle.id) : null
  const customPrompt = prompt?.customQuestion
  const displayPrompt = customPrompt || getCurrentPrompt()
  const myResponse = prompt?.responses?.find(r => r.authorId === user?.id)
  const recent = [...moments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3)

  return (
    <div className="tab-view active" id="tab-home">
      <div className="home-greeting stagger">
        <div className="greeting-date">{dateStr}</div>
        <h2 className="greeting-headline">
          {greeting}, <em>{user?.name || 'friend'}</em>.
        </h2>
      </div>

      {/* Hero prompt card */}
      <div className="prompt-card stagger" onClick={() => onSwitchTab('prompt')}>
        <div className="prompt-card-bg" />
        <div className="prompt-card-eyebrow">
          <div className="pulse-dot" />
          This week's prompt
        </div>
        <div className="prompt-card-question">"{displayPrompt}"</div>
        <div className="prompt-card-meta">
          <div className="prompt-card-participants">
            {user && <Avatar name={user.name} color={user.color} size={28} />}
            {circle && <Avatar name={circle.name} color={circle.color} size={28} />}
          </div>
          <div className="prompt-card-cta">
            {myResponse
              ? <span className="prompt-responded">Responded</span>
              : 'Tap to respond →'
            }
          </div>
        </div>
      </div>

      {/* Circles */}
      <div className="stagger">
        <div className="section-header">
          <div className="section-title">Your circles</div>
          <button className="section-link" onClick={() => onSwitchTab('circles')}>See all</button>
        </div>
        {circles.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--s7) 0' }}>
            <div className="empty-body" style={{ padding: 0 }}>No circles yet. Add a friend to get started.</div>
          </div>
        ) : (
          <div className="circle-list">
            {circles.map(c => (
              <CircleCard key={c.id} circle={c} prompts={prompts} user={user} onClick={() => onOpenCircle(c.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Recent moments */}
      <div className="stagger">
        <div className="section-header mt2">
          <div className="section-title">Recent moments</div>
          <button className="section-link" onClick={() => onSwitchTab('circles')}>Browse</button>
        </div>
        {recent.length === 0 ? (
          <div style={{ fontSize: 18, fontWeight: 300, color: 'var(--ink-30)', fontStyle: 'italic', fontFamily: 'var(--f-content)', padding: 'var(--s5) 0' }}>
            Your shared moments will appear here.
          </div>
        ) : (
          <div className="moments-list">
            {recent.map(m => <MomentCard key={m.id} moment={m} circles={circles} user={user} />)}
          </div>
        )}
      </div>

      <div style={{ height: 'var(--s9)' }} />
    </div>
  )
}
