import { useState } from 'react'
import { apiFetch } from '../../api/client.js'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useToast } from '../ui/Toast.jsx'

const COLORS = ['#c2714f','#6b7c5e','#a8893a','#4f7fa8','#8a5fa8','#a84f6b','#3a7a7a','#1a1510']
const TOTAL_STEPS = 4

export default function SetupScreen() {
  const { refetch } = useAuth()
  const { show: showToast } = useToast()

  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [partnerName, setPartnerName] = useState('')
  const [coupleName, setCoupleName] = useState('')
  const [color, setColor] = useState('#c2714f')
  const [friendCoupleName, setFriendCoupleName] = useState('')
  const [friendNames, setFriendNames] = useState('')
  const [firstPrompt, setFirstPrompt] = useState('')
  const [saving, setSaving] = useState(false)

  const titles = ['Who are you?', 'Your color', 'Add a circle', 'First prompt']
  const subs = ['Step 1 of 4', 'Step 2 of 4', 'Step 3 of 4', 'Step 4 of 4']

  function goBack() {
    if (step > 1) setStep(s => s - 1)
  }

  async function handleNext() {
    if (step < TOTAL_STEPS) {
      setStep(s => s + 1)
    } else {
      await finish()
    }
  }

  async function finish() {
    setSaving(true)
    try {
      const derivedCouple = coupleName || (partnerName ? `${name} & ${partnerName}` : name)
      await apiFetch('/auth/profile', {
        method: 'PATCH',
        body: {
          name: name || 'You',
          partnerName,
          coupleName: derivedCouple,
          color,
          friendCoupleName,
          friendNames,
          firstPrompt,
        },
      })
      await refetch()
      showToast('Welcome to Double Date ✦')
    } catch (err) {
      showToast('Something went wrong — try again')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div id="screen-setup" className="screen active">
      <div className="setup-header">
        <button className="setup-back" onClick={goBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        <div className="setup-title">{titles[step - 1]}</div>
        <div className="setup-subtitle">{subs[step - 1]}</div>
      </div>

      <ProgressDots step={step} total={TOTAL_STEPS} />

      <div className="setup-body">
        {/* Step 1: Names */}
        <div className={`setup-step${step === 1 ? ' active' : ''}`}>
          <div className="form-group">
            <label className="form-label">Your name</label>
            <input className="form-input" type="text" placeholder="e.g. Justin" value={name} onChange={e => setName(e.target.value)} autoCapitalize="words" autoComplete="off" />
          </div>
          <div className="form-group">
            <label className="form-label">Partner's name (optional)</label>
            <input className="form-input" type="text" placeholder="e.g. Sarah" value={partnerName} onChange={e => setPartnerName(e.target.value)} autoCapitalize="words" autoComplete="off" />
          </div>
          <div className="form-group">
            <label className="form-label">Your couple name or nickname</label>
            <input className="form-input" type="text" placeholder="e.g. The Sinclairs" value={coupleName} onChange={e => setCoupleName(e.target.value)} autoCapitalize="words" autoComplete="off" />
          </div>
        </div>

        {/* Step 2: Color */}
        <div className={`setup-step${step === 2 ? ' active' : ''}`}>
          <div className="form-group">
            <label className="form-label">Choose your color — it'll represent you across all circles</label>
            <div className="color-picker">
              {COLORS.map(c => (
                <div
                  key={c}
                  className={`color-swatch${color === c ? ' selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="setup-hint">Your color appears on your responses, map pins, and almanac pages. It'll show your friends which moments are yours at a glance.</div>
        </div>

        {/* Step 3: Friend circle */}
        <div className={`setup-step${step === 3 ? ' active' : ''}`}>
          <div className="form-group">
            <label className="form-label">Name of friends / couple</label>
            <input className="form-input" type="text" placeholder="e.g. The Garcias" value={friendCoupleName} onChange={e => setFriendCoupleName(e.target.value)} autoCapitalize="words" autoComplete="off" />
          </div>
          <div className="form-group">
            <label className="form-label">Their names (optional)</label>
            <input className="form-input" type="text" placeholder="e.g. Marco & Elena" value={friendNames} onChange={e => setFriendNames(e.target.value)} autoCapitalize="words" autoComplete="off" />
          </div>
          <div className="setup-hint">In the real app, you'd invite them via a link or code. For now, we'll set them up so you can see how the experience looks together.</div>
        </div>

        {/* Step 4: First prompt */}
        <div className={`setup-step${step === 4 ? ' active' : ''}`}>
          <div className="form-group">
            <label className="form-label">Your first weekly prompt</label>
            <textarea className="textarea-input" rows="3" placeholder="e.g. What's one thing that happened this week you want to remember?" value={firstPrompt} onChange={e => setFirstPrompt(e.target.value)} />
          </div>
          <div className="setup-hint">Each week, the app suggests a prompt. Either couple can replace it. This is yours to set the tone — or leave blank and use the default.</div>
        </div>
      </div>

      <div className="setup-footer">
        <div className="progress-dots" style={{ paddingTop: 0, marginBottom: 'var(--s4)' }}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`progress-dot${i === step - 1 ? ' active' : i < step - 1 ? ' done' : ''}`}
            />
          ))}
        </div>
        <button className="btn-dark" onClick={handleNext} disabled={saving}>
          {step < TOTAL_STEPS ? 'Continue' : saving ? 'Saving…' : 'Start your circle'}
        </button>
      </div>
    </div>
  )
}

function ProgressDots({ step, total }) {
  return (
    <div className="progress-dots">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`progress-dot${i === step - 1 ? ' active' : i < step - 1 ? ' done' : ''}`}
        />
      ))}
    </div>
  )
}
