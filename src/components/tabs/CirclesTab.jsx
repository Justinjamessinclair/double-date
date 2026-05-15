import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useData } from '../../hooks/useData.jsx'
import { weekKey, formatRelDate } from '../../utils/date.js'
import { getCurrentPrompt } from '../../utils/prompts.js'
import MomentCard from '../shared/MomentCard.jsx'
import CircleCard from '../shared/CircleCard.jsx'

export default function CirclesTab({ onOpenAddCircle, onSwitchTab }) {
  const { user } = useAuth()
  const { circles, moments, prompts } = useData()
  const [activeCircleId, setActiveCircleId] = useState(null)

  const activeCircle = circles.find(c => c.id === activeCircleId)

  if (activeCircle) {
    return (
      <CircleDetail
        circle={activeCircle}
        moments={moments.filter(m => m.circleId === activeCircle.id)}
        prompts={prompts}
        circles={circles}
        user={user}
        onBack={() => setActiveCircleId(null)}
        onSwitchTab={onSwitchTab}
      />
    )
  }

  return (
    <div className="tab-view active" id="tab-circles">
      <div className="circles-list-view stagger">
        <div className="section-header">
          <div className="section-title">Your circles</div>
        </div>

        {circles.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="26" cy="32" r="16"/>
              <circle cx="38" cy="32" r="16"/>
            </svg>
            <div className="empty-title">No circles yet</div>
            <div className="empty-body">Add another couple or friend to start sharing moments together.</div>
          </div>
        ) : (
          <div className="circle-list">
            {circles.map(c => (
              <CircleCard
                key={c.id}
                circle={c}
                prompts={prompts}
                user={user}
                onClick={() => setActiveCircleId(c.id)}
              />
            ))}
          </div>
        )}

        <div style={{ marginTop: 'var(--s4)' }}>
          <div className="add-circle-card" onClick={onOpenAddCircle}>
            <div className="add-circle-icon">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="9"/>
                <line x1="11" y1="7" x2="11" y2="15"/>
                <line x1="7" y1="11" x2="15" y2="11"/>
              </svg>
            </div>
            <div className="add-circle-text">
              <div className="label">Add a new circle</div>
              <div className="sub">Invite another couple or friend</div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ height: 'var(--s9)' }} />
    </div>
  )
}

function CircleDetail({ circle, moments, prompts, circles, user, onBack, onSwitchTab }) {
  const wk = weekKey()
  const prompt = prompts.find(p => p.weekKey === wk && p.circleId === circle.id)
  const promptQ = prompt?.customQuestion || getCurrentPrompt()
  const responses = prompt?.responses || []
  const initials = circle.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const sorted = [...moments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return (
    <div className="tab-view active" id="tab-circles">
      <div className="circle-detail active">
        <button className="setup-back" onClick={onBack} style={{ color: 'var(--ink-60)', marginBottom: 'var(--s5)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M10 3L5 8l5 5"/>
          </svg>
          All circles
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s4)', marginBottom: 'var(--s6)' }}>
          <div className="circle-avatar" style={{ background: circle.color, width: 56, height: 56, fontSize: 20, borderRadius: 'var(--r-lg)' }}>
            {initials}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 20, fontWeight: 500, letterSpacing: '-0.01em' }}>{circle.name}</div>
            {circle.members && <div style={{ fontSize: 13, fontWeight: 300, color: 'var(--ink-60)' }}>{circle.members}</div>}
          </div>
        </div>

        <div className="prompt-card" style={{ marginBottom: 'var(--s5)' }} onClick={() => onSwitchTab('prompt')}>
          <div className="prompt-card-bg" />
          <div className="prompt-card-eyebrow"><div className="pulse-dot" />This week's prompt</div>
          <div className="prompt-card-question">"{promptQ}"</div>
          <div className="prompt-card-cta">{responses.length} response{responses.length !== 1 ? 's' : ''} so far →</div>
        </div>

        <div className="section-header">
          <div className="section-title">All moments</div>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--ink-30)' }}>{moments.length} total</span>
        </div>
        <div className="moments-list">
          {sorted.length === 0 ? (
            <div style={{ fontSize: 18, fontWeight: 300, color: 'var(--ink-30)', fontStyle: 'italic', fontFamily: 'var(--f-content)', padding: 'var(--s5) 0' }}>
              No moments yet. Add the first one.
            </div>
          ) : (
            sorted.map(m => <MomentCard key={m.id} moment={m} circles={circles} user={user} />)
          )}
        </div>
      </div>
      <div style={{ height: 'var(--s9)' }} />
    </div>
  )
}
