export default function Avatar({ name = '', color = '#c2714f', size = 32 }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className="participant-avatar"
      style={{
        background: color,
        width: size,
        height: size,
        fontSize: size * 0.35,
      }}
    >
      {initials}
    </div>
  )
}
