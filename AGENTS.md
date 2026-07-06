# CarbonTrack — Agent Guide

## Stack
- Next.js 14 (App Router), TypeScript (strict), Tailwind CSS v3
- PostgreSQL via raw `pg` (no ORM), JWT auth via `jose`
- `@/*` maps to `src/*`

## Dev commands
```bash
npm run dev          # next dev --turbo -H 0.0.0.0 (4GB heap)
npm run build        # next build (4GB heap); TS + ESLint errors ignored during build
npm run start        # next start (production)
npm run lint         # next lint; extends next/core-web-vitals
npm run db:seed      # node scripts/seed.js
node scripts/seed-admin.js   # creates admin@carbontrack.com / Admin@2026!
```

## Portals
| Route | Cookie | Audience |
|-------|--------|----------|
| `/dashboard` | `token` | Company users |
| `/admin` | `adm_token` | Administrators |
| `/expert` | `exp_token` | Auditors/experts |
| `/partner` | *(no middleware)* | Partner organizations |

Each portal's JWT includes `{ userId, email, companyId, role }` with 7-day expiry.

## API routes
`src/app/api/` has 21 endpoint groups: `admin/*`, `assessments`, `auth`, `certifications`, `company`, `dashboard`, `documents`, `emissions`, `expert`, `market`, `notifications`, `partner`, `partners`, `puro`, `rag`, `reports`, `settings`, `sites`, `subscription`, `subscriptions`, `vvb-registry`.

## DB
- Connects via `DATABASE_URL` or individual `PG*` vars (`PGHOST`, `PGPORT`, etc.)
- Use `PGSSLMODE=require` for SSL (Neon, Supabase); off by default
- Connection retry in `src/lib/db.ts`: auto-retries terminated connections once
- SQL migrations: `scripts/init-db.sql` + `scripts/migrate-*.sql` (12 files)
  - Run sequentially in alpha order; no version tracking table

## Build quirks (intentional)
- `next.config.js`: both `eslint.ignoreDuringBuilds` and `typescript.ignoreBuildErrors` are `true`
- ESLint + TypeScript still work in dev/IDE — only production build skips them
- `@react-pdf/renderer` is listed in `serverComponentsExternalPackages`
- `NODE_OPTIONS=--max-old-space-size=4096` hardcoded in every npm script

## MRV engine
`src/lib/mrv/calculate.ts` dispatches by methodology code: `VM0048` (REDD+), `VM0047` (ARR), `VM0050` (cookstoves), `VM0033` (mangroves). Returns `MRVResult` with baseline, leakage, buffer, and eligible credits.

## RAG assistant
`src/lib/groq.ts` — Groq API (LLaMA 3.3 70B), OpenAI-compatible. Two modes: `groqComplete` (non-streaming) and `groqStream` (returns `ReadableStream`). Requires `GROQ_API_KEY` in env.

## Project conventions
- All UI text is in French
- No test framework, no formatter, no pre-commit hooks, no Docker
- CI/CD: Jenkins (`Jenkinsfile`) → rsync releases → atomic symlink → PM2 reload
- Production: PM2 in fork mode on port 3000, managed via `ecosystem.config.js`
- `scripts/` contains all DB init + migration + seed scripts

## Production gotchas
- User-uploaded files (logos, documents) go to `public/logos/` and `public/uploads/`. In Jenkins deploys these dirs are symlinked to `shared/` — if you add a new upload directory, you **must** add a symlink in the Jenkinsfile (see `Deploy: stage release` stage) and a `location` block in `deploy/nginx-carbontrack.conf`
- `public/logos/` and `public/uploads/` are gitignored — they do not exist in fresh clones
