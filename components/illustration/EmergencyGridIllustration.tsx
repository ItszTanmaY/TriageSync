'use client';

import React from 'react';

export function EmergencyGridIllustration() {
  return (
    <div className="relative w-full aspect-square max-w-[460px] mx-auto rounded-3xl tactile-panel p-4 overflow-hidden border border-white/10 bg-[#020204] shadow-[0_0_50px_rgba(0,0,0,0.8)] select-none group">
      {/* Background Architectural Blueprint Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Subtle Radial Glow in Center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-radial from-white/[0.04] to-transparent rounded-full pointer-events-none blur-2xl" />

      {/* SVG Vector Graphic */}
      <svg
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10"
        aria-label="TriageSync Autonomous Grid and Capability Matching Vector Illustration"
      >
        <defs>
          {/* Subtle Gradients */}
          <linearGradient id="gridLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
          </linearGradient>

          <linearGradient id="neonEmeraldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00E599" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.9" />
          </linearGradient>

          <linearGradient id="redAlertGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF2A44" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FF7A00" stopOpacity="0.9" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="vectorGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Radar Concentric Rings */}
        <circle cx="250" cy="250" r="210" stroke="#ffffff" strokeOpacity="0.06" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="250" cy="250" r="160" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1" />
        <circle cx="250" cy="250" r="110" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="4 4" />
        <circle cx="250" cy="250" r="60" stroke="#ffffff" strokeOpacity="0.16" strokeWidth="1" />

        {/* Outer Circular Compass & Angle Markers */}
        <g stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1">
          <line x1="250" y1="20" x2="250" y2="35" />
          <line x1="250" y1="465" x2="250" y2="480" />
          <line x1="20" y1="250" x2="35" y2="250" />
          <line x1="465" y1="250" x2="480" y2="250" />
        </g>
        <text x="250" y="16" fill="#71717A" fontSize="9" fontFamily="monospace" textAnchor="middle" letterSpacing="2">
          SECTOR N 18°31&apos;14&quot;
        </text>
        <text x="485" y="253" fill="#71717A" fontSize="9" fontFamily="monospace" textAnchor="end" letterSpacing="1">
          E 73°51&apos;19&quot;
        </text>

        {/* 2. Routing Vector Paths (Incident -> Ambulance -> Hospital) */}
        {/* Curving transit route */}
        <path
          d="M 110 360 C 180 340, 180 220, 250 210 S 330 200, 390 140"
          stroke="url(#gridLineGrad)"
          strokeWidth="2"
          strokeDasharray="6 4"
        />

        {/* Pulsing Green Corridor Active Route */}
        <path
          d="M 110 360 Q 230 380, 290 280 T 390 140"
          stroke="url(#neonEmeraldGrad)"
          strokeWidth="2.5"
          filter="url(#vectorGlow)"
          className="animate-pulse"
        />

        {/* Cross Network Vector Connections */}
        <line x1="110" y1="360" x2="160" y2="160" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="160" y1="160" x2="390" y2="140" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="290" y1="280" x2="360" y2="370" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="2 2" />

        {/* 3. Node A: Emergency Incident Beacon (Bottom-Left) */}
        <g transform="translate(110, 360)">
          {/* Animated beacon ring */}
          <circle cx="0" cy="0" r="22" stroke="#FF2A44" strokeOpacity="0.3" strokeWidth="1.5" className="animate-ping" />
          <circle cx="0" cy="0" r="16" fill="#FF2A44" fillOpacity="0.15" stroke="#FF2A44" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="6" fill="#FF2A44" />
          {/* Label */}
          <rect x="-42" y="24" width="84" height="20" rx="4" fill="#0A0A0C" stroke="#FF2A44" strokeOpacity="0.4" strokeWidth="1" />
          <text x="0" y="37" fill="#FF8080" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle" letterSpacing="1">
            INCIDENT / RED
          </text>
        </g>

        {/* 4. Node B: In-Transit Fleet Ambulance (Center-Right) */}
        <g transform="translate(290, 280)">
          <circle cx="0" cy="0" r="18" fill="#00E5FF" fillOpacity="0.12" stroke="#00E5FF" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="5" fill="#00E5FF" />
          {/* Ambulance Icon Shape */}
          <rect x="-10" y="-7" width="20" height="14" rx="2" fill="none" stroke="#FFFFFF" strokeWidth="1.2" />
          <line x1="0" y1="-5" x2="0" y2="5" stroke="#00E5FF" strokeWidth="1.2" />
          <line x1="-5" y1="0" x2="5" y2="0" stroke="#00E5FF" strokeWidth="1.2" />
          {/* Label HUD */}
          <rect x="22" y="-12" width="90" height="24" rx="5" fill="#0A0A0C" stroke="#FFFFFF" strokeOpacity="0.15" strokeWidth="1" />
          <text x="28" y="-1" fill="#FFFFFF" fontSize="8" fontFamily="monospace" fontWeight="bold">
            FLEET: APEX-101
          </text>
          <text x="28" y="8" fill="#00E599" fontSize="7" fontFamily="monospace">
            ETA: 6 MIN • O-NEG ONBOARD
          </text>
        </g>

        {/* 5. Node C: Destination ER Trauma Center (Top-Right) */}
        <g transform="translate(390, 140)">
          {/* Outer glow target */}
          <circle cx="0" cy="0" r="28" stroke="#00E599" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="0" cy="0" r="20" fill="#00E599" fillOpacity="0.12" stroke="#00E599" strokeWidth="1.5" />
          {/* Medical Cross Vector */}
          <path
            d="M -4 -10 H 4 V -4 H 10 V 4 H 4 V 10 H -4 V 4 H -10 V -4 H -4 Z"
            fill="#FFFFFF"
          />
          {/* Hospital HUD Badge */}
          <rect x="-105" y="-36" width="100" height="30" rx="5" fill="#0A0A0C" stroke="#00E599" strokeOpacity="0.4" strokeWidth="1" />
          <text x="-55" y="-22" fill="#FFFFFF" fontSize="8" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">
            SAHYADRI TRAUMA
          </text>
          <text x="-55" y="-12" fill="#00E599" fontSize="7" fontFamily="monospace" textAnchor="middle">
            MATCH FIT: 96.4% • ER READY
          </text>
        </g>

        {/* 6. MedPass Cryptographic QR Micro-Matrix (Top-Left) */}
        <g transform="translate(60, 80)">
          <rect x="0" y="0" width="80" height="80" rx="10" fill="#0A0A0C" stroke="#FFFFFF" strokeOpacity="0.15" strokeWidth="1" />
          {/* Corner target squares */}
          <rect x="10" y="10" width="18" height="18" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
          <rect x="14" y="14" width="10" height="10" fill="#00E599" />

          <rect x="52" y="10" width="18" height="18" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
          <rect x="56" y="14" width="10" height="10" fill="#FFFFFF" />

          <rect x="10" y="52" width="18" height="18" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
          <rect x="14" y="56" width="10" height="10" fill="#FFFFFF" />

          {/* Matrix data dots */}
          <circle cx="40" cy="20" r="2.5" fill="#FFFFFF" />
          <circle cx="40" cy="35" r="2.5" fill="#00E599" />
          <circle cx="50" cy="45" r="2.5" fill="#FFFFFF" />
          <circle cx="35" cy="55" r="2.5" fill="#00E599" />
          <circle cx="55" cy="60" r="2.5" fill="#FFFFFF" />

          <text x="40" y="74" fill="#A1A1AA" fontSize="6.5" fontFamily="monospace" textAnchor="middle" letterSpacing="0.5">
            ED25519 VERIFIED
          </text>
        </g>

        {/* 7. Live Vital Telemetry & ECG Oscillograph Track (Center Horizon) */}
        <g transform="translate(140, 230)">
          {/* Vital Monitor Card */}
          <rect x="0" y="0" width="220" height="42" rx="8" fill="#060608" stroke="#FFFFFF" strokeOpacity="0.12" strokeWidth="1" />
          
          {/* ECG Trace Path */}
          <path
            d="M 10 21 L 45 21 L 52 14 L 58 28 L 65 4 L 72 36 L 78 21 L 95 21 L 102 16 L 108 26 L 115 21 L 150 21"
            fill="none"
            stroke="#00E599"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Telemetry Digits */}
          <text x="160" y="17" fill="#A1A1AA" fontSize="7" fontFamily="monospace">
            HR: <tspan fill="#FFFFFF" fontWeight="bold">128</tspan> BPM
          </text>
          <text x="160" y="30" fill="#A1A1AA" fontSize="7" fontFamily="monospace">
            SpO2: <tspan fill="#00E5FF" fontWeight="bold">98%</tspan> GCS: <tspan fill="#FF8080" fontWeight="bold">11</tspan>
          </text>
        </g>

        {/* 8. QueuePredict Automated Diversion Pill (Bottom-Right) */}
        <g transform="translate(320, 410)">
          <rect x="0" y="0" width="130" height="34" rx="6" fill="#0A0A0C" stroke="#FFFFFF" strokeOpacity="0.15" strokeWidth="1" />
          <circle cx="14" cy="17" r="4" fill="#00E599" />
          <text x="26" y="15" fill="#FFFFFF" fontSize="8" fontFamily="monospace" fontWeight="bold">
            QUEUEPREDICT: BALANCED
          </text>
          <text x="26" y="26" fill="#71717A" fontSize="7" fontFamily="monospace">
            DIVERSIONS SAVED: 14
          </text>
        </g>
      </svg>

      {/* Floating Micro-Badge on corner of container */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between font-mono text-[9px] text-zinc-500 uppercase tracking-widest pointer-events-none">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E599] animate-pulse" />
          Autonomous Dispatch Grid
        </span>
        <span>OSRM / Ed25519 / PostGIS</span>
      </div>
    </div>
  );
}
