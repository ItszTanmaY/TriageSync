'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  getOutboxSummary,
  flushOutbox,
  subscribeOutbox,
  OutboxSummary,
} from '@/lib/offline/outbox';

export function ConnectivityIndicator() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [summary, setSummary] = useState<OutboxSummary>({
    total: 0,
    pending: 0,
    synced: 0,
    failed: 0,
  });
  const [isFlushing, setIsFlushing] = useState<boolean>(false);
  const [lastSyncMessage, setLastSyncMessage] = useState<string | null>(null);

  const handleFlush = useCallback(async () => {
    if (isFlushing) return;
    setIsFlushing(true);
    setLastSyncMessage(null);
    try {
      const res = await flushOutbox();
      const updated = await getOutboxSummary();
      setSummary(updated);
      if (res.syncedIds.length > 0) {
        setLastSyncMessage(`Synced ${res.syncedIds.length} item(s)`);
      }
    } catch {
      setLastSyncMessage('Sync failed (offline)');
    } finally {
      setIsFlushing(false);
    }
  }, [isFlushing]);

  useEffect(() => {
    // Initial online state
    if (typeof window !== 'undefined') {
      setIsOnline(window.navigator.onLine);
    }

    const updateSummary = async () => {
      try {
        const s = await getOutboxSummary();
        setSummary(s);
      } catch {
        // Ignore in environments without IDB
      }
    };

    updateSummary();
    const unsubscribe = subscribeOutbox(updateSummary);

    const handleOnline = () => {
      setIsOnline(true);
      if (!isSimulatedOffline) {
        handleFlush();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check every 10 seconds (ARCHITECTURE section 8)
    const interval = setInterval(() => {
      updateSummary();
      if (window.navigator.onLine && !isSimulatedOffline && summary.pending > 0) {
        handleFlush();
      }
    }, 10000);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isSimulatedOffline, summary.pending, handleFlush]);

  const toggleSimulatedOffline = () => {
    const next = !isSimulatedOffline;
    setIsSimulatedOffline(next);
    if (!next) {
      handleFlush();
    }
  };

  const effectiveOnline = isOnline && !isSimulatedOffline;

  return (
    <div className="flex items-center gap-2 font-mono text-[11px]">
      {/* Live Connectivity Pip */}
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${
          effectiveOnline
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
            : 'bg-amber-950/40 border-amber-500/40 text-amber-300 animate-pulse'
        }`}
        title={effectiveOnline ? 'All systems online' : 'Offline: writes routed to IndexedDB outbox'}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            effectiveOnline ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-amber-400'
          }`}
        />
        <span className="uppercase tracking-wider font-semibold">
          {effectiveOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Outbox Queued Items Count (RL-7) */}
      {summary.pending > 0 && (
        <button
          type="button"
          onClick={handleFlush}
          disabled={isFlushing || !effectiveOnline}
          className="touch-target px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all"
          title="Click to flush outbox"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>
            {isFlushing ? 'Syncing...' : `${summary.pending} Queued`}
          </span>
        </button>
      )}

      {lastSyncMessage && (
        <span className="text-[10px] text-zinc-500 hidden sm:inline">
          {lastSyncMessage}
        </span>
      )}

      {/* Chaos Simulator Switch for Hackathon Rehearsal & Judges (SIM-3) */}
      <button
        type="button"
        onClick={toggleSimulatedOffline}
        className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border transition-colors ${
          isSimulatedOffline
            ? 'bg-red-950/80 border-red-500/60 text-red-300 font-bold'
            : 'bg-black/40 border-white/10 text-zinc-500 hover:text-zinc-300'
        }`}
        title="Simulate cellular cut for live demo testing"
      >
        {isSimulatedOffline ? 'Sim: Cellular Cut' : 'Sim: Net Off'}
      </button>
    </div>
  );
}
