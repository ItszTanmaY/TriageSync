'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { DEMO_USERS } from '@/lib/auth/types';

export default function LoginPage() {
  const router = useRouter();
  const { login, switchUser } = useAuth();

  const [email, setEmail] = useState<string>('asha@citizen.medpass.in');
  const [password, setPassword] = useState<string>('password123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      router.push('/');
    } else {
      setError(res.error || 'Invalid credentials');
    }
  };

  const handleQuickDemo = (role: 'citizen' | 'hospital_staff' | 'paramedic' | 'dispatcher') => {
    switchUser(role);
    if (role === 'hospital_staff') router.push('/hospital/dashboard');
    else if (role === 'paramedic') router.push('/incident/new');
    else if (role === 'dispatcher') router.push('/command');
    else router.push('/medpass');
  };

  return (
    <div className="max-w-md mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-white/[0.08] pb-6">
        <div className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">
          SECURE ACCESS / TRIAGESYNC 2.0
        </div>
        <h1 className="text-3xl font-normal text-white tracking-tight">
          Sign In
        </h1>
        <p className="text-xs text-zinc-400">
          Role-scoped access for citizens, hospital ER trauma teams, paramedics, and dispatchers.
        </p>
      </div>

      {/* Form Card */}
      <div className="p-6 sm:p-8 rounded-2xl tactile-panel border border-white/20 bg-[#08080c] shadow-2xl space-y-6">
        {error && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 font-mono text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div className="space-y-1.5">
            <label className="text-zinc-400 uppercase tracking-wider block">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@domain.com"
              className="touch-target w-full px-4 py-3 bg-zinc-950 border border-white/15 focus:border-white/40 rounded-xl text-white outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-zinc-400 uppercase tracking-wider block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="touch-target w-full px-4 py-3 bg-zinc-950 border border-white/15 focus:border-white/40 rounded-xl text-white outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="touch-target w-full py-3.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
              <span>→</span>
            </button>
          </div>
        </form>

        {/* 1-Tap Quick Demo Credentials for Hackathon Judges */}
        <div className="pt-4 border-t border-white/10 space-y-3 font-mono">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest text-center">
            Or Click 1-Tap Role Demo (Instant Sign-in)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            {DEMO_USERS.map((demo) => (
              <button
                key={demo.id}
                type="button"
                onClick={() => handleQuickDemo(demo.role)}
                className="p-3 rounded-xl bg-zinc-950 border border-white/10 hover:border-white/30 text-left space-y-1 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{demo.full_name}</span>
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-semibold ${
                      demo.role === 'citizen'
                        ? 'bg-emerald-950 text-emerald-400'
                        : demo.role === 'hospital_staff'
                        ? 'bg-cyan-950 text-cyan-300'
                        : demo.role === 'paramedic'
                        ? 'bg-amber-950 text-amber-300'
                        : 'bg-purple-950 text-purple-300'
                    }`}
                  >
                    {demo.role.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 truncate">{demo.email}</div>
                {demo.hospital_name && (
                  <div className="text-[9px] text-cyan-400 truncate">
                    @ {demo.hospital_name}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 text-center font-mono text-xs text-zinc-400">
          <span>New to TriageSync? </span>
          <Link href="/register" className="text-white underline hover:text-zinc-300 font-semibold">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
