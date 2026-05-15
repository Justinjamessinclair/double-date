export default function BottomSheet({ open, onClose, title, subtitle, children }) {
  return (
    <>
      <div
        className={`sheet-overlay${open ? ' visible' : ''}`}
        onClick={onClose}
      />
      <div className={`bottom-sheet${open ? ' open' : ''}`}>
        <div className="sheet-handle" />
        {title && <div className="sheet-title">{title}</div>}
        {subtitle && <div className="sheet-subtitle">{subtitle}</div>}
        {children}
      </div>
    </>
  )
}
