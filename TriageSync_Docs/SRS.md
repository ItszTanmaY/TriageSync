# Software Requirements Specification (SRS)
**Project:** TriageSync 2.0 + MedPass
**Version:** 1.0 (Hackathon prototype)
**Standard reference:** structured after IEEE 830 / ISO 29148

---

## 1. Introduction

### 1.1 Purpose
Defines functional and non-functional requirements for TriageSync 2.0, an emergency coordination platform that (a) identifies patients via MedPass, (b) routes ambulances to hospitals that can actually treat them, (c) balances hospital load, (d) provides hands-free voice handover, and (e) keeps working with poor connectivity.

### 1.2 Scope
Web-based PWA with role-based interfaces: Citizen, Bystander, Paramedic, Hospital Staff, Blood Bank, Dispatcher/Admin. Prototype uses synthetic data and simulated ambulances.

**In scope:** MedPass, matching engine, queue prediction, voice handover, offline sync, peer relay demo, dashboards, audit logs.
**Out of scope (prototype):** real hospital system integration (HL7/FHIR production), certified clinical decision support, native BLE mesh, real payment, real 112 integration.

### 1.3 Definitions
| Term | Meaning |
|---|---|
| MedPass | Emergency medical identity card with QR |
| Critical tier | Minimum info for emergency (blood group, allergies, critical conditions, one contact) |
| Full tier | Extended record (medications, history, all contacts, insurance) |
| Incident | One emergency event with one or more patients |
| Triage level | RED (immediate), YELLOW (delayed), GREEN (minor), BLACK (deceased/expectant) |
| Golden Hour | First hour after trauma, critical for outcomes |
| SBAR | Situation, Background, Assessment, Recommendation handover format |
| MCI | Mass-casualty incident |

### 1.4 Assumptions
- Responders have a smartphone with a camera and browser.
- Hospitals update availability via the dashboard (or the simulator in the demo).
- Clinical triage rules are simplified for demonstration.

---

## 2. Overall Description

### 2.1 Product perspective
Cloud-hosted PWA + realtime backend. Works as a client-heavy app with an offline outbox that syncs when connectivity returns.

### 2.2 User classes
| Role | Needs |
|---|---|
| Citizen | Create/update MedPass, control privacy, get QR card |
| Bystander | Scan QR, see critical info, trigger alert with minimal friction (no login) |
| Paramedic | Start incident, get hospital recommendation, voice handover, navigate |
| Hospital staff | Update resources, see incoming patients, prepare |
| Blood bank | Update stock, receive/approve requests |
| Dispatcher/Admin | City-wide view, diversion, MCI control, analytics |

### 2.3 Constraints
- Free-tier services; hackathon timeline.
- Must run on mid-range Android browsers.
- Personal health data must follow data-minimisation principles.

---

## 3. Functional Requirements

Priority: **M** = Must, **S** = Should, **C** = Could.

### 3.1 MedPass (MP)
| ID | Requirement | Pri |
|---|---|---|
| MP-1 | Citizen can register (phone OTP or email) and create a MedPass: name, DOB, blood group, allergies, conditions, medications, emergency contacts (1 to 3), organ donor flag, language | M |
| MP-2 | System generates a QR code and printable/wallet-ready card (PNG/PDF), with Add-to-wallet-style image and lock-screen wallpaper export | M |
| MP-3 | QR contains a signed compact **critical-tier payload** readable offline, plus a URL token for online enrichment | M |
| MP-4 | Scanning requires no login or app install (opens a web page) | M |
| MP-5 | Critical tier visible to any scanner; full tier requires responder verification (paramedic login or one-time code sent to an emergency contact) | M |
| MP-6 | Every scan is recorded in an audit log (time, approx. location, scanner role) visible to the patient | M |
| MP-7 | On scan, an emergency alert with GPS can be sent to emergency contacts via SMS/WhatsApp link and to the dispatcher | M |
| MP-8 | Patient can revoke/rotate the QR token and edit privacy tiers | S |
| MP-9 | Medical data stored encrypted at rest; sensitive fields field-level encrypted | S |
| MP-10 | Card text available in English, Hindi, Marathi | S |

