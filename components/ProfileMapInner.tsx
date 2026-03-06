'use client'

import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type MedalPin = {
  id: string
  medalType: string
  restaurantName: string
  restaurantSlug: string
  categoryName: string
  iconEmoji: string
  city: string | null
  state: string | null
  address: string | null
  lat: number
  lng: number
}

const MEDAL_COLORS: Record<string, { color: string; label: string }> = {
  gold:   { color: '#eab308', label: '1st' },
  silver: { color: '#9ca3af', label: '2nd' },
  bronze: { color: '#d97706', label: '3rd' },
}

function createMedalIcon(medalType: string) {
  const { color, label } = MEDAL_COLORS[medalType] ?? { color: '#6b7280', label: '' }
  return L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${color};border:3px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      font-size:11px;font-weight:bold;color:white;
    ">${label}</div>`,
  })
}

export default function ProfileMapInner({ pins }: { pins: MedalPin[] }) {
  const bounds = useMemo(() => {
    if (pins.length === 0) return null
    const lats = pins.map(p => p.lat)
    const lngs = pins.map(p => p.lng)
    return L.latLngBounds(
      [Math.min(...lats) - 0.02, Math.min(...lngs) - 0.02],
      [Math.max(...lats) + 0.02, Math.max(...lngs) + 0.02],
    )
  }, [pins])

  if (pins.length === 0 || !bounds) return null

  return (
    <div className="rounded-xl overflow-hidden border border-amber-200 shadow-sm relative z-0">
      <MapContainer
        bounds={bounds}
        scrollWheelZoom={false}
        style={{ height: 380, width: '100%' }}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {pins.map(pin => (
          <Marker
            key={pin.id}
            position={[pin.lat, pin.lng]}
            icon={createMedalIcon(pin.medalType)}
          >
            <Popup>
              <div className="text-sm font-semibold">{pin.restaurantName}</div>
              <div className="text-xs text-gray-500">
                {pin.iconEmoji} {pin.categoryName} · {pin.medalType.charAt(0).toUpperCase() + pin.medalType.slice(1)}
              </div>
              {pin.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    [pin.address, pin.city, pin.state].filter(Boolean).join(', ')
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline block mt-1"
                >
                  Get directions &rarr;
                </a>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
