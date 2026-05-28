# Life Insurance Recommendation

National life insurance lead generation site. Programmatic SEO across U.S. states and cities, paired with on-site quote intake and routing to aggregator partners.

## Stack

- **Framework:** Next.js 15 (App Router, TypeScript, no `/src`, `@/*` alias)
- **Styling:** Tailwind CSS v4, shadcn/ui (neutral theme), `lucide-react` icons
- **Forms & validation:** `react-hook-form`, `zod`, `@hookform/resolvers`
- **Anti-bot:** Cloudflare Turnstile (`@marsidev/react-turnstile`)
- **Data layer:** Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- **SEO:** `next-seo`, server-rendered metadata, generated sitemaps
- **Analytics:** `@vercel/analytics`
- **Utilities:** `date-fns`, `clsx`, `tailwind-merge`
- **Tooling:** pnpm, ESLint, Prettier (+ `prettier-plugin-tailwindcss`)

## Project layout

```
app/
  [state]/                Programmatic state pages
    [city]/               Programmatic city pages
  api/lead/               Lead intake endpoint
  services/               Static service / product pages
components/
  forms/                  Quote-form building blocks
  layout/                 Header, footer, shell
  pages/                  Page-level composed sections
  seo/                    SEO helpers / JSON-LD
  ui/                     shadcn/ui primitives
lib/
  data/                   Static + fetched dataset access
  seo/                    Metadata, schema.org, sitemap helpers
  supabase/               Server + browser Supabase clients
  lead-routing/           Aggregator routing, validation, retries
  content/                Page-content generators / templates
scripts/
  data-pipeline/          ETL for Census, NOAA, geo data
  content-gen/            Bulk content / page generators
public/sitemaps/          Generated sitemap files
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in values:

| Variable                          | Purpose                                  |
| --------------------------------- | ---------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`        | Supabase project URL (client + server)   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Supabase anon key (client)               |
| `SUPABASE_SERVICE_ROLE_KEY`       | Supabase service role (server only)      |
| `CENSUS_API_KEY`                  | U.S. Census API key (demographic data)   |
| `NOAA_API_TOKEN`                  | NOAA climate data token                  |
| `GOOGLE_MAPS_API_KEY`             | Geocoding / maps                         |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`  | Cloudflare Turnstile site key (client)   |
| `TURNSTILE_SECRET_KEY`            | Turnstile verification (server)          |
| `AGGREGATOR_LEAD_ENDPOINT`        | Lead-buyer POST endpoint                 |
| `AGGREGATOR_API_KEY`              | Lead-buyer auth token                    |
| `NEXT_PUBLIC_SITE_URL`            | Canonical site URL (SEO, sitemaps)       |

## Commands

```bash
pnpm install        # install dependencies
pnpm dev            # start the dev server (http://localhost:3000)
pnpm build          # production build
pnpm start          # run the production build
pnpm lint           # ESLint
pnpm format         # Prettier write
pnpm format:check   # Prettier check
```

## Database

The schema lives in `supabase/migrations/`. The initial migration
(`0001_initial_schema.sql`) creates four tables — `leads`, `contractors`,
`lead_routing_log`, `content_overrides` — and enables row-level security on
all of them. Service-role writes only, except `content_overrides` which is
anon-readable so page templates can fetch per-city customizations at request
time.

### Apply the migration

**Option 1 — Supabase dashboard (no CLI required):**

1. Open the Supabase project in the dashboard.
2. Navigate to **SQL Editor** → **New query**.
3. Paste the contents of `supabase/migrations/0001_initial_schema.sql`.
4. Run. Verify the tables appear under **Table Editor** with RLS enabled.

**Option 2 — Supabase CLI (recommended for repeatable migrations):**

```bash
# one-time
pnpm dlx supabase login
pnpm dlx supabase link --project-ref <your-project-ref>

