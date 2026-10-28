'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Shield,
  Activity,
  Ambulance,
  PhoneCall,
  QrCode,
  Radio,
  Mic,
  ChevronRight,
  Flame,
} from 'lucide-react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Close mobile drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Track scroll for enhanced glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/medpass', label: 'MedPass ID', icon: Shield, description: 'Ed25519 Verified Emergency Card' },
    { href: '/hospital/dashboard', label: 'ER Radar', icon: Activity, description: 'Live Trauma Bay & Bed Telemetry' },
    { href: '/command', label: 'Command Center', icon: Radio, description: 'Citywide Fleet Map & QueuePredict' },
    { href: '/incident/inc-demo-01/handover', label: 'Voice Handover', icon: Mic, description: 'SBAR / MIST Hands-Free Telemetry' },
    { href: '/s/tok_asha_k_9901', label: 'Bystander Scan', icon: QrCode, description: 'Offline Public QR Emergency Scan' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200/90 shadow-sm'
          : 'bg-white/80 backdrop-blur-md border-b border-slate-200/60'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 touch-target focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-xl group"
            aria-label="TriageSync 2.0 Emergency Home"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-sky-500/25 group-hover:scale-105 transition-transform">
              <Ambulance className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-sans text-base font-black tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors">
                  TriageSync
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 border border-sky-200">
                  2.0
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 tracking-wider uppercase font-semibold">
                Emergency Dispatch & MedPass
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 font-sans text-sm font-semibold">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`min-h-[48px] px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Sector status indicator */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-bold">PUNE SECTOR 01 • ACTIVE</span>
            </div>

            {/* Prominent Red Emergency CTA */}
            <Link
              href="/incident/new"
              className="min-h-[48px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-500/25 hover:shadow-red-500/40 flex items-center gap-2 active:scale-95 transition-all"
            >
              <Flame className="w-4 h-4 animate-bounce" />
              <span>Report Emergency</span>
            </Link>
          </div>

          {/* Mobile Menu Hamburger Toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              href="/incident/new"
              className="min-h-[48px] px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-red-600/30 active:scale-95 transition-all"
              aria-label="Report Emergency Immediately"
            >
              <Flame className="w-4 h-4" />
              <span>SOS</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="min-h-[48px] min-w-[48px] p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-sky-500"
              aria-label={isOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <X className="w-6 h-6 text-slate-900 transition-transform rotate-90 duration-200" />
              ) : (
                <Menu className="w-6 h-6 text-slate-900 transition-transform duration-200" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu with Smooth Animated Slide & Fade */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out border-b border-slate-200 bg-white/98 backdrop-blur-2xl ${
          isOpen ? 'max-h-[520px] opacity-100 shadow-2xl' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="px-4 pt-3 pb-6 space-y-2">
          {/* Status banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-800">Dispatch Network Online</span>
            </div>
            <span className="text-[11px] font-bold text-sky-600">Pune Metro</span>
          </div>

          {/* Links List */}
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`min-h-[54px] p-3 rounded-xl flex items-center justify-between transition-all ${
                  isActive
                    ? 'bg-sky-50 text-sky-800 border border-sky-200 font-bold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isActive ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">{link.label}</div>
                    <div className="text-[11px] text-slate-500">{link.description}</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            );
          })}

          {/* Large Mobile Emergency CTA Button */}
          <div className="pt-2">
            <Link
              href="/incident/new"
              className="min-h-[52px] w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-bold text-sm tracking-wide uppercase shadow-lg shadow-red-600/30 flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all"
            >
              <PhoneCall className="w-5 h-5 animate-bounce" />
              <span>Dispatch Emergency Response (1-Tap)</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
