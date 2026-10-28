'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { UserRole } from '@/lib/auth/types';

export function UserNav() {
  const { user, logout, switchUser } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center gap-2 font-mono text-xs">
        <Link
          href="/login"
          className="touch-target px-3 py-1.5 text-zinc-400 hover:text-white transition-colors"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className="touch-target px-3.5 py-1.5 rounded-lg bg-white text-black font-semibold hover:bg-zinc-200 transition-colors"
        >
          Register
        </Link>
      </div>
    );
  }

  const roleMeta: Record<
    UserRole,
    { label: string; pipColor: string; badgeClass: string; primaryLink: string; linkText: string }
  > = {
    citizen: {
      label: 'Citizen',
      pipColor: 'bg-[#00E599]',
      badgeClass: 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400',
      primaryLink: '/medpass',
      linkText: 'My MedPass Card',
    },
    hospital_staff: {
      label: user.hospital_name ? `ER • ${user.hospital_name.split(' ')[0]}` : 'ER Staff',
      pipColor: 'bg-[#00E5FF]',
      badgeClass: 'bg-cyan-950/60 border-cyan-500/30 text-cyan-300',
      primaryLink: '/hospital/dashboard',
      linkText: 'ER Staff Radar',
    },
    paramedic: {
      label: user.badge_number ? `EMS • ${user.badge_number}` : 'Paramedic',
      pipColor: 'bg-amber-400',
      badgeClass: 'bg-amber-950/60 border-amber-500/30 text-amber-300',
      primaryLink: '/incident/new',
      linkText: 'Field Incident SOS',
    },
    dispatcher: {
      label: 'Dispatch',
      pipColor: 'bg-purple-400',
      badgeClass: 'bg-purple-950/60 border-purple-500/30 text-purple-300',
      primaryLink: '/command',
      linkText: 'City Command Map',
    },
  };

  const meta = roleMeta[user.role];

  return (
    <div className="relative" ref={menuRef}>
      {/* Account Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="touch-target flex items-center gap-2.5 px-3 py-1.5 rounded-xl tactile-panel hover:border-white/30 transition-all font-mono text-xs"
        aria-label="User Account Menu"
      >
        <div className="w-5 h-5 rounded-full bg-zinc-800 border border-white/20 flex items-center justify-center text-[10px] text-white font-bold">
          {user.full_name.charAt(0).toUpperCase()}
        </div>

        <span className="text-white font-medium max-w-[120px] truncate hidden md:inline">
          {user.full_name}
        </span>

        {/* Role Badge */}
        <span
          className={`px-2 py-0.5 rounded-md border text-[10px] uppercase font-semibold flex items-center gap-1.5 ${meta.badgeClass}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${meta.pipColor}`} />
          <span>{meta.label}</span>
        </span>
      </button>

      {/* Account Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 p-3 rounded-2xl tactile-panel border border-white/20 bg-[#08080c] shadow-2xl z-50 font-mono text-xs space-y-3 animate-in fade-in zoom-in-95 duration-150">
          {/* User Profile Header */}
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-white/10 space-y-1">
            <div className="text-white font-medium text-sm truncate">{user.full_name}</div>
            <div className="text-zinc-500 text-[11px] truncate">{user.email}</div>
            {user.hospital_name && (
              <div className="text-cyan-400 text-[10px] pt-1">
                Hospital: {user.hospital_name}
              </div>
            )}
          </div>

          {/* Role Direct Action Link */}
          <div>
            <Link
              href={meta.primaryLink}
              onClick={() => setIsOpen(false)}
              className="touch-target w-full py-2 px-3 rounded-lg bg-white/10 hover:bg-white text-white hover:text-black font-semibold flex items-center justify-between transition-colors text-xs uppercase"
            >
              <span>{meta.linkText}</span>
              <span>→</span>
            </Link>
          </div>

          {/* Quick Demo Role Switcher for Hackathon Evaluators */}
          <div className="space-y-1.5 pt-1 border-t border-white/10">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block px-1">
              Quick Role Switch (Demo Mode)
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  switchUser('citizen');
                  setIsOpen(false);
                }}
                className={`p-2 rounded-lg text-left border transition-colors ${
                  user.role === 'citizen'
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 font-bold'
                    : 'bg-zinc-950/60 border-white/[0.08] text-zinc-400 hover:text-white'
                }`}
              >
                Citizen (Asha)
              </button>

              <button
                type="button"
                onClick={() => {
                  switchUser('hospital_staff');
                  setIsOpen(false);
                }}
                className={`p-2 rounded-lg text-left border transition-colors ${
                  user.role === 'hospital_staff'
                    ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300 font-bold'
                    : 'bg-zinc-950/60 border-white/[0.08] text-zinc-400 hover:text-white'
                }`}
              >
                ER Staff (Sahyadri)
              </button>

              <button
                type="button"
                onClick={() => {
                  switchUser('paramedic');
                  setIsOpen(false);
                }}
                className={`p-2 rounded-lg text-left border transition-colors ${
                  user.role === 'paramedic'
                    ? 'bg-amber-950/80 border-amber-500/50 text-amber-300 font-bold'
                    : 'bg-zinc-950/60 border-white/[0.08] text-zinc-400 hover:text-white'
                }`}
              >
                Paramedic (Apex)
              </button>

              <button
                type="button"
                onClick={() => {
                  switchUser('dispatcher');
                  setIsOpen(false);
                }}
                className={`p-2 rounded-lg text-left border transition-colors ${
                  user.role === 'dispatcher'
                    ? 'bg-purple-950/80 border-purple-500/50 text-purple-300 font-bold'
                    : 'bg-zinc-950/60 border-white/[0.08] text-zinc-400 hover:text-white'
                }`}
              >
                City Dispatch
              </button>
            </div>
          </div>

          {/* Sign Out */}
          <div className="pt-1 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="w-full text-left px-2 py-1.5 text-zinc-500 hover:text-red-400 text-xs transition-colors"
            >
              Sign Out of Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
