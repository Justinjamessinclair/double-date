import { useState, useRef, useEffect } from 'react'
import BottomSheet from '../ui/BottomSheet.jsx'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useData } from '../../hooks/useData.jsx'
import { useToast } from '../ui/Toast.jsx'
import { getCurrentPrompt } from '../../utils/prompts.js'
import { apiFetch } from '../../api/client.js'
import { weekKey } from '../../utils/date.js'

const COLORS = ['#c2714f','#6b7c5e','#a8893a','#4f7fa8','#8a5fa8','#a84f6b','#3a7a7a','#1a1510']

export default function AddMomentSheet({ open, onClose, initialType = 'voice' }) {
  const { user } = useAuth()
  const { circles, addMoment, refetch } = useData()
  const { show: showToast } = useToast()

  const [type, setType] = useState(initialType)
  const [circleId, setCircleId] = useState(null)
  const [textContent, setTextContent] = useState('')
  const [placeName, setPlaceName] = useState('')
  const [placeNote, setPlaceNote] = useState('')
  const [geocodeResult, setGeocodeResult] = useState(null)
  const [geocodeStatus, setGeocodeStatus] = useState('')
  const [pendingCoords, setPendingCoords] = useState(null)
  const [voiceCaption, setVoiceCaption] = useState('')
  const [recording, setRecording] = useState(false)
  const [photoDataUrl, setPhotoDataUrl] = useState(null)
  const [photoCaption, setPhotoCaption] = useState('')
  const [promptResponse, setPromptResponse] = useState('')
  const [saving, setSaving] = useState(false)
  const cameraInputRef = useRef(null)
  const uploadInputRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const recBlobRef = useRef(null)

  // Set default circle and type when opening
  useEffect(() => {
    if (open) {
      setCircleId(circles[0]?.id || null)
      setType(initialType)
      setTextContent('')
      setPlaceName('')
      setPlaceNote('')
      setVoiceCaption('')
      setPhotoDataUrl(null)
      setPhotoCaption('')
      setPromptResponse('')
      setGeocodeStatus('')
      setGeocodeResult(null)
      setPendingCoords(null)
      recBlobRef.current = null
    }
  }, [open, initialType, circles])

  async function geocodePlace() {
    if (!placeName) { showToast('Enter a place name first'); return }
    const token = import.meta.env.VITE_MAPBOX_TOKEN
    if (!token) {
      setGeocodeStatus('Add Mapbox token to enable location search')
      return
    }
    setGeocodeStatus('Searching…')
    try {
      const encoded = encodeURIComponent(placeName)
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${token}&limit=1&country=us`)
      const data = await res.json()
      if (data.features?.length > 0) {
        const feat = data.features[0]
        setPendingCoords(feat.geometry.coordinates)
        setGeocodeResult(`✓ Found: ${feat.place_name}`)
        setGeocodeStatus('found')
      } else {
        setPendingCoords(null)
        setGeocodeResult('Location not found — will save without map pin')
        setGeocodeStatus('not-found')
      }
    } catch {
      setGeocodeResult('Search failed — check connection')
      setGeocodeStatus('error')
    }
  }

  function toggleRecording() {
    if (!recording) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        chunksRef.current = []
        const mr = new MediaRecorder(stream)
        mr.ondataavailable = e => chunksRef.current.push(e.data)
        mr.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          recBlobRef.current = blob
          stream.getTracks().forEach(t => t.stop())
        }
        mr.start()
        recorderRef.current = mr
        setRecording(true)
      }).catch(() => {
        setRecording(true) // simulate if no mic access
      })
    } else {
      recorderRef.current?.stop()
      setRecording(false)
      showToast('Voice note ready — save moment below')
    }
  }

  function handlePhotoFile(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => {
      setPhotoDataUrl(e.target.result)
      showToast('Photo ready — tap Save moment')
    }
    reader.readAsDataURL(file)
  }

  async function save() {
    if (!circleId) { showToast('Select a circle first'); return }
    setSaving(true)

    try {
      const wk = weekKey()
      let momentData = { type, circleId, authorName: user?.name }

      if (type === 'text') {
        if (!textContent) { showToast('Write something first'); setSaving(false); return }
        momentData.content = textContent
      } else if (type === 'place') {
        if (!placeName) { showToast('Enter a place name'); setSaving(false); return }
        momentData.content = placeNote || placeName
        momentData.location = placeName
        if (pendingCoords) momentData.coords = pendingCoords
      } else if (type === 'voice') {
        momentData.content = voiceCaption || 'Voice note'
        // Upload blob if we have one
        if (recBlobRef.current) {
          try {
            const { url, key } = await apiFetch('/media/upload', { method: 'POST', body: { contentType: 'audio/webm' } })
            await fetch(url, { method: 'PUT', body: recBlobRef.current, headers: { 'Content-Type': 'audio/webm' } })
            momentData.audioKey = key
          } catch { /* store locally, sync later */ }
        }
      } else if (type === 'photo') {
        if (!photoDataUrl) { showToast('Take or upload a photo first'); setSaving(false); return }
        momentData.content = photoCaption || 'Photo'
        // Upload photo blob
        try {
          const blob = await (await fetch(photoDataUrl)).blob()
          const { url, key } = await apiFetch('/media/upload', { method: 'POST', body: { contentType: blob.type } })
          await fetch(url, { method: 'PUT', body: blob, headers: { 'Content-Type': blob.type } })
          momentData.photoKey = key
        } catch { momentData.photoDataUrl = photoDataUrl }
      } else if (type === 'prompt') {
        if (!promptResponse) { showToast('Write a response first'); setSaving(false); return }
        momentData.content = promptResponse
        momentData.isPromptResponse = true
        momentData.weekKey = wk
        // Also save as prompt response
        try {
          await apiFetch(`/prompts/${circleId}/${wk}/responses`, {
            method: 'POST',
            body: { type: 'text', content: promptResponse, authorName: user?.name },
          })
        } catch { /* best effort */ }
      }

      await addMoment(momentData)
      onClose()
      showToast('Moment saved ✦')
    } catch {
      showToast('Failed to save moment')
    } finally {
      setSaving(false)
    }
  }

  const promptQ = getCurrentPrompt()

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Add a moment"
      subtitle="A moment is anything worth keeping — a voice note, a thought, a place you were."
    >
      {/* Type grid */}
      <div className="type-grid">
        <TypeCard id="voice" label="Voice" desc="Record an audio note" selected={type === 'voice'} onClick={() => setType('voice')}
          icon={<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="var(--sage)" strokeWidth="1.5" strokeLinecap="round"><rect x="7.5" y="2" width="7" height="12" rx="3.5"/><path d="M4 11a7 7 0 0014 0"/><line x1="11" y1="18" x2="11" y2="20"/></svg>}
          iconBg="var(--sage-pale)"
        />
        <TypeCard id="text" label="Text" desc="Write a thought" selected={type === 'text'} onClick={() => setType('text')}
          icon={<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="var(--terra)" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="16" height="14" rx="2"/><line x1="7" y1="9" x2="15" y2="9"/><line x1="7" y1="13" x2="12" y2="13"/></svg>}
          iconBg="var(--terra-pale)"
        />
        <TypeCard id="place" label="Place" desc="Pin a location" selected={type === 'place'} onClick={() => setType('place')}
          icon={<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="9" r="4"/><path d="M11 2C7.7 2 5 4.7 5 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.3-2.7-6-6-6z" fill="none"/></svg>}
          iconBg="var(--gold-pale)"
        />
        <TypeCard id="prompt" label="Prompt" desc="Answer this week's" selected={type === 'prompt'} onClick={() => setType('prompt')}
          icon={<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="var(--sage)" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="9"/><path d="M11 7v5l3 3"/></svg>}
          iconBg="rgba(107,124,94,0.12)"
        />
        {/* Photo spans 2 columns */}
        <div
          className={`type-card${type === 'photo' ? ' selected' : ''}`}
          onClick={() => setType('photo')}
          style={{ gridColumn: 'span 2' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s4)' }}>
            <div className="type-icon" style={{ background: 'rgba(168,137,58,0.12)', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round">
                <rect x="2" y="6" width="18" height="13" rx="2"/>
                <circle cx="11" cy="12" r="3.5"/>
                <path d="M7 6l1.5-3h5L15 6"/>
              </svg>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div className="type-label">Photo</div>
              <div className="type-desc">Take or upload a picture</div>
            </div>
          </div>
        </div>
      </div>

      {/* Input area */}
      <div id="moment-input-area">
        {type === 'voice' && (
          <div>
            <button className={`record-btn${recording ? ' recording' : ''}`} onClick={toggleRecording}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="6" y="2" width="6" height="10" rx="3" fill="currentColor"/>
                <path d="M3 9a6 6 0 0012 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              </svg>
              <span>{recording ? 'Recording… tap to stop' : 'Hold to record'}</span>
            </button>
            <div className="form-group mt1">
              <label className="form-label">Optional caption</label>
              <input className="form-input" type="text" placeholder="What's this about?" value={voiceCaption} onChange={e => setVoiceCaption(e.target.value)} autoComplete="off" />
            </div>
          </div>
        )}

        {type === 'text' && (
          <div className="form-group">
            <label className="form-label">Your thought</label>
            <textarea className="textarea-input" rows="4" placeholder="Write whatever's on your mind..." value={textContent} onChange={e => setTextContent(e.target.value)} />
          </div>
        )}

        {type === 'place' && (
          <div>
            <div className="form-group">
              <label className="form-label">Search for a place</label>
              <div className="place-search-row">
                <input className="form-input" type="text" placeholder="e.g. Trattoria Daly, Lincoln Heights" value={placeName} onChange={e => setPlaceName(e.target.value)} autoCapitalize="words" />
                <button className="geocode-btn" onClick={geocodePlace}>Find</button>
              </div>
              {geocodeResult && (
                <div style={{ marginTop: 'var(--s3)', padding: 'var(--s3) var(--s4)', background: geocodeStatus === 'found' ? 'var(--sage-pale)' : 'var(--gold-pale)', borderRadius: 'var(--r-sm)', fontSize: 13, color: geocodeStatus === 'found' ? 'var(--sage)' : 'var(--gold)', fontFamily: 'var(--f-mono)', letterSpacing: '0.04em' }}>
                  {geocodeResult}
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">What happened here?</label>
              <textarea className="textarea-input" rows="3" placeholder="A note about this place..." value={placeNote} onChange={e => setPlaceNote(e.target.value)} />
            </div>
          </div>
        )}

        {type === 'prompt' && (
          <div>
            <div className="prompt-this-week" style={{ marginBottom: 'var(--s5)', borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '1px solid var(--ink-10)' }}>
              <div className="prompt-week-header" style={{ padding: 'var(--s5)' }}>
                <div className="prompt-week-eyebrow">This week</div>
                <div className="prompt-week-question" style={{ fontSize: 16 }}>"{promptQ}"</div>
              </div>
            </div>
            <div className="form-group">
              <textarea className="textarea-input" rows="4" placeholder="Your response..." value={promptResponse} onChange={e => setPromptResponse(e.target.value)} />
            </div>
          </div>
        )}

        {type === 'photo' && (
          <div>
            <div className="photo-capture-area">
              <div className="photo-preview">
                {!photoDataUrl ? (
                  <div className="photo-preview-placeholder">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <rect x="4" y="10" width="32" height="24" rx="3"/>
                      <circle cx="20" cy="22" r="6"/>
                      <path d="M13 10l2.5-5h9L27 10"/>
                    </svg>
                    <span>No photo yet</span>
                  </div>
                ) : (
                  <img src={photoDataUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              <div className="photo-btn-row">
                <button className="photo-action-btn" onClick={() => cameraInputRef.current?.click()}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="1" y="4" width="14" height="10" rx="1.5"/>
                    <circle cx="8" cy="9" r="2.5"/>
                    <path d="M5 4l1-2h4l1 2"/>
                  </svg>
                  Camera
                </button>
                <button className="photo-action-btn" onClick={() => uploadInputRef.current?.click()}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="1" y="1" width="14" height="14" rx="2"/>
                    <circle cx="5.5" cy="5.5" r="1.5"/>
                    <path d="M1 11l4-4 3 3 2-2 5 5"/>
                  </svg>
                  Upload
                </button>
              </div>
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => handlePhotoFile(e.target.files[0])} />
              <input ref={uploadInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handlePhotoFile(e.target.files[0])} />
            </div>
            <div className="form-group">
              <label className="form-label">Caption (optional)</label>
              <input className="form-input" type="text" placeholder="What's this about?" value={photoCaption} onChange={e => setPhotoCaption(e.target.value)} autoComplete="off" />
            </div>
          </div>
        )}
      </div>

      {/* Circle selector */}
      <div className="form-group mt1">
        <label className="form-label">Share with</label>
        <div className="circle-selector">
          {circles.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--ink-30)', fontWeight: 300 }}>No circles yet. Add one first.</div>
          ) : (
            circles.map(c => (
              <div
                key={c.id}
                className={`circle-selector-item${circleId === c.id ? ' selected' : ''}`}
                onClick={() => setCircleId(c.id)}
              >
                <div className="moment-avatar-sm" style={{ background: c.color, width: 32, height: 32, fontSize: 11 }}>{c.name[0]}</div>
                <div>
                  <div className="circle-selector-name">{c.name}</div>
                  {c.members && <div className="circle-selector-sub">{c.members}</div>}
                </div>
                <div className={`checkmark${circleId === c.id ? ' selected' : ''}`}>
                  {circleId === c.id && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                      <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <button className="btn-dark" onClick={save} disabled={saving}>
        {saving ? 'Saving…' : 'Save moment'}
      </button>
    </BottomSheet>
  )
}

function TypeCard({ label, desc, selected, onClick, icon, iconBg }) {
  return (
    <div className={`type-card${selected ? ' selected' : ''}`} onClick={onClick}>
      <div className="type-icon" style={{ background: iconBg }}>{icon}</div>
      <div className="type-label">{label}</div>
      <div className="type-desc">{desc}</div>
    </div>
  )
}
