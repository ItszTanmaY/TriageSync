'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { UserRole } from '@/lib/auth/types';
import { MOCK_HOSPITALS } from '@/lib/supabase/mock-data';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<UserRole>('citizen');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(MOCK_HOSPITALS[0].id);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const hospitalObj = MOCK_HOSPITALS.find((h) => h.id === selectedHospitalId);

    const res = await register({
      full_name: fullName,
      email,
      password,
      role,
      hospital_id: role === 'hospital_staff' ? selectedHospitalId : undefined,
      hospital_name: role === 'hospital_staff' ? hospitalObj?.name : undefined,
    });

    setIsLoading(false);

    if (res.success) {
      if (role === 'hospital_staff') router.push('/hospital/dashboard');
      else if (role === 'paramedic') router.push('/incident/new');
      else if (role === 'dispatcher') router.push('/command');
      else router.push('/medpass');
    } else {
      setError(res.error || 'Registration failed');
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-white/[0.08] pb-6">
        <div className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">
          ACCOUNT CREATION / ROLE-SCOPED ACCESS
        </div>
        <h1 className="text-3xl font-normal text-white tracking-tight">
          Register Account
        </h1>
        <p className="text-xs text-zinc-400">
          Create a role-scoped profile tailored for citizens, hospital clinical staff, paramedics, or dispatchers.
        </p>
      </div>

      {/* Form Card */}
      <div className="p-6 sm:p-8 rounded-2xl tactile-panel border border-white/20 bg-[#08080c] shadow-2xl space-y-6">
        {error && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 font-mono text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 font-mono text-xs">
          {/* 1. Role Selection Grid */}
          <div className="space-y-2">
            <label className="text-zinc-400 uppercase tracking-wider block">
              Select Your Role in the Emergency System
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  id: 'citizen' as UserRole,
                  title: 'Citizen / Patient',
                  desc: 'Generate MedPass QR card, emergency contacts & allergy record.',
                  color: 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300',
                },
                {
                  id: 'hospital_staff' as UserRole,
                  title: 'Hospital ER Staff / Doctor',
                  desc: 'Manage ER bed steppers, equipment toggles & pre-arrival alerts.',
                  color: 'border-cyan-500/50 bg-cyan-950/20 text-cyan-300',
                },
                {
                  id: 'paramedic' as UserRole,
                  title: 'EMS Paramedic / Fleet',
                  desc: 'Rapid field triage SOS, hands-free voice SBAR handover.',
                  color: 'border-amber-500/50 bg-amber-950/20 text-amber-300',
                },
                {
                  id: 'dispatcher' as UserRole,
                  title: 'City Dispatcher',
                  desc: 'Municipal tactical command, QueuePredict load balancing.',
                  color: 'border-purple-500/50 bg-purple-950/20 text-purple-300',
                },
              ].map((item) => {
                const isSelected = role === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRole(item.id)}
                    className={`touch-target p-4 rounded-xl text-left border transition-all ${
                      isSelected
                        ? `bg-zinc-900 border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.15)] ring-1 ring-white/30`
                        : 'bg-zinc-950 border-white/10 text-zinc-400 hover:border-white/25'
                    }`}
                  >
                    <div className="font-bold text-white text-xs mb-1 flex items-center justify-between">
                      <span>{item.title}</span>
                      {isSelected && <span className="text-[#00E599]">●</span>}
                    </div>
                    <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
                      {item.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Hospital Facility Selection (Only for Hospital Staff) */}
          {role === 'hospital_staff' && (
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/40 space-y-2 animate-in fade-in">
              <label className="text-cyan-300 uppercase tracking-wider block font-bold text-[11px]">
                Hospital Facility Affiliation (HD-1)
              </label>
              <select
                value={selectedHospitalId}
                onChange={(e) => setSelectedHospitalId(e.target.value)}
                className="touch-target w-full px-4 py-3 bg-zinc-950 border border-cyan-500/40 focus:border-cyan-400 rounded-xl text-white outline-none"
              >
                {MOCK_HOSPITALS.map((hosp) => (
                  <option key={hosp.id} value={hosp.id}>
                    {hosp.name} (Level {hosp.level} Trauma Center)
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-zinc-400 block pt-1 font-sans">
                Your login will grant real-time authorization to update bed counts and receive inbound RED alerts for this specific facility.
              </span>
            </div>
          )}

          {/* 3. Credentials */}
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-zinc-400 uppercase tracking-wider block">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder={role === 'hospital_staff' ? 'Dr. Priya Nair' : 'Asha Kulkarni'}
                className="touch-target w-full px-4 py-3 bg-zinc-950 border border-white/15 focus:border-white/40 rounded-xl text-white outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-400 uppercase tracking-wider block">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@organization.in"
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
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isLoading}
              className="touch-target w-full py-3.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Creating Account...' : 'Complete Registration'}</span>
              <span>→</span>
            </button>
          </div>
        </form>

        <div className="pt-2 text-center font-mono text-xs text-zinc-400 border-t border-white/10">
          <span>Already have an account? </span>
          <Link href="/login" className="text-white underline hover:text-zinc-300 font-semibold">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
