'use client'

import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { LeaderboardRow } from '@/lib/queries'
import 'leaflet/dist/leaflet.css'

const MEDAL_COLORS: Record<number, { color: string; label: string }> = {
  0: { color: '#eab308', label: '1st' },  // gold/yellow
  1: { color: '#9ca3af', label: '2nd' },  // silver/gray
  2: { color: '#d97706', label: '3rd' },  // bronze/amber
}

function createIcon(index: number) {
  const { color, label } = MEDAL_COLORS[index] ?? { color: '#6b7280', label: '' }
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

export default function LeaderboardMapInner({ rows, ranks }: { rows: LeaderboardRow[]; ranks?: number[] }) {
  const mappableRows = useMemo(
    () => rows.filter(r => r.lat != null && r.lng != null),
    [rows],
  )

  const bounds = useMemo(() => {
    if (mappableRows.length === 0) return null
    const lats = mappableRows.map(r => r.lat!)
    const lngs = mappableRows.map(r => r.lng!)
    return L.latLngBounds(
      [Math.min(...lats) - 0.02, Math.min(...lngs) - 0.02],
      [Math.max(...lats) + 0.02, Math.max(...lngs) + 0.02],
    )
  }, [mappableRows])

  if (mappableRows.length === 0 || !bounds) return null

  return (
    <div className="rounded-xl overflow-hidden border border-amber-200 shadow-sm mb-4 relative z-0">
      <MapContainer
        bounds={bounds}
        scrollWheelZoom={false}
        style={{ height: 260, width: '100%' }}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {mappableRows.map((row, i) => {
          // Find this row's index in the original rows array to get its rank
          const origIndex = rows.indexOf(row)
          const rank = ranks?.[origIndex] ?? (i + 1)
          return (
          <Marker
            key={row.restaurantId}
            position={[row.lat!, row.lng!]}
            icon={createIcon(rank - 1)}
          >
            <Popup>
              <div className="text-sm font-medium">{row.restaurantName}</div>
              <div className="text-xs text-gray-500">Score: {row.totalScore}</div>
              {row.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    [row.address, row.city, row.state].filter(Boolean).join(', ')
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline block mt-1"
                >
                  {[row.address, row.city].filter(Boolean).join(', ')} →
                </a>
              )}
            </Popup>
          </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
