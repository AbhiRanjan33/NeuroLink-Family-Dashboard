// components/PatientLocationMap.tsx
'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false });

interface PatientLocationMapProps {
  patientId: string;
}

export default function PatientLocationMap({ patientId }: PatientLocationMapProps) {
  const [patientLoc, setPatientLoc] = useState<{ lat: number; lng: number; updatedAt: string } | null>(null);
  const [homeLoc, setHomeLoc] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);

  // FETCH PATIENT + HOME
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locRes, homeRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/get-patient-location?patientId=${patientId}`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/get-patient-home?patientId=${patientId}`)
        ]);

        const locData = await locRes.json();
        const homeData = await homeRes.json();

        if (locData.success && locData.location?.coordinates) {
          const [lng, lat] = locData.location.coordinates;
          setPatientLoc({
            lat,
            lng,
            updatedAt: new Date(locData.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          });
        }

        if (homeData.success && homeData.homeLocation?.coordinates) {
          const [lng, lat] = homeData.homeLocation.coordinates;
          setHomeLoc({
            lat,
            lng,
            address: homeData.homeAddress || 'Home'
          });
        }
      } catch (err) {
        console.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [patientId]);

  // FETCH ROUTE
  const fetchRoute = async () => {
    if (!patientLoc || !homeLoc) return;
    setRouteLoading(true);

    try {
      const res = await fetch(
        `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${process.env.NEXT_PUBLIC_ORS_API_KEY}&start=${patientLoc.lng},${patientLoc.lat}&end=${homeLoc.lng},${homeLoc.lat}`
      );
      const data = await res.json();
      if (data.features?.[0]) {
        setRoute(data.features[0]);
      }
    } catch (err) {
      console.error('Route error');
    } finally {
      setRouteLoading(false);
    }
  };

  useEffect(() => {
    if (patientLoc && homeLoc) fetchRoute();
  }, [patientLoc, homeLoc]);

  if (loading) {
    return (
      <div className="mt-6 rounded-2xl bg-white p-6 shadow text-center">
        <p style={{ color: '#6B5E4C' }}>Loading location & route...</p>
      </div>
    );
  }

  if (!patientLoc) {
    return (
      <div className="mt-6 rounded-2xl bg-white p-6 shadow text-center">
        <p style={{ color: '#DC3545' }}>No patient location</p>
      </div>
    );
  }

  const distance = route?.properties?.segments?.[0]?.distance
    ? `${(route.properties.segments[0].distance / 1000).toFixed(1)} km`
    : '—';
  const duration = route?.properties?.segments?.[0]?.duration
    ? `${Math.round(route.properties.segments[0].duration / 60)} min`
    : '—';

  return (
    <div className="mt-6 rounded-2xl bg-white p-6 shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold" style={{ color: '#2C2416' }}>
          Patient → Home Route
        </h2>
        <button
          onClick={fetchRoute}
          disabled={routeLoading}
          className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold text-sm"
        >
          {routeLoading ? 'Loading...' : 'Refresh Route'}
        </button>
      </div>

      <div className="mb-3 flex gap-4 text-sm" style={{ color: '#6B5E4C' }}>
        <span>Last updated: <strong>{patientLoc.updatedAt}</strong></span>
        <span>Distance: <strong>{distance}</strong></span>
        <span>ETA: <strong>{duration}</strong></span>
      </div>

      <div style={{ height: '450px', borderRadius: '16px', overflow: 'hidden' }}>
        <MapComponent
          patientLat={patientLoc.lat}
          patientLng={patientLoc.lng}
          homeLat={homeLoc?.lat}
          homeLng={homeLoc?.lng}
          homeAddress={homeLoc?.address}
          route={route}
        />
      </div>
    </div>
  );
}