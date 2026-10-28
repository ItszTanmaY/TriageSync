# Build Roadmap + Ready-to-Paste Antigravity Prompts

How to use: work **phase by phase**. Start each phase by telling the agent to read `AGENTS.md`, `SRS.md` and `ARCHITECTURE.md`. Finish and test one phase before starting the next. Commit after each phase.

Suggested timeline for a 24 to 48 hour hackathon is shown; scale it to your deadline.

| Phase | Focus | Time | SRS IDs |
|---|---|---|---|
| 0 | Project setup + seed data | 1-2 h | SIM-1 |
| 1 | Hospital dashboard + live resources | 3-4 h | HD-1..3, HM-1,2 |
| 2 | Matching engine + explainable UI | 4-5 h | HM-3..8 |
| 3 | MedPass + QR + scan page | 4-5 h | MP-1..7, RL-2,3 |
| 4 | Incidents + ambulance sim + map | 3-4 h | INC-*, SIM-2, CC-1 |
| 5 | QueuePredict + diversion | 2-3 h | QP-* |
| 6 | Voice handover | 3-4 h | VH-* |
| 7 | Offline outbox + peer relay demo | 3-4 h | RL-* |
| 8 | Command center, MCI, analytics, polish | 3-4 h | CC-*, SIM-3 |
| 9 | Pitch rehearsal + bug bash | 2 h | all |

**Cut line if short on time:** finish phases 0 to 4 and 6 first (identity + matching + voice = a complete story). Phases 5, 7, 8 are the "wow" layers.

---

## Phase 0: Setup
**Prompt:**
```
Read AGENTS.md, SRS.md and ARCHITECTURE.md fully. Create a Next.js (App Router, TypeScript strict,
Tailwind, shadcn/ui) project with PWA support. Set up Supabase client, env var template (.env.example),
and apply the SQL schema from ARCHITECTURE.md section 2 as a migration. Write a seed script in /sim
that creates 10 fictional hospitals around Pune with realistic differing capabilities (one with full ICU,
one with no trauma bay, one with no O-negative, one far but fully equipped), blood stock for all 8 groups,
10 ambulances, and 5 sample MedPasses. Provide a README section on how to run it.
```
**Done when:** `npm run dev` works and seed populates tables.

## Phase 1: Hospital dashboard
```
Build the hospital staff dashboard (/hospital/dashboard) per SRS HD-1..3 and HM-1..2. Mobile-friendly
steppers for icu_free, er_free, trauma_bay_free, ventilators_free; toggles for ot, cath_lab, ct; on-call
specialist toggles; blood stock steppers per group. Every change updates updated_at and is pushed through
Supabase Realtime. Show a "last updated X min ago" chip that turns amber after 30 min and red after 60.
Include an Incoming Patients panel (empty state for now). Use hospital-scoped auth with RLS.
```

## Phase 2: Matching engine
```
Implement /lib/matching as pure TypeScript functions per ARCHITECTURE.md section 5 (requirements table,
hard exclusions, weighted score, blood compatibility, freshness decay). Add Vitest unit tests covering:
excluded hospital with no trauma bay, O-neg shortage, stale data penalty, tie-breaks.
Then build POST /api/incidents/:id/recommend and a UI card list showing top 3 hospitals with ETA,
score, and a "Why this hospital?" expandable breakdown of each factor, plus a greyed list of excluded
hospitals with reasons. Allow accept or override-with-reason. Reserve a bed for 15 minutes on selection.
```

## Phase 3: MedPass + QR
```
Build the MedPass flow per SRS MP-1..8. Form (React Hook Form + Zod) for details and up to 3 contacts.
Generate Ed25519-signed compact payload (ARCHITECTURE.md section 3), render QR with the qrcode library,
and export a wallet-style card PNG and a lock-screen wallpaper image. Build the public scan page /s/[token]:
verify the signature client-side with the bundled public key, show critical tier immediately from the URL
hash (works offline via service worker cache), then enrich online. Big red "Send emergency alert" button
sends GPS to contacts (SMS deep link) and the dispatcher. Add the "Request full record" flow gated by
responder login or OTP, and write every scan to medpass_scans and audit_log. Patient page shows scan history.
```