### 3.2 Incident Management (INC)
| ID | Requirement | Pri |
|---|---|---|
| INC-1 | Bystander or paramedic can create an incident: location (GPS), number of patients, type (road accident, cardiac, stroke, burns, obstetric, other) | M |
| INC-2 | Each patient gets a triage level and optional linked MedPass | M |
| INC-3 | Incident lifecycle: Created, Ambulance assigned, En route, Arrived, Handed over, Closed | M |
| INC-4 | Golden Hour timer starts at incident creation and is displayed to all participants | S |
| INC-5 | Nearest available ambulance is suggested for assignment (simulated fleet) | S |

### 3.3 Hospital Capability Matching (HM)
| ID | Requirement | Pri |
|---|---|---|
| HM-1 | Hospitals publish live availability: ICU beds, ER beds, trauma bay, ventilators, OT status, on-call specialists, blood stock by group | M |
| HM-2 | Each value stores `updated_at`; stale values are visually flagged and penalised in scoring | M |
| HM-3 | Engine maps patient condition to **required capabilities** (e.g. severe trauma needs trauma bay + OT + blood) | M |
| HM-4 | Engine ranks hospitals using a weighted score of ETA, capability fit, bed availability, blood match, projected queue, data freshness | M |
| HM-5 | UI shows top 3 hospitals with **explanation** per score component | M |
| HM-6 | Hospitals hard-failing a required capability are excluded (or shown as "not suitable" with reason) | M |
| HM-7 | Paramedic can accept recommendation or override with a reason (logged) | M |
| HM-8 | When selected, the hospital is **reserved** a bed for a hold time (e.g. 15 min) | S |

### 3.4 QueuePredict (QP)
| ID | Requirement | Pri |
|---|---|---|
| QP-1 | System tracks incoming ambulances per hospital with ETAs | M |
| QP-2 | Computes projected ER load at arrival time = current occupancy + inbound arrivals - expected discharges | M |
| QP-3 | If projected load exceeds threshold, recommends diverting to next best hospital | M |
| QP-4 | Dispatcher dashboard shows load heatmap/bars per hospital | S |
| QP-5 | Diversion decisions are logged with the numbers used | S |

### 3.5 Voice Handover (VH)
| ID | Requirement | Pri |
|---|---|---|
| VH-1 | Paramedic UI has one large push-to-talk button usable with gloves/one hand | M |
| VH-2 | Speech converted to text (English, Hindi, Marathi) | M |
| VH-3 | LLM extracts structured fields: age/sex, mechanism of injury, injuries, vitals (HR, BP, SpO2, GCS), interventions, needs (blood group, OT, ventilator) | M |
| VH-4 | Structured brief and raw transcript appear on the destination hospital's ER screen in real time | M |
| VH-5 | Extracted "needs" trigger a pre-arrival checklist (e.g. "Prepare 2 units O-neg", "Alert trauma surgeon") | S |
| VH-6 | Extracted values shown for paramedic confirmation before send (one tap) with auto-send timeout | S |
| VH-7 | If STT/LLM unavailable offline, raw audio/text is queued and sent later | S |

### 3.6 ResilientLink (RL)
| ID | Requirement | Pri |
|---|---|---|
| RL-1 | All critical actions (create incident, scan alert, handover) write to a local **outbox** and sync automatically when online | M |
| RL-2 | App shell and MedPass scan page work offline (service worker cache) | M |
| RL-3 | Offline QR payload decoding works without network | M |
| RL-4 | SMS fallback: a pre-filled SMS with compact incident code can be sent to the dispatcher number | S |
| RL-5 | Peer relay demo: two or more nearby devices exchange packets over WebRTC data channels and forward to a device that has connectivity | S |
| RL-6 | Messages are deduplicated by UUID and conflict-resolved with last-write-wins + vector timestamp | S |
| RL-7 | Connectivity status indicator and queued-items count visible | M |

### 3.7 Hospital Dashboard (HD)
| ID | Requirement | Pri |
|---|---|---|
| HD-1 | Staff login with hospital-scoped access | M |
| HD-2 | One-tap resource updates (steppers for beds, toggles for equipment) | M |
| HD-3 | Incoming patient list with ETA, triage, structured brief, needs checklist | M |
| HD-4 | Audible/visual alert when RED patient is inbound | S |
| HD-5 | Inter-hospital blood request to another hospital/blood bank | C |

### 3.8 Command Center (CC)
| ID | Requirement | Pri |
|---|---|---|
| CC-1 | Live map: ambulances, incidents, hospitals with status colours | M |
| CC-2 | Mass-casualty mode: split N patients across hospitals optimally | S |
| CC-3 | Green-corridor notification: send route/ETA to (simulated) traffic control | C |
| CC-4 | Analytics: average time-to-hospital, diversions made, dead-ends avoided, scans | S |

### 3.9 Simulation (SIM)
| ID | Requirement | Pri |
|---|---|---|
| SIM-1 | Seed script creates hospitals, users, MedPasses, ambulances | M |
| SIM-2 | Ambulance simulator moves markers along OSRM routes | M |
| SIM-3 | "Chaos buttons": kill network, fill a hospital's ICU, trigger multi-ambulance surge for live demo | S |

---

## 4. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-1 | Performance | QR scan to critical info displayed < 2 s on 4G; < 0.5 s offline |
| NFR-2 | Performance | Hospital recommendation computed < 2 s for 10 hospitals |
| NFR-3 | Realtime | Dashboard updates propagate < 2 s |
| NFR-4 | Availability | Core scan + alert flow works offline; sync within 10 s of reconnect |
| NFR-5 | Security | TLS everywhere; row-level security on all tables; JWT auth; signed QR payloads |
| NFR-6 | Privacy | Data minimisation; consent captured; audit log; patient can delete account and data |
| NFR-7 | Usability | Paramedic and bystander flows achievable in <= 3 taps; large touch targets (>= 48 px); high contrast |
| NFR-8 | Accessibility | WCAG 2.1 AA for key flows; voice alternatives; multilingual |
| NFR-9 | Compatibility | Chrome/Edge/Safari mobile, last 2 versions |
| NFR-10 | Maintainability | TypeScript strict mode; modular matching engine with unit tests |
| NFR-11 | Reliability | Idempotent sync; no data loss in outbox |
| NFR-12 | Explainability | Every recommendation shows its scoring factors |

---

## 5. External Interfaces
- **UI**: responsive PWA, mobile-first for paramedic/bystander, desktop-first for dashboards.
- **APIs**: OSRM (routing), SMS gateway (Twilio or `sms:` link), LLM API (structuring), Web Speech API.
- **Hardware**: camera (QR), microphone, GPS.

## 6. Data Requirements (summary)
Entities: users, medpasses, medpass_scans, hospitals, hospital_resources, blood_stock, ambulances, incidents, patients, handovers, recommendations, audit_log, outbox_events. Full schema in `ARCHITECTURE.md`.

## 7. Security & Privacy Requirements
1. Tiered disclosure with responder verification for the full tier.
2. Signed QR payload to prevent tampering; token rotation.
3. Row-level security by role and hospital.
4. Immutable audit log of every read of sensitive data.
5. Encryption at rest for medical fields; no health data in URLs or analytics.
6. Consent and purpose statement at registration; delete-my-data function.
7. Rate limiting on public scan endpoint to prevent scraping.

## 8. Risks and Mitigations
| Risk | Mitigation |
|---|---|
| Stale hospital data | Freshness score, decay, prompts to update, flagged in UI |
| Misuse of QR data | Tiered access, audit log, contact notification, token rotation |
| Wrong LLM extraction | Mandatory confirm step, raw transcript always shown |
| No connectivity during demo | Offline-first design, local seed data, simulator |
| Scope too large | Follow the phased roadmap; Must items first |

## 9. Acceptance Criteria (demo-level)
1. Scan a QR with airplane mode on: critical info shows.
2. Create incident: top 3 hospitals shown with explanations; one with full ICU is excluded.
3. Fill a hospital's ICU in the dashboard: recommendation changes within 2 s.
4. Three ambulances target one hospital: the third is diverted with the reason shown.
5. Speak a handover: structured brief appears on the hospital screen with a prep checklist.
6. Disconnect the network: actions queue, then sync on reconnect; peer relay demo forwards a packet.

## 10. Traceability
Each requirement ID (MP-, INC-, HM-, QP-, VH-, RL-, HD-, CC-, SIM-) should be referenced in commit messages and in `ROADMAP.md` tasks.
