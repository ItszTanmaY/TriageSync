import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  enqueueOutboxEvent,
  listOutboxEvents,
  getOutboxSummary,
  flushOutbox,
  resolveOutboxConflict,
  resetInMemoryOutbox,
} from '../lib/offline/outbox';
import {
  createRelayPacket,
  processInboundPacket,
  generateCompactIncidentSMS,
  parseCompactIncidentSMS,
  resetSeenPacketIds,
} from '../lib/peer/relay';

describe('Phase 7: ResilientLink Offline Outbox & Peer Relay (RL-1..RL-7)', () => {
  beforeEach(() => {
    resetInMemoryOutbox();
    resetSeenPacketIds();
  });

  describe('7.1 Offline Outbox Store & Client UUID Idempotency (RL-1, RL-6)', () => {
    it('enqueues events with automatic client UUID and pending status', async () => {
      const event = await enqueueOutboxEvent({
        type: 'create_incident',
        endpoint: '/api/incidents',
        method: 'POST',
        payload: { triage: 'red', type: 'cardiac' },
      });

      expect(event.id).toBeDefined();
      expect(event.status).toBe('pending');
      expect(event.attempts).toBe(0);
      expect(event.createdAt).toBeGreaterThan(0);

      const all = await listOutboxEvents();
      expect(all.length).toBe(1);
      expect(all[0].id).toBe(event.id);
    });

    it('deduplicates events when same client UUID is re-submitted (Idempotency)', async () => {
      const fixedId = 'client-uuid-incident-001';

      const first = await enqueueOutboxEvent({
        id: fixedId,
        type: 'create_incident',
        endpoint: '/api/incidents',
        method: 'POST',
        payload: { attempt: 1 },
      });

      const second = await enqueueOutboxEvent({
        id: fixedId,
        type: 'create_incident',
        endpoint: '/api/incidents',
        method: 'POST',
        payload: { attempt: 2 },
      });

      expect(first.id).toBe(second.id);
      const all = await listOutboxEvents();
      expect(all.length).toBe(1);
    });

    it('calculates outbox summary counts accurately (RL-7)', async () => {
      await enqueueOutboxEvent({
        type: 'create_incident',
        endpoint: '/api/incidents',
        method: 'POST',
        payload: {},
      });
      await enqueueOutboxEvent({
        type: 'scan_alert',
        endpoint: '/api/scan/tok/alert',
        method: 'POST',
        payload: {},
      });

      const summary = await getOutboxSummary();
      expect(summary.total).toBe(2);
      expect(summary.pending).toBe(2);
      expect(summary.synced).toBe(0);
      expect(summary.failed).toBe(0);
    });
  });

  describe('7.2 Outbox Flush & Network Failure Retry Handling (RL-1)', () => {
    it('marks events as synced on successful response', async () => {
      await enqueueOutboxEvent({
        id: 'evt-sync-ok',
        type: 'create_incident',
        endpoint: '/api/incidents',
        method: 'POST',
        payload: { name: 'Emergency 1' },
      });

      const mockFetchSuccess = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      const result = await flushOutbox(mockFetchSuccess as unknown as typeof fetch);
      expect(result.syncedIds).toContain('evt-sync-ok');
      expect(result.failedIds.length).toBe(0);

      const summary = await getOutboxSummary();
      expect(summary.pending).toBe(0);
      expect(summary.synced).toBe(1);
    });

    it('increments attempts and marks failed on network error without losing data', async () => {
      await enqueueOutboxEvent({
        id: 'evt-sync-fail',
        type: 'scan_alert',
        endpoint: '/api/scan/alert',
        method: 'POST',
        payload: { gps: 'lost' },
      });

      const mockFetchFail = vi.fn().mockRejectedValue(new Error('Airplane mode active'));

      const result = await flushOutbox(mockFetchFail as unknown as typeof fetch);
      expect(result.failedIds).toContain('evt-sync-fail');
      expect(result.syncedIds.length).toBe(0);

      const summary = await getOutboxSummary();
      expect(summary.failed).toBe(1);

      const events = await listOutboxEvents();
      expect(events[0].attempts).toBe(1);
      expect(events[0].lastError).toContain('Airplane mode active');
    });
  });

  describe('7.3 Conflict Resolution: Last-Write-Wins (RL-6)', () => {
    it('resolves conflicts by version number when present', () => {
      const older = { id: 'inc-1', version: 1, updated_at: '2026-10-28T10:00:00Z', triage: 'yellow' };
      const newer = { id: 'inc-1', version: 2, updated_at: '2026-10-28T09:00:00Z', triage: 'red' };

      const res = resolveOutboxConflict(newer, older);
      expect(res.source).toBe('incoming');
      expect(res.resolved.version).toBe(2);
    });

    it('resolves conflicts by timestamp when versions are absent or equal', () => {
      const earlier = { id: 'inc-2', updated_at: '2026-10-28T10:00:00Z', status: 'created' };
      const later = { id: 'inc-2', updated_at: '2026-10-28T10:05:00Z', status: 'en_route' };

      const res = resolveOutboxConflict(later, earlier);
      expect(res.source).toBe('incoming');
      expect(res.resolved.status).toBe('en_route');
    });
  });

  describe('7.4 Peer Relay Store-and-Forward Mesh (RL-5, RL-6)', () => {
    it('creates packets with origin hop and initial TTL of 5', () => {
      const pkt = createRelayPacket('node-ambulance-01', 'incident_relay', { emergency: 'crash' });
      expect(pkt.id).toBeDefined();
      expect(pkt.ttl).toBe(5);
      expect(pkt.hops).toEqual(['node-ambulance-01']);
    });

    it('decrements TTL and appends hop ID on offline relay nodes', () => {
      resetSeenPacketIds();
      const originPkt = createRelayPacket('node-origin', 'incident_relay', { case: 'STEMI' });

      // First forward to node-relay-1
      const forward1 = processInboundPacket(originPkt, 'node-relay-1', false);
      expect(forward1.action).toBe('forward_to_peers');
      expect(forward1.forwardablePacket?.ttl).toBe(4);
      expect(forward1.forwardablePacket?.hops).toEqual(['node-origin', 'node-relay-1']);
    });

    it('delivers directly to cloud gateway when node has internet connectivity', () => {
      resetSeenPacketIds();
      const originPkt = createRelayPacket('node-amb', 'incident_relay', { bloodNeeded: 'O-' });

      const gatewayResult = processInboundPacket(originPkt, 'node-toll-gateway', true);
      expect(gatewayResult.action).toBe('deliver_to_cloud');
      expect(gatewayResult.forwardablePacket?.hops).toContain('node-toll-gateway');
    });

    it('drops duplicate packets seen previously on the same node (RL-6)', () => {
      resetSeenPacketIds();
      const pkt = createRelayPacket('node-1', 'incident_relay', { val: 42 });

      // First pass
      processInboundPacket(pkt, 'node-2', false);

      // Duplicate arrival of same packet
      const dupResult = processInboundPacket(pkt, 'node-2', false);
      expect(dupResult.action).toBe('drop_duplicate');
    });

    it('drops packets whose TTL reaches 1 to prevent infinite forwarding loops', () => {
      resetSeenPacketIds();
      const pkt = createRelayPacket('node-1', 'incident_relay', { test: true }, { initialTtl: 1 });

      const res = processInboundPacket(pkt, 'node-2', false);
      expect(res.action).toBe('drop_ttl_expired');
    });
  });

  describe('7.5 Compact SMS Fallback (RL-4)', () => {
    it('generates a compact SMS string under 50 characters with checksum', () => {
      const sms = generateCompactIncidentSMS({
        triage: 'red',
        type: 'road_accident',
        lat: 18.5204,
        lng: 73.8567,
        patients: 2,
      });

      expect(sms.code).toMatch(/^TS:RED:MVA:18\.5204,73\.8567:P2:[0-9A-F]{4}$/);
      expect(sms.smsDeepLink).toContain('sms:+919922001122');
      expect(sms.code.length).toBeLessThan(50);
    });

    it('round-trips encode and decode accurately', () => {
      const original = {
        triage: 'yellow' as const,
        type: 'cardiac',
        lat: 18.5521,
        lng: 73.8214,
        patients: 1,
      };

      const { code } = generateCompactIncidentSMS(original);
      const parsed = parseCompactIncidentSMS(code);

      expect(parsed).not.toBeNull();
      expect(parsed?.triage).toBe('yellow');
      expect(parsed?.type).toBe('cardiac');
      expect(parsed?.patients).toBe(1);
      expect(parsed?.lat).toBeCloseTo(18.5521, 3);
      expect(parsed?.lng).toBeCloseTo(73.8214, 3);
    });

    it('gracefully returns null for malformed SMS codes', () => {
      expect(parseCompactIncidentSMS('INVALID-SMS-STRING')).toBeNull();
      expect(parseCompactIncidentSMS('TS:RED:UNKNOWN')).toBeNull();
    });
  });
});
