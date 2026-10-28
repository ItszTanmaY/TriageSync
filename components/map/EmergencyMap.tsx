'use client';

import React, { useState } from 'react';
import { Hospital, Ambulance, GeoLocation } from '@/lib/types/database';

interface EmergencyMapProps {
  hospitals: Hospital[];
  ambulances: Ambulance[];
  incidentLocation?: GeoLocation | null;
  selectedHospitalId?: string | null;
  activeAmbulanceId?: string | null;
}

export function EmergencyMap({
  hospitals,
  ambulances,
  incidentLocation,
  selectedHospitalId,
  activeAmbulanceId,
}: EmergencyMapProps) {
  const [activeTab, setActiveTab] = useState<'grid' | 'fleet'>('grid');

  const minLat = 18.44;
  const maxLat = 18.76;
  const minLon = 73.65;
  const maxLon = 73.95;

  const toMapCoords = (loc: GeoLocation) => {
    const x = ((loc.longitude - minLon) / (maxLon - minLon)) * 100;
    const y = (1 - (loc.latitude - minLat) / (maxLat - minLat)) * 100;
    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
    };
  };

  const selectedHospital = hospitals.find((h) => h.id === selectedHospitalId);

  return (
    <div className="rounded-2xl tactile-panel overflow-hidden">
      {/* Map Header */}
      <div className="p-4 bg-black/60 border-b border-white/[0.08] flex items-center justify-between font-mono text-xs">
        <span className="uppercase tracking-widest text-zinc-400">
          Pune Sector Telemetry / Vector Map
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('grid')}
            className={`px-3 py-1 rounded-md uppercase tracking-wider transition-colors ${
              activeTab === 'grid' ? 'bg-white text-black font-semibold' : 'text-zinc-500 hover:text-white'
            }`}
          >
            Hospitals ({hospitals.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fleet')}
            className={`px-3 py-1 rounded-md uppercase tracking-wider transition-colors ${
              activeTab === 'fleet' ? 'bg-white text-black font-semibold' : 'text-zinc-500 hover:text-white'
            }`}
          >
            Fleet ({ambulances.length})
          </button>
        </div>
      </div>

      {/* Vector Canvas */}
      <div className="relative w-full h-[420px] bg-[#020204] overflow-hidden select-none">
        {/* Hairline Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111116_1px,transparent_1px),linear-gradient(to_bottom,#111116_1px,transparent_1px)] bg-[size:36px_36px] opacity-60 pointer-events-none" />

        {/* River outline */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          <path
            d="M 10 320 Q 250 280, 500 240 T 990 200"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3"
            strokeDasharray="4 4"
          />
        </svg>

        {/* Route Line */}
        {incidentLocation && selectedHospital && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            {(() => {
              const start = toMapCoords(incidentLocation);
              const end = toMapCoords(selectedHospital.location);
              return (
                <line
                  x1={`${start.x}%`}
                  y1={`${start.y}%`}
                  x2={`${end.x}%`}
                  y2={`${end.y}%`}
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  className="animate-pulse"
                />
              );
            })()}
          </svg>
        )}

        {/* Hospitals */}
        {hospitals.map((hosp) => {
          const coords = toMapCoords(hosp.location);
          const isSelected = hosp.id === selectedHospitalId;
          const isExcluded = hosp.id === 'hosp-003' || hosp.id === 'hosp-004';

          return (
            <div
              key={hosp.id}
              style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 transition-transform ${
                isSelected ? 'scale-125 z-30' : 'hover:scale-110'
              }`}
            >
              <div
                className={`relative w-4 h-4 rounded-full border ${
                  isSelected
                    ? 'bg-white border-white shadow-[0_0_12px_#ffffff]'
                    : isExcluded
                    ? 'bg-[#FF2A44] border-[#FF2A44] opacity-50'
                    : 'bg-[#00E599] border-[#00E599]'
                }`}
                title={hosp.name}
              />
              <div className="absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded bg-black/90 border border-white/10 font-mono text-[9px] text-zinc-300 pointer-events-none">
                {hosp.name.split(' ')[0]}
              </div>
            </div>
          );
        })}

        {/* Ambulances */}
        {ambulances.map((amb) => {
          const coords = toMapCoords(amb.location);
          const isActive = amb.id === activeAmbulanceId;

          return (
            <div
              key={amb.id}
              style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 ${
                isActive ? 'scale-125 z-30' : ''
              }`}
            >
              <div
                className={`w-3 h-3 rotate-45 border ${
                  isActive
                    ? 'bg-white border-white animate-pulse'
                    : 'bg-zinc-700 border-zinc-500'
                }`}
                title={amb.callsign}
              />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[8px] text-zinc-500 pointer-events-none">
                {amb.callsign}
              </div>
            </div>
          );
        })}

        {/* Emergency Incident Site */}
        {incidentLocation && (
          <div
            style={{
              left: `${toMapCoords(incidentLocation).x}%`,
              top: `${toMapCoords(incidentLocation).y}%`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
          >
            <div className="relative flex items-center justify-center w-6 h-6">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF2A44] opacity-60" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF2A44] shadow-[0_0_10px_#FF2A44]" />
            </div>
            <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] uppercase px-1.5 py-0.5 bg-black border border-[#FF2A44]/50 text-[#FF2A44]">
              INCIDENT SITE
            </div>
          </div>
        )}
      </div>

      {/* Legend Footer */}
      <div className="p-3 bg-black/80 font-mono text-[10px] text-zinc-500 flex flex-wrap items-center justify-between gap-4 uppercase tracking-wider">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="telemetry-pip bg-[#00E599]" />
            <span>Hospital Ready</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="telemetry-pip bg-[#FF2A44]" />
            <span>Capacity Excluded</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rotate-45 bg-zinc-400" />
            <span>Fleet Unit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="telemetry-pip bg-[#FF2A44] animate-ping" />
            <span>Emergency Site</span>
          </div>
        </div>

        {selectedHospital && (
          <div className="text-white">
            TARGET: {selectedHospital.name.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}
