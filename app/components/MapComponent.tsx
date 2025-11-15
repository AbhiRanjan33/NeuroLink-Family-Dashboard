// components/MapComponent.tsx
'use client';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
};

interface MapComponentProps {
  patientLat: number;
  patientLng: number;
  homeLat?: number;
  homeLng?: number;
  homeAddress?: string;
  route?: any;
}

export default function MapComponent({
  patientLat,
  patientLng,
  homeLat,
  homeLng,
  homeAddress,
  route,
}: MapComponentProps) {
  useEffect(() => {
    fixLeafletIcons();
  }, []);

  const patientPos: [number, number] = [patientLat, patientLng];
  const homePos: [number, number] | undefined = homeLat && homeLng ? [homeLat, homeLng] : undefined;

  const routeCoords: [number, number][] = route?.geometry?.coordinates
    ? route.geometry.coordinates.map((c: number[]) => [c[1], c[0]])
    : [];

  const center = homePos ? [(patientLat + homeLat) / 2, (patientLng + homeLng) / 2] : patientPos;

  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
      />

      {/* PATIENT MARKER */}
      <Marker position={patientPos}>
        <Popup>
          <strong>Patient is here</strong>
          <br />
          Live location
        </Popup>
      </Marker>

      {/* HOME MARKER */}
      {homePos && (
        <Marker
          position={homePos}
          icon={L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color:#10b981; width:28px; height:28px; border-radius:50%; border:3px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          })}
        >
          <Popup>
            <strong>Home</strong>
            <br />
            {homeAddress}
          </Popup>
        </Marker>
      )}

      {/* ROUTE LINE */}
      {routeCoords.length > 0 && (
        <Polyline
          positions={routeCoords}
          color="#3b82f6"
          weight={6}
          opacity={0.8}
          dashArray="10, 10"
        />
      )}
    </MapContainer>
  );
}