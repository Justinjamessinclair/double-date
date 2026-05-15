import { useState, useEffect } from 'react'
import BottomSheet from '../ui/BottomSheet.jsx'
import { useData } from '../../hooks/useData.jsx'
import { useToast } from '../ui/Toast.jsx'

const COLORS = ['#4f7fa8','#8a5fa8','#a84f6b','#3a7a7a','#6b7c5e','#a8893a']

export default function CreateCircleSheet({ open, onClose }) {
  const { addCircle } = useData()
  const { show: showToast } = useToast()

  const [name, setName] = useState('')
  const [members, setMembers] = useState('')
  const [color, setColor] = useState('#4f7fa8')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setName(''); setMembers(''); setColor('#4f7fa8')
    }
  }, [open])

  async function save() {
    if (!name) { showToast('Enter a name for this circle'); return }
    setSaving(true)
    try {
      await addCircle({ name, members, color })
      onClose()
      showToast(`${name} added to your circles`)
    } catch {
      showToast('Failed to create circle')
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="New circle"
      subtitle="Add another couple, friend, or group. They'd receive an invite link in the real app."
    >
      <div className="form-group">
        <label className="form-label">Their couple/friend name</label>
        <input className="form-input" type="text" placeholder="e.g. The Garcias" value={name} onChange={e => setName(e.target.value)} autoCapitalize="words" />
      </div>
      <div className="form-group">
        <label className="form-label">Names (optional)</label>
        <input className="form-input" type="text" placeholder="e.g. Marco & Elena" value={members} onChange={e => setMembers(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Pick a color for them</label>
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
      <button className="btn-dark" onClick={save} disabled={saving}>
        {saving ? 'Adding…' : 'Add circle'}
      </button>
    </BottomSheet>
  )
}
