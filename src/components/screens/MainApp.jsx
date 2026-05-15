import { useState } from 'react'
import HomeTab from '../tabs/HomeTab.jsx'
import PromptTab from '../tabs/PromptTab.jsx'
import CirclesTab from '../tabs/CirclesTab.jsx'
import MapTab from '../tabs/MapTab.jsx'
import AlmanacTab from '../tabs/AlmanacTab.jsx'
import AddMomentSheet from '../sheets/AddMomentSheet.jsx'
import CreateCircleSheet from '../sheets/CreateCircleSheet.jsx'
import SettingsSheet from '../sheets/SettingsSheet.jsx'
import ProfileSheet from '../sheets/ProfileSheet.jsx'

export default function MainApp() {
  const [activeTab, setActiveTab] = useState('home')
  const [momentSheetOpen, setMomentSheetOpen] = useState(false)
  const [momentInitialType, setMomentInitialType] = useState('voice')
  const [circleSheetOpen, setCircleSheetOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  // For opening a circle detail from HomeTab
  const [pendingCircleId, setPendingCircleId] = useState(null)

  function openAddMoment(type) {
    setMomentInitialType(type || 'voice')
    setMomentSheetOpen(true)
  }

  function switchTab(tab) {
    setActiveTab(tab)
  }

  function openCircle(id) {
    setPendingCircleId(id)
    setActiveTab('circles')
  }

  return (
    <div id="screen-app" className="screen active">
      {/* Top bar */}
      <div className="app-topbar">
        <div className="topbar-wordmark">Double Date</div>
        <div className="topbar-actions">
          <button className="icon-btn" onClick={() => setSettingsOpen(true)} aria-label="Settings">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="10" cy="10" r="2.5"/>
              <path d="M10 2v1.5M10 16.5V18M2 10h1.5M16.5 10H18M4.1 4.1l1.1 1.1M14.8 14.8l1.1 1.1M4.1 15.9l1.1-1.1M14.8 5.2l1.1-1.1"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Scroll area with tab content */}
      <div className="scroll-area">
        {activeTab === 'home' && (
          <HomeTab onSwitchTab={switchTab} onOpenCircle={openCircle} />
        )}
        {activeTab === 'prompt' && (
          <PromptTab onOpenAddMoment={openAddMoment} />
        )}
        {activeTab === 'circles' && (
          <CirclesTab
            onOpenAddCircle={() => setCircleSheetOpen(true)}
            onSwitchTab={switchTab}
            pendingCircleId={pendingCircleId}
            onPendingCircleConsumed={() => setPendingCircleId(null)}
          />
        )}
        {activeTab === 'map' && (
          <MapTab onOpenAddMoment={openAddMoment} />
        )}
        {activeTab === 'almanac' && (
          <AlmanacTab />
        )}
      </div>

      {/* Bottom nav */}
      <nav className="bottom-nav">
        <NavButton id="home" label="Home" active={activeTab === 'home'} onClick={() => switchTab('home')}>
          <svg className="nav-icon" width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l8-7 8 7v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9z"/>
            <path d="M9 21V12h4v9"/>
          </svg>
        </NavButton>
        <NavButton id="prompt" label="Prompt" active={activeTab === 'prompt'} onClick={() => switchTab('prompt')}>
          <svg className="nav-icon" width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="9"/>
            <path d="M11 7v5l3 3"/>
          </svg>
        </NavButton>
        <NavButton id="circles" label="Circles" active={activeTab === 'circles'} onClick={() => switchTab('circles')}>
          <svg className="nav-icon" width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="8" cy="11" r="5"/>
            <circle cx="14" cy="11" r="5"/>
          </svg>
        </NavButton>
        <NavButton id="almanac" label="Almanac" active={activeTab === 'almanac'} onClick={() => switchTab('almanac')}>
          <svg className="nav-icon" width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="3" y="3" width="16" height="16" rx="2"/>
            <line x1="7" y1="8" x2="15" y2="8"/>
            <line x1="7" y1="12" x2="15" y2="12"/>
            <line x1="7" y1="16" x2="11" y2="16"/>
          </svg>
        </NavButton>
      </nav>

      {/* FAB */}
      <button className="add-moment-btn" onClick={() => openAddMoment()} aria-label="Add a moment">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      {/* Sheets */}
      <AddMomentSheet open={momentSheetOpen} onClose={() => setMomentSheetOpen(false)} initialType={momentInitialType} />
      <CreateCircleSheet open={circleSheetOpen} onClose={() => setCircleSheetOpen(false)} />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} onOpenProfile={() => setProfileOpen(true)} />
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  )
}

function NavButton({ id, label, active, onClick, children }) {
  return (
    <button className={`nav-btn${active ? ' active' : ''}`} id={`nav-${id}`} onClick={onClick}>
      {children}
      <span className="nav-label">{label}</span>
    </button>
  )
}
