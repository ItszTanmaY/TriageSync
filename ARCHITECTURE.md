# Architecture, Data Model, API and Algorithms

## 1. System Overview

```
 Bystander / Citizen / Paramedic / Hospital / Dispatcher  (PWA, Next.js)
                     |            ^
        HTTPS + WebSocket (Supabase Realtime)
                     v            |
   +-----------------------------------------------+
   | Supabase: Postgres+PostGIS | Auth | Realtime  |
   |           Edge Functions   | Storage          |
   +-----------------------------------------------+
        |               |                |
   OSRM routing    LLM API (structuring)  SMS gateway
   
 Offline path: IndexedDB outbox -> background sync -> API
 Peer path:    device A --WebRTC--> device B (online) -> API
```

### Folder structure (Next.js)
```
/app
  /(public)/scan/[token]        # bystander scan page
  /(citizen)/medpass            # create/edit MedPass
  /(paramedic)/incident/[id]    # incident + voice + recommendations
  /(hospital)/dashboard         # resources + incoming
  /(admin)/command              # map, MCI, analytics
  /api/...                      # route handlers
/lib
  /matching     # scoring engine (pure functions + tests)
  /queue        # queue prediction
  /qr           # sign/verify/encode payload
  /offline      # outbox, sync, connectivity
  /voice        # STT + structuring
  /peer         # WebRTC relay
  /supabase     # client + types
/sim            # seed + ambulance simulator
/supabase/migrations
/tests
```

## 2. Database Schema (PostgreSQL / Supabase)

```sql
create extension if not exists postgis;
create extension if not exists pgcrypto;

create type user_role as enum ('citizen','paramedic','hospital_staff','blood_bank','dispatcher','admin');
create type triage_level as enum ('red','yellow','green','black');
create type incident_status as enum ('created','assigned','en_route','arrived','handed_over','closed');
create type incident_type as enum ('road_accident','cardiac','stroke','burns','obstetric','paediatric','other');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role user_role not null default 'citizen',
  full_name text,
  hospital_id uuid,               -- for hospital_staff
  created_at timestamptz default now()
);

create table medpasses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  full_name text not null,
  dob date,
  sex text,
  blood_group text check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  allergies text[] default '{}',
  conditions text[] default '{}',
  medications text[] default '{}',
  organ_donor boolean default false,
  language text default 'en',
  public_token text unique not null,       -- rotatable
  token_version int default 1,
  critical_payload_signed text,            -- compact signed string encoded in QR
  full_tier_encrypted bytea,               -- optional extra data
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  medpass_id uuid references medpasses(id) on delete cascade,
  name text not null,
  relation text,
  phone text not null,
  priority int default 1
);

create table medpass_scans (
  id uuid primary key default gen_random_uuid(),
  medpass_id uuid references medpasses(id) on delete cascade,
  scanned_at timestamptz default now(),
  location geography(point,4326),
  scanner_role text,               -- 'anonymous','paramedic'
  tier_accessed text,              -- 'critical','full'
  client_id text
);

create table hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location geography(point,4326) not null,
  phone text,
  level int default 2,             -- 1 = tertiary/trauma centre
  specialties text[] default '{}'  -- 'trauma','cardiac','neuro','burns','obstetric','paediatric'
);

create table hospital_resources (
  hospital_id uuid primary key references hospitals(id) on delete cascade,
  icu_total int, icu_free int,
  er_total int, er_free int,
  trauma_bay_free int default 0,
  ventilators_free int default 0,
  ot_available boolean default false,
  cath_lab_available boolean default false,
  ct_available boolean default true,
  on_call jsonb default '{}',      -- {"trauma_surgeon":true,"neurosurgeon":false}
  avg_er_service_min int default 20,
  updated_at timestamptz default now()
);

create table blood_stock (
  hospital_id uuid references hospitals(id) on delete cascade,
  blood_group text,
  units int default 0,
  updated_at timestamptz default now(),
  primary key (hospital_id, blood_group)
);

create table ambulances (
  id uuid primary key default gen_random_uuid(),
  callsign text unique,
  location geography(point,4326),
  status text default 'available', -- available, assigned, en_route, offline
  updated_at timestamptz default now()
);

create table incidents (
  id uuid primary key default gen_random_uuid(),
  created_by uuid,
  type incident_type not null,
  status incident_status default 'created',
  location geography(point,4326) not null,
  patient_count int default 1,
  ambulance_id uuid references ambulances(id),
  created_at timestamptz default now(),
  closed_at timestamptz,
  client_uuid uuid unique          -- idempotency for offline sync
);

create table patients (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references incidents(id) on delete cascade,
  medpass_id uuid references medpasses(id),
  triage triage_level default 'red',
  est_age int, sex text,
  destination_hospital_id uuid references hospitals(id),
  reserved_until timestamptz,
  eta_min numeric
);

create table recommendations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  ranking jsonb not null,          -- [{hospital_id, score, factors:{...}, excluded_reason}]
  chosen_hospital_id uuid,
  override_reason text,
  created_at timestamptz default now()
);

create table handovers (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  transcript text,
  structured jsonb,                -- SBAR/MIST fields
  needs jsonb,                     -- {"blood":"O-","units":2,"ot":true,"ventilator":true}
  confirmed boolean default false,
  created_at timestamptz default now()
);

create table audit_log (
  id bigserial primary key,
  at timestamptz default now(),
  actor uuid, actor_role text,
  action text, entity text, entity_id uuid,
  meta jsonb
);

create table diversions (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid, from_hospital uuid, to_hospital uuid,
  reason text, numbers jsonb, at timestamptz default now()
);

alter publication supabase_realtime add table
  hospital_resources, blood_stock, ambulances, incidents, patients, handovers;
```

