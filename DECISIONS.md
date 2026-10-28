# Architectural Decisions & Technical Log (TriageSync 2.0 + MedPass)

## DEC-001: Offline-First Mock Store Fallback
- **Context:** High-stakes hackathon demos, CI test pipelines, and real-world disaster/airplane mode offline evaluation require zero external setup blockers.
- **Decision:** Built a type-safe `LocalMockStore` in `lib/supabase/client.ts` that acts as an in-memory replica of Supabase PostgreSQL and PostGIS tables. When `NEXT_PUBLIC_SUPABASE_URL` is omitted, the app transparently uses the seeded 10-hospital Pune grid without crashing or erroring. When Supabase credentials are provided, it accesses Supabase via RLS.
- **Outcome:** All unit and integration tests run offline without network access; zero disruption if judges test in airplane mode.

## DEC-002: Ed25519 Cryptographic QR Payload Encoding
- **Context:** SRS MP-3 and ARCHITECTURE.md Section 3 require offline-readable signed critical-tier payloads (< 300 bytes) stored in the URL hash fragment (`#<b64(payload)>.<b64(signature)>`).
- **Decision:** Utilized `tweetnacl` Ed25519 detached signatures. The public key is bundled in the client PWA and configurable via `NEXT_PUBLIC_MEDPASS_SIGNING_PUBLIC_KEY`. Hash fragments are never transmitted over HTTP to server access logs, safeguarding privacy under the DPDP Act (India).
- **Outcome:** Scan page verifies signatures in < 10ms offline in airplane mode.

## DEC-003: Strict TypeScript & Zero-`any` Standard
- **Context:** Codebase reliability for high-stakes emergency systems.
- **Decision:** Strict compiler flags enabled (`noImplicitAny: true`, `strictNullChecks: true`). Every JSON boundary (resources, ranking, handover MIST/SBAR fields, outbox payloads) is validated with Zod schemas.