## Phase 4: Incidents, map, simulator
```
Create the incident flow: a one-screen "Report emergency" form (GPS auto-filled, type chips, patient count,
triage selector) usable with one hand. Build the live Leaflet + OSM map for the Command Center showing
hospitals (coloured by capacity), ambulances and incidents. Implement /sim ambulance simulator that moves
ambulance markers along OSRM routes to their assigned destinations and updates positions in Supabase every
2 seconds. Add Golden Hour timer to incident screens. Auto-suggest nearest available ambulance.
```

## Phase 5: QueuePredict
```
Implement /lib/queue per ARCHITECTURE.md section 6 and integrate it into the matching engine's queue_score.
Track inbound ambulances per hospital. When projected_load > 0.85 or wait > 15 min, automatically recommend
diversion to the next best hospital and write a diversions row with the numbers. Add a dispatcher
load-bar widget per hospital and a "Why diverted" tooltip. Add a simulation button: send 3 ambulances to the
same hospital and show the third being rerouted.
```

## Phase 6: Voice handover
```
Build the paramedic handover screen with one huge push-to-talk button. Use Web Speech API with language
selector (English, Hindi, Marathi); fallback to recording audio and sending to a server STT route.
Send the transcript to an LLM route that returns strict JSON per ARCHITECTURE.md section 7 (never invent values).
Show an editable draft with all fields, a "Send to ER" confirm button and a 10-second auto-send countdown.
On send, store in handovers, push via Realtime to the hospital dashboard Incoming Patients panel as a card with
vitals, injuries, and a generated prep checklist (blood units, OT, ventilator, specialist). Play an alert sound for RED.
```

## Phase 7: Offline + peer relay
```
Implement the offline outbox in /lib/offline per ARCHITECTURE.md section 8: IndexedDB queue, idempotent
client UUIDs, flush on reconnect, Background Sync where supported, a connectivity indicator with queued
count. Route incident creation, scan alerts and handovers through it. Add Workbox caching so the scan page
and incident form load offline. Then build a peer relay demo page: two or more devices connect via WebRTC data
channels (signalling via /api/signal), exchange packets {id, ttl, hops}, store-and-forward, and the node with
internet posts to /api/sync. Show a hop visualisation. Add an SMS fallback button with a compact incident code.
```

## Phase 8: Command center, MCI, polish
```
Add mass-casualty mode: given N patients with triage levels, distribute across hospitals to maximise
capability fit while respecting capacity (greedy with capacity decrement is fine). Add analytics cards
(avg time-to-hospital, diversions, dead-ends avoided, scans). Add admin "chaos buttons": kill network,
fill a hospital's ICU, surge. Polish: loading states, empty states, error toasts, dark/high-contrast
mode for the ambulance screen, i18n for the MedPass card (en, hi, mr).
```

## Phase 9: Rehearsal
```
Write Playwright tests for the six acceptance criteria in SRS section 9. Fix failures. Create a
/demo page that resets seed data with one click. Verify the app runs on a mid-range Android phone.
```

---

## Prompting tips for vibe coding
1. Always attach or reference the three docs; agents drift without them.
2. One phase per conversation; ask the agent to **plan first, then implement**.
3. After each phase: "Run the tests, list what is incomplete, and update ROADMAP.md checkboxes."
4. If something breaks, paste the exact error and ask for a root cause before a fix.
5. Keep a `DECISIONS.md` for any deviation from the SRS.

## Progress checklist
- [x] P0 Setup  - [x] P1 Hospital dashboard  - [ ] P2 Matching  - [ ] P3 MedPass
- [ ] P4 Incidents/map  - [ ] P5 QueuePredict  - [ ] P6 Voice  - [ ] P7 Offline/peer
- [ ] P8 Command/MCI  - [ ] P9 Rehearsal
