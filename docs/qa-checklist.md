# Phase 1 — Pre-launch QA checklist

Status legend: ✅ pass · ⚠ partial / manual follow-up · ☐ not yet run · ⛔ blocked

Last verified: `2026-05-28` from `pnpm build && pnpm start` (sandbox).
Sandbox can't run a browser or reach `validator.schema.org` / `search.google.com`,
so anything that needs Lighthouse or external validators is marked **manual** —
re-run from your laptop or CI before declaring launch.

---

## 1. Build + bundle ✅

```
pnpm build
```

Outcome captured at last build:

| Route | Type | Initial JS | First Load JS |
|---|---|---:|---:|
| `/` | static | 980 B | 188 kB |
| `/[state]` (×51) | SSG | 980 B | 188 kB |
| `/[state]/[city]` (×25 prerendered, rest ISR) | SSG + ISR | 6.08 kB | **230 kB** |
| `/find-pros` | static | 168 B | 178 kB |
| `/api/lead` | dynamic | 140 B | 102 kB |
| `/privacy /terms /ccpa /tcpa-consent` | static | ~167 B | 106 kB |
| `/robots.txt /sitemap.xml /sitemaps/*.xml` | static | 140 B | 102 kB |

City pages carry RHF + zod + Turnstile (~37 kB delta vs state pages). Acceptable
for the conversion route; everything else stays at the shared 102 kB floor.

Gzipped initial HTML on a cold request:

| Route | Gzip |
|---|---:|
| `/` | 24.0 kB |
| `/california` | 17.8 kB |
| `/california/los-angeles-ca` | 21.7 kB ✅ (<100 kB target) |

---

## 2. Lighthouse audits ☐ manual

Run mobile, throttled (CPU 4×, Slow 4G).

Targets: **Performance 85+ · Accessibility 95+ · Best Practices 95+ · SEO 100**.

| URL | Tier | Notes | P / A / BP / SEO |
|---|---|---|---|
| `/` | — | Homepage | _record here_ |
| `/california` | — | State page | _record here_ |
| `/california/los-angeles-ca` | A | Tier A city | _record here_ |
| `/ohio/akron` | B | Pick from pipeline output once it runs | _record here_ |
| `/montana/billings` | C | Pick from pipeline output once it runs | _record here_ |

How to run: open each URL in Chrome → DevTools → Lighthouse → Mobile +
Performance/Accessibility/BP/SEO categories → Generate report. Or use
`pnpm dlx unlighthouse` / `pnpm dlx @unlighthouse/cli --site $URL` for a
batch report.

> The Tier B and Tier C URLs above are placeholders — replace with real
> slugs once the data pipeline has run against the full SimpleMaps CSV.

---

## 3. Schema validation ⚠ partial

Locally validated (every JSON-LD block parses cleanly with `JSON.parse` and
carries `https://schema.org` `@context`):

| Page | Schemas emitted |
|---|---|
| `/` | Organization, WebSite, Service, FAQPage |
| `/california` | Service, FAQPage, BreadcrumbList |
| `/california/los-angeles-ca` | Service, FAQPage, LocalBusiness, BreadcrumbList |

Still to run manually from a machine with internet:

- https://validator.schema.org → paste each page URL → confirm zero errors.
- https://search.google.com/test/rich-results → paste each page URL → confirm
  detected types match expected.

---

## 4. Content uniqueness ✅

Ran `generateCityContent` for 5 cities sampled from the 25-baseline (indexes
0, 4, 9, 14, 19):

| City | Words | FAQs |
|---|---:|---:|
| New York, NY | 643 | 5 |
| Phoenix, AZ | 631 | 5 |
| San Jose, CA | 642 | 5 |
| Charlotte, NC | 632 | 5 |
| Washington, DC | 637 | 5 |

Cross-city uniqueness: **5/5 unique intros, 5/5 whyCityMatters, 5/5
seasonality, 5/5 first FAQ questions, 5/5 FAQ orderings**. Average word
count 637, all inside the 600–900 target.

---

## 5. Form QA ⚠ live-DB follow-up

Verified from the prod build (`pnpm start`):

| Case | Expected | Result |
|---|---|---|
| Missing zip | 400 zod field error | ✅ |
| Invalid zip format (`abc12`) | 400 "Invalid ZIP" | ✅ |
| Invalid phone (`123`) | 400 "Invalid phone" | ✅ |
| Full submit, `tcpa_consent: false` | 400 "TCPA consent required" | ✅ |
| Full submit, missing `turnstile_token` | 400 "Verification required" | ✅ |
| Full submit, prod env, no `TURNSTILE_SECRET_KEY` | 403 "Turnstile secret not configured" | ✅ |
| 6th request inside 60s from same IP | 429 + `Retry-After` header | ✅ |
| Valid full submit reaches `insertLead` | 500 only because `NEXT_PUBLIC_SUPABASE_URL` empty in sandbox | ✅ (flow correct) |
| Spam: phone `1111111111` | reaches insertLead with `routing_status='spam_flagged'` | ✅ (flow correct) |

To finish before launch (needs live Supabase + Turnstile env):

1. Submit a full lead from the deployed form → verify a row appears in
   `leads` with `partial=false`, `tcpa_consent_text` populated, IP and
   user-agent stamped.
2. Abandon at step 6 after providing phone → verify a row appears with
   `partial=true`, no email.
