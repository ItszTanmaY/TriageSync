'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck,
  Activity,
  ArrowRight,
  Flame,
  CheckCircle2,
  Zap,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-16 sm:space-y-24 py-2 sm:py-6">
      {/* Editorial Clinical Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-sky-50/50 to-blue-50/40 border border-sky-100 p-6 sm:p-10 lg:p-14 shadow-lg shadow-sky-900/[0.03]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Core Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100/80 border border-sky-200 text-sky-800 text-xs font-mono font-bold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>Next-Gen Emergency Medical Dispatch & Identity</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.05]">
              Right Patient. <br />
              Right Hospital. <br />
              <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Every Second Saved.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
              Eliminating the identity gap and hospital dead-ends during the critical Golden Hour.
              Powered by <strong>capability-aware routing</strong>, <strong>QueuePredict</strong> load balancing,
              and <strong>offline-verifiable Ed25519 MedPass</strong> identity.
            </p>

            {/* High-Contrast Action CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="/incident/new"
                className="min-h-[52px] px-7 py-3.5 rounded-2xl font-sans text-sm uppercase tracking-wider font-bold text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 transition-all shadow-xl shadow-red-600/25 hover:shadow-red-600/40 flex items-center gap-2.5 active:scale-95"
              >
                <Flame className="w-5 h-5 animate-pulse" />
                <span>Launch Emergency SOS</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>

              <Link
                href="/hospital/dashboard"
                className="min-h-[52px] px-6 py-3.5 rounded-2xl font-sans text-sm uppercase tracking-wider font-bold text-sky-800 bg-white hover:bg-sky-50/80 border border-sky-200 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <Activity className="w-4 h-4 text-sky-600" />
                <span>Hospital ER Radar</span>
              </Link>

              <Link
                href="/medpass"
                className="min-h-[52px] px-5 py-3.5 rounded-2xl font-sans text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Get MedPass Card</span>
              </Link>
            </div>

            {/* Quick Proof Pills */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Sub-second Capability Matching</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero Hallucination SBAR Voice</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>100% Offline Airplane-Mode QR</span>
              </div>
            </div>
          </div>

          {/* Right Column: High-Res Real Emergency Healthcare Imagery & Live Telemetry Glass Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-white group">
              {/* High-Resolution Emergency Ambulance Image */}
              <div className="relative h-72 sm:h-96 w-full">
                <Image
                  src="https://images.unsplash.com/photo-1587745416684-47b88f30f22b?auto=format&fit=crop&w=1200&q=80"
                  alt="Emergency Ambulance Dispatch with flashing lights in active transit"
                  fill
                  priority
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {/* Subtle Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-transparent" />
              </div>

              {/* Floating Emergency Status Overlay Card */}
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/60 shadow-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                    <span className="font-mono text-xs font-bold text-red-600 tracking-wider uppercase">
                      Active Golden Hour Dispatch
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    BED RESERVED
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Sahyadri Super Speciality</h4>
                    <p className="text-xs text-slate-500">Fleet: Apex-101 • Polytrauma Red</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-sky-600 font-mono">07:14</span>
                    <span className="text-[10px] text-slate-400 block font-mono">ETA REMAINING</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative subtle ambient ring */}
            <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-sky-400/20 rounded-full blur-2xl pointer-events-none -z-10" />
          </div>
        </div>

        {/* 4 Precision Clinical Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-8 border-t border-sky-100">
          <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-sm">
            <div className="text-3xl font-black text-slate-900 tracking-tight font-mono">10</div>
            <div className="text-xs text-sky-700 font-bold uppercase tracking-wider mt-1">
              Hospitals Mapped
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">ICU, OT, Cath Lab & Blood Stock</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-sm">
            <div className="text-3xl font-black text-slate-900 tracking-tight font-mono">&lt; 2.0s</div>
            <div className="text-xs text-sky-700 font-bold uppercase tracking-wider mt-1">
              Match Engine Speed
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Weighted capability routing</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-sm">
            <div className="text-3xl font-black text-slate-900 tracking-tight font-mono">Ed25519</div>
            <div className="text-xs text-emerald-700 font-bold uppercase tracking-wider mt-1">
              Offline Verification
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Zero-network cryptographic QR</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-sm">
            <div className="text-3xl font-black text-slate-900 tracking-tight font-mono">100%</div>
            <div className="text-xs text-indigo-700 font-bold uppercase tracking-wider mt-1">
              Explainable Breakdown
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Every factor visible to clinician</div>
          </div>
        </div>
      </section>

      {/* Core Operational Portals Grid (With Real Healthcare Imagery) */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-sky-600">
              Live Medical Workstations
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              System Portals & Operations
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
            Select Live Emergency Role
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. Bystander Scan Card */}
          <Link
            href="/s/tok_asha_k_9901"
            className="group rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="relative h-44 w-full overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80"
                  alt="Emergency bystander medical scan"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold tracking-wider uppercase backdrop-blur-md">
                  01 / Citizen Scan
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-xs font-mono text-emerald-300 font-bold">
                    Zero Login Required
                  </span>
                  <h3 className="text-lg font-bold">Bystander Scan & Alert</h3>
                </div>
              </div>

              <div className="p-5">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Instant critical medical identity verification via offline Ed25519 signature in URL hash fragment.
                  Displays allergies, blood group, emergency contacts, and 1-tap SOS GPS dispatch.
                </p>
              </div>
            </div>

            <div className="p-5 pt-0 flex items-center justify-between text-xs font-bold text-sky-600 group-hover:text-sky-700">
              <span>Inspect Asha Kulkarni Record</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 2. Paramedic Incident Reporter Card */}
          <Link
            href="/incident/new"
            className="group rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="relative h-44 w-full overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80"
                  alt="Paramedic in ambulance dispatch"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-red-600/90 text-white text-[10px] font-bold tracking-wider uppercase backdrop-blur-md">
                  02 / Dispatch
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-xs font-mono text-rose-300 font-bold">
                    1-Handed Paramedic Console
                  </span>
                  <h3 className="text-lg font-bold">Report Emergency Incident</h3>
                </div>
              </div>

              <div className="p-5">
                <p className="text-xs text-slate-600 leading-relaxed">
                  One-handed mobile triage reporting, GPS coordinates, automatic capability matching,
                  and nearest available ambulance assignment (e.g. Apex-101).
                </p>
              </div>
            </div>

            <div className="p-5 pt-0 flex items-center justify-between text-xs font-bold text-red-600 group-hover:text-red-700">
              <span>Launch New Incident</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 3. Hospital ER Telemetry Radar */}
          <Link
            href="/hospital/dashboard"
            className="group rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="relative h-44 w-full overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80"
                  alt="Modern Hospital ER and Trauma Center"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-sky-600/90 text-white text-[10px] font-bold tracking-wider uppercase backdrop-blur-md">
                  03 / Hospital ER
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-xs font-mono text-sky-300 font-bold">
                    Live Beds & Trauma Bays
                  </span>
                  <h3 className="text-lg font-bold">Hospital Staff Dashboard</h3>
                </div>
              </div>

              <div className="p-5">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mobile steppers for ICU and ER beds, equipment toggles (OT, Cath Lab, CT),
                  8-group blood stock, and incoming patient radar with audible chime alert for RED arrivals.
                </p>
              </div>
            </div>

            <div className="p-5 pt-0 flex items-center justify-between text-xs font-bold text-sky-600 group-hover:text-sky-700">
              <span>Open Staff Telemetry</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 4. Hands-Free Voice Handover */}
          <Link
            href="/incident/inc-demo-01/handover"
            className="group rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="relative h-44 w-full overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80"
                  alt="Paramedic hands-free medical voice handover"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-indigo-600/90 text-white text-[10px] font-bold tracking-wider uppercase backdrop-blur-md">
                  04 / Voice SBAR
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-xs font-mono text-indigo-300 font-bold">
                    Multilingual NLP
                  </span>
                  <h3 className="text-lg font-bold">Hands-Free Voice Handover</h3>
                </div>
              </div>

              <div className="p-5">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Push-to-talk SBAR/MIST extraction in English, Hindi, and Marathi. Extracts vitals,
                  injuries, and generates pre-arrival checklist with a 10-second auto-send timer.
                </p>
              </div>
            </div>

            <div className="p-5 pt-0 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:text-indigo-700">
              <span>Open Voice Workstation</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 5. Citywide Command Center & QueuePredict */}
          <Link
            href="/command"
            className="group rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="relative h-44 w-full overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80"
                  alt="Citywide Emergency Command Center"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-cyan-600/90 text-white text-[10px] font-bold tracking-wider uppercase backdrop-blur-md">
                  05 / QueuePredict
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-xs font-mono text-cyan-300 font-bold">
                    Dispatcher Radar
                  </span>
                  <h3 className="text-lg font-bold">Citywide Command Center</h3>
                </div>
              </div>

              <div className="p-5">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Real-time hospital load bars, inbound ambulance tracking, automated diversion triggers
                  when ER load exceeds 85%, and Chaos Surge test buttons.
                </p>
              </div>
            </div>

            <div className="p-5 pt-0 flex items-center justify-between text-xs font-bold text-cyan-600 group-hover:text-cyan-700">
              <span>Launch Command Center</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 6. MedPass Citizen Identity Studio */}
          <Link
            href="/medpass"
            className="group rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="relative h-44 w-full overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80"
                  alt="Digital health identity and cryptographic card"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-emerald-600/90 text-white text-[10px] font-bold tracking-wider uppercase backdrop-blur-md">
                  06 / MedPass
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-xs font-mono text-emerald-300 font-bold">
                    Offline Cryptographic QR
                  </span>
                  <h3 className="text-lg font-bold">MedPass Citizen Studio</h3>
                </div>
              </div>

              <div className="p-5">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Create and sign medical identities with Ed25519, export lock-screen wallpaper and wallet card PNGs,
                  configure up to 3 emergency contacts, and rotate public tokens.
                </p>
              </div>
            </div>

            <div className="p-5 pt-0 flex items-center justify-between text-xs font-bold text-emerald-600 group-hover:text-emerald-700">
              <span>Create MedPass Card</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* Trust & Architecture Banner */}
      <section className="p-8 rounded-3xl bg-gradient-to-r from-sky-900 via-blue-900 to-slate-900 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-sky-300 text-xs font-mono font-bold uppercase tracking-wider">
            <Zap className="w-4 h-4 text-sky-400" />
            <span>DPDP Act 2023 & IEEE 830 Standard Architecture</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black">
            Tiered Disclosure with Zero Medical Hallucinations
          </h3>
          <p className="text-sm text-sky-100 max-w-2xl">
            Critical life-saving info is offline verifiable without internet. Full longitudinal health records require
            verified responder credentials and are logged in immutable cryptographic audit trails.
          </p>
        </div>

        <Link
          href="/incident/inc-demo-01"
          className="min-h-[48px] px-6 py-3 rounded-xl bg-white text-slate-900 hover:bg-sky-50 font-bold text-xs uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-all shadow-md shrink-0"
        >
          <span>View Live Incident Demo</span>
          <ArrowRight className="w-4 h-4 text-sky-600" />
        </Link>
      </section>
    </div>
  );
}
