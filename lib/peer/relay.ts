/**
 * ResilientLink Peer Relay & Store-and-Forward Mesh (SRS RL-4, RL-5, RL-6)
 *
 * Implements:
 * 1. WebRTC DataChannel packet format with TTL decay and hop tracking
 * 2. Deduplication store by packet UUID
 * 3. Compact SMS fallback encoding/decoding for zero-connectivity situations
 */

export interface RelayPacket<T = unknown> {
  id: string; // Unique packet UUID
  originNodeId: string;
  targetNodeId?: string; // Optional target or broadcast if undefined/'*'
  type: 'incident_relay' | 'handover_relay' | 'resource_alert' | 'heartbeat';
  payload: T;
  ttl: number; // Time-to-live in hops (decrements each hop)
  hops: string[]; // Sequence of node IDs that relayed this packet
  timestamp: number;
}

export interface PeerRelayNodeState {
  nodeId: string;
  isOnline: boolean;
  connectedPeers: string[];
  packetsRelayed: number;
  packetsDelivered: number;
}

export interface CompactIncidentPayload {
  triage: 'red' | 'yellow' | 'green' | 'black';
  type: string; // e.g. 'road_accident', 'cardiac'
  lat: number;
  lng: number;
  patients: number;
  emergencyContact?: string;
  shortId?: string;
}

/**
 * In-memory seen packets cache per node for deduplication (RL-6)
 */
const seenPacketsByNode = new Map<string, Set<string>>();

/**
 * Reset seen packets cache (useful for testing)
 */
export function resetSeenPacketIds(): void {
  seenPacketsByNode.clear();
}

function hasNodeSeenPacket(nodeId: string, packetId: string): boolean {
  return seenPacketsByNode.get(nodeId)?.has(packetId) ?? false;
}

function markNodeSeenPacket(nodeId: string, packetId: string): void {
  let set = seenPacketsByNode.get(nodeId);
  if (!set) {
    set = new Set<string>();
    seenPacketsByNode.set(nodeId, set);
  }
  set.add(packetId);
}

/**
 * Create a new relay packet with initial TTL and origin.
 */
export function createRelayPacket<T>(
  originNodeId: string,
  type: RelayPacket<T>['type'],
  payload: T,
  options?: {
    id?: string;
    targetNodeId?: string;
    initialTtl?: number;
  }
): RelayPacket<T> {
  const packet: RelayPacket<T> = {
    id: options?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pkt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    originNodeId,
    targetNodeId: options?.targetNodeId || '*',
    type,
    payload,
    ttl: options?.initialTtl ?? 5,
    hops: [originNodeId],
    timestamp: Date.now(),
  };

  markNodeSeenPacket(originNodeId, packet.id);
  return packet;
}

/**
 * Process an inbound relay packet on a node:
 * - Checks if already seen by this node (deduplication RL-6)
 * - Checks TTL (> 0)
 * - If current node is online, marks for server gateway sync
 * - If current node is offline, decrements TTL and prepares for forward relay to connected peers
 */
