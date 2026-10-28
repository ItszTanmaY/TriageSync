-- TriageSync 2.0 + MedPass: Initial Database Schema
-- Architecture Specification: Section 2

create extension if not exists postgis;
create extension if not exists pgcrypto;

-- Enums
do $$ begin
  create type user_role as enum ('citizen','paramedic','hospital_staff','blood_bank','dispatcher','admin');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type triage_level as enum ('red','yellow','green','black');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type incident_status as enum ('created','assigned','en_route','arrived','handed_over','closed');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type incident_type as enum ('road_accident','cardiac','stroke','burns','obstetric','paediatric','other');
exception
  when duplicate_object then null;
end $$;

-- 1. Profiles Table
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  role user_role not null default 'citizen',
  full_name text,
  hospital_id uuid,
  created_at timestamptz default now()
);

-- 2. Hospitals Table
create table if not exists hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location geography(point,4326) not null,
  phone text,
  level int default 2,
  specialties text[] default '{}'
);

-- 3. MedPasses Table
create table if not exists medpasses (
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
  public_token text unique not null,
  token_version int default 1,
  critical_payload_signed text,
  full_tier_encrypted bytea,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Emergency Contacts Table
create table if not exists emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  medpass_id uuid references medpasses(id) on delete cascade,
  name text not null,
  relation text,
  phone text not null,
  priority int default 1
);

-- 5. MedPass Scans (Audit Log for patient)
create table if not exists medpass_scans (
  id uuid primary key default gen_random_uuid(),
  medpass_id uuid references medpasses(id) on delete cascade,
  scanned_at timestamptz default now(),
  location geography(point,4326),
  scanner_role text,
  tier_accessed text,
  client_id text
);

-- 6. Hospital Resources Table
create table if not exists hospital_resources (
  hospital_id uuid primary key references hospitals(id) on delete cascade,
  icu_total int not null default 0,
  icu_free int not null default 0,
  er_total int not null default 0,
  er_free int not null default 0,
  trauma_bay_free int default 0,
  ventilators_free int default 0,
  ot_available boolean default false,
  cath_lab_available boolean default false,
  ct_available boolean default true,
  on_call jsonb default '{}',
  avg_er_service_min int default 20,
  updated_at timestamptz default now()
);

-- 7. Blood Stock Table
create table if not exists blood_stock (
  hospital_id uuid references hospitals(id) on delete cascade,
  blood_group text check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  units int default 0 check (units >= 0),
  updated_at timestamptz default now(),
  primary key (hospital_id, blood_group)
);

-- 8. Ambulances Table
create table if not exists ambulances (
  id uuid primary key default gen_random_uuid(),
  callsign text unique not null,
  location geography(point,4326),
  status text default 'available',
  updated_at timestamptz default now()
);

-- 9. Incidents Table
create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  created_by uuid,
  type incident_type not null,
  status incident_status default 'created',
  location geography(point,4326) not null,
  patient_count int default 1,
  ambulance_id uuid references ambulances(id),
  created_at timestamptz default now(),
  closed_at timestamptz,
  client_uuid uuid unique
);

-- 10. Patients Table
create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references incidents(id) on delete cascade,
  medpass_id uuid references medpasses(id),
  triage triage_level default 'red',
  est_age int,
  sex text,
  destination_hospital_id uuid references hospitals(id),
  reserved_until timestamptz,
  eta_min numeric
);

-- 11. Recommendations Table
create table if not exists recommendations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  ranking jsonb not null,
  chosen_hospital_id uuid,
  override_reason text,
  created_at timestamptz default now()
);

-- 12. Handovers Table
create table if not exists handovers (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  transcript text,
  structured jsonb,
  needs jsonb,
  confirmed boolean default false,
  created_at timestamptz default now()
);

-- 13. Audit Log Table
create table if not exists audit_log (
  id bigserial primary key,
  at timestamptz default now(),
  actor uuid,
  actor_role text,
  action text not null,
  entity text not null,
  entity_id uuid,
  meta jsonb
);

-- 14. Diversions Table (QueuePredict analytics)
create table if not exists diversions (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references incidents(id),
  from_hospital uuid references hospitals(id),
  to_hospital uuid references hospitals(id),
  reason text not null,
  numbers jsonb not null,
  at timestamptz default now()
);

-- Indices for rapid spatial and lookup performance
create index if not exists idx_hospitals_location on hospitals using gist (location);
create index if not exists idx_ambulances_location on ambulances using gist (location);
create index if not exists idx_incidents_location on incidents using gist (location);
create index if not exists idx_medpasses_token on medpasses (public_token);
create index if not exists idx_incidents_status on incidents (status);
create index if not exists idx_patients_incident on patients (incident_id);
