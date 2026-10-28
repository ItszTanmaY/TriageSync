'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectivityIndicator } from '@/components/offline/ConnectivityIndicator';
import { UserNav } from '@/components/auth/UserNav';
import { useAuth } from '@/lib/auth/context';
import {
  Menu,
  X,
  ShieldCheck,
  Activity,
  Flame,
  Radio,
  Share2,
  Scan,
  User,
  LogOut,
  ChevronRight,
} from 'lucide-react';

export function ResponsiveNavbar() {
  const pathname = usePathname();
  const { user, logout, switchUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    {
      href: '/s/tok_asha_k_9901',
      label: 'Bystander Scan',
      sub: 'Emergency QR Identity',
      icon: Scan,
    },
    {
      href: '/medpass',
      label: 'MedPass',
      sub: 'Offline Ed25519 Card',
      icon: ShieldCheck,
    },
    {
      href: '/hospital/dashboard',
      label: 'ER Radar',
      sub: 'Hospital Resources & SBAR',
      icon: Activity,
    },
    {
      href: '/command',
      label: 'Command',
      sub: 'City Fleet & QueuePredict',
      icon: Radio,
    },
    {
      href: '/peer',
      label: 'Mesh Relay',
      sub: 'Store-and-Forward P2P',
      icon: Share2,
    },
    {
      href: '/incident/new',
      label: 'SOS Dispatch',
      sub: 'Rapid Field Reporting',
      icon: Flame,
      highlight: true,
    },
  ];

  return (
    <>
      {/* Sticky Frosted Header */}
      <header className="sticky top-0 z-50 navbar-blur px-4 sm:px-6 py-3 transition-all border-b border-white/15">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Brand Logo & Telemetry Indicator */}
          <Link
            href="/"
            className="flex items-center gap-3 touch-target focus:outline-none focus:ring-1 focus:ring-white/40 rounded-lg group shrink-0"
            aria-label="TriageSync 2.0 Home"
          >
            <span className="telemetry-pip bg-[#00E599] shadow-[0_0_8px_#00E599]" />
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-xs font-semibold tracking-wider text-white uppercase">
                TriageSync
              </span>
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest hidden sm:inline">
                / MEDPASS 2.0
              </span>
            </div>
          </Link>

          {/* Desktop Navigation (>= 768px md) */}
          <div className="hidden md:flex items-center gap-2 sm:gap-4">
            <nav className="flex items-center gap-1 sm:gap-2 font-mono text-[11px] tracking-wider uppercase">
              <Link
                href="/medpass"
                className={`touch-target px-2.5 py-1.5 transition-colors ${
                  pathname === '/medpass' ? 'text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                MedPass
              </Link>
              <Link
                href="/hospital/dashboard"
                className={`touch-target px-2.5 py-1.5 transition-colors ${
                  pathname === '/hospital/dashboard' ? 'text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                ER Radar
              </Link>
              <Link
                href="/command"
                className={`touch-target px-2.5 py-1.5 transition-colors ${
                  pathname === '/command' ? 'text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Command
              </Link>
              <Link
                href="/peer"
                className={`touch-target px-2.5 py-1.5 transition-colors ${
                  pathname === '/peer' ? 'text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Mesh Relay
              </Link>
              <Link
                href="/incident/new"
                className="touch-target px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white text-white hover:text-black transition-all font-semibold"
              >
                SOS
              </Link>
            </nav>

            {/* Realtime Outbox & Connectivity Indicator (RL-7) */}
            <div className="pl-2 border-l border-white/[0.08]">
              <ConnectivityIndicator />
            </div>

            {/* Role-Scoped User Navigation & Quick Switcher */}
            <div className="pl-2 border-l border-white/[0.08]">
              <UserNav />
            </div>
          </div>

          {/* Mobile Actions (< 768px) */}
          <div className="flex md:hidden items-center gap-2">
            {/* Quick Mobile SOS Button */}
            <Link
              href="/incident/new"
              className="touch-target px-3 py-1.5 rounded-lg bg-[#FF2A44] hover:bg-[#ff1430] text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm"
              aria-label="Launch Emergency Incident"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>SOS</span>
            </Link>

            {/* Hamburger Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="touch-target w-11 h-11 rounded-xl bg-zinc-950 border border-white/20 hover:border-white/40 text-white flex items-center justify-center transition-all focus:outline-none focus:ring-1 focus:ring-white/40"
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <Menu className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay & Slide-down Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[57px] z-40 bg-black/85 backdrop-blur-xl md:hidden overflow-y-auto animate-in fade-in duration-200">
          <div className="p-4 sm:p-6 space-y-6 max-w-lg mx-auto pb-24">
            {/* 1. User Session & Quick Role Switcher on Mobile */}
            <div className="p-4 rounded-2xl tactile-panel border border-white/20 bg-[#08080c] space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/20 flex items-center justify-center text-xs text-white font-bold">
                    {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="text-white font-bold text-xs">
                      {user?.full_name || 'Guest Citizen'}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate">
                      {user?.email || 'Standalone Session'}
                    </div>
                  </div>
                </div>

                <span className="text-[9px] uppercase px-2 py-0.5 rounded font-bold border border-white/15 bg-zinc-900 text-emerald-400">
                  {user?.role ? user.role.replace('_', ' ') : 'CITIZEN'}
                </span>
              </div>

              {/* Quick 1-Tap Role Demo Switcher on Mobile */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                  Quick Role Switch (Demo Mode)
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      switchUser('citizen');
                      setMobileMenuOpen(false);
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      user?.role === 'citizen'
                        ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 font-bold'
                        : 'bg-zinc-950 border-white/10 text-zinc-400'
                    }`}
                  >
                    Citizen (Asha)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      switchUser('hospital_staff');
                      setMobileMenuOpen(false);
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      user?.role === 'hospital_staff'
                        ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300 font-bold'
                        : 'bg-zinc-950 border-white/10 text-zinc-400'
                    }`}
                  >
                    ER Staff (Sahyadri)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      switchUser('paramedic');
                      setMobileMenuOpen(false);
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      user?.role === 'paramedic'
                        ? 'bg-amber-950/80 border-amber-500/50 text-amber-300 font-bold'
                        : 'bg-zinc-950 border-white/10 text-zinc-400'
                    }`}
                  >
                    Paramedic (Apex)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      switchUser('dispatcher');
                      setMobileMenuOpen(false);
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      user?.role === 'dispatcher'
                        ? 'bg-purple-950/80 border-purple-500/50 text-purple-300 font-bold'
                        : 'bg-zinc-950 border-white/10 text-zinc-400'
                    }`}
                  >
                    City Dispatch
                  </button>
                </div>
              </div>

              {/* Login / Register / Logout Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                {user ? (
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-zinc-500 hover:text-red-400 flex items-center gap-1.5 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-3 w-full justify-between">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-white underline font-semibold"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-1 rounded-lg bg-white text-black font-bold"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Navigation Portals List */}
            <div className="space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 block px-1">
                Emergency System Portals
              </span>

              <div className="space-y-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`touch-target p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                        link.highlight
                          ? 'bg-[#FF2A44]/15 border-[#FF2A44]/40 text-white'
                          : isActive
                          ? 'bg-white/15 border-white text-white font-semibold'
                          : 'bg-zinc-950/80 border-white/15 text-zinc-300 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                            link.highlight
                              ? 'bg-[#FF2A44] border-red-500 text-white'
                              : 'bg-zinc-900 border-white/10 text-zinc-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-sans font-medium text-sm text-white flex items-center gap-1.5">
                            <span>{link.label}</span>
                            {isActive && <span className="text-[#00E599] text-xs font-mono">●</span>}
                          </div>
                          <div className="font-mono text-[11px] text-zinc-500">{link.sub}</div>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-zinc-500" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* 3. Live Connectivity Telemetry Bar */}
            <div className="p-4 rounded-xl tactile-panel border border-white/15 bg-zinc-950/60 flex items-center justify-between font-mono text-xs">
              <span className="text-zinc-500 text-[10px] uppercase">Telemetry Status</span>
              <ConnectivityIndicator />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