export function processInboundPacket<T>(
  packet: RelayPacket<T>,
  currentNodeId: string,
  isCurrentNodeOnline: boolean
): {
  action: 'deliver_to_cloud' | 'forward_to_peers' | 'drop_duplicate' | 'drop_ttl_expired';
  forwardablePacket?: RelayPacket<T>;
  reason: string;
} {
  // 1. Deduplication check on this node
  if (hasNodeSeenPacket(currentNodeId, packet.id)) {
    return {
      action: 'drop_duplicate',
      reason: `Packet ${packet.id.slice(0, 8)} already processed on node ${currentNodeId}`,
    };
  }

  // 2. TTL expiration check
  if (packet.ttl <= 1) {
    markNodeSeenPacket(currentNodeId, packet.id);
    return {
      action: 'drop_ttl_expired',
      reason: `Packet ${packet.id.slice(0, 8)} TTL exhausted (hops: ${packet.hops.join(' -> ')})`,
    };
  }

  // Record packet as seen on this node
  markNodeSeenPacket(currentNodeId, packet.id);

  // 3. If this node has internet connectivity, it acts as the gateway to the cloud!
  if (isCurrentNodeOnline) {
    return {
      action: 'deliver_to_cloud',
      forwardablePacket: {
        ...packet,
        hops: [...packet.hops, currentNodeId],
      },
      reason: `Gateway node ${currentNodeId} is online; bridging packet to Supabase cloud`,
    };
  }

  // 4. Store-and-forward relay to peers
  const forwarded: RelayPacket<T> = {
    ...packet,
    ttl: packet.ttl - 1,
    hops: [...packet.hops, currentNodeId],
  };

  return {
    action: 'forward_to_peers',
    forwardablePacket: forwarded,
    reason: `Node ${currentNodeId} forwarding to mesh peers (remaining TTL: ${forwarded.ttl})`,
  };
}

/**
 * Generates an ultra-compact SMS incident code for zero-cellular-data environments (RL-4).
 * Format: TS:[TRIAGE]:[TYPE_CODE]:[LAT],[LNG]:P[COUNT]:[CHECKSUM]
 * Example: TS:RED:MVA:18.5204,73.8567:P1:7C2A
 */
export function generateCompactIncidentSMS(incident: CompactIncidentPayload): {
  smsText: string;
  smsDeepLink: string;
  code: string;
} {
  const typeMap: Record<string, string> = {
    road_accident: 'MVA',
    cardiac: 'CRD',
    stroke: 'STR',
    burns: 'BRN',
    obstetric: 'OBS',
    paediatric: 'PED',
    other: 'OTH',
  };

  const shortType = typeMap[incident.type] || incident.type.slice(0, 3).toUpperCase();
  const triage = incident.triage.toUpperCase();
  const lat = incident.lat.toFixed(4);
  const lng = incident.lng.toFixed(4);
  const patients = incident.patients || 1;

  // Simple deterministic 4-character checksum
  const rawString = `${triage}:${shortType}:${lat},${lng}:P${patients}`;
  let hash = 0;
  for (let i = 0; i < rawString.length; i++) {
    hash = (hash << 5) - hash + rawString.charCodeAt(i);
    hash |= 0;
  }
  const checksum = Math.abs(hash).toString(16).slice(0, 4).toUpperCase().padStart(4, '0');

  const code = `TS:${rawString}:${checksum}`;
  const smsText = `EMERGENCY ALERT [TriageSync 2.0]\n${code}\nLocation: https://maps.google.com/?q=${lat},${lng}`;
  const dispatcherPhone = '+919922001122';
  const smsDeepLink = `sms:${dispatcherPhone}?body=${encodeURIComponent(smsText)}`;

  return {
    smsText,
    smsDeepLink,
    code,
  };
}

/**
 * Parses a compact SMS emergency string back into structured incident fields (RL-4).
 */
export function parseCompactIncidentSMS(smsCode: string): CompactIncidentPayload | null {
  const trimmed = smsCode.trim();
  const match = trimmed.match(/TS:([A-Z]+):([A-Z0-9]+):(-?\d+\.\d+),(-?\d+\.\d+):P(\d+):([A-F0-9]{4})/i);

  if (!match) {
    return null;
  }

  const [, triageStr, typeCode, latStr, lngStr, patientStr] = match;

  const reverseTypeMap: Record<string, string> = {
    MVA: 'road_accident',
    CRD: 'cardiac',
    STR: 'stroke',
    BRN: 'burns',
    OBS: 'obstetric',
    PED: 'paediatric',
    OTH: 'other',
  };

  const triage = triageStr.toLowerCase() as CompactIncidentPayload['triage'];
  const type = reverseTypeMap[typeCode.toUpperCase()] || 'other';
  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  const patients = parseInt(patientStr, 10);

  return {
    triage,
    type,
    lat,
    lng,
    patients,
  };
}