### Row-Level Security rules (summary)
- `medpasses`: owner full access; public access only via an **Edge Function** that returns the critical tier for a valid token (never direct table access).
- `hospital_resources`, `blood_stock`: read for authenticated roles; write only for staff of that `hospital_id`.
- `incidents`, `patients`, `handovers`: paramedic/dispatcher read-write; hospital staff read only where `destination_hospital_id` = their hospital.
- `audit_log`: insert via server only; patient can read rows about their own MedPass.

## 3. QR Payload Design

Critical payload (compact JSON, < 300 bytes to keep QR small):
```json
{"v":1,"n":"Asha K","bg":"O-","al":["penicillin"],"cd":["T2DM"],"ec":"+91XXXXXXXXXX","t":"<public_token>","ts":1730100000}
```
- Signed with Ed25519 (private key on server). QR content: `https://app.example/s/<token>#<base64url(payload)>.<base64url(signature)>`.
- Public key bundled in the PWA so the scan page can **verify and display offline**. The part after `#` never reaches the server (hash fragment), which also protects privacy in logs.
- Rotate: increment `token_version`, regenerate and invalidate old token server-side.

## 4. API Surface (Next.js route handlers / Edge Functions)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/medpass` | Create/update MedPass, returns QR assets |
| GET | `/api/scan/:token` | Critical tier (rate-limited, logs scan) |
| POST | `/api/scan/:token/full` | Full tier after responder auth or OTP |
| POST | `/api/scan/:token/alert` | Send emergency alert (SMS + dispatcher) |
| POST | `/api/incidents` | Create incident (idempotent via `client_uuid`) |
| POST | `/api/incidents/:id/recommend` | Run matching engine, store ranking |
| POST | `/api/patients/:id/select-hospital` | Choose/override and reserve bed |
| POST | `/api/handover` | Submit transcript, returns structured draft |
| POST | `/api/handover/:id/confirm` | Confirm and push to hospital |
| PATCH | `/api/hospital/resources` | Staff update resources |
| GET | `/api/command/overview` | City snapshot for dispatcher |
| POST | `/api/sync` | Batch endpoint for outbox events |
| POST | `/api/signal` | WebRTC signalling for peer relay demo |
| POST | `/api/sim/*` | Chaos buttons (demo only, admin) |

## 5. Matching Engine

