import { useState } from 'react'
import { apiFetch } from '../../api/client.js'

export default function AuthScreen() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await apiFetch('/auth/request', { method: 'POST', body: { email } })
      setSent(true)
    } catch {
      // still show confirmation — don't leak whether email exists
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div id="screen-onboard" className="screen active">
      <div className="onboard-bg" />
      <div className="onboard-content">
        <div className="onboard-logo">
          <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
            <rect x="10" y="18" width="44" height="30" rx="5" fill="rgba(245,240,232,0.15)" stroke="rgba(245,240,232,0.5)" strokeWidth="1.5"/>
            <circle cx="32" cy="33" r="10" fill="rgba(245,240,232,0.2)" stroke="rgba(245,240,232,0.6)" strokeWidth="1.5"/>
            <circle cx="32" cy="33" r="6" fill="rgba(245,240,232,0.3)" stroke="rgba(245,240,232,0.4)" strokeWidth="1"/>
            <circle cx="32" cy="33" r="2.5" fill="rgba(245,240,232,0.8)"/>
            <circle cx="44" cy="21" r="3" fill="rgba(245,240,232,0.4)" stroke="rgba(245,240,232,0.6)" strokeWidth="1"/>
            <rect x="14" y="21" width="8" height="5" rx="1" fill="none" stroke="rgba(245,240,232,0.5)" strokeWidth="1"/>
            <circle cx="29" cy="31" r="1.5" fill="rgba(255,255,255,0.6)"/>
          </svg>
          <div>
            <div className="onboard-wordmark">Double Date</div>
            <div className="onboard-tagline">A living record</div>
          </div>
        </div>

        {!sent ? (
          <>
            <h1 className="onboard-headline">Your friendship,<br /><em>written down</em></h1>
            <p className="onboard-body">A private place for two couples to share weekly prompts, voice moments, and map a year of life together — then look back at all of it.</p>

            <div className="onboard-steps">
              <div className="onboard-step">
                <span className="step-num">01</span>
                <span className="step-text"><strong>Weekly prompt.</strong> A question each week — answer by voice, text, or a dropped pin on the map.</span>
              </div>
              <div className="onboard-step">
                <span className="step-num">02</span>
                <span className="step-text"><strong>Shared moments.</strong> Everything lives in a circle between you and your friends.</span>
              </div>
              <div className="onboard-step">
                <span className="step-num">03</span>
                <span className="step-text"><strong>The Almanac.</strong> Once a year, it all compiles into a chapter you keep forever.</span>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" style={{ color: 'rgba(245,240,232,0.5)' }}>Your email address</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ background: 'rgba(245,240,232,0.08)', color: 'var(--cream)', borderColor: 'rgba(245,240,232,0.15)' }}
                  required
                  autoComplete="email"
                />
              </div>
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? 'Sending…' : 'Send magic link'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="onboard-headline">Check your<br /><em>email</em></h1>
            <p className="onboard-body">We sent a magic link to <strong style={{ color: 'var(--cream)' }}>{email}</strong>. Tap it to sign in — no password needed.</p>
            <button className="btn-secondary" onClick={() => setSent(false)}>Use a different email</button>
          </>
        )}
      </div>
    </div>
  )
}
