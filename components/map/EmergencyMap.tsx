'use client';

import React, { useState } from 'react';
import { Hospital, Ambulance, GeoLocation } from '@/lib/types/database';
import { Building2, Ambulance as AmbulanceIcon, AlertCircle, Navigation } from 'lucide-react';

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

  // Pune bounding box for coordinate mapping:
  // Lat: ~18.45 to 18.75, Lon: ~73.65 to 73.95
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
    <div className="rounded-2xl glass-panel-glow border-cyan-500/30 overflow-hidden space-y-0">
      {/* Map Control Bar */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-cyan-400" />
          <span className="font-black text-sm text-white tracking-wide">
            Live Tactical Pune Grid (OSM / OSRM Telemetry)
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('grid')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              activeTab === 'grid'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Hospitals ({hospitals.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fleet')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              activeTab === 'fleet'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Fleet ({ambulances.length})
          </button>
        </div>
      </div>

      {/* High-Contrast Tactical Canvas Map */}
      <div className="relative w-full h-[400px] sm:h-[480px] bg-[#030611] overflow-hidden border-b border-slate-800 select-none">
        {/* Subtle Map Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:40px_40px] opacity-40 pointer-events-none" />

        {/* Pune Landmark Water Body Indicator (Mula-Mutha River line) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          <path
            d="M 10 320 Q 250 280, 500 240 T 990 200"
            fill="none"
            stroke="#0284c7"
            strokeWidth="8"
          />
        </svg>

        {/* Dynamic Route Polyline if Incident and Destination are active */}
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
                  stroke="#00f0ff"
                  strokeWidth="3"
                  strokeDasharray="6 4"
                  className="animate-pulse"
                />
              );
            })()}
          </svg>
        )}

        {/* 1. Hospitals Markers */}
        {hospitals.map((hosp) => {
          const coords = toMapCoords(hosp.location);
          const isSelected = hosp.id === selectedHospitalId;
          const isFullIcu = hosp.id === 'hosp-003';
          const isNoTrauma = hosp.id === 'hosp-004';
          const isExcluded = isFullIcu || isNoTrauma;

          return (
            <div
              key={hosp.id}
              style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 transition-transform ${
                isSelected ? 'scale-125 z-30' : 'hover:scale-110'
              }`}
            >
              <div
                className={`relative flex items-center justify-center w-8 h-8 rounded-xl border shadow-lg ${
                  isSelected
                    ? 'bg-cyan-500 border-white text-slate-950 shadow-cyan-500/50'
                    : isExcluded
                    ? 'bg-red-950/80 border-red-500 text-red-300 shadow-red-950/50'
                    : 'bg-slate-900 border-emerald-500/60 text-emerald-300 shadow-emerald-950/30'
                }`}
                title={`${hosp.name} (Level ${hosp.level})`}
              >
                <Building2 className="w-4 h-4 stroke-[2.5]" />
                {isSelected && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
                )}
              </div>
              <div className="absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-800 text-[10px] font-bold text-slate-200 pointer-events-none">
                {hosp.name.split(' ')[0]}
              </div>
            </div>
          );
        })}

        {/* 2. Ambulances Markers */}
        {ambulances.map((amb) => {
          const coords = toMapCoords(amb.location);
          const isActive = amb.id === activeAmbulanceId;

          return (
            <div
              key={amb.id}
              style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 transition-transform ${
                isActive ? 'scale-125 z-30' : 'hover:scale-110'
              }`}
            >
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-lg border shadow-lg ${
                  isActive
                    ? 'bg-cyan-400 border-white text-slate-950 animate-pulse'
                    : amb.status === 'en_route'
                    ? 'bg-amber-500 border-amber-300 text-slate-950'
                    : 'bg-slate-800 border-slate-600 text-slate-300'
                }`}
                title={`${amb.callsign} (${amb.status})`}
              >
                <AmbulanceIcon className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-cyan-300 pointer-events-none">
                {amb.callsign}
              </div>
            </div>
          );
        })}

        {/* 3. Incident Location Beacon */}
        {incidentLocation && (
          <div
            style={{
              left: `${toMapCoords(incidentLocation).x}%`,
              top: `${toMapCoords(incidentLocation).y}%`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
          >
            <div className="relative flex items-center justify-center w-8 h-8">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white shadow-xl shadow-red-600/50">
                <AlertCircle className="w-4 h-4" />
              </span>
            </div>
            <div className="absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full bg-red-950 border border-red-700 text-[10px] font-black text-red-200">
              EMERGENCY SITE
            </div>
          </div>
        )}
      </div>

      {/* Legend & Grid Summary Footer */}
      <div className="p-4 bg-slate-950 text-xs flex flex-wrap items-center justify-between gap-4 text-slate-300">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-300" />
            <span>Hospital Ready</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 border border-red-400" />
            <span>Capacity Excluded (Full ICU/No Bay)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-lg bg-cyan-400" />
            <span>Active Ambulance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <span>Emergency Site</span>
          </div>
        </div>

        {selectedHospital && (
          <div className="text-cyan-300 font-bold">
            Target: {selectedHospital.name}
          </div>
        )}
      </div>
    </div>
  );
}
