import { NextRequest, NextResponse } from 'next/server';

interface SignalMessage {
  from: string;
  to: string;
  type: 'offer' | 'answer' | 'ice' | 'join';
  data: unknown;
  timestamp: number;
}

// In-memory message queue for signaling during live demos
const messageQueues: Map<string, SignalMessage[]> = new Map();
const activeNodes: Map<string, { lastSeen: number; name: string }> = new Map();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { from, to, type, data } = body;

    if (!from) {
      return NextResponse.json({ success: false, error: 'Missing "from" node ID' }, { status: 400 });
    }

    // Update node heartbeat
    activeNodes.set(from, { lastSeen: Date.now(), name: body.name || `Node ${from.slice(0, 4)}` });

    if (type === 'join') {
      // Just registering presence
      return NextResponse.json({
        success: true,
        nodes: Array.from(activeNodes.entries()).map(([id, info]) => ({ id, ...info })),
      });
    }

    if (!to || !type) {
      return NextResponse.json({ success: false, error: 'Missing "to" or "type"' }, { status: 400 });
    }

    const msg: SignalMessage = {
      from,
      to,
      type,
      data,
      timestamp: Date.now(),
    };

    const targetQueue = messageQueues.get(to) || [];
    targetQueue.push(msg);
    messageQueues.set(to, targetQueue);

    return NextResponse.json({ success: true, queuedFor: to });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Signaling error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const nodeId = searchParams.get('nodeId');

  if (!nodeId) {
    return NextResponse.json({
      success: true,
      nodes: Array.from(activeNodes.entries()).map(([id, info]) => ({ id, ...info })),
    });
  }

  // Drain pending signals for this node
  const pending = messageQueues.get(nodeId) || [];
  messageQueues.set(nodeId, []);

  // Filter active nodes (seen within last 60 seconds)
  const now = Date.now();
  for (const [id, info] of activeNodes.entries()) {
    if (now - info.lastSeen > 60000) {
      activeNodes.delete(id);
    }
  }

  return NextResponse.json({
    success: true,
    messages: pending,
    nodes: Array.from(activeNodes.entries()).map(([id, info]) => ({ id, ...info })),
  });
}
