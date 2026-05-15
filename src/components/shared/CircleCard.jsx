import { weekKey } from '../../utils/date.js'

export default function CircleCard({ circle: c, prompts, user, onClick }) {
  const wk = weekKey()
  const prompt = prompts.find(p => p.weekKey === wk && p.circleId === c.id)
  const responses = prompt?.responses || []
  const lastResponse = responses[responses.length - 1]
  const sub = lastResponse
    ? `${lastResponse.authorName}: "${lastResponse.content?.slice(0, 40)}…"`
    : 'No responses yet this week'
  const hasNew = responses.some(r => r.authorId !== user?.id)
  const initials = c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="circle-card" onClick={onClick}>
      <div className="circle-avatar" style={{ background: c.color }}>{initials}</div>
      <div className="circle-info">
        <div className="circle-name">{c.name}</div>
        <div className="circle-last-response">
          {c.members ? `${c.members} — ` : ''}{sub}
        </div>
      </div>
      {hasNew && <div className="circle-badge" />}
    </div>
  )
}
