import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-16 py-4">
      {/* Editorial Hero Section */}
      <section className="relative pt-6 pb-12 border-b border-white/[0.08]">
        <div className="max-w-4xl space-y-8">
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

          <div className="flex flex-wrap items-center gap-4 pt-4">
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
            <div className="mt-6 flex items-center justify-between font-mono text-xs text-zinc-400 group-hover:text-white transition-colors">
              <span>Open Asha Kulkarni Record</span>
              <span className="text-base group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          {/* 2. Paramedic Incident */}
          <Link
            href="/incident/new"
            className="group p-6 rounded-2xl tactile-panel tactile-panel-hover flex flex-col justify-between min-h-[220px]"
          >
            <div>
              <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400 uppercase tracking-wider mb-4">
                <span>02 / Dispatch</span>
                <span>Paramedic Console</span>
              </div>
              <h3 className="text-xl font-medium text-white group-hover:text-zinc-200 transition-colors">
                Report Emergency
              </h3>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                One-handed mobile triage reporting, GPS coordinates, capability matching, and nearest ambulance dispatch.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between font-mono text-xs text-zinc-400 group-hover:text-white transition-colors">
              <span>Launch Incident</span>
              <span className="text-base group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          {/* 3. Hospital ER Staff */}
          <Link
            href="/hospital/dashboard"
            className="group p-6 rounded-2xl tactile-panel tactile-panel-hover flex flex-col justify-between min-h-[220px]"
          >
            <div>
              <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400 uppercase tracking-wider mb-4">
                <span>03 / Telemetry</span>
                <span className="text-[#00E599]">Live Steppers</span>
              </div>
              <h3 className="text-xl font-medium text-white group-hover:text-zinc-200 transition-colors">
                Hospital ER Dashboard
              </h3>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                Tactile steppers for ICU and ER beds, equipment toggles, blood stock per group, and inbound patient radar.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between font-mono text-xs text-zinc-400 group-hover:text-white transition-colors">
              <span>Manage Hospital State</span>
              <span className="text-base group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          {/* 4. MedPass Citizen Card */}
          <Link
            href="/medpass"
            className="group p-6 rounded-2xl tactile-panel tactile-panel-hover flex flex-col justify-between min-h-[220px]"
          >
            <div>
              <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400 uppercase tracking-wider mb-4">
                <span>04 / Identity</span>
                <span>Citizen Wallet</span>
              </div>
              <h3 className="text-xl font-medium text-white group-hover:text-zinc-200 transition-colors">
                MedPass Generator
              </h3>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                Generate signed digital wallet cards, export high-resolution wallpaper images, and review scan audit trails.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between font-mono text-xs text-zinc-400 group-hover:text-white transition-colors">
              <span>Open MedPass Hub</span>
              <span className="text-base group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          {/* 5. Active Incident Console */}
          <Link
            href="/incident/demo-01"
            className="group p-6 rounded-2xl tactile-panel tactile-panel-hover flex flex-col justify-between min-h-[220px]"
          >
            <div>
              <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400 uppercase tracking-wider mb-4">
                <span>05 / Live Grid</span>
                <span className="text-[#FF2A44]">Golden Hour Active</span>
              </div>
              <h3 className="text-xl font-medium text-white group-hover:text-zinc-200 transition-colors">
                Paramedic Tactical Console
              </h3>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                Live 60-minute countdown timer, tactical vector map, route simulation, and 15-minute bed hold reservation.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between font-mono text-xs text-zinc-400 group-hover:text-white transition-colors">
              <span>View Active Incident</span>
              <span className="text-base group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          {/* 6. Architectural Differentiators */}
          <div className="p-6 rounded-2xl border border-white/[0.08] bg-zinc-950/40 flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="font-mono text-[11px] text-zinc-400 uppercase tracking-wider mb-4">
                06 / Compliance
              </div>
              <h3 className="text-xl font-medium text-white">
                DPDP & IEEE Standard
              </h3>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                Tiered access architecture: critical data public, full health records verified and logged in immutable audit trails.
              </p>
            </div>
            <div className="mt-6 font-mono text-[11px] text-zinc-400 uppercase tracking-widest">
              Zero-Trust Architecture
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
