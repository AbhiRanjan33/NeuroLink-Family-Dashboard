// components/MedicineInput.tsx
'use client';
import { useState, useEffect } from 'react';
import { Clock, Pill } from 'lucide-react';

interface Props {
  familyUserId: string;
  patientId: string;
}

interface MedTimes {
  'Medicine 1'?: string;
  'Medicine 2'?: string;
}

export default function MedicineInput({ familyUserId, patientId }: Props) {
  const [med1Time, setMed1Time] = useState('');
  const [med2Time, setMed2Time] = useState('');
  const [savedTimes, setSavedTimes] = useState<MedTimes>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Format time: "08:30" → "8:30 AM"
  const formatTime = (time: string) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  // FETCH today’s saved meds
  const fetchSavedMeds = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/get-today-medications?patientId=${patientId}`
      );
      const data = await res.json();
      if (data.success) {
        setSavedTimes(data.medications);
        // Pre-fill inputs if not already set
        if (data.medications['Medicine 1'] && !med1Time) {
          setMed1Time(data.medications['Medicine 1']);
        }
        if (data.medications['Medicine 2'] && !med2Time) {
          setMed2Time(data.medications['Medicine 2']);
        }
      }
    } catch (err) {
      console.error('Failed to load meds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedMeds();
    const interval = setInterval(fetchSavedMeds, 30_000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [patientId]);

  const saveMedications = async () => {
    if (!med1Time && !med2Time) return;

    setSaving(true);
    setSaved(false);

    const meds = [];
    if (med1Time) meds.push({ name: 'Medicine 1', time: med1Time });
    if (med2Time) meds.push({ name: 'Medicine 2', time: med2Time });

    try {
      for (const med of meds) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/add-medication`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            familyUserId,
            patientId,
            name: med.name,
            time: med.time,
          }),
        });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      await fetchSavedMeds(); // Refresh display
    } catch (err) {
      alert('Failed to save medicines');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 rounded-2xl bg-white p-6 shadow-lg">
      <h2 className="mb-5 text-2xl font-bold text-center flex items-center justify-center gap-2" style={{ color: '#2C2416' }}>
        <Pill size={28} />
        Add Today&apos;s Medicines
      </h2>

      {loading ? (
        <p className="text-center text-sm text-gray-500">Loading saved times...</p>
      ) : (
        <div className="space-y-5">
          {/* Medicine 1 */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#6B5E4C' }}>
              Medicine 1
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="time"
                  value={med1Time}
                  onChange={(e) => setMed1Time(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 text-base"
                  style={{
                    borderColor: '#E8DCC4',
                    backgroundColor: '#FFFFFF',
                    color: '#000000'
                  }}
                />
              </div>
              {savedTimes['Medicine 1'] && (
                <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                  <Clock size={14} />
                  {formatTime(savedTimes['Medicine 1'])}
                </div>
              )}
            </div>
          </div>

          {/* Medicine 2 */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#6B5E4C' }}>
              Medicine 2
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="time"
                  value={med2Time}
                  onChange={(e) => setMed2Time(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 text-base"
                  style={{
                    borderColor: '#E8DCC4',
                    backgroundColor: '#FFFFFF',
                    color: '#000000'
                  }}
                />
              </div>
              {savedTimes['Medicine 2'] && (
                <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                  <Clock size={14} />
                  {formatTime(savedTimes['Medicine 2'])}
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={saveMedications}
            disabled={saving || (!med1Time && !med2Time)}
            className="w-full mt-4 rounded-xl px-6 py-3.5 font-bold text-white transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"
            style={{
              background: saving || (!med1Time && !med2Time)
                ? '#ccc'
                : 'linear-gradient(to right, #8B5CF6, #6D28D9)',
              boxShadow: saving || (!med1Time && !med2Time) ? 'none' : '0 4px 12px rgba(139, 92, 246, 0.3)'
            }}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : saved ? (
              'Saved!'
            ) : (
              <>
                <Pill size={18} />
                Save Medicines
              </>
            )}
          </button>

          {/* Success */}
          {saved && (
            <p className="mt-3 text-center text-sm font-medium text-green-600 animate-pulse">
              Medicines saved for today!
            </p>
          )}
        </div>
      )}
    </div>
  );
}