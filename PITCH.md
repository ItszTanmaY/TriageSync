# Pitch, Demo Script and Judge Q&A

## 30-second pitch
"When an accident victim is unconscious, nobody knows who they are. And the ambulance rushes to the nearest hospital, only to find the ICU full or the blood missing. We lose the golden hour twice. **TriageSync + MedPass** fixes both. A QR card identifies the patient in seconds, even offline, with privacy tiers and audit trails. A capability-aware engine routes the ambulance to the hospital that can actually treat them, balances load so no ER collapses, and a hands-free voice handover prepares the doctors before arrival. And when networks fail, it keeps working."

## Tagline options
- "Right patient. Right hospital. Right now."
- "Don't lose the golden hour twice."

## Differentiators (say these explicitly)
1. Capability-aware, **explainable** routing (not just nearest hospital)
2. **Freshness-scored** data (we admit data can be stale and handle it)
3. **Privacy-tiered** MedPass with audit log
4. Offline-first with signed QR readable without internet
5. Voice to structured SBAR with human confirmation
6. Load balancing with visible maths

## 4-minute live demo flow
| Time | Action | Shows |
|---|---|---|
| 0:00 | Problem statement (one slide: "2 dead-ends") | Story |
| 0:30 | Phone in airplane mode, scan MedPass QR: critical info appears; tap "Send alert" (queued) | MP, RL |
| 1:00 | Paramedic creates incident on a highway: top 3 hospitals with explanations; nearest hospital greyed out ("ICU full, no trauma bay") | HM |
| 1:45 | Hospital user fills ICU on the dashboard: ranking changes live | Realtime |
| 2:15 | Chaos button: surge 3 ambulances to one hospital: third gets diverted with numbers | QP |
| 2:45 | Paramedic speaks handover (Hindi or English): structured brief and checklist appear on ER screen with alert sound | VH |
| 3:15 | Turn network back on: queued alert syncs; show peer relay hop demo with two phones | RL |
| 3:45 | Command center map and analytics: "dead-ends avoided: 7" | CC |
| 4:00 | Close: roadmap (native BLE mesh, real hospital integration, 112 integration) | Vision |

## Backup plan
- Pre-record a 2-minute video of the demo.
- "Reset demo" button restores seed data.
- Keep a printed QR card and a second phone charged.

## Likely judge questions and answers
**Isn't QR data a privacy risk?**
Only a minimal critical tier (blood group, allergies, critical conditions, one contact) is exposed, the same data many people already put on lock-screens or medical bracelets. The full record needs responder verification or contact-approved OTP, every scan is audit-logged and visible to the patient, and tokens can be rotated.

**How do you keep hospital data accurate?**
Every value has a timestamp, stale data is penalised and flagged, hospitals get one-tap updates and reminders, and the model prefers fresher sources. In production, this would connect to hospital management systems via HL7/FHIR.

**Is the offline mesh real?**
The prototype uses an offline-first PWA with an outbox, SMS fallback, and a WebRTC peer-relay demo. True cellular-free BLE mesh requires a native app, which is on our roadmap using Android Nearby Connections or BLE.

**What if the voice AI gets it wrong?**
Nothing is sent blindly: the paramedic sees the structured draft next to the raw transcript and confirms with one tap. Fields not spoken stay empty rather than guessed.

**How is this different from existing ambulance apps?**
They track location. We match patient needs to live hospital capability, balance load across the city, identify the patient, and keep working offline, in one system.

**How would it scale / business model?**
City-level or state emergency-service contracts (SaaS per hospital or per ambulance), insurer and employer partnerships for MedPass, and integration with the 112 emergency response system.

**Clinical safety?**
It supports routing and information; paramedics keep the final decision with an override. Triage rules follow standard frameworks (e.g. START) and would be reviewed by clinicians before real deployment.

## Impact metrics to show (clearly labelled as simulated)
- Time to identify patient: from minutes to seconds
- Dead-end hospital trips avoided
- ER overload events prevented
- Minutes saved from pre-arrival preparation

## Slide outline (8 slides)
1. Problem (golden hour lost twice)
2. Solution overview (5 pillars)
3. MedPass and privacy
4. Matching engine and explainability
5. QueuePredict and voice handover
6. Resilience (offline, peer relay)
7. Architecture and tech stack
8. Roadmap, impact, ask
