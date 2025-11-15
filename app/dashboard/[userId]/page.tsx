'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import PatientLocationMap from '@/app/components/PatientLocationMap';
import ReminderInput from '@/app/components/ReminderInput';
import SendRemarkInput from '@/app/components/SendRemarkInput';
import PatientProgressDashboard from '@/app/components/PatientProgressDashboard';
import HomeAddressInput from '@/app/components/HomeAddressInput';
import SpeechToText from '@/app/components/SpeechToText';
import MedicineInput from '@/app/components/MedicineInput';

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/drqhllyex/upload';
const UPLOAD_PRESET = 'ml_default';

export default function Dashboard() {
  const { userId } = useParams();
  const [user, setUser] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', photo: '', relation: '' });
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false); // NEW
  const [isConnecting, setIsConnecting] = useState(false); // NEW

  useEffect(() => {
    const stored = localStorage.getItem('familyUser');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.userId !== userId) {
        window.location.href = '/login';
      } else {
        setUser(parsed);
        // Check if already connected (optional: check backend)
        // For now, assume false unless we store it
      }
    } else {
      window.location.href = '/login';
    }
  }, [userId]);

  const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      uploadToCloudinary(file);
    }
  };

  const uploadToCloudinary = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('public_id', `family_members/${Date.now()}`);

    try {
      const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
      const data = await res.json();
      setNewMember(prev => ({ ...prev, photo: data.secure_url }));
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const addFamilyMember = async () => {
    if (!newMember.name || !newMember.relation || !newMember.photo) {
      alert('Please fill all fields and upload photo');
      return;
    }

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/add-family-member`,
        { userId, ...newMember }
      );
      const updatedUser = { ...user, familyMembers: res.data.familyMembers };
      setUser(updatedUser);
      localStorage.setItem('familyUser', JSON.stringify(updatedUser));
      setNewMember({ name: '', photo: '', relation: '' });
      setPreview(null);
      setShowAddForm(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add');
    }
  };

  const handleConnect = async () => {
    if (!confirm('Connect this family to the patient?\nThis will sync all family data.')) return;

    setIsConnecting(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/connect-family`,
        {
          familyUserId: user.userId,
          patientId: user.patientId,
        }
      );

      if (res.data.success) {
        setIsConnected(true);
        alert('Family connected successfully! Patient can now see your family.');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to connect');
    } finally {
      setIsConnecting(false);
    }
  };

  if (!user) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F1E8', padding: '20px' }}>
      <div className="mx-auto max-w-5xl">

        {/* HEADER: PROFILE + CONNECT BUTTON (TOP RIGHT) */}
        <div className="mb-8 flex items-center justify-between rounded-2xl bg-white p-6 shadow-lg">
          {/* LEFT: Profile */}
          <div className="flex items-center gap-6">
            {user.photo ? (
              <Image
                src={user.photo}
                alt={user.name}
                width={90}
                height={90}
                className="rounded-full border-4 shadow-md"
                style={{ borderColor: '#E8DCC4' }}
              />
            ) : (
              <div
                className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-dashed shadow-md"
                style={{ backgroundColor: '#E8DCC4', borderColor: '#6B5E4C' }}
              >
                <svg className="h-10 w-10" style={{ color: '#6B5E4C' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#6B5E4C' }}>
                {user.name}
              </h1>
              <p className="text-lg" style={{ color: '#8B7355' }}>
                {user.relation} of <strong>{user.patientName}</strong>
              </p>
            </div>
          </div>

          {/* RIGHT: CONNECT / CONNECTED */}
          <div>
            {isConnected ? (
              <div className="flex items-center gap-2 rounded-xl bg-green-100 px-5 py-3 text-green-700 font-medium shadow-sm">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Connected</span>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="group flex items-center gap-2 rounded-xl px-6 py-3 text-white font-semibold shadow-md transition-all duration-200 hover:shadow-lg active:scale-95 disabled:opacity-60"
                style={{ backgroundColor: '#6B5E4C' }}
              >
                {isConnecting ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Connect to Patient</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* FAMILY MEMBERS SECTION */}
        <div className="rounded-2xl bg-white p-6 shadow">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold" style={{ color: '#2C2416' }}>Family Members</h2>
            <button
              onClick={() => setShowAddForm(true)}
              className="rounded-xl px-5 py-3 text-lg font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: '#6B5E4C' }}
            >
              + Add Family Member
            </button>
          </div>

          {/* ADD FORM */}
          {showAddForm && (
            <div className="mb-6 rounded-xl border-2 border-dashed p-5" style={{ borderColor: '#E8DCC4', backgroundColor: '#F9F6F0' }}>
              <h3 className="mb-4 text-lg font-semibold" style={{ color: '#2C2416' }}>Add New Member</h3>
              <div className="space-y-4">
                <input
                  placeholder="Name"
                  value={newMember.name}
                  onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                  className="w-full rounded-xl border px-4 py-3"
                  style={{ borderColor: '#E8DCC4', backgroundColor: '#FFFFFF' }}
                />
                <input
                  placeholder="Relation (e.g., Brother)"
                  value={newMember.relation}
                  onChange={e => setNewMember({ ...newMember, relation: e.target.value })}
                  className="w-full rounded-xl border px-4 py-3"
                  style={{ borderColor: '#E8DCC4', backgroundColor: '#FFFFFF' }}
                />
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer">
                    {preview ? (
                      <Image src={preview} alt="Preview" width={80} height={80} className="rounded-xl" />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed" style={{ backgroundColor: '#E8DCC4', borderColor: '#6B5E4C' }}>
                        <svg className="h-8 w-8" style={{ color: '#6B5E4C' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                  {uploading && <span className="text-sm" style={{ color: '#6B5E4C' }}>Uploading...</span>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addFamilyMember}
                    disabled={uploading}
                    className="rounded-xl px-4 py-2 text-white transition"
                    style={{ backgroundColor: '#6B5E4C', opacity: uploading ? 0.6 : 1 }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewMember({ name: '', photo: '', relation: '' });
                      setPreview(null);
                    }}
                    className="rounded-xl bg-gray-400 px-4 py-2 text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FAMILY GRID */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {user.familyMembers?.length === 0 ? (
              <p className="col-span-full py-8 text-center" style={{ color: '#999' }}>No family members added yet.</p>
            ) : (
              user.familyMembers?.map((member: any, i: number) => (
                <div key={i} className="rounded-xl p-4 text-center shadow" style={{ backgroundColor: '#FFFFFF' }}>
                  {member.photo ? (
                    <Image src={member.photo} alt={member.name} width={80} height={80} className="mx-auto mb-3 rounded-full" />
                  ) : (
                    <div className="mx-auto mb-3 h-20 w-20 rounded-full" style={{ backgroundColor: '#E8DCC4' }} />
                  )}
                  <h3 className="text-lg font-semibold" style={{ color: '#2C2416' }}>{member.name}</h3>
                  <p className="text-sm" style={{ color: '#6B5E4C' }}>{member.relation}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {user?.patientId && (
  <HomeAddressInput
    patientId={user.patientId}
    familyUserId={user.userId}
  />
)}



        // After ReminderInput
{user?.patientId && (
  <>
    <PatientLocationMap patientId={user.patientId} />
    <div className="mt-8 grid gap-6 md:grid-cols-2">
    {/* REMINDER INPUT — CENTERED */}
    <div className="rounded-2xl bg-white p-6 shadow flex items-center justify-center">
      <div className="w-full max-w-md">
        <ReminderInput
          familyUserId={user.userId}
          patientId={user.patientId}
        />
        <MedicineInput familyUserId={user.userId}
          patientId={user.patientId}/>
      </div>
    </div>

    {/* SEND REMARK INPUT — TOP-ALIGNED (UNCHANGED) */}
    <div className="rounded-2xl bg-white p-6 shadow">
      <SendRemarkInput
        familyUserId={user.userId}
        patientId={user.patientId}
        familyUser={{
          userId: user.userId,
          name: user.name,
          relation: user.relation,
          photo: user.photo,
          familyMembers: user.familyMembers || []
        }}
      />
    </div>
  </div>
  </>
)}

        {/* PROGRESS DASHBOARD */}
{user?.patientId && (
  <PatientProgressDashboard
    patientId={user.patientId}
    familyUserId={user.userId}
  />
)}


{/* <SpeechToText/> */}


        

        {/* Logout */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              localStorage.removeItem('familyUser');
              window.location.href = '/login';
            }}
            style={{ color: '#DC3545' }}
            className="text-lg font-medium hover:underline"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}