import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6" style={{ backgroundColor: '#F5F1E8' }}>
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-lg">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: '#E8DCC4' }}>
            <svg className="h-10 w-10" style={{ color: '#6B5E4C' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-normal" style={{ color: '#6B5E4C', fontFamily: 'Georgia, serif' }}>NeuroLink</h1>
          <p className="mt-2 text-lg" style={{ color: '#8B7355' }}>Memory Companion</p>
        </div>

        <div className="mt-8 space-y-4">
          <Link
            href="/login"
            className="flex w-full justify-center rounded-2xl px-8 py-4 text-lg font-semibold text-white shadow-sm transition"
            style={{ backgroundColor: '#6B5E4C' }}
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="flex w-full justify-center rounded-2xl border px-8 py-4 text-lg font-semibold shadow-sm transition"
            style={{ borderColor: '#6B5E4C', color: '#6B5E4C', backgroundColor: 'transparent' }}
          >
            Sign Up
          </Link>
        </div>

        <p className="mt-6 text-center text-sm" style={{ color: '#999' }}>
          Secure portal for caregivers
        </p>
      </div>
    </div>
  );
}