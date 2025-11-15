'use client';
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/family-login`,
        { email, password }
      );
      const { familyUser } = res.data;
      localStorage.setItem('familyUser', JSON.stringify(familyUser));
      router.push(`/dashboard/${familyUser.userId}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6" style={{ backgroundColor: '#F5F1E8' }}>
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-center text-3xl font-semibold" style={{ color: '#2C2416' }}>Family Login</h1>
        
        <input
          type="email"
          placeholder="Email"
          required
          className="w-full rounded-2xl border px-5 py-4 text-base"
          style={{ borderColor: '#E8DCC4', backgroundColor: '#FFFFFF', color: '#2C2416' }}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          required
          className="w-full rounded-2xl border px-5 py-4 text-base"
          style={{ borderColor: '#E8DCC4', backgroundColor: '#FFFFFF', color: '#2C2416' }}
          onChange={e => setPassword(e.target.value)}
        />
        
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl py-4 text-lg font-semibold text-white transition"
          style={{ backgroundColor: '#6B5E4C', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        
        <p className="text-center text-sm">
          New here? <Link href="/signup" style={{ color: '#6B5E4C' }} className="font-semibold hover:underline">Sign Up</Link>
        </p>
      </form>
    </div>
  );
}