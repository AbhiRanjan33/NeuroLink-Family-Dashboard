// components/HomeAddressInput.tsx
'use client';
import { useState, useEffect } from 'react';

interface Props {
  patientId: string;
  familyUserId: string;
}

export default function HomeAddressInput({ patientId, familyUserId }: Props) {
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [existingAddress, setExistingAddress] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch existing home address on mount
  useEffect(() => {
    const fetchHomeAddress = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/get-patient-home?patientId=${patientId}`
        );
        const data = await res.json();

        if (data.success && data.homeAddress) {
          setExistingAddress(data.homeAddress);
          setAddress(data.homeAddress);
          setUpdatedAt(data.updatedAt ? new Date(data.updatedAt).toLocaleString() : null);
        }
      } catch (err) {
        console.error('Failed to load home address:', err);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) fetchHomeAddress();
  }, [patientId]);

  const save = async () => {
    const trimmed = address.trim();
    if (!trimmed) return;

    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/save-home-address`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: trimmed, patientId, familyUserId }),
      });
      const data = await res.json();

      if (data.success) {
        setExistingAddress(trimmed);
        setUpdatedAt(new Date().toLocaleString());
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert(data.error || 'Failed to save');
      }
    } catch (err) {
      alert('Error saving address');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl border-2 border-green-300">
      <label className="block text-sm font-bold text-green-800 mb-2">
        Set Home Address
      </label>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="e.g., 123 Main St, Mumbai, India"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && save()}
          className="flex-1 px-4 py-2 border border-green-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black placeholder-gray-500"
          disabled={saving}
        />
        <button
          onClick={save}
          disabled={saving || !address.trim() || address.trim() === existingAddress}
          className={`px-6 py-2 rounded-lg font-bold text-white transition-all min-w-[100px] ${
            saving || !address.trim() || address.trim() === existingAddress
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700'
          }`}
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
        </button>
      </div>

      <p className="text-xs text-green-700 mt-2">
        We convert your address to GPS coordinates automatically
      </p>

      {/* Show existing address */}
      {loading ? (
        <p className="text-xs text-gray-500 mt-3 italic">Loading address...</p>
      ) : existingAddress ? (
        <div className="mt-3 p-3 bg-white/70 rounded-lg border border-green-200">
          <p className="text-xs font-semibold text-green-800">Current Home Address:</p>
          <p className="text-sm text-gray-800 mt-1">{existingAddress}</p>
          {updatedAt && (
            <p className="text-xs text-gray-500 mt-1">
              Updated: {updatedAt}
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-500 mt-3 italic">No home address set yet</p>
      )}
    </div>
  );
}