import Link from "next/link";
import { EmergencyGridIllustration } from "@/components/illustration/EmergencyGridIllustration";

export default function Home() {
  return (
    <div className="space-y-16 py-4">
      {/* Editorial Hero Section with Vector Grid Illustration */}
      <section className="relative pt-4 sm:pt-6 pb-12 border-b border-white/[0.08]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Value Proposition & CTAs */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-widest text-zinc-400">
              <span className="telemetry-pip bg-[#00E599] shadow-[0_0_6px_#00E599]" />
              AUTONOMOUS EMERGENCY DISPATCH & IDENTITY ARCHITECTURE
            </div>

            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-medium tracking-tight text-white leading-[0.95]">
              Right patient. <br />
              Right hospital. <br />
              <span className="text-zinc-500">Right now.</span>
            </h1>

            <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl font-normal leading-relaxed">
              Eliminating the identity gap and hospital dead-ends during the golden hour.
              Engineered with capability-aware routing, QueuePredict load balancing, and offline-verifiable Ed25519 identity cards.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/incident/new"
                className="touch-target px-8 py-3.5 rounded-xl font-mono text-xs uppercase tracking-wider font-semibold text-black bg-white hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center gap-2"
              >
                <span>Launch Emergency</span>
                <span className="font-sans font-bold">→</span>
              </Link>

              <Link
                href="/hospital/dashboard"
                className="touch-target px-8 py-3.5 rounded-xl font-mono text-xs uppercase tracking-wider font-semibold text-zinc-300 bg-zinc-900/60 hover:bg-zinc-800 border border-white/10 transition-all flex items-center gap-2"
              >
                <span>Hospital ER Radar</span>
                <span className="font-sans font-bold">→</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Architectural Vector SVG Illustration */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <EmergencyGridIllustration />
          </div>
        </div>

        {/* Precision Telemetry Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-8 border-t border-white/[0.06] font-mono">
          <div>
            <div className="text-3xl font-normal text-white tracking-tight">10</div>
            <div className="text-[11px] text-zinc-500 uppercase tracking-widest mt-1">Hospitals Tracked</div>
          </div>
          <div>
            <div className="text-3xl font-normal text-white tracking-tight">&lt; 2.0s</div>
            <div className="text-[11px] text-zinc-500 uppercase tracking-widest mt-1">Scoring Latency</div>
          </div>
          <div>
            <div className="text-3xl font-normal text-white tracking-tight">Ed25519</div>
            <div className="text-[11px] text-zinc-500 uppercase tracking-widest mt-1">Offline Payload</div>
          </div>
          <div>
            <div className="text-3xl font-normal text-white tracking-tight">100%</div>
            <div className="text-[11px] text-zinc-500 uppercase tracking-widest mt-1">Explainable Factor Breakdown</div>
          </div>
        </div>
      </section>

      {/* Core Architectural Portals Grid */}
      <section className="space-y-6">
        <div className="flex items-baseline justify-between border-b border-white/[0.08] pb-4">
          <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400">
            System Portals & Operations
          </h2>
          <span className="font-mono text-[11px] text-zinc-400">SELECT OPERATIONAL WORKFLOW</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Bystander Scan */}
          <Link
            href="/s/tok_asha_k_9901"
            className="group p-6 rounded-2xl tactile-panel tactile-panel-hover flex flex-col justify-between min-h-[220px]"
          >
            <div>
              <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400 uppercase tracking-wider mb-4">
                <span>01 / Scan</span>
                <span className="text-[#00E599]">Zero Login Required</span>
              </div>
              <h3 className="text-xl font-medium text-white group-hover:text-zinc-200 transition-colors">
                Bystander Scan & Alert
              </h3>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                Instant critical medical identity verification via offline Ed25519 signature in URL hash fragment.
              </p>
            </div>
            <div className="pt-6 font-mono text-xs text-zinc-400 group-hover:text-white flex items-center gap-1 transition-colors">
              <span>Inspect Asha Kulkarni (O-) Record</span>
              <span>→</span>
            </div>
          </Link>

          {/* 2. MedPass Generator */}
          <Link
            href="/medpass"
            className="group p-6 rounded-2xl tactile-panel tactile-panel-hover flex flex-col justify-between min-h-[220px]"
          >
            <div>
              <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400 uppercase tracking-wider mb-4">
                <span>02 / Citizen</span>
                <span>Tiered Privacy</span>
              </div>
              <h3 className="text-xl font-medium text-white group-hover:text-zinc-200 transition-colors">
                MedPass Generator
              </h3>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                Generate cryptographic lockscreen wallpaper and wallet cards with client-side Ed25519 key signing.
              </p>
            </div>
            <div className="pt-6 font-mono text-xs text-zinc-400 group-hover:text-white flex items-center gap-1 transition-colors">
              <span>Create / Rotate Identity</span>
              <span>→</span>
            </div>
          </Link>

          {/* 3. Paramedic Dispatch */}
          <Link
            href="/incident/new"
            className="group p-6 rounded-2xl tactile-panel tactile-panel-hover flex flex-col justify-between min-h-[220px]"
          >
            <div>
              <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400 uppercase tracking-wider mb-4">
                <span>03 / Paramedic</span>
                <span className="text-[#00E599]">GPS Synced</span>
              </div>
              <h3 className="text-xl font-medium text-white group-hover:text-zinc-200 transition-colors">
                Rapid Incident Report
              </h3>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                One-handed emergency dispatch with capability matching, automated nearest fleet assignment, and golden hour telemetry.
              </p>
            </div>
            <div className="pt-6 font-mono text-xs text-zinc-400 group-hover:text-white flex items-center gap-1 transition-colors">
              <span>Report Emergency</span>
              <span>→</span>
            </div>
          </Link>

          {/* 4. Hospital Live ER Radar */}
          <Link
            href="/hospital/dashboard"
            className="group p-6 rounded-2xl tactile-panel tactile-panel-hover flex flex-col justify-between min-h-[220px]"
          >
            <div>
              <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400 uppercase tracking-wider mb-4">
                <span>04 / Hospital</span>
                <span className="text-[#00E599]">Realtime Sync</span>
              </div>
              <h3 className="text-xl font-medium text-white group-hover:text-zinc-200 transition-colors">
                Hospital ER Radar
              </h3>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                Live bed steppers, equipment toggles, blood stock telemetry, and incoming SBAR voice handover checklists.
              </p>
            </div>
            <div className="pt-6 font-mono text-xs text-zinc-400 group-hover:text-white flex items-center gap-1 transition-colors">
              <span>Open ER Staff Dashboard</span>
              <span>→</span>
            </div>
          </Link>

          {/* 5. Command Center */}
          <Link
            href="/command"
            className="group p-6 rounded-2xl tactile-panel tactile-panel-hover flex flex-col justify-between min-h-[220px]"
          >
            <div>
              <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400 uppercase tracking-wider mb-4">
                <span>05 / Dispatch</span>
                <span>Load Balancing</span>
              </div>
              <h3 className="text-xl font-medium text-white group-hover:text-zinc-200 transition-colors">
                Command Center &amp; Map
              </h3>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                City-wide fleet tracking, QueuePredict load radar, and autonomous hospital diversion with mathematical proof.
              </p>
            </div>
            <div className="pt-6 font-mono text-xs text-zinc-400 group-hover:text-white flex items-center gap-1 transition-colors">
              <span>Launch Tactical Center</span>
              <span>→</span>
            </div>
          </Link>

          {/* 6. Peer Relay & Offline Mesh */}
          <Link
            href="/peer"
            className="group p-6 rounded-2xl tactile-panel tactile-panel-hover flex flex-col justify-between min-h-[220px]"
          >
            <div>
              <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400 uppercase tracking-wider mb-4">
                <span>06 / ResilientLink</span>
                <span className="text-[#00E599]">Zero Cell Data</span>
              </div>
              <h3 className="text-xl font-medium text-white group-hover:text-zinc-200 transition-colors">
                Mesh Relay &amp; SMS Fallback
              </h3>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                WebRTC multi-hop store-and-forward mesh with hop visualizer, deduplication, and 40-byte compact SMS codes.
              </p>
            </div>
            <div className="pt-6 font-mono text-xs text-zinc-400 group-hover:text-white flex items-center gap-1 transition-colors">
              <span>Test Peer Mesh &amp; SMS</span>
              <span>→</span>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
