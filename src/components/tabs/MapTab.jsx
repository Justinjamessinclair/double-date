import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useData } from '../../hooks/useData.jsx'
import MomentCard from '../shared/MomentCard.jsx'

const MAP_STYLE = 'mapbox://styles/mapbox/light-v11'
const MAPBOX_CDN = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js'

// Inject Mapbox script tag once and return a promise that resolves when ready
let mapboxLoadPromise = null
function loadMapboxScript() {
  if (mapboxLoadPromise) return mapboxLoadPromise
  if (window.mapboxgl) {
    mapboxLoadPromise = Promise.resolve(window.mapboxgl)
    return mapboxLoadPromise
  }
  mapboxLoadPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = MAPBOX_CDN
    s.onload = () => resolve(window.mapboxgl)
    s.onerror = reject
    document.head.appendChild(s)
  })
  return mapboxLoadPromise
}

export default function MapTab({ onOpenAddMoment }) {
  const { user } = useAuth()
  const { circles, moments } = useData()
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const [mapReady, setMapReady] = useState(false)

  const token = import.meta.env.VITE_MAPBOX_TOKEN
  const places = moments.filter(m => m.type === 'place')
  const sorted = [...places].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const legendItems = []
  if (user) legendItems.push({ color: user.color, label: user.coupleName || user.name })
  circles.forEach(c => legendItems.push({ color: c.color, label: c.name }))

  useEffect(() => {
    if (!token || mapRef.current) return

    loadMapboxScript().then(mapboxgl => {
      mapboxgl.accessToken = token

      const map = new mapboxgl.Map({
        container: 'mapbox-container',
        style: MAP_STYLE,
        center: [-118.22, 34.11],
        zoom: 11,
        attributionControl: false,
      })

      map.addControl(new mapboxgl.AttributionControl({ compact: true }))
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')

      map.on('load', () => {
        mapRef.current = map
        setMapReady(true)
      })

      map.on('error', () => {})
    }).catch(() => {})
  }, [token])

  // Refresh markers when places or map changes
  useEffect(() => {
    if (!mapRef.current || !mapReady) return

    const mapboxgl = window.mapboxgl
    if (!mapboxgl) return

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    const placesWithCoords = places.filter(m => m.coords)
    placesWithCoords.forEach(moment => {
      const circle = moment.circleId ? circles.find(c => c.id === moment.circleId) : null
      const color = moment.authorId === user?.id ? (user?.color || '#c2714f') : (circle?.color || '#888')
      const authorName = moment.authorId === user?.id ? (user?.name || 'You') : (moment.authorName || 'Them')

      const el = document.createElement('div')
      el.className = 'dd-marker'
      el.style.background = color
      el.innerHTML = `<div class="dd-marker-inner">${(moment.location || '?')[0].toUpperCase()}</div>`

      const popup = new mapboxgl.Popup({ offset: 20, closeButton: true, maxWidth: '200px' })
        .setHTML(`
          <div class="map-popup-name">${moment.location || 'Place'}</div>
          ${moment.content ? `<div class="map-popup-note">${moment.content.slice(0, 80)}</div>` : ''}
          <div class="map-popup-by">by ${authorName}</div>
        `)

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(moment.coords)
        .setPopup(popup)
        .addTo(mapRef.current)

      markersRef.current.push(marker)
    })

    if (markersRef.current.length > 1) {
      const coords = placesWithCoords.map(m => m.coords)
      const bounds = coords.reduce(
        (b, c) => b.extend(c),
        new mapboxgl.LngLatBounds(coords[0], coords[0])
      )
      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 14 })
    }
  }, [mapReady, places, circles, user])

  return (
    <div className="tab-view active" id="tab-map">
      <div className="stagger">
        <div className="section-header" style={{ marginTop: 0 }}>
          <div className="section-title">Life map</div>
          <button className="section-link" onClick={() => onOpenAddMoment('place')}>+ Pin</button>
        </div>

        <div className="map-placeholder">
          <div id="mapbox-container" style={{ display: token ? 'block' : 'none' }} />
          {!token && (
            <div className="mapbox-token-prompt">
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="var(--terra)" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="20" cy="18" r="7"/>
                <path d="M20 4C12.3 4 6 10.3 6 18c0 9 14 22 14 22s14-13 14-22c0-7.7-6.3-14-14-14z"/>
                <circle cx="33" cy="10" r="5" fill="var(--gold-pale)" stroke="var(--gold)"/>
                <line x1="33" y1="7" x2="33" y2="13"/><line x1="30" y1="10" x2="36" y2="10"/>
              </svg>
              <div className="prompt-title">Map ready to connect</div>
              <div className="prompt-body">Add your Mapbox token as VITE_MAPBOX_TOKEN to see pinned places on a real interactive map.</div>
              <div className="prompt-code">VITE_MAPBOX_TOKEN=pk.eyJ1...</div>
            </div>
          )}
          <div className="map-legend">
            {legendItems.map((l, i) => (
              <div key={i} className="legend-item">
                <div className="legend-dot" style={{ background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        <div className="section-header mt2">
          <div className="section-title">Pinned places</div>
        </div>
        <div className="moments-list">
          {sorted.length === 0 ? (
            <div style={{ fontSize: 18, fontWeight: 300, color: 'var(--ink-30)', fontStyle: 'italic', fontFamily: 'var(--f-content)', padding: 'var(--s5) 0' }}>
              Places you pin will appear here and on the map.
            </div>
          ) : (
            sorted.map(m => <MomentCard key={m.id} moment={m} circles={circles} user={user} />)
          )}
        </div>
      </div>
      <div style={{ height: 'var(--s9)' }} />
    </div>
  )
}