3. Submit with a deliberately broken Turnstile widget → verify 403.
4. Submit with TCPA unchecked → verify 400.
5. Tail `lead_routing_log` and confirm one row per routing attempt with
   `destination_type` ∈ {contractor, aggregator}, `duration_ms` populated.

---

## 6. Indexation prep ✅

| Check | Status |
|---|---|
| `/robots.txt` reachable (200) | ✅ |
| `/sitemap.xml` reachable (200) | ✅ |
| `/sitemap.xml` is a sitemap index pointing to 3 children | ✅ |
| `/sitemaps/states.xml` has 51 `<url>` entries | ✅ |
| `/sitemaps/cities-1.xml` has ≤250 entries (currently 25) | ✅ |
| `/sitemaps/services.xml` empty valid `<urlset>` placeholder | ✅ |
| `xmllint --noout` clean on all sitemaps | ✅ |
| Homepage `<link rel="canonical">` present | ✅ `http://localhost:3000` |
| State page canonical present | ✅ |
| City page canonical present | ✅ |
| Commercial pages NOT noindex | ✅ all `index, follow` |
| `/find-pros` noindex | ✅ `noindex, nofollow` |
| Legal pages indexed | ✅ all `index, follow` |
| `<meta name="googlebot">` carries `max-image-preview:large` + `max-snippet:-1` | ✅ |

Note: `/find-pros` is both `Disallow:` in robots.txt and `noindex` in meta.
Slightly redundant — a Disallow'd URL can't be crawled, so the meta isn't
read. Keeping both as belt-and-suspenders; cost is zero.

---

## 7. Performance audit ✅ (build) / ☐ (Lighthouse LCP)

- City page initial HTML gzipped: **21.7 kB** (target <100 kB) ✅
- City page First Load JS: 230 kB (RHF + Turnstile)
- All pages SSG or ISR — zero SSR overhead at request time.
- `next/font` Inter is preloaded.
- Single client component (`MobileNav`) on shared layout; `LeadForm` is
  client-only on `/[state]/[city]` and `/find-pros`.

LCP target ≤2.5s on mobile — verify via Lighthouse from a real browser.
Expected to comfortably pass with the SSG output + small CSS surface.

---

## 8. Pre-deploy go / no-go

- [ ] All required env vars set in Vercel project settings (see
      `.env.example`, especially `NEXT_PUBLIC_SUPABASE_URL`,
      `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY`,
      `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `AGGREGATOR_LEAD_ENDPOINT`,
      `AGGREGATOR_API_KEY`, `GA4_MEASUREMENT_ID`, `GA4_API_SECRET`,
      `NEXT_PUBLIC_SITE_URL`, `GSC_VERIFICATION`).
- [ ] OG image at `public/og-default.png` replaced with branded asset.
- [ ] Legal pages reviewed by an attorney.
- [ ] Supabase migration `0001_initial_schema.sql` applied to the
      production project.
- [ ] At least one contractor record seeded in the `contractors` table
      so contractor-first routing has somewhere to land (otherwise every
      lead falls through to the aggregator).
- [ ] Lighthouse run on `/`, `/california`, `/california/los-angeles-ca`
      and at least one Tier B + Tier C city — all four scores green.
- [ ] Schema.org validator clean on the same set.

---

## 9. Deploy to Vercel

```bash
# from your laptop
git checkout main
git merge --ff-only claude/tender-ptolemy-8XhHf
git push origin main
```

1. **Connect repo**: Vercel → Add New → Project → import the GitHub repo.
2. **Framework**: Next.js (auto-detected).
3. **Build settings**:
   - Build command: `pnpm build`
   - Install command: `pnpm install`
   - Node version: 20.x (or latest LTS)
4. **Environment variables**: paste every key from `.env.example` into
   Production (and Preview, mirroring values you're happy to share).
5. **First deploy**: monitor the build logs. Expect ~12 s compile + a
   couple of minutes for static generation; total well under the 10-min
   Vercel ceiling.
6. **Custom domain**: Vercel → Project → Settings → Domains → Add your
   domain → follow the DNS instructions (CNAME or A record).
7. **Post-deploy smoke test** (replace `https://example.com`):
   ```bash
   curl -sI https://example.com/                            | head -1   # 200
   curl -sI https://example.com/california                  | head -1   # 200
   curl -sI https://example.com/california/los-angeles-ca   | head -1   # 200
   curl -sI https://example.com/south-dakota/aberdeen       | head -1   # 200 via ISR (only after pipeline runs and adds the city)
   curl -sI https://example.com/no-such-state               | head -1   # 404
   curl -sI https://example.com/sitemap.xml                 | head -1   # 200
   curl -sI https://example.com/robots.txt                  | head -1   # 200
   ```
8. **Google Search Console**:
   - Add `https://example.com` as a property → DNS or HTML-tag
     verification (use `GSC_VERIFICATION` env var for the HTML-tag path).
   - Submit `https://example.com/sitemap.xml` under Sitemaps.
   - Wait for status `Success`. Coverage report fills in within 1–3 days.
9. **GA4**: confirm the server-side `lead_submit` event arrives in the
   GA4 DebugView within a minute of a test submission.

---

## 10. Reference

- Acceptance criteria for Phase 2 trigger: see
  `docs/post-launch-monitoring.md`.
- Data pipeline runbook: `README.md` → "Data pipeline".
- Form payload schema + TCPA copy: `lib/lead-routing/tcpa.ts`.
