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
- [ ] Static data layer: 50 states + ~250 priority cities
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
