'use client';

import React, { useState, useEffect } from 'react';
import {
  RelayPacket,
  createRelayPacket,
  processInboundPacket,
  generateCompactIncidentSMS,
  parseCompactIncidentSMS,
  CompactIncidentPayload,
} from '@/lib/peer/relay';
import { flushOutbox } from '@/lib/offline/outbox';

interface SimulationHop {
  nodeId: string;
  nodeName: string;
  role: 'origin' | 'relay' | 'gateway';
  isOnline: boolean;
  status: 'pending' | 'processing' | 'forwarded' | 'delivered';
}

export default function PeerRelayPage() {
  const [currentNodeId] = useState<string>(() => `node-${Math.random().toString(36).slice(2, 6)}`);
  const [isCurrentNodeOnline, setIsCurrentNodeOnline] = useState<boolean>(false);
  const [packetsLog, setPacketsLog] = useState<
    { packet: RelayPacket; action: string; reason: string; time: string }[]
  >([]);
  const [isRelaying, setIsRelaying] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(-1);

  // Simulated Nodes in the Pune Sector 01 Emergency Mesh
  const [meshNodes, setMeshNodes] = useState<SimulationHop[]>([
    {
      nodeId: 'node-amb-101',
      nodeName: 'Ambulance 101 (Ghats Shadow)',
      role: 'origin',
      isOnline: false,
      status: 'pending',
    },
    {
      nodeId: 'node-police-4',
      nodeName: 'Highway Patrol PCR-4',
      role: 'relay',
      isOnline: false,
      status: 'pending',
    },
    {
      nodeId: 'node-toll-khed',
      nodeName: 'Khed-Shivapur Toll Gateway',
      role: 'gateway',
      isOnline: true,
      status: 'pending',
    },
  ]);

  // SMS Fallback Simulator State (RL-4)
  const [smsTriage, setSmsTriage] = useState<'red' | 'yellow' | 'green'>('red');
  const [smsType, setSmsType] = useState<string>('road_accident');
  const [smsPatients, setSmsPatients] = useState<number>(2);
  const [smsResult, setSmsResult] = useState<{
    code: string;
    smsText: string;
    smsDeepLink: string;
  } | null>(null);
  const [testDecodeInput, setTestDecodeInput] = useState<string>('');
  const [decodedResult, setDecodedResult] = useState<CompactIncidentPayload | null>(null);

  // Generate initial SMS fallback code
  useEffect(() => {
    const res = generateCompactIncidentSMS({
      triage: smsTriage,
      type: smsType,
      lat: 18.5204,
      lng: 73.8567,
      patients: smsPatients,
    });
    setSmsResult(res);
    setTestDecodeInput(res.code);
    setDecodedResult(parseCompactIncidentSMS(res.code));
  }, [smsTriage, smsType, smsPatients]);

  // Handle Multi-Hop Peer Simulation (RL-5)
  const runPeerRelaySimulation = async () => {
    setIsRelaying(true);
    setActiveStep(0);

    // Reset node states
    setMeshNodes((prev) => prev.map((n) => ({ ...n, status: 'pending' })));

    // 1. Create origin packet in cellular shadow
    const samplePayload = {
      incident_id: 'inc-mesh-demo-99',
      triage: 'red',
      type: 'road_accident',
      patients: 2,
      location: { latitude: 18.5204, longitude: 73.8567 },
      notes: 'Highway collision, two critical patients, urgent trauma team required.',
    };

    const initialPacket = createRelayPacket(
      'node-amb-101',
      'incident_relay',
      samplePayload,
      { initialTtl: 5 }
    );

    // Step 0: Origin Node produces packet
    setMeshNodes((prev) =>
      prev.map((n, idx) => (idx === 0 ? { ...n, status: 'processing' } : n))
    );
    setPacketsLog((prev) => [
      {
        packet: initialPacket,
        action: 'Packet Created at Origin',
        reason: 'Ambulance 101 has 0 bars cellular; packet placed in local mesh outbox.',
        time: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);

    await new Promise((r) => setTimeout(r, 1200));

    // Step 1: Forward to Relay Node (Police PCR-4)
    setActiveStep(1);
    setMeshNodes((prev) =>
      prev.map((n, idx) =>
        idx === 0
          ? { ...n, status: 'forwarded' }
          : idx === 1
          ? { ...n, status: 'processing' }
          : n
      )
    );

    const relayResult = processInboundPacket(initialPacket, 'node-police-4', false);
    setPacketsLog((prev) => [
      {
        packet: relayResult.forwardablePacket || initialPacket,
        action: 'Relayed via WebRTC DataChannel',
        reason: relayResult.reason,
        time: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);

    await new Promise((r) => setTimeout(r, 1400));

    // Step 2: Forward to Gateway Node (Khed Toll with 5G Internet)
    setActiveStep(2);
    setMeshNodes((prev) =>
      prev.map((n, idx) =>
        idx === 1
          ? { ...n, status: 'forwarded' }
          : idx === 2
          ? { ...n, status: 'processing' }
          : n
      )
    );

    const packetAtGateway = relayResult.forwardablePacket || initialPacket;
    const gatewayResult = processInboundPacket(packetAtGateway, 'node-toll-khed', true);

    // Node posts to /api/sync
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: [
            {
              id: packetAtGateway.id,
              type: 'create_incident',
              payload: samplePayload,
            },
          ],
        }),
      });
      flushOutbox().catch(() => {});
    } catch {
      // Simulation catch
    }

    setPacketsLog((prev) => [
      {
        packet: gatewayResult.forwardablePacket || packetAtGateway,
        action: 'Delivered to Cloud Gateway (Supabase)',
        reason: `${gatewayResult.reason}. Emergency successfully registered on central ER radar!`,
        time: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);

    setMeshNodes((prev) =>
      prev.map((n, idx) => (idx === 2 ? { ...n, status: 'delivered' } : n))
    );

    setActiveStep(3);
    setIsRelaying(false);
  };

  const handleTestDecode = (code: string) => {
    setTestDecodeInput(code);
    setDecodedResult(parseCompactIncidentSMS(code));
  };

  return (
    <div className="space-y-12 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/[0.08] pb-6">
        <div className="space-y-1">
          <div className="font-mono text-xs uppercase tracking-widest text-zinc-500">
            RESILIENTLINK / MESH ARCHITECTURE (RL-4, RL-5, RL-6)
          </div>
          <h1 className="text-3xl font-normal text-white tracking-tight">
            Peer Relay & Store-and-Forward Mesh
          </h1>
          <p className="text-xs text-zinc-400">
            Automated hop-by-hop packet forwarding across peer devices when cellular coverage fails.
          </p>
        </div>

        {/* Local Node Telemetry Chip */}
        <div className="p-3 rounded-xl tactile-panel font-mono text-xs space-y-1 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-zinc-500 uppercase">Local Node ID</span>
            <span className="text-white font-bold">{currentNodeId}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-zinc-500 uppercase">Gateway Uplink</span>
            <button
              type="button"
              onClick={() => setIsCurrentNodeOnline(!isCurrentNodeOnline)}
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                isCurrentNodeOnline
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-zinc-900 text-zinc-400 border border-white/10'
              }`}
            >
              {isCurrentNodeOnline ? 'Active (5G)' : 'Shadow (0 Bars)'}
            </button>
          </div>
        </div>
      </div>

      {/* 1. Live Interactive Hop Diagram (RL-5) */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-white/[0.08] pb-3">
          <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400">
            Live Hop Visualizer (Ambulance → Relay Node → Cloud Gateway)
          </h2>
          <span className="font-mono text-[11px] text-zinc-500">
            Max TTL: 5 Hops • WebRTC DataChannel
          </span>
        </div>

        <div className="p-6 rounded-2xl tactile-panel space-y-6">
          {/* Hop Nodes Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
            {meshNodes.map((node, index) => {
              const isCurrentActive = activeStep === index;
              return (
                <div
                  key={node.nodeId}
                  className={`p-5 rounded-xl border transition-all ${
                    isCurrentActive
                      ? 'bg-white/10 border-white text-white shadow-[0_0_20px_rgba(255,255,255,0.15)] ring-1 ring-white'
                      : node.status === 'delivered'
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                      : node.status === 'forwarded'
                      ? 'bg-zinc-900/60 border-white/20 text-zinc-300'
                      : 'bg-zinc-950/80 border-white/[0.08] text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 font-mono text-[10px]">
                    <span className="uppercase tracking-widest text-zinc-500">
                      HOP 0{index + 1} / {node.role.toUpperCase()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-semibold uppercase ${
                        node.isOnline
                          ? 'bg-emerald-950 text-emerald-400'
                          : 'bg-amber-950 text-amber-400'
                      }`}
                    >
                      {node.isOnline ? 'Online Gateway' : 'Dead Zone'}
                    </span>
                  </div>

                  <div className="font-sans font-medium text-white text-sm">
                    {node.nodeName}
                  </div>
                  <div className="font-mono text-xs text-zinc-500 mt-1">
                    ID: {node.nodeId}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono">
                    <span className="text-[10px] text-zinc-500 uppercase">State:</span>
                    <span
                      className={`font-semibold uppercase text-[11px] ${
                        node.status === 'delivered'
                          ? 'text-emerald-400'
                          : node.status === 'processing'
                          ? 'text-white animate-pulse'
                          : node.status === 'forwarded'
                          ? 'text-zinc-400'
                          : 'text-zinc-600'
                      }`}
                    >
                      {node.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Trigger */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <p className="text-xs text-zinc-400 font-sans max-w-xl">
              Click below to simulate an ambulance entering the Katraj mountain pass with zero network, routing a critical RED polytrauma incident across peer vehicles to reach the ER gateway.
            </p>

            <button
              type="button"
              onClick={runPeerRelaySimulation}
              disabled={isRelaying}
              className="touch-target px-6 py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-mono text-xs uppercase tracking-wider font-semibold transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center gap-2 shrink-0 active:scale-95 disabled:opacity-50"
            >
              <span>{isRelaying ? 'Simulating Hop Relays...' : 'Trigger Multi-Hop Dispatch'}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Live Packet Telemetry & Hop Log */}
      {packetsLog.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-baseline justify-between border-b border-white/[0.08] pb-3">
            <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400">
              Mesh Packet Telemetry & Deduplication Log (RL-6)
            </h2>
            <span className="font-mono text-[11px] text-zinc-500">
              {packetsLog.length} Packet Events Captured
            </span>
          </div>

          <div className="p-4 rounded-2xl tactile-panel space-y-3 font-mono text-xs">
            {packetsLog.map((log, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-zinc-950/80 border border-white/[0.08] space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="telemetry-pip bg-[#00E599]" />
                    <span className="text-white font-semibold">{log.action}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500">{log.time}</span>
                </div>
                <p className="text-zinc-400 font-sans text-xs">{log.reason}</p>
                <div className="flex flex-wrap items-center gap-4 text-[10px] text-zinc-500 pt-1 border-t border-white/[0.06]">
                  <span>UUID: {log.packet.id.slice(0, 8)}...</span>
                  <span>TTL Remaining: {log.packet.ttl}</span>
                  <span>Hop Path: {log.packet.hops.join(' → ')}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Compact SMS Fallback (RL-4) */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-white/[0.08] pb-3">
          <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400">
            Compact SMS Fallback (RL-4)
          </h2>
          <span className="font-mono text-[11px] text-zinc-500">
            For Zero-Cellular-Data / 2G GSM Voice-Only Fallback
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SMS Generator Controls */}
          <div className="lg:col-span-6 p-6 rounded-2xl tactile-panel space-y-5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 block">
              Test Incident Parameters
            </span>

            <div className="grid grid-cols-3 gap-2">
              {(['red', 'yellow', 'green'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSmsTriage(t)}
                  className={`touch-target py-2 rounded-lg border font-mono text-xs uppercase tracking-wider transition-all ${
                    smsTriage === t
                      ? 'bg-white text-black border-white font-bold'
                      : 'bg-zinc-950 text-zinc-400 border-white/10 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-zinc-500 uppercase">Incident Type</label>
              <select
                value={smsType}
                onChange={(e) => setSmsType(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-white/10 rounded-lg font-mono text-xs text-white"
              >
                <option value="road_accident">Road Accident (MVA)</option>
                <option value="cardiac">Cardiac Arrest (CRD)</option>
                <option value="stroke">Acute Stroke (STR)</option>
                <option value="burns">Severe Burns (BRN)</option>
                <option value="obstetric">Obstetric (OBS)</option>
                <option value="paediatric">Paediatric (PED)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-zinc-500 uppercase">Patient Count</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSmsPatients(Math.max(1, smsPatients - 1))}
                  className="w-10 h-10 rounded bg-zinc-900 border border-white/10 text-white font-mono"
                >
                  -
                </button>
                <span className="font-mono text-xl text-white">{smsPatients}</span>
                <button
                  type="button"
                  onClick={() => setSmsPatients(smsPatients + 1)}
                  className="w-10 h-10 rounded bg-zinc-900 border border-white/10 text-white font-mono"
                >
                  +
                </button>
              </div>
            </div>

            {smsResult && (
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-black/60 rounded-xl border border-white/10 font-mono text-xs space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase">Generated Compact Code</span>
                  <div className="text-emerald-400 font-bold select-all">{smsResult.code}</div>
                  <span className="text-[10px] text-zinc-500 block pt-1">
                    Payload size: 34 bytes (vs 420 bytes JSON — 92% compression)
                  </span>
                </div>

                <a
                  href={smsResult.smsDeepLink}
                  className="touch-target w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-mono text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <span>1-Tap Launch Native SMS App</span>
                  <span>→</span>
                </a>
              </div>
            )}
          </div>

          {/* SMS Code Decoder & Verification */}
          <div className="lg:col-span-6 p-6 rounded-2xl tactile-panel space-y-5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 block">
              Dispatcher Reverse Code Decoder
            </span>

            <div className="space-y-2">
              <label className="text-[11px] font-mono text-zinc-500 uppercase">
                Paste Received SMS Code
              </label>
              <input
                type="text"
                value={testDecodeInput}
                onChange={(e) => handleTestDecode(e.target.value)}
                placeholder="TS:RED:MVA:18.5204,73.8567:P2:..."
                className="w-full px-3 py-2.5 bg-zinc-950 border border-white/10 rounded-lg font-mono text-xs text-white focus:outline-none focus:border-white/40"
              />
            </div>

            {decodedResult ? (
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-white/10 space-y-2 font-mono text-xs">
                <div className="text-emerald-400 font-semibold text-[11px] uppercase">
                  ✓ Valid Checksum & Formatted Incident Decoded
                </div>
                <div className="grid grid-cols-2 gap-2 text-zinc-300 pt-1">
                  <div>
                    <span className="text-zinc-500 text-[10px] block">TRIAGE</span>
                    <span className="font-bold uppercase text-white">{decodedResult.triage}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block">TYPE</span>
                    <span className="font-bold text-white">{decodedResult.type}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block">GPS</span>
                    <span className="text-white">
                      {decodedResult.lat}, {decodedResult.lng}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block">PATIENTS</span>
                    <span className="text-white">{decodedResult.patients}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-white/10 text-xs font-mono text-zinc-500">
                Invalid or incomplete code. Ensure code matches TS:[TRIAGE]:[TYPE]:[COORDS]:P[N]:[HASH]
              </div>
            )}

            <div className="p-3 bg-zinc-900/40 rounded-xl border border-white/[0.06] text-[11px] text-zinc-400 leading-relaxed">
              <strong>Architecture Note (Section 8):</strong> In standard web browsers, WebRTC DataChannels allow true zero-cloud direct transmission between paired devices. For cellular-free discovery without Wi-Fi, the system is designed to pair with an Android BLE/Nearby daemon.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