### 5.1 Capability requirements per incident type
```ts
const REQUIREMENTS = {
  road_accident: { must: ['er','trauma_bay'], should: ['ot','blood','icu','ct'] },
  cardiac:       { must: ['er','cath_lab'],   should: ['icu'] },
  stroke:        { must: ['er','ct'],         should: ['icu','neuro'] },
  burns:         { must: ['er'],              should: ['burns','icu'] },
  obstetric:     { must: ['er','obstetric'],  should: ['ot','blood'] },
  paediatric:    { must: ['er','paediatric'], should: ['icu'] },
  other:         { must: ['er'],              should: [] },
};
```
- `must` failing -> hospital excluded (reason shown).
- Severity RED upgrades some `should` items to `must` (e.g. ICU bed, matching blood).

### 5.2 Score (0 to 100), weights configurable
```
score = 0.30*eta_score
      + 0.25*capability_score
      + 0.15*bed_score
      + 0.15*blood_score
      + 0.10*queue_score
      + 0.05*freshness_score
```
- `eta_score = clamp(1 - eta/maxEta)` (OSRM ETA, fallback haversine/40 km/h)
- `capability_score` = fraction of `should` satisfied
- `bed_score` = min(1, free_beds / 2)
- `blood_score` = 1 if exact group units >= needed; 0.6 if compatible group; 0 otherwise
- `queue_score` = 1 - projected_load (see 6)
- `freshness_score` = exp(-age_minutes/30)
- Return top 3 with per-factor breakdown for the explainability panel.

## 6. QueuePredict

```
inbound(h, t)   = ambulances heading to h with ETA <= t
projected_load  = (er_total - er_free + inbound(h, ETA_this)
                   - expected_discharges(h, ETA_this)) / er_total
wait_min        = max(0, (inbound + occupied - er_total)) * avg_er_service_min / er_total
divert if projected_load > 0.85  or  wait_min > 15  -> pick next best hospital
```
Log each decision in `diversions.numbers` so judges can see the maths.

## 7. Voice Handover Pipeline
1. Push-to-talk -> Web Speech API (lang: en-IN / hi-IN / mr-IN); fallback: record audio -> server STT.
2. Transcript -> LLM with a strict JSON schema prompt:
```
Extract: age, sex, mechanism, injuries[], vitals{hr,bp,spo2,gcs}, interventions[],
needs{blood_group,units,ot,ventilator,specialist}, notes. Use null when not stated.
Never invent values. Output JSON only.
```
3. Show draft to paramedic -> confirm (or auto-send after 10 s).
4. Save `handovers`, realtime push to the hospital screen, generate checklist from `needs`.

## 8. Offline and Peer Relay

### Outbox
```ts
type OutboxEvent = { id: string; type: string; payload: any; createdAt: number; attempts: number };
// write -> IndexedDB; flush on 'online' event + Background Sync + 10s timer
// server dedupes by id (client_uuid); response marks event done
```
### Peer relay (demo scope)
- Devices on same Wi-Fi/hotspot (or any internet) connect via WebRTC data channel using the signalling endpoint.
- Packets: `{id, ttl, type, payload, hops[]}`; each node stores-and-forwards; the node with internet posts to `/api/sync`.
- Dedup by `id`; decrement `ttl`; show hop count in UI.
- Honest note for judges: browsers cannot advertise BLE; true cellular-free mesh needs a native app (Android Nearby Connections / BLE) -> roadmap item.

## 9. Security Checklist
- [ ] RLS on every table, tested with non-privileged roles
- [ ] Public scan endpoint: rate limit (e.g. 20/min/IP), no enumeration (random 128-bit tokens)
- [ ] Ed25519 signature verification on QR payload
- [ ] Full-tier access requires verified responder or OTP to contact; audit every access
- [ ] Secrets only in env vars; never in client bundle
- [ ] No health data in query strings, logs or analytics
- [ ] Delete-my-data endpoint
- [ ] Disclaimer: prototype, not a medical device

## 10. Test Plan
- Unit: scoring weights, exclusions, blood compatibility, queue projection, QR sign/verify.
- Integration: create incident -> recommendation -> reserve -> handover -> hospital sees it.
- Offline: Playwright with network off; verify outbox flush.
- Demo script rehearsal covers all acceptance criteria in SRS section 9.
