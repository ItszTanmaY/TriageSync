# AGENTS.md: Rules for the AI coding agent

Place this file in the repo root (Antigravity reads project rules from root files such as `AGENTS.md`; if your version expects a different rules location, copy this content there).

## Project
TriageSync 2.0 + MedPass: emergency coordination PWA. Source of truth: `SRS.md`, `ARCHITECTURE.md`, `ROADMAP.md`. Read them before any task.

## Stack (do not change without asking)
Next.js App Router, TypeScript (strict), Tailwind, shadcn/ui, Supabase (Postgres, PostGIS, Realtime, Auth, Edge Functions), Leaflet + OSM, Workbox, idb, tweetnacl, Zod, React Hook Form, Vitest, Playwright.

## Working rules
1. **Plan first**: before coding, output a short plan listing files to create or change and the SRS IDs addressed. Then implement.
2. Work on **one roadmap phase at a time**. Do not build features from later phases.
3. Keep business logic (matching, queue, QR signing, outbox) in `/lib` as **pure, tested functions**, not inside components.
4. Validate all inputs with Zod at API boundaries.
5. Never use `any`; no `@ts-ignore` without a comment explaining why.
6. All DB access respects RLS. Never use the service-role key in client code.
7. Never log or place health data in URLs, analytics or error messages.
8. Every write from a client that matters (incident, alert, handover) must go through the **offline outbox** with a client UUID for idempotency.
9. UI: mobile-first for paramedic and bystander screens; touch targets >= 48px; high contrast; no tiny text; avoid typing-heavy flows.
10. Every recommendation or diversion must expose its **explanation** (factor breakdown).
11. Use seeded fictional data only. Add a visible "Prototype, not a medical device" notice in the footer.
12. After each task: run lint, typecheck and tests; fix failures; summarise what changed and what is left.
13. Record any deviation from the specs in `DECISIONS.md`.
14. Commit messages reference requirement IDs, e.g. `feat(HM-4): weighted scoring engine`.

## Code style
- Small components, named exports, colocate tests as `*.test.ts`.
- Constants for weights and thresholds live in `/lib/config.ts`.
- Dates in UTC in the DB; format locally in UI. Use `date-fns`.

## Definition of done
- Meets the SRS requirement IDs for the phase
- Unit tests for new logic pass
- Works with network disabled where SRS says so
- No console errors; accessible labels on interactive elements
- ROADMAP checklist updated

## Do-not list
- Do not add paid services or API keys without asking.
- Do not invent medical advice; the system supports routing and information only.
- Do not remove audit logging or rate limiting for convenience.
