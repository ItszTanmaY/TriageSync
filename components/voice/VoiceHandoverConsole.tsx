'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Activity,
  Droplets,
  ShieldAlert,
  Send,
  RotateCcw,
  Pause,
  Play,
  Volume2,
  Stethoscope,
  Clock,
  CheckSquare
} from 'lucide-react';
import { HandoverStructuredData } from '@/lib/types/database';
import { PreArrivalChecklistItem, generatePreArrivalChecklist } from '@/lib/voice/parser';
import { enqueueOutboxEvent, flushOutbox } from '@/lib/offline/outbox';

// Web Speech API TypeScript Definitions
interface SpeechRecognitionResultItem {
  transcript: string;
  confidence?: number;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: {
    [index: number]: SpeechRecognitionResultItem;
  };
}

interface ISpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface ISpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface ISpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => ISpeechRecognitionInstance;

interface IWindow extends Window {
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
  SpeechRecognition?: SpeechRecognitionConstructor;
}

interface VoiceHandoverConsoleProps {
  incidentId: string;
  patientId: string;
  hospitalId?: string;
  hospitalName?: string;
  onHandoverConfirmed?: (data: HandoverStructuredData) => void;
}

const PRESET_SCENARIOS = [
  {
    id: 'mvc-en',
    title: 'Highway Rollover MVC',
    lang: 'en' as const,
    langLabel: 'English (IN)',
    tag: 'Polytrauma',
    color: 'from-rose-500/20 to-red-600/30 text-rose-400 border-rose-500/30',
    transcript:
      '36 year old male involved in high-speed rollover MVC on Pune expressway. Patient has flail chest, suspected spleen laceration, and left femur fracture. Heart rate is 128, BP is 85/50, SpO2 88 percent on room air, GCS 11. Cervical collar applied, two large bore IV lines running saline, high flow oxygen mask on. We require 2 units of O negative blood, trauma surgeon at bedside, and emergency OT held on arrival. ETA 8 minutes.',
  },
  {
    id: 'stemi-hi',
    title: 'तीव्र दिल का दौरा (STEMI)',
    lang: 'hi' as const,
    langLabel: 'हिंदी (Hindi)',
    tag: 'Cardiac',
    color: 'from-amber-500/20 to-orange-600/30 text-amber-400 border-amber-500/30',
    transcript:
      '54 वर्षीय पुरुष, सीने में तेज दर्द और पसीना. Acute STEMI, pulse 110, BP 90/60, oxygen 92%. Aspirin and Sorbitrate given. ETA 12 minutes. Cath lab and cardiologist alert required.',
  },
  {
    id: 'neuro-mr',
    title: 'गंभीर दुचाकी अपघात (TBI)',
    lang: 'mr' as const,
    langLabel: 'मराठी (Marathi)',
    tag: 'Neuro Trauma',
    color: 'from-cyan-500/20 to-blue-600/30 text-cyan-400 border-cyan-500/30',
    transcript:
      '28 वर्षांचा तरुण, दुचाकी अपघात. डोक्याला गंभीर दुखापत आणि हाड मोडले. जीसीएस 9, pulse 120, BP 100/70. Oxygen mask attached. Neurosurgeon and ventilator preparation needed. 2 units blood ready.',
  },
];

