# TriageSync 2.0 (with MedPass)
### Emergency identity + hospital-capability routing + offline-first coordination

> Working name. Rename freely (ideas: LifeRoute, GoldenHour, RakshaSync).

## 1. Problem

In a road accident or medical emergency:

1. **Identity gap**: the patient is unconscious. Nobody knows blood group, allergies, conditions, or who to call.
2. **Hospital dead-end**: the ambulance goes to the nearest hospital, which then has no free ICU bed, no trauma surgeon, no ventilator or no matching blood. Minutes of the "golden hour" are lost.
3. **Blind handover**: the ER learns about the patient only when the ambulance arrives.
4. **Network failure**: highways and disaster zones often have weak or no connectivity.

## 2. What changed from v1 (and why)

| v1 idea | Problem a judge may raise | v2 improvement |
|---|---|---|
| QR shows blood type, contacts, allergies to anyone | Privacy and misuse risk | **Tiered access**: lock-screen tier (blood group, allergies, critical conditions) is public; full record needs responder verification + is audit-logged and the patient's contacts are notified. DPDP Act (India) aligned. |
| QR opens a web page | Fails without internet | QR encodes a **signed compact payload** (critical tier) so it is readable even offline; the page enhances it when online. |
| "Nearest hospital with resources" | Resource data goes stale and nobody trusts it | **Freshness-scored availability**: each figure has a "last updated" timestamp and confidence; stale data is penalised and flagged; hospitals update with a 1-tap UI, plus an auto-decay model. |
| Distance + beds | Ignores what the patient actually needs | **Triage-aware matching engine**: severity (START-style) + injury category (trauma, cardiac, stroke, burns, obstetric, paediatric) mapped to required capabilities, then a weighted score (ETA, capability, bed, blood, load, freshness). Explainable output: "Why this hospital?" |
| QueuePredict | Hand-wavy "algorithm" | Simple, defensible **queue model** (arrivals in transit + current ER load + average service time) giving projected wait and a **diversion recommendation**. |
| Voice handover | Raw text on a screen is noisy | Voice is converted to **structured SBAR/MIST handover** (age, mechanism, injuries, vitals, treatment, needs) via LLM, with Hindi/Marathi/English input, and auto-triggers **resource prep** (blood, OT, ventilator). |
| BLE + WebRTC mesh | Browsers cannot do BLE advertising / true mesh; unrealistic | Honest, buildable scope: **offline-first PWA** (IndexedDB outbox, background sync), **SMS fallback** (Twilio or device `sms:` deep link), and a **WebRTC data-channel peer relay demo** between nearby devices. Native BLE listed as future work. |
| (missing) | | **Mass-casualty mode**, **Golden Hour timer**, **green-corridor alerts**, **post-incident analytics**, **audit trail**. |

## 3. Product pillars

1. **MedPass**: emergency identity card (QR on wallet / lock screen / printable).
2. **TriageSync Engine**: capability-aware hospital matching with explainable scoring.
3. **QueuePredict**: load balancing and diversion across hospitals.
4. **VoiceHandover**: hands-free multilingual voice to structured ER brief.
5. **ResilientLink**: offline-first sync, SMS fallback, peer relay.
6. **Command Center**: live map and dashboards for dispatch, hospitals, and mass-casualty events.

## 4. Actors

- **Citizen / Patient**: creates MedPass.
- **Bystander**: scans QR, triggers emergency.
- **Paramedic**: runs the incident from the ambulance app.
- **Hospital ER staff**: manages resources, sees incoming patients.
- **Blood bank officer**: manages stock, handles requests.
- **Dispatcher / Admin**: sees the whole city grid.

## 5. Document map

| File | Purpose |
|---|---|
| `README.md` | This overview |
| `SRS.md` | Software Requirements Specification |
| `ARCHITECTURE.md` | Stack, data model (SQL), API, algorithms, security |
| `ROADMAP.md` | Phased build plan with ready-to-paste Antigravity prompts |
| `AGENTS.md` | Rules file so the AI agent keeps code consistent |
| `PITCH.md` | Pitch, demo script, judge Q&A |

## 6. Recommended stack (vibe-coding friendly, all free tier)

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, installed as a **PWA**
- **Backend/DB/Realtime/Auth**: Supabase (Postgres + PostGIS + Realtime + Auth + Edge Functions)
- **Maps**: Leaflet + OpenStreetMap, OSRM public routing for ETA (no billing needed)
- **Voice**: Web Speech API (live) with Whisper/Gemini fallback; LLM structuring via Gemini or Claude API
- **QR**: `qrcode` (generate), `html5-qrcode` (scan); payload signed with Ed25519 (`tweetnacl`)
- **Offline**: Workbox service worker + IndexedDB (`idb`)
- **Peer demo**: WebRTC data channels with a tiny signalling endpoint
- **Deploy**: Vercel + Supabase

## 7. Demo data

Seed 8 to 10 fictional hospitals around one city (e.g. Pune) with beds, specialties and blood stock, plus an **ambulance simulator** that moves markers along real routes so the demo works without real vehicles.

> Note: all patient and hospital data is synthetic. This is a prototype, not a certified medical device.
