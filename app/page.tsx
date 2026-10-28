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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. Bystander Scan */}
          <Link
            href="/s/tok_asha_k_9901"
            className="group p-6 rounded-2xl tactile-panel tactile-panel-hover border border-white/20 hover:border-white/50 bg-[#0c0c12]/90 flex flex-col justify-between min-h-[230px] transition-all shadow-sm hover:shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400 uppercase tracking-wider mb-4 pb-3 border-b border-white/10">
                <span>01 / Scan</span>
                <span className="text-[#00E599] font-medium">Zero Login Required</span>
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
            className="group p-6 rounded-2xl tactile-panel tactile-panel-hover border border-white/20 hover:border-white/50 bg-[#0c0c12]/90 flex flex-col justify-between min-h-[230px] transition-all shadow-sm hover:shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400 uppercase tracking-wider mb-4 pb-3 border-b border-white/10">
                <span>02 / Citizen</span>
                <span className="font-medium text-zinc-300">Tiered Privacy</span>
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
            className="group p-6 rounded-2xl tactile-panel tactile-panel-hover border border-white/20 hover:border-white/50 bg-[#0c0c12]/90 flex flex-col justify-between min-h-[230px] transition-all shadow-sm hover:shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400 uppercase tracking-wider mb-4 pb-3 border-b border-white/10">
                <span>03 / Paramedic</span>
                <span className="text-[#00E599] font-medium">GPS Synced</span>
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
            className="group p-6 rounded-2xl tactile-panel tactile-panel-hover border border-white/20 hover:border-white/50 bg-[#0c0c12]/90 flex flex-col justify-between min-h-[230px] transition-all shadow-sm hover:shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400 uppercase tracking-wider mb-4 pb-3 border-b border-white/10">
                <span>04 / Hospital</span>
                <span className="text-[#00E599] font-medium">Realtime Sync</span>
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
            className="group p-6 rounded-2xl tactile-panel tactile-panel-hover border border-white/20 hover:border-white/50 bg-[#0c0c12]/90 flex flex-col justify-between min-h-[230px] transition-all shadow-sm hover:shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400 uppercase tracking-wider mb-4 pb-3 border-b border-white/10">
                <span>05 / Dispatch</span>
                <span className="font-medium text-zinc-300">Load Balancing</span>
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
            className="group p-6 rounded-2xl tactile-panel tactile-panel-hover border border-white/20 hover:border-white/50 bg-[#0c0c12]/90 flex flex-col justify-between min-h-[230px] transition-all shadow-sm hover:shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400 uppercase tracking-wider mb-4 pb-3 border-b border-white/10">
                <span>06 / ResilientLink</span>
                <span className="text-[#00E599] font-medium">Zero Cell Data</span>
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

      {/* Problem Statement & Mission Architecture Section (Evaluation Criteria) */}
      <section className="space-y-8 pt-8 border-t border-white/[0.08]">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-[#FF2A44]" />
            CORE PROBLEM STATEMENT &amp; ENGINEERING SPECIFICATION
          </div>
          <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-white">
            The Golden Hour Crisis: 5 Systemic Failures Solved
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-3xl leading-relaxed">
            In trauma emergencies, survival drops exponentially after the first 60 minutes. Current emergency response grids suffer from critical structural bottlenecks that TriageSync 2.0 systematically eliminates.
          </p>
        </div>

        {/* 5 Problem & Solution Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-mono">
          {/* Problem 1 */}
          <div className="p-6 rounded-2xl bg-[#09090e] border border-white/10 space-y-4">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-white/[0.08]">
              <span className="text-[#FF2A44] font-bold">FAILURE 01</span>
              <span className="text-zinc-500 text-[10px]">IDENTITY GAP</span>
            </div>
            <div>
              <h3 className="text-white text-base font-normal font-sans">The Identity Void (Zero Context)</h3>
              <p className="text-xs text-zinc-400 mt-2 font-sans leading-relaxed">
                Unconscious victims arrive with unknown blood type, critical allergies (e.g. Penicillin), or pre-existing conditions (e.g. severe asthma), leading to fatal transfusions and medication errors.
              </p>
            </div>
            <div className="pt-2 text-xs text-emerald-400 border-t border-white/[0.06] font-sans">
              <strong>TriageSync Solution:</strong> MedPass (MP-1..MP-10) with Ed25519-signed offline payload in URL hash. Works with any phone camera in airplane mode without login.
            </div>
          </div>

          {/* Problem 2 */}
          <div className="p-6 rounded-2xl bg-[#09090e] border border-white/10 space-y-4">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-white/[0.08]">
              <span className="text-[#FF2A44] font-bold">FAILURE 02</span>
              <span className="text-zinc-500 text-[10px]">HOSPITAL DEAD-ENDS</span>
            </div>
            <div>
              <h3 className="text-white text-base font-normal font-sans">The Nearest-Hospital Fallacy</h3>
              <p className="text-xs text-zinc-400 mt-2 font-sans leading-relaxed">
                Ambulances rush to the nearest facility by distance, only to discover the ICU is full, no trauma surgeon is on duty, or no matching O- blood exists. Minutes of the Golden Hour are wasted.
              </p>
            </div>
            <div className="pt-2 text-xs text-emerald-400 border-t border-white/[0.06] font-sans">
              <strong>TriageSync Solution:</strong> Capability-Aware Engine (HM-1..HM-8) with 6-factor composite scoring (ETA, capacity, equipment, blood, load, freshness) and hard exclusions.
            </div>
          </div>

          {/* Problem 3 */}
          <div className="p-6 rounded-2xl bg-[#09090e] border border-white/10 space-y-4">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-white/[0.08]">
              <span className="text-[#FF2A44] font-bold">FAILURE 03</span>
              <span className="text-zinc-500 text-[10px]">ER HERD BOTTLENECK</span>
            </div>
            <div>
              <h3 className="text-white text-base font-normal font-sans">Uncoordinated ER Convergence</h3>
              <p className="text-xs text-zinc-400 mt-2 font-sans leading-relaxed">
                Multiple ambulances converge simultaneously on the same major hospital, overwhelming ER triage staff while sister facilities sit underutilized with free trauma bays.
              </p>
            </div>
            <div className="pt-2 text-xs text-emerald-400 border-t border-white/[0.06] font-sans">
              <strong>TriageSync Solution:</strong> QueuePredict (QP-1..QP-5) calculates projected load at arrival. Automatically diverts subsequent ambulances before arrival when load &gt; 85%.
            </div>
          </div>

          {/* Problem 4 */}
          <div className="p-6 rounded-2xl bg-[#09090e] border border-white/10 space-y-4">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-white/[0.08]">
              <span className="text-[#FF2A44] font-bold">FAILURE 04</span>
              <span className="text-zinc-500 text-[10px]">PARAMEDIC OVERLOAD</span>
            </div>
            <div>
              <h3 className="text-white text-base font-normal font-sans">Manual Charting During CPR</h3>
              <p className="text-xs text-zinc-400 mt-2 font-sans leading-relaxed">
                Responders cannot type on keyboards or touch screens while performing chest compressions or airway bag ventilation in a speeding ambulance. Handover happens blindly at hospital arrival.
              </p>
            </div>
            <div className="pt-2 text-xs text-emerald-400 border-t border-white/[0.06] font-sans">
              <strong>TriageSync Solution:</strong> VoiceHandover (VH-1..VH-7) one-touch speech recognition (EN, HI, MR) auto-extracting SBAR structured vitals and auto-triggering ER prep checklists.
            </div>
          </div>

          {/* Problem 5 */}
          <div className="p-6 rounded-2xl bg-[#09090e] border border-white/10 space-y-4">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-white/[0.08]">
              <span className="text-[#FF2A44] font-bold">FAILURE 05</span>
              <span className="text-zinc-500 text-[10px]">NETWORK BLACKOUTS</span>
            </div>
            <div>
              <h3 className="text-white text-base font-normal font-sans">Cellular Tower Blackouts</h3>
              <p className="text-xs text-zinc-400 mt-2 font-sans leading-relaxed">
                Highway mountain passes, severe monsoon storms, and mass-casualty disasters crash cellular networks, rendering standard cloud-only emergency dispatch apps useless.
              </p>
            </div>
            <div className="pt-2 text-xs text-emerald-400 border-t border-white/[0.06] font-sans">
              <strong>TriageSync Solution:</strong> ResilientLink (RL-1..RL-7) with IndexedDB offline outbox, WebRTC peer store-and-forward mesh relay, and 40-byte compact incident SMS fallback.
            </div>
          </div>

          {/* Problem 6: Mass Casualties */}
          <div className="p-6 rounded-2xl bg-[#09090e] border border-white/10 space-y-4">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-white/[0.08]">
              <span className="text-[#FF2A44] font-bold">FAILURE 06</span>
              <span className="text-zinc-500 text-[10px]">MCI DISASTERS</span>
            </div>
            <div>
              <h3 className="text-white text-base font-normal font-sans">Mass-Casualty Overload (MCI)</h3>
              <p className="text-xs text-zinc-400 mt-2 font-sans leading-relaxed">
                Bus collisions or structural collapses produce 10+ victims at once. Dispatchers lack algorithmic tools to split red, yellow, and green patients across the city without crushing one ER.
              </p>
            </div>
            <div className="pt-2 text-xs text-emerald-400 border-t border-white/[0.06] font-sans">
              <strong>TriageSync Solution:</strong> MCI Distribution Engine (CC-2) splits N patients optimally across hospitals, prioritizing trauma bays for RED and ER observation for YELLOW.
            </div>
          </div>
        </div>

        {/* IEEE 830 Traceability Table */}
        <div className="p-6 rounded-2xl bg-black/40 border border-white/[0.08] font-mono text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-white font-bold uppercase tracking-wider">
              SRS Traceability &amp; Verification Matrix (100% Implemented)
            </span>
            <span className="text-[#00E599] font-bold">84 Automated Vitest Specs Passing</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px] text-zinc-400">
            <div>
              <div className="text-white font-bold mb-1">MedPass (MP-1..10)</div>
              <div>• Ed25519 Offline Signing</div>
              <div>• QR Wallet &amp; Wallpaper</div>
              <div>• Tiered Privacy Disclosure</div>
              <div>• Immutable Audit Logging</div>
            </div>

            <div>
              <div className="text-white font-bold mb-1">Matching (HM-1..8)</div>
              <div>• 6-Factor Composite Score</div>
              <div>• Hard Exclusion of Unfit ERs</div>
              <div>• Blood Unit Availability</div>
              <div>• 100% Explainable Factors</div>
            </div>

            <div>
              <div className="text-white font-bold mb-1">Queue &amp; Handover</div>
              <div>• QueuePredict (QP-1..5)</div>
              <div>• Autonomous ER Diversion</div>
              <div>• Voice SBAR (VH-1..7)</div>
              <div>• Auto Prep Checklists</div>
            </div>

            <div>
              <div className="text-white font-bold mb-1">Offline &amp; Command</div>
              <div>• IndexedDB Outbox (RL-1)</div>
              <div>• WebRTC Peer Relay (RL-5)</div>
              <div>• 40-byte Compact SMS (RL-4)</div>
              <div>• MCI Multi-Split (CC-2)</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
