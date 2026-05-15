import { useState } from 'react'
import BottomSheet from '../ui/BottomSheet.jsx'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useToast } from '../ui/Toast.jsx'

const ChevronRight = () => (
  <svg className="settings-row-arrow" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M5 3l4 4-4 4"/>
  </svg>
)

export default function SettingsSheet({ open, onClose, onOpenProfile }) {
  const { user } = useAuth()
  const { show: showToast } = useToast()
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [tokenValue, setTokenValue] = useState('')

  const tokenStatus = import.meta.env.VITE_MAPBOX_TOKEN ? '✓ Set' : 'Not set'

  function saveToken() {
    if (!tokenValue.startsWith('pk.')) {
      showToast('Token should start with pk.')
      return
    }
    showToast('Set VITE_MAPBOX_TOKEN in your .env file to activate the map')
    setShowTokenInput(false)
  }

  function exportData() {
    showToast('Export — connect backend for full data download')
  }

  function handleOpenProfile() {
    onClose()
    setTimeout(onOpenProfile, 300)
  }

  const displayName = user ? user.name + (user.partnerName ? ` & ${user.partnerName}` : '') : '—'
  const initials = user ? (user.name || '?')[0].toUpperCase() : '?'

  return (
    <BottomSheet open={open} onClose={onClose} title="Settings">
      {/* Profile header */}
      <div className="settings-profile-header" onClick={handleOpenProfile}>
        <div className="profile-avatar">
          {user?.profilePic ? (
            <img src={user.profilePic} className="profile-avatar-img" alt="" />
          ) : (
            <div className="profile-avatar-initials" style={{ background: user?.color || '#c2714f' }}>
              {initials}
            </div>
          )}
        </div>
        <div className="settings-profile-info">
          <div className="settings-profile-name">{displayName}</div>
          <div className="settings-profile-couple">{user?.coupleName || '—'}</div>
          <div className="settings-profile-sub">Tap to edit profile</div>
        </div>
        <ChevronRight />
      </div>

      {/* Map section */}
      <div className="settings-section">
        <div className="settings-section-title">Map</div>
        <div className="settings-row" onClick={() => setShowTokenInput(v => !v)}>
          <div className="settings-row-icon" style={{ background: 'var(--gold-pale)' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="8" cy="8" r="5"/>
              <path d="M8 3C5.2 3 3 5.2 3 8c0 3.5 5 9 5 9s5-5.5 5-9c0-2.8-2.2-5-5-5z"/>
            </svg>
          </div>
          <div className="settings-row-label">Mapbox token</div>
          <div className="settings-row-value">{tokenStatus}</div>
          <ChevronRight />
        </div>
        {showTokenInput && (
          <div style={{ marginTop: 'var(--s3)' }}>
            <div className="setup-hint" style={{ marginBottom: 'var(--s3)' }}>
              Get your free token at <strong>mapbox.com</strong> → Account → Access tokens. It starts with <code style={{ fontFamily: 'var(--f-mono)', fontSize: 11 }}>pk.</code>
              <br />Then add it to your <code style={{ fontFamily: 'var(--f-mono)', fontSize: 11 }}>.env</code> file as <code style={{ fontFamily: 'var(--f-mono)', fontSize: 11 }}>VITE_MAPBOX_TOKEN</code>.
            </div>
            <div className="token-input-row">
              <input className="form-input" type="text" placeholder="pk.eyJ1IjoiLi4uIn0..." value={tokenValue} onChange={e => setTokenValue(e.target.value)} style={{ fontSize: 13, fontFamily: 'var(--f-mono)' }} />
              <button className="token-save-btn" onClick={saveToken}>Save</button>
            </div>
          </div>
        )}
      </div>

      {/* Notifications section */}
      <div className="settings-section">
        <div className="settings-section-title">Notifications</div>
        <div className="settings-row">
          <div className="settings-row-icon" style={{ background: 'var(--terra-pale)' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--terra)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M9 2a5 5 0 015 5c0 4 1.5 5 1.5 5H2.5S4 11 4 7a5 5 0 015-5z"/>
              <path d="M7 14a2 2 0 004 0"/>
            </svg>
          </div>
          <div className="settings-row-label">Weekly prompt reminder</div>
          <div className="settings-row-value">Sundays</div>
          <ChevronRight />
        </div>
      </div>

      {/* Data section */}
      <div className="settings-section">
        <div className="settings-section-title">Data</div>
        <div className="settings-row" onClick={exportData}>
          <div className="settings-row-icon" style={{ background: 'var(--sage-pale)' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--sage)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M9 2v9m0 0l-3-3m3 3l3-3"/>
              <path d="M3 13v2a1 1 0 001 1h10a1 1 0 001-1v-2"/>
            </svg>
          </div>
          <div className="settings-row-label">Export my data</div>
          <div className="settings-row-value">JSON</div>
          <ChevronRight />
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: 'var(--s4) 0' }}>
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-30)' }}>
          DOUBLE DATE · v1.0 · Built with care
        </div>
      </div>
    </BottomSheet>
  )
}
