import { openDB, IDBPDatabase } from 'idb';

export type OutboxActionType =
  | 'create_incident'
  | 'scan_alert'
  | 'voice_handover'
  | 'update_incident';

export interface OutboxEvent<T = Record<string, unknown>> {
  id: string; // Client UUID (Idempotency Key)
  type: OutboxActionType;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH';
  payload: T;
  createdAt: number;
  attempts: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  lastError?: string;
  vectorClock?: Record<string, number>;
}

export interface OutboxSummary {
  total: number;
  pending: number;
  synced: number;
  failed: number;
}

const DB_NAME = 'triagesync_resilient_store';
const STORE_NAME = 'outbox_events';
const DB_VERSION = 1;

// In-memory fallback cache for Node/Vitest test environments and SSR
const inMemoryOutbox: Map<string, OutboxEvent> = new Map();

/**
 * Returns an IndexedDB instance if running in browser with IDB support,
 * or null in SSR / Node.js test environments.
 */
async function getIDB(): Promise<IDBPDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return null;
  }
  try {
    return await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      },
    });
  } catch {
    return null;
  }
}

/**
 * Generate a client UUID (RFC4122 v4 compatible) for idempotency.
 */
export function generateClientUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Enqueue a critical write event into the offline outbox (RL-1, RL-6).
 * Idempotent: If an event with the same ID already exists, it is deduplicated.
 */
export async function enqueueOutboxEvent<T extends Record<string, unknown>>(
  event: Omit<OutboxEvent<T>, 'createdAt' | 'attempts' | 'status' | 'id'> & {
    id?: string;
    createdAt?: number;
    attempts?: number;
    status?: OutboxEvent['status'];
  }
): Promise<OutboxEvent<T>> {
  const finalId = event.id || generateClientUUID();
  const existing = await getOutboxEvent(finalId);

  if (existing) {
    // Idempotency: Deduplicate event
    return existing as OutboxEvent<T>;
  }

  const outboxEvent: OutboxEvent<T> = {
    id: finalId,
    type: event.type,
    endpoint: event.endpoint,
    method: event.method,
    payload: event.payload,
    createdAt: event.createdAt ?? Date.now(),
    attempts: event.attempts ?? 0,
    status: event.status ?? 'pending',
    lastError: event.lastError,
    vectorClock: event.vectorClock || { client: Date.now() },
  };

  const db = await getIDB();
  if (db) {
    await db.put(STORE_NAME, outboxEvent);
  } else {
    inMemoryOutbox.set(finalId, outboxEvent as OutboxEvent);
  }

  notifyOutboxListeners();
  return outboxEvent;
}

/**
 * Retrieve a specific outbox event by ID.
 */
export async function getOutboxEvent(id: string): Promise<OutboxEvent | null> {
  const db = await getIDB();
  if (db) {
    const found = await db.get(STORE_NAME, id);
    return found || null;
  }
  return inMemoryOutbox.get(id) || null;
}

/**
 * List all events currently in the outbox.
 */
export async function listOutboxEvents(): Promise<OutboxEvent[]> {
  const db = await getIDB();
  if (db) {
    return await db.getAll(STORE_NAME);
  }
  return Array.from(inMemoryOutbox.values()).sort((a, b) => a.createdAt - b.createdAt);
}

/**
 * Get count summary of outbox events (RL-7).
 */
export async function getOutboxSummary(): Promise<OutboxSummary> {
  const all = await listOutboxEvents();
  return {
    total: all.length,
    pending: all.filter((e) => e.status === 'pending' || e.status === 'syncing').length,
    synced: all.filter((e) => e.status === 'synced').length,
    failed: all.filter((e) => e.status === 'failed').length,
  };
}

/**
 * Update an existing outbox event's state.
 */
export async function updateOutboxEvent(event: OutboxEvent): Promise<void> {
  const db = await getIDB();
  if (db) {
    await db.put(STORE_NAME, event);
  } else {
    inMemoryOutbox.set(event.id, event);
  }
  notifyOutboxListeners();
}

/**
 * Remove an event from the outbox after verified sync.
 */
export async function removeOutboxEvent(id: string): Promise<void> {
  const db = await getIDB();
  if (db) {
    await db.delete(STORE_NAME, id);
  } else {
    inMemoryOutbox.delete(id);
  }
  notifyOutboxListeners();
}

/**
 * Clear the in-memory outbox (useful for unit testing).
 */
export function resetInMemoryOutbox(): void {
  inMemoryOutbox.clear();
}

/**
 * Flush all pending outbox events to the server (RL-1, RL-6).
 * Handles network failures gracefully, updates retry counts, and preserves client idempotency.
 */
export async function flushOutbox(customFetch?: typeof fetch): Promise<{
  syncedIds: string[];
  failedIds: string[];
}> {
  const fetchFn = customFetch || (typeof window !== 'undefined' ? window.fetch.bind(window) : fetch);
  const events = await listOutboxEvents();
  const pending = events.filter((e) => e.status === 'pending' || (e.status === 'failed' && e.attempts < 5));

  const syncedIds: string[] = [];
  const failedIds: string[] = [];

  for (const event of pending) {
    event.status = 'syncing';
    await updateOutboxEvent(event);

    try {
      const response = await fetchFn(event.endpoint, {
        method: event.method,
        headers: {
          'Content-Type': 'application/json',
          'X-Client-UUID': event.id,
          'X-Client-Timestamp': String(event.createdAt),
        },
        body: JSON.stringify({
          ...event.payload,
          _outbox_id: event.id,
          _client_timestamp: event.createdAt,
        }),
      });

      if (response.ok) {
        event.status = 'synced';
        event.attempts += 1;
        await updateOutboxEvent(event);
        syncedIds.push(event.id);
      } else {
        const errorText = await response.text();
        event.status = 'failed';
        event.attempts += 1;
        event.lastError = `HTTP ${response.status}: ${errorText.slice(0, 100)}`;
        await updateOutboxEvent(event);
        failedIds.push(event.id);
      }
    } catch (err: unknown) {
      event.status = 'failed';
      event.attempts += 1;
      event.lastError = err instanceof Error ? err.message : 'Network failure';
      await updateOutboxEvent(event);
      failedIds.push(event.id);
    }
  }

  notifyOutboxListeners();
  return { syncedIds, failedIds };
}

/**
 * Conflict resolution logic (RL-6): Last-Write-Wins with Vector Clocks.
 */
export function resolveOutboxConflict<T extends { updated_at?: string; version?: number }>(
  incoming: T,
  existing: T
): { resolved: T; source: 'incoming' | 'existing' } {
  // 1. Explicit version number comparison
  if (typeof incoming.version === 'number' && typeof existing.version === 'number') {
    if (incoming.version > existing.version) return { resolved: incoming, source: 'incoming' };
    if (existing.version > incoming.version) return { resolved: existing, source: 'existing' };
  }

  // 2. ISO timestamp LWW comparison
  const incomingTime = incoming.updated_at ? new Date(incoming.updated_at).getTime() : 0;
  const existingTime = existing.updated_at ? new Date(existing.updated_at).getTime() : 0;

  if (incomingTime >= existingTime) {
    return { resolved: incoming, source: 'incoming' };
  }
  return { resolved: existing, source: 'existing' };
}

// Event notification callbacks for live UI reactivity
type OutboxListener = () => void;
const listeners: Set<OutboxListener> = new Set();

export function subscribeOutbox(listener: OutboxListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyOutboxListeners() {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // Ignore listener error
    }
  }
}