export function VoiceHandoverConsole({
  incidentId,
  patientId,
  hospitalId = 'hosp-sahyadri',
  hospitalName = 'Sahyadri Super Speciality Hospital',
  onHandoverConfirmed,
}: VoiceHandoverConsoleProps) {
  // Speech & Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLang, setSelectedLang] = useState<'en' | 'hi' | 'mr'>('en');
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  // Structured Draft State
  const [handoverId, setHandoverId] = useState<string | null>(null);
  const [structured, setStructured] = useState<HandoverStructuredData | null>(null);
  const [checklist, setChecklist] = useState<PreArrivalChecklistItem[]>([]);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Auto-send Countdown State (10 seconds)
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const recognitionRef = useRef<ISpeechRecognitionInstance | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const win = window as unknown as IWindow;
      const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang =
          selectedLang === 'hi' ? 'hi-IN' : selectedLang === 'mr' ? 'mr-IN' : 'en-IN';

        recognition.onresult = (event: ISpeechRecognitionEvent) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          setTranscript(currentTranscript.trim());
        };

        recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
          console.warn('Speech recognition error:', event.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      } else {
        setSpeechSupported(false);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [selectedLang]);

  // Handle Push-to-Talk Toggle
  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsRecording(false);
      if (transcript.trim().length > 5) {
        parseTranscript(transcript, selectedLang);
      }
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.lang =
            selectedLang === 'hi' ? 'hi-IN' : selectedLang === 'mr' ? 'mr-IN' : 'en-IN';
          recognitionRef.current.start();
          setIsRecording(true);
        } catch (e) {
          console.warn('Could not start recognition directly:', e);
          setIsRecording(true);
        }
      } else {
        setIsRecording(true);
      }
    }
  };

  // Submit and Parse Transcript
  const parseTranscript = async (textToParse: string, lang: 'en' | 'hi' | 'mr') => {
    setIsProcessing(true);
    // Cancel any running countdown
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setCountdown(null);

    try {
      const res = await fetch('/api/handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_id: incidentId,
          patient_id: patientId,
          hospital_id: hospitalId,
          transcript: textToParse,
          language: lang,
        }),
      });

      const data = await res.json();
      if (data.success && data.structured) {
        setHandoverId(data.handover_id);
        setStructured(data.structured);
        setChecklist(data.checklist || generatePreArrivalChecklist(data.structured));
        // Start 10s auto-send countdown (SRS VH-6)
        startCountdown(data.handover_id, data.structured);
      }
    } catch (err) {
      console.error('Error parsing transcript:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-send Countdown Logic (10 seconds)
  const startCountdown = (hId: string, structData: HandoverStructuredData) => {
    setCountdown(10);
    setIsPaused(false);

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          confirmHandover(hId, structData);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const togglePauseCountdown = () => {
    if (isPaused) {
      // Resume
      setIsPaused(false);
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            if (handoverId && structured) confirmHandover(handoverId, structured);
            return 0;
          }
          return prev - 1;
        });
      });
    } else {
      // Pause
      setIsPaused(true);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }
  };

  const cancelCountdown = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setCountdown(null);
    setIsPaused(false);
  };

  // Confirm Handover to Hospital
  const confirmHandover = async (
    hId: string = handoverId || 'temp-id',
    structData: HandoverStructuredData = structured!
  ) => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setCountdown(null);

    const clientUuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `hnd-${Date.now()}`;
    const payload = {
      handover_id: hId,
      patient_id: patientId,
      hospital_id: hospitalId,
      structured: structData,
    };

    // 1. Enqueue in resilient offline outbox (RL-1, VH-7)
    try {
      await enqueueOutboxEvent({
        id: clientUuid,
        type: 'voice_handover',
        endpoint: `/api/handover/${hId}/confirm`,
        method: 'POST',
        payload,
      });
    } catch (e) {
      console.warn('Failed to enqueue handover', e);
    }

    try {
      if (typeof window !== 'undefined' && window.navigator.onLine) {
        const res = await fetch(`/api/handover/${hId}/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-UUID': clientUuid,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (data.success) {
          flushOutbox().catch(() => {});
          setIsConfirmed(true);
          if (onHandoverConfirmed) {
            onHandoverConfirmed(structData);
          }
          return;
        }
      }

      // Offline mode confirmation (VH-7)
      setIsConfirmed(true);
      if (onHandoverConfirmed) {
        onHandoverConfirmed(structData);
      }
    } catch (err) {
      console.error('Error confirming handover online, preserved in outbox:', err);
      setIsConfirmed(true);
      if (onHandoverConfirmed) {
        onHandoverConfirmed(structData);
      }
    }
  };

  // Quick Preset Scenario Trigger
  const loadScenario = (scenario: (typeof PRESET_SCENARIOS)[0]) => {
    setSelectedLang(scenario.lang);
    setTranscript(scenario.transcript);
    parseTranscript(scenario.transcript, scenario.lang);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-[#0A1128] p-5 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Stethoscope className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono tracking-widest text-cyan-400 font-semibold uppercase">
                  Paramedic Hands-Free Voice
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  SBAR / MIST Engine
                </span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Emergency Voice Handover Telemetry
              </h2>
              <p className="text-xs text-slate-400">
                Destination:{' '}
                <span className="font-semibold text-slate-200">{hospitalName}</span>
              </p>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-700/60">
            {(
              [
                { id: 'en', label: 'English (IN)' },
                { id: 'hi', label: 'हिंदी (Hindi)' },
                { id: 'mr', label: 'मराठी (Marathi)' },
              ] as const
            ).map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setSelectedLang(l.id)}
                className={`min-h-[48px] px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                  selectedLang === l.id
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preset Demo Clinical Scenarios (1-Tap Test Triggers) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Quick 1-Tap Clinical Presets (Live Demo)
          </span>
          <span className="text-[11px] text-slate-500">
            Click to auto-populate & test clinical parsing
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESET_SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => loadScenario(s)}
              className={`p-3.5 rounded-xl border bg-slate-900/80 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${s.color} hover:bg-slate-800 flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">{s.title}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/40">
                    {s.lang.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                  {s.transcript}
                </p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                <span>{s.tag}</span>
                <span className="font-semibold text-cyan-400">1-Tap Test →</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Push-To-Talk Workstation */}
      <div className="relative rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-black p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Pulsating Wave Background for Recording */}
        {isRecording && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-2xl">
            <div className="w-72 h-72 rounded-full bg-cyan-500/10 animate-ping opacity-60" />
            <div className="w-96 h-96 rounded-full bg-cyan-500/5 animate-pulse" />
          </div>
        )}

        {/* Big Touch-Target Push-to-Talk Button (>= 96px for gloved paramedic hand) */}
        <div className="relative mb-4">
          <button
            type="button"
            onClick={toggleRecording}
            className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl ${
              isRecording
                ? 'bg-gradient-to-tr from-rose-600 to-red-500 text-white scale-110 shadow-rose-500/50 ring-4 ring-rose-400/50 animate-pulse'
                : 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white hover:scale-105 shadow-cyan-500/40 ring-4 ring-cyan-500/20 active:scale-95'
            }`}
            style={{ minWidth: '96px', minHeight: '96px' }}
            aria-label={isRecording ? 'Stop Recording Handover' : 'Push to Talk Voice Handover'}
          >
            {isRecording ? (
              <>
                <MicOff className="w-10 h-10 mb-1" />
                <span className="text-[10px] font-bold tracking-widest uppercase">Release</span>
              </>
            ) : (
              <>
                <Mic className="w-10 h-10 mb-1" />
                <span className="text-[10px] font-bold tracking-widest uppercase">Hold to Speak</span>
              </>
            )}
          </button>
        </div>

        {/* Status indicator */}
        <div className="space-y-1">
          {!speechSupported && (
            <div className="mb-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Browser Speech API unavailable. Manual input & presets active.</span>
            </div>
          )}
          <div className="flex items-center justify-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isRecording
                  ? 'bg-red-500 animate-ping'
                  : isProcessing
                  ? 'bg-amber-400 animate-spin'
                  : 'bg-emerald-500'
              }`}
            />
            <span className="text-sm font-bold text-white">
              {isRecording
                ? 'Listening to clinical report... Speak naturally'
                : isProcessing
                ? 'Extracting clinical SBAR & generating checklist...'
                : 'Push button to speak or tap a scenario above'}
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-md">
            Uses clinical NLP to extract age, vitals (HR, BP, SpO2, GCS), injuries, and ER needs
            without fabricating data.
          </p>
        </div>

        {/* Live Audio Transcript Box */}
        <div className="w-full mt-5 text-left">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              Live Clinical Transcript
            </span>
            {transcript && (
              <button
                type="button"
                onClick={() => {
                  setTranscript('');
                  setStructured(null);
                  setChecklist([]);
                  cancelCountdown();
                }}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Dictated handover transcript appears here... (e.g. 36yo male, MVC rollover, HR 120, BP 90/60, need 2 units blood and trauma surgeon)"
            rows={3}
            className="w-full rounded-xl bg-slate-900/90 border border-slate-700 p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
          />

          {transcript && !structured && !isProcessing && (
            <div className="mt-2.5 flex justify-end">
              <button
                type="button"
                onClick={() => parseTranscript(transcript, selectedLang)}
                className="min-h-[48px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Analyze & Extract Clinical SBAR
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Auto-Send 10-Second Countdown Banner (SRS VH-6) */}
      {countdown !== null && structured && !isConfirmed && (
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-950 p-4 shadow-xl backdrop-blur-xl animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-12 h-12 rounded-full border-2 border-amber-400 text-amber-300 font-black text-lg">
                {countdown}
              </div>
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Auto-Sending to ER in {countdown} Seconds
                </h4>
                <p className="text-xs text-slate-300">
                  Review the structured SBAR below. You can pause, edit, or push immediately.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePauseCountdown}
                className="min-h-[48px] px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 hover:bg-slate-700 flex items-center gap-1.5"
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>

              <button
                type="button"
                onClick={cancelCountdown}
                className="min-h-[48px] px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-rose-400 hover:bg-rose-950/50 flex items-center gap-1.5"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => confirmHandover()}
                className="min-h-[48px] px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black shadow-lg shadow-emerald-500/30 hover:from-emerald-400 hover:to-teal-500 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Success Banner */}
      {isConfirmed && (
        <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 p-5 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">
                  Handover Dispatched to {hospitalName} ER!
                </h4>
                <p className="text-xs text-emerald-300">
                  Incoming patient card, vitals telemetry, and prep checklist are now live on the hospital dashboard.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 text-xs font-bold font-mono rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              TELEMETRY LIVE
            </span>
          </div>
        </div>
      )}

      {/* Structured Clinical Brief (SBAR / MIST) */}
      {structured && (
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/90 p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Structured SBAR / MIST Extraction</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Patient ID: {patientId.slice(0, 8)}...
            </span>
          </div>

          {/* Demographic & Mechanism Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Demographics
              </span>
              <p className="text-sm font-bold text-white mt-0.5">
                {structured.age ? `${structured.age} yrs` : 'Age Unspecified'} •{' '}
                {structured.sex || 'Sex Unspecified'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 md:col-span-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Mechanism of Injury
              </span>
              <p className="text-sm font-bold text-cyan-300 mt-0.5">
                {structured.mechanism || 'Blunt Trauma Evaluation'}
              </p>
            </div>
          </div>

          {/* Vitals Telemetry Grid */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Extracted Vitals
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* HR */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400">HEART RATE</span>
                  <p className="text-lg font-black text-rose-400">
                    {structured.vitals.hr ? `${structured.vitals.hr} bpm` : '—'}
                  </p>
                </div>
                <Heart className="w-5 h-5 text-rose-500/60" />
              </div>

              {/* BP */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400">BLOOD PRESSURE</span>
                  <p className="text-lg font-black text-amber-400">
                    {structured.vitals.bp || '—'}
                  </p>
                </div>
                <Activity className="w-5 h-5 text-amber-500/60" />
              </div>

              {/* SpO2 */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400">SpO2 SAT</span>
                  <p className="text-lg font-black text-cyan-400">
                    {structured.vitals.spo2 ? `${structured.vitals.spo2}%` : '—'}
                  </p>
                </div>
                <Droplets className="w-5 h-5 text-cyan-500/60" />
              </div>

              {/* GCS */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400">GLASGOW COMA</span>
                  <p className="text-lg font-black text-purple-400">
                    {structured.vitals.gcs ? `GCS ${structured.vitals.gcs}/15` : '—'}
                  </p>
                </div>
                <ShieldAlert className="w-5 h-5 text-purple-500/60" />
              </div>
            </div>
          </div>

          {/* Injuries & Field Interventions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Suspected Injuries
              </span>
              <div className="flex flex-wrap gap-1.5">
                {structured.injuries.map((inj, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-xs rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30"
                  >
                    {inj}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Interventions Performed
              </span>
              <div className="flex flex-wrap gap-1.5">
                {structured.interventions.map((intv, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-xs rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                  >
                    {intv}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Automated Hospital Pre-Arrival Action Checklist (SRS VH-5) */}
          <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-b from-slate-900 to-slate-950 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-cyan-400" />
                Hospital Pre-Arrival Preparation Checklist (Generated)
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Auto-assigned to ER trauma team
              </span>
            </div>

            <div className="space-y-2">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{item.title}</span>
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          item.urgency === 'critical'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {item.urgency}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                  </div>
                  <span className="text-xs font-mono text-cyan-400 uppercase">Pending ER</span>
                </div>
              ))}
            </div>
          </div>

          {/* Paramedic Manual Confirm Button */}
          {!isConfirmed && countdown === null && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => confirmHandover()}
                className="min-h-[48px] px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm shadow-xl shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Confirm & Push Handover to Hospital
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
