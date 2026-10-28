# TriageSync 2.0 + MedPass
### Autonomous Emergency Coordination, Hospital-Capability Routing & Offline-First Medical Identity

[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Vitest-84%20Tests%20Passing-brightgreen.svg)](https://vitest.dev/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.2.1-black.svg)](https://nextjs.org/)
[![IEEE 830](https://img.shields.io/badge/Standard-IEEE%20830%20%2F%20ISO%2029148-success.svg)](SRS.md)

---

## 1. Problem Statement & Mission

In critical trauma and emergency care, the **Golden Hour** (the first 60 minutes after trauma) dictates patient survival. However, emergency response grids worldwide face **5 systemic structural breakdowns**:

1. **The Identity Void (Zero Context)**: The victim is unconscious. Responders have zero knowledge of blood group, critical allergies (e.g. Penicillin), chronic conditions (diabetes, asthma), or emergency contacts. Transfusing wrong blood or administering allergenic drugs causes fatal complications.
2. **The Nearest-Hospital Dead-End Dilemma**: Ambulances rush to the nearest hospital by distance, only to discover the ICU is full, the trauma bay is occupied, no CT scanner is operational, or no matching O-negative blood units exist. Minutes are wasted turning around.
3. **Emergency Room Convergence & Bottlenecks**: Multiple ambulances independently converge on the same major hospital at once, overwhelming ER triage while neighboring hospitals have open trauma bays.
4. **Paramedic Cognitive Overload**: Responders cannot type on touchscreens or keyboards while performing chest compressions or airway intubation in a moving vehicle.
5. **Cellular Tower Blackouts & Highway Dead Zones**: Severe storms, remote highway corridors, and mass-casualty disasters crash cellular networks, crippling standard cloud-dependent apps.

---

## 2. Technical Solution & Core Architecture

TriageSync 2.0 + MedPass systematically solves each failure mode through 6 architectural pillars:

| Failure Mode | TriageSync 2.0 Engine | Requirement IDs |
|---|---|---|
| **Identity Void** | **MedPass**: Ed25519-signed compact payload in URL hash (`#payload.sig`). Decodes and verifies offline in airplane mode via any smartphone camera. Tiered privacy with responder OTP verification. | `MP-1` to `MP-10` |
| **Hospital Dead-Ends** | **Capability-Aware Matching Engine**: 6-factor composite scoring ($S = w_{\text{eta}} S_{\text{eta}} + w_{\text{cap}} S_{\text{cap}} + w_{\text{bed}} S_{\text{bed}} + w_{\text{blood}} S_{\text{blood}} + w_{\text{queue}} S_{\text{queue}} + w_{\text{fresh}} S_{\text{fresh}}$). Excludes unfit hospitals automatically. | `HM-1` to `HM-8` |
| **ER Convergence** | **QueuePredict Autonomous Diversion**: Mathematical load calculation ($L_{\text{projected}} = \frac{\text{occupied} + \text{inbound} - \text{discharges}}{\text{capacity}}$). Diverts 3rd inbound ambulance when load exceeds 85%. | `QP-1` to `QP-5` |
| **Paramedic Overload** | **VoiceHandover Pipeline**: Hands-free multilingual Web Speech API (English, Hindi, Marathi) with SBAR extraction and automated hospital pre-arrival preparation checklists. | `VH-1` to `VH-7` |
| **Network Blackouts** | **ResilientLink Architecture**: Client-side IndexedDB outbox with idempotent UUIDs, WebRTC peer-to-peer store-and-forward mesh relay, and 40-byte compact SMS distress fallback. | `RL-1` to `RL-7` |
| **Mass-Casualty Disasters** | **MCI Multi-Patient Distribution Engine**: Greedy optimal split of N patients across regional hospitals respecting trauma bay and ICU limits. | `CC-1` to `CC-4` |

---

## 3. System Architecture Diagram

```
[ Citizen / Patient ] ---> Creates MedPass ---> Ed25519 Signed Payload (#hash)
                                                    |
[ Bystander / Paramedic Phone ] <-------------------+ (Airplane Mode QR Scan)
         |
         +---> Incident Triggered (GPS, Triage Level: RED / YELLOW / GREEN)
         |            |
         |            v
         |     [ Capability-Aware Matching Engine ]
         |     * Haversine Distance & Realtime OSRM ETA
         |     * Hard Exclusion (Zero Trauma Bay / Full ICU)
         |     * Blood Unit Compatibility Matching
         |     * Freshness Score Decay Penalty
         |            |
         |            v
         |     [ QueuePredict Load Balancer ]
         |     * Tracks Inbound Vehicles & Projected ER Load
         |     * Autonomous Diversion when Load > 85%
         |            |
         +------------+---> [ Hands-Free Voice Handover (SBAR) ]
                      |            |
                      |            v
                      +---> [ Hospital ER Radar Dashboard ]
                                   * Live Bed Steppers & Equipment Toggles
                                   * Pre-Arrival Checklist (Blood, OR, Ventilator)
                                   * SBAR Clinical Brief
```

---

## 4. Verification & Testing

Every single IEEE 830 / ISO 29148 specification requirement has automated tests:

```bash
# Run unit and acceptance test suite (84 tests passing)
npm test

# Run strict TypeScript typecheck (0 errors)
npm run typecheck

# Run Next.js production build (25 routes compiled)
npm run build
```

### Complete Test Matrix (84 Passed Specs)
- `tests/phase0-setup.test.ts`: Supabase schema, PostGIS types, mock seed data integrity.
- `tests/phase1-hospital.test.ts`: Hospital resource state, real-time sync, freshness decay.
- `tests/phase2-matching.test.ts`: 6-factor matching, hard exclusions, blood matching, tie-breakers.
- `tests/phase3-medpass.test.ts`: Ed25519 signing, offline URL hash verification, token rotation, dynamic origin.
- `tests/phase4-incidents.test.ts`: Incident lifecycle, Golden Hour timer, fleet proximity.
- `tests/phase5-queue.test.ts`: Inbound tracking, projected load, autonomous ER diversion.
- `tests/phase6-voice.test.ts`: SBAR voice parser, vitals extraction, pre-arrival checklist.
- `tests/phase7-offline.test.ts`: IndexedDB outbox, idempotency, WebRTC store-and-forward relay, compact SMS.
- `tests/phase8-command.test.ts`: MCI distribution algorithm, fleet telemetry, surge chaos testing.
- `tests/phase9-rehearsal.test.ts`: All 6 SRS acceptance criteria verified end-to-end.
- `tests/auth.test.ts`: Role-based authentication (Citizen, Bystander, Paramedic, Hospital Staff, Dispatcher).

---

## 5. Technology Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Language**: TypeScript (Strict Mode, Zero `any`)
- **Styling**: Tailwind CSS + Monochromatic Minimalist Tactile System
- **Cryptography**: TweetNaCl (Ed25519 digital signatures, zero-dependency offline decryption)
- **Database & Realtime**: Supabase (PostgreSQL, Row-Level Security, Realtime Subscriptions)
- **Offline Outbox**: IndexedDB (`idb` library)
- **Mesh Communication**: WebRTC Data Channels with signaling fallback
- **Mapping**: Leaflet + OpenStreetMap + OSRM routing

---

*Prototype demonstration system. Developed for emergency coordination research. Not a certified medical device.*