# apply all pending migrations to the linked remote project
pnpm dlx supabase db push
```

### Typed client

- `lib/supabase/client.ts` — `createBrowserClient()` (anon key, client
  components) and `createServerClient()` (service role, API routes).
- `lib/supabase/types.ts` — hand-written `Database` type that mirrors the
  migration. Regenerate with `pnpm dlx supabase gen types typescript
  --linked > lib/supabase/types.generated.ts` once the project is linked,
  then swap the import if you'd rather not maintain by hand.
- `lib/supabase/queries.ts` — typed helpers: `insertLead`,
  `updateLeadRouting`, `getContractorForZip`, `logRoutingAttempt`,
  `getContentOverride`.

## Data pipeline

The page templates run against three static JSON files in `lib/data/`:
`cities.json`, `states.json`, `cities-by-state.json`. They're generated
offline by the scripts in `scripts/data-pipeline/`:

| Stage | Script | Source |
| ----- | ------ | ------ |
| 1 | `fetch-census.ts` | Census ACS 5-year (2022) — median home value, household income, housing units |
| 2 | `fetch-noaa.ts` | NOAA NCEI 1991–2020 climate normals — temps, precip, days >90°F / <32°F |
| 3 | `generate-pricing.ts` | Deterministic HVAC pricing from Census + NOAA |
| 4 | `merge-data.ts` | Joins everything into `lib/data/*.json` |

Each stage maintains its own cache under `scripts/data-pipeline/output/`
and skips work already done, so reruns are cheap. Pass `--force` to
recompute everything; `--limit N` for quick smoke tests; `--min-population
N` to trim the long tail.

### Setup

1. Download the free **US Cities Basic** CSV from
   [simplemaps.com/data/us-cities](https://simplemaps.com/data/us-cities)
   and place it at `scripts/data-pipeline/raw/uscities.csv` (gitignored —
   includes ~30k cities, attribution required per SimpleMaps license).
2. Get a [Census API key](https://api.census.gov/data/key_signup.html)
   and a [NOAA NCDC token](https://www.ncdc.noaa.gov/cdo-web/token) and
   put them in `.env.local`.
3. Run:
   ```bash
   pnpm data:build                                # full pipeline, all cities
   pnpm data:build -- --min-population 25000      # 1k-ish cities, faster
   pnpm data:build -- --skip-census --skip-noaa   # offline merge only
   ```

Outputs are pretty-printed for clean diffs. The generated JSON in
`lib/data/` is intended to be committed once it reflects real data; the
intermediate caches in `scripts/data-pipeline/output/` are not.

## Deployment

Production target is Vercel. Configure the environment variables above in the
Vercel project settings, then connect the repo. `main` deploys to production;
preview deploys are created per PR.

## Build phases

### Phase 1 — 301 pages MVP

- [x] Next.js 15 + Tailwind + shadcn/ui scaffolding
- [x] Folder structure for routes, components, lib, scripts
- [x] Environment variable template
- [x] Supabase schema + typed client (leads, contractors, routing log, overrides)
- [x] Data pipeline scripts (Census + NOAA + pricing → `lib/data/*.json`)
- [x] Typed data accessors + deterministic content variant rotator
- [x] Layout chrome: Header, Footer, Breadcrumbs (JSON-LD), SectionContainer, PhoneCTA
- [x] CountryPage, StatePage, CityPage templates + schema builders + SchemaInjector
- [x] Dynamic routes: `/`, `/[state]`, `/[state]/[city]` (ISR), 404 + error pages
- [x] 6-step lead form + Turnstile + partial-save + /find-pros + /api/lead stub
- [x] /api/lead production handler: zod, rate-limit, Turnstile, spam, Supabase insert, contractor → aggregator routing, GA4 fire
- [ ] Run pipeline against full SimpleMaps CSV (≥1000 cities, all 50 states)
- [ ] State page template (`/[state]`)
- [ ] City page template (`/[state]/[city]`)
- [ ] Core quote form + Turnstile + Supabase persistence
- [ ] Lead routing to aggregator endpoint
- [ ] SEO metadata, JSON-LD, canonical, OG
- [ ] `sitemap.xml` + `robots.txt`
- [ ] Vercel deploy on `main`

### Phase 2 — Coverage expansion

- [ ] Extend city coverage (1k+ pages)
- [ ] Service / product pages (term, whole, IUL, final expense)
- [ ] Comparison / FAQ pages
- [ ] Content generation pipeline (`scripts/content-gen`)

### Phase 3 — Data + personalization

- [ ] Census + NOAA pipelines (`scripts/data-pipeline`)
- [ ] Localized risk / cost factors on city pages
- [ ] A/B testing of form variants

### Phase 4 — Lead quality + monetization

- [ ] Server-side lead scoring
- [ ] Multi-buyer routing with fallback
- [ ] Reporting dashboard
