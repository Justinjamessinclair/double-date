import { useState, useRef, useEffect } from 'react'
import BottomSheet from '../ui/BottomSheet.jsx'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useToast } from '../ui/Toast.jsx'
import { apiFetch } from '../../api/client.js'

const COLORS = ['#c2714f','#6b7c5e','#a8893a','#4f7fa8','#8a5fa8','#a84f6b','#3a7a7a','#1a1510']

export default function ProfileSheet({ open, onClose }) {
  const { user, refetch } = useAuth()
  const { show: showToast } = useToast()
  const picInputRef = useRef(null)

  const [name, setName] = useState('')
  const [partner, setPartner] = useState('')
  const [couple, setCouple] = useState('')
  const [color, setColor] = useState('#c2714f')
  const [pendingPic, setPendingPic] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && user) {
      setName(user.name || '')
      setPartner(user.partnerName || '')
      setCouple(user.coupleName || '')
      setColor(user.color || '#c2714f')
      setPendingPic(null)
    }
  }, [open, user])

  function handlePicFile(file) {
    if (!file) return
    const img = new Image()
    const reader = new FileReader()
    reader.onload = e => {
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX = 400
        let w = img.width, h = img.height
        if (w > h) { if (w > MAX) { h = h * MAX / w; w = MAX } }
        else { if (h > MAX) { w = w * MAX / h; h = MAX } }
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        setPendingPic(canvas.toDataURL('image/jpeg', 0.82))
        showToast('Photo selected — tap Save to confirm')
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
    picInputRef.current.value = ''
  }

  async function save() {
    setSaving(true)
    try {
      const derivedCouple = couple || (partner ? `${name} & ${partner}` : name)
      const body = { name: name || user?.name, partnerName: partner, coupleName: derivedCouple, color }
      if (pendingPic) body.profilePic = pendingPic
      await apiFetch('/auth/profile', { method: 'PATCH', body })
      await refetch()
      onClose()
      showToast('Profile updated ✦')
    } catch {
      showToast('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const initials = (name || '?')[0].toUpperCase()
  const avatarPic = pendingPic || user?.profilePic

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Edit profile"
      subtitle="Your name and photo appear in your circles and responses."
    >
      {/* Avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--s4)', marginBottom: 'var(--s6)' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: 96, height: 96, borderRadius: 'var(--r-xl)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: color }}>
            {avatarPic
              ? <img src={avatarPic} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              : <span style={{ fontFamily: 'var(--f-display)', fontSize: 36, color: 'white' }}>{initials}</span>
            }
          </div>
          <div className="profile-avatar-edit" onClick={() => picInputRef.current?.click()} style={{ width: 32, height: 32, bottom: -6, right: -6 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
              <rect x="1" y="3" width="12" height="9" rx="1.5"/>
              <circle cx="7" cy="7.5" r="2"/>
              <path d="M4 3l1-2h4l1 2"/>
            </svg>
          </div>
        </div>
        <input ref={picInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handlePicFile(e.target.files[0])} />
        <div style={{ fontSize: 12, fontWeight: 300, color: 'var(--ink-30)', fontFamily: 'var(--f-mono)', letterSpacing: '0.06em' }}>Tap camera icon to change</div>
      </div>

      <div className="form-group">
        <label className="form-label">Your name</label>
        <input className="form-input" type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} autoCapitalize="words" />
      </div>
      <div className="form-group">
        <label className="form-label">Partner's name</label>
        <input className="form-input" type="text" placeholder="Partner's name (optional)" value={partner} onChange={e => setPartner(e.target.value)} autoCapitalize="words" />
      </div>
      <div className="form-group">
        <label className="form-label">Couple name</label>
        <input className="form-input" type="text" placeholder="e.g. The Sinclairs" value={couple} onChange={e => setCouple(e.target.value)} autoCapitalize="words" />
      </div>
      <div className="form-group">
        <label className="form-label">Your color</label>
        <div className="color-picker">
          {COLORS.map(c => (
            <div key={c} className={`color-swatch${color === c ? ' selected' : ''}`} style={{ background: c }} onClick={() => setColor(c)} />
          ))}
        </div>
      </div>

      <button className="btn-dark" onClick={save} disabled={saving}>
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </BottomSheet>
  )
}
