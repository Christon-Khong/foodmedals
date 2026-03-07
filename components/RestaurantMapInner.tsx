'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const pinIcon = L.divIcon({
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
  html: `<div style="
    width:32px;height:32px;border-radius:50%;
    background:#eab308;border:3px solid white;
    box-shadow:0 2px 6px rgba(0,0,0,0.3);
    display:flex;align-items:center;justify-content:center;
    font-size:14px;
  ">📍</div>`,
})

type Props = {
  lat: number
  lng: number
  name: string
  address: string
}

export default function RestaurantMapInner({ lat, lng, name, address }: Props) {
  return (
    <div className="rounded-xl overflow-hidden border border-amber-200 shadow-sm mt-4 relative z-0">
      <MapContainer
        center={[lat, lng]}
        zoom={16}
        scrollWheelZoom={false}
        style={{ height: 200, width: '100%' }}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <Marker position={[lat, lng]} icon={pinIcon}>
          <Popup>
            <div className="text-sm font-medium">{name}</div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${address}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline block mt-1"
            >
              Get directions →
            </a>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
