import Link from "next/link";
import {
  ShieldAlert,
  QrCode,
  Radio,
  Ambulance,
  HeartPulse,
  Flame,
  ArrowRight,
  Zap,
  Activity,
  Layers,
  Lock,
  WifiOff,
} from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-10 py-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl p-8 sm:p-12 glass-panel-glow border-cyan-500/30">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 text-xs font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            AUTONOMOUS EMERGENCY COORDINATION & MEDPASS 2.0
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.1]">
            Right patient. <br />
            Right hospital. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
              Right now.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 leading-relaxed font-normal">
            Eliminating the identity gap and hospital dead-ends during the golden hour.
            Powered by capability-aware routing, QueuePredict load balancing, offline-verifiable
            Ed25519 identity, and hands-free voice handover.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              href="/incident/new"
              className="touch-target inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-lg shadow-cyan-500/25 transition-all text-sm tracking-wide gap-2"
            >
              <Ambulance className="w-5 h-5" />
              Launch Emergency Incident
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/hospital/dashboard"
              className="touch-target inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-bold text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 transition-all text-sm tracking-wide gap-2"
            >
              <Radio className="w-5 h-5 text-emerald-400" />
              Hospital ER Radar
            </Link>
          </div>
        </div>

        {/* Live Grid Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 pt-8 border-t border-slate-800/80">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400">10</div>
            <div className="text-xs text-slate-400 font-medium">Pune Hospitals Tracked</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">100%</div>
            <div className="text-xs text-slate-400 font-medium">Offline Ed25519 Verified</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">&lt; 2.0s</div>
            <div className="text-xs text-slate-400 font-medium">Capability Match Latency</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">0</div>
            <div className="text-xs text-slate-400 font-medium">Dead-Ends Tolerated</div>
          </div>
        </div>
      </section>

      {/* 5 Core Portals Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-cyan-400" />
            Emergency Role Portals
          </h2>
          <span className="text-xs text-slate-400 font-medium">5 Specialized Workflows</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. Bystander Scan */}
          <Link
            href="/s/tok_asha_k_9901"
            className="group block p-6 rounded-2xl glass-panel glass-card-interactive border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                <QrCode className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-950/60 text-red-400 border border-red-800/40">
                NO LOGIN REQUIRED
              </span>
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
              Bystander Scan & Alert
            </h3>
            <p className="text-sm text-slate-400 mt-2 line-clamp-2">
              Instant critical identity read from QR payload, zero app install, offline cryptographic verification.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
              <span>Demo Asha Kulkarni QR</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 2. Paramedic Incident */}
          <Link
            href="/incident/new"
            className="group block p-6 rounded-2xl glass-panel glass-card-interactive border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <Ambulance className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                1-HANDED FLOW
              </span>
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
              Paramedic Command
            </h3>
            <p className="text-sm text-slate-400 mt-2 line-clamp-2">
              Create incident, capability-matched top 3 hospital ranking with factor explanations and 15-min bed reservation.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
              <span>Start Incident</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 3. Hospital ER Staff */}
          <Link
            href="/hospital/dashboard"
            className="group block p-6 rounded-2xl glass-panel glass-card-interactive border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Radio className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                1-TAP UPDATES
              </span>
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
              Hospital ER Dashboard
            </h3>
            <p className="text-sm text-slate-400 mt-2 line-clamp-2">
              Steppers for ICU/ER beds, ventilators, blood stock, and incoming patient cards with SBAR briefs and prep checklists.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <span>Open ER Command</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 4. MedPass Citizen Card */}
          <Link
            href="/medpass"
            className="group block p-6 rounded-2xl glass-panel glass-card-interactive border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <HeartPulse className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-950/60 text-blue-300 border border-blue-800/40">
                OFFLINE WALLET
              </span>
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
              MedPass Generator & Card
            </h3>
            <p className="text-sm text-slate-400 mt-2 line-clamp-2">
              Create medical identity, configure emergency contacts, export wallet and lock-screen wallpaper, view scan audit logs.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-blue-400">
              <span>Manage MedPass</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 5. City Command & Dispatcher */}
          <Link
            href="/command"
            className="group block p-6 rounded-2xl glass-panel glass-card-interactive border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/40">
                CITY-WIDE GRID
              </span>
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
              Dispatcher Command Center
            </h3>
            <p className="text-sm text-slate-400 mt-2 line-clamp-2">
              City map with active ambulances, hospital capacity heatmaps, mass-casualty distribution, and diversion analytics.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <span>View City Map</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 6. Demo Script & Chaos Runner */}
          <Link
            href="/demo"
            className="group block p-6 rounded-2xl glass-panel glass-card-interactive border-purple-500/30 bg-purple-950/10 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <Flame className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/40">
                JUDGES & CHAOS
              </span>
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
              Live Demo & Chaos Console
            </h3>
            <p className="text-sm text-slate-400 mt-2 line-clamp-2">
              1-click test cases: fill ICU, kill network, surge 3 ambulances to trigger diversion, reset seed data.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-purple-400">
              <span>Open Chaos Console</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* Key Architectural Differentiators */}
      <section className="p-8 rounded-2xl glass-panel border-slate-800 space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyan-400" />
          Technical Differentiators for Evaluation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-300">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-cyan-300">
              <Activity className="w-4 h-4" />
              Explainable Capability Matching
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Not just nearest distance. Maps clinical requirement matrices (trauma bay, OT, blood, cath lab) and exposes factor scores so paramedics understand why a hospital was picked.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-300">
              <WifiOff className="w-4 h-4" />
              Offline-First & ResilientLink
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Signed Ed25519 critical tier decoded in airplane mode from URL hash fragment. IndexedDB outbox flushes automatically on reconnect with idempotent client UUIDs.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-purple-300">
              <Lock className="w-4 h-4" />
              Privacy-Tiered & Audit-Logged
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Lock-screen critical tier is public; full medical history requires verified responder login or contact OTP. Every scan is cryptographically logged and visible to the patient.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
