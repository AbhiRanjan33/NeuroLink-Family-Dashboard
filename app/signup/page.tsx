'use client';
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/drqhllyex/upload';
const UPLOAD_PRESET = 'ml_default';

export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', email: '', password: '', photo: '', relation: '', patientEmail: '', phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

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
    formData.append('public_id', `family/${Date.now()}`);

    try {
      const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
      const data = await res.json();
      setForm(prev => ({ ...prev, photo: data.secure_url }));
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!form.photo) {
      alert('Please upload a photo');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/family-signup`,
        form
      );
      const { userId } = res.data;
      router.push(`/dashboard/${userId}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6" style={{ backgroundColor: '#F5F1E8' }}>
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-center text-3xl font-semibold" style={{ color: '#2C2416' }}>Family Signup</h1>

        {/* PHOTO UPLOAD */}
        <div className="flex flex-col items-center">
          <label className="cursor-pointer">
            {preview ? (
              <div className="relative">
                <Image src={preview} alt="Preview" width={120} height={120} className="rounded-full object-cover border-4" style={{ borderColor: '#E8DCC4' }} />
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-50">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-dashed" style={{ backgroundColor: '#E8DCC4', borderColor: '#6B5E4C' }}>
                <svg className="h-12 w-12" style={{ color: '#6B5E4C' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
          <p className="mt-2 text-sm" style={{ color: '#6B5E4C' }}>Upload Profile Photo</p>
        </div>

        {/* INPUTS */}
        {['name', 'email', 'phone', 'password', 'relation', 'patientEmail'].map((field) => (
          <input
            key={field}
            type={field.includes('email') ? 'email' : field === 'password' ? 'password' : field === 'phone' ? 'tel' : 'text'}
            placeholder={field === 'patientEmail' ? "Patient's Email" : field.charAt(0).toUpperCase() + field.slice(1).replace('Email', ' Email')}
            required
            className="w-full rounded-2xl border px-5 py-4 text-base"
            style={{ borderColor: '#E8DCC4', backgroundColor: '#FFFFFF', color: '#2C2416' }}
            onChange={e => setForm({ ...form, [field]: e.target.value })}
          />
        ))}

        <button
          type="submit"
          disabled={loading || uploading}
          className="w-full rounded-2xl py-4 text-lg font-semibold text-white transition"
          style={{ backgroundColor: '#6B5E4C', opacity: (loading || uploading) ? 0.6 : 1 }}
        >
          {loading ? 'Creating...' : 'Create Dashboard'}
        </button>

        <p className="text-center text-sm">
          Have an account? <Link href="/login" style={{ color: '#6B5E4C' }} className="font-semibold hover:underline">Login</Link>
        </p>
      </form>
    </div>
  );
}