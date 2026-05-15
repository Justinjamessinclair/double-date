import { useState, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useData } from '../../hooks/useData.jsx'
import { useToast } from '../ui/Toast.jsx'
import { weekKey, formatRelDate } from '../../utils/date.js'
import { getCurrentPrompt } from '../../utils/prompts.js'
import { apiFetch } from '../../api/client.js'

export default function PromptTab({ onOpenAddMoment }) {
  const { user } = useAuth()
  const { circles, prompts, addResponse, refetch } = useData()
  const { show: showToast } = useToast()

  const [customOn, setCustomOn] = useState(false)
  const [customText, setCustomText] = useState('')
  const [recording, setRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const timerRef = useRef(null)

  const now = new Date()
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  const weekOf = `${months[weekStart.getMonth()]} ${weekStart.getDate()}`

  const circle = circles[0]
  const wk = weekKey()
  const prompt = circle ? prompts.find(p => p.weekKey === wk && p.circleId === circle.id) : null
  const customPromptQ = prompt?.customQuestion
  const displayPrompt = customPromptQ || getCurrentPrompt()
  const responses = prompt?.responses || []
  const expectedCount = 2 + circles.length * 2

  async function saveCustomPrompt() {
    if (!circle) return
    try {
      await apiFetch(`/prompts/${circle.id}/${wk}`, {
        method: 'PATCH',
        body: { customQuestion: customText || null },
      })
      await refetch()
      showToast(customText ? 'Prompt updated' : 'Using suggested prompt')
      setCustomOn(false)
    } catch {
      showToast('Failed to save prompt')
    }
  }

  function toggleRecording() {
    if (!recording) {
      setRecording(true)
      setRecordSeconds(0)
      timerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000)
    } else {
      clearInterval(timerRef.current)
      setRecording(false)
      if (recordSeconds > 0 && circle) {
        addResponse(circle.id, wk, {
          type: 'voice',
          content: '',
          duration: String(recordSeconds),
          authorName: user?.name,
        }).then(() => showToast('Voice response saved ✦'))
          .catch(() => showToast('Failed to save response'))
      }
    }
  }

  const recMin = Math.floor(recordSeconds / 60)
  const recSec = recordSeconds % 60

  return (
    <div className="tab-view active" id="tab-prompt">
      <div className="prompt-this-week stagger">
        <div className="prompt-week-header">
          <div className="prompt-week-eyebrow">Week of {weekOf}</div>
          <div className="prompt-week-question">"{displayPrompt}"</div>
        </div>

        <div className="prompt-edit-area">
          <div className="prompt-edit-label">Customize prompt</div>
          <label className="prompt-edit-toggle" onClick={() => {
            setCustomOn(v => !v)
            if (!customOn) setCustomText(customPromptQ || '')
          }}>
            <div className={`toggle-switch${customOn ? ' on' : ''}`}>
              <div className="toggle-knob" />
            </div>
            <span className="toggle-label">{customOn ? 'Write your own prompt' : 'Use the suggested prompt'}</span>
          </label>
          <div className={`prompt-custom-input${customOn ? ' visible' : ''}`}>
            <textarea
              className="textarea-input"
              rows="3"
              placeholder="Write your own prompt for this circle..."
              value={customText}
              onChange={e => setCustomText(e.target.value)}
            />
            <button className="btn-dark mt1" onClick={saveCustomPrompt} style={{ marginTop: 'var(--s3)' }}>
              Save prompt
            </button>
          </div>
        </div>
      </div>

      {/* Responses */}
      <div className="response-section stagger" style={{ marginTop: 'var(--s5)' }}>
        <div className="response-section-header">
          <div className="response-section-title">Responses this week</div>
          <div className="response-count">{responses.length} of {expectedCount}</div>
        </div>
        <div className="response-list">
          {responses.length === 0 ? (
            <div className="response-empty">No responses yet — be the first to answer.</div>
          ) : (
            responses.map(r => (
              <ResponseItem key={r.id} response={r} user={user} circles={circles} />
            ))
          )}
        </div>
        <div className="record-area">
          <button
            className={`record-btn${recording ? ' recording' : ''}`}
            onClick={toggleRecording}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="6" y="2" width="6" height="10" rx="3" fill="currentColor"/>
              <path d="M3 9a6 6 0 0012 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              <line x1="9" y1="15" x2="9" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>
              {recording
                ? `Recording ${recMin}:${String(recSec).padStart(2,'0')} — tap to stop`
                : 'Record your response'
              }
            </span>
          </button>
          <div style={{ marginTop: 'var(--s3)' }}>
            <button
              onClick={() => onOpenAddMoment('text')}
              style={{ width: '100%', background: 'none', border: '1.5px solid var(--ink-10)', borderRadius: 'var(--r-md)', padding: 14, fontFamily: 'var(--f-body)', fontSize: 14, color: 'var(--ink-60)', cursor: 'pointer', transition: 'all var(--t-fast)' }}
            >
              Or write a text response
            </button>
          </div>
        </div>
      </div>

      <div style={{ height: 'var(--s9)' }} />
    </div>
  )
}

function ResponseItem({ response: r, user, circles }) {
  const isMe = r.authorId === user?.id
  const color = isMe ? user?.color : (circles[0]?.color || '#888')
  const date = formatRelDate(r.createdAt)

  return (
    <div className="response-item">
      <div className="response-author-row">
        <div className="moment-avatar-sm" style={{ background: color, width: 28, height: 28 }}>
          {(r.authorName?.[0] || '?')}
        </div>
        <span className="response-author-name">{isMe ? 'You' : r.authorName}</span>
        <span className="response-author-date">{date}</span>
      </div>
      {r.type === 'voice' ? (
        <div className="moment-voice-player" style={{ background: `${color}15`, marginTop: 'var(--s2)' }}>
          <button className="play-btn" style={{ background: color }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="white"><polygon points="2,1 10,6 2,11"/></svg>
          </button>
          <div className="waveform">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="wave-bar" style={{ background: color, height: 4 + Math.sin(i * 0.8) * 6 }} />
            ))}
          </div>
          <span className="voice-duration" style={{ color }}>0:{r.duration || '24'}</span>
        </div>
      ) : (
        <div className="moment-text" style={{ fontSize: 18, lineHeight: 1.5, color: 'var(--ink)', fontWeight: 300 }}>
          {r.content}
        </div>
      )}
    </div>
  )
}
