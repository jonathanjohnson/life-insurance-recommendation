# Post-launch monitoring

What to watch, where to set the alarms, and how to know when Phase 1 is
done and Phase 2 can start.

---

## Cadence

| Surface | First 2 weeks | After |
|---|---|---|
| GSC Coverage report | daily | weekly |
| GSC Performance (clicks, impressions, CTR) | daily | weekly |
| Vercel bandwidth + function execution | daily | weekly |
| Supabase row counts (`leads`, `lead_routing_log`) | daily | weekly |
| Lead routing log review (failures, p95, aggregator response) | weekly | bi-weekly |
| Ahrefs rank tracker | weekly | weekly |
| OG image preview (Slack / Facebook debugger) | once at launch | on brand change |

---

## Google Search Console

1. **Coverage**: Pages → Indexed / Not indexed. Goal: ≥60% indexation
   inside 30 days. Common "Not indexed" reasons to expect early:
   - "Discovered, currently not indexed" → Google found the URL via the
     sitemap but hasn't crawled yet. Time-based; no action needed.
   - "Crawled, currently not indexed" → quality signal. Check the page —
     usually means thin content. Our city pages average 637 visible
     words; if a specific city scores below ~500 words it's probably
     missing enriched data (pipeline didn't backfill that city).
   - "Duplicate, Google chose different canonical" → check the canonical
     link tag, confirm we're not pointing to an alias.
2. **Sitemap**: Sitemaps → expect status `Success` with 51 + 250
   discovered URLs. If Google reports a parse error, run
   `xmllint --noout https://yourdomain.com/sitemap.xml` to confirm.
3. **Performance**: track impressions on the seed cities first. A new
   city URL typically hits its first impression 4–10 days after first
   index.
4. **Manual re-crawl**: after the data pipeline runs and refreshes
   pricing/climate data, request indexing on 5–10 high-priority URLs to
   speed up the refresh.

---

## Vercel

Set these alerts in **Settings → Alerts** for the production project:

| Metric | Threshold | Action |
|---|---|---|
| Bandwidth | 80% of plan | Investigate top routes; consider Edge caching |
| Serverless function invocations | 80% of plan | Same |
| Function execution duration p95 (`/api/lead`) | >5 s | Check `lead_routing_log.duration_ms` — aggregator slow? |
| Function error rate | >1% over 1 h | Tail logs; look for Supabase or Turnstile failures |
| ISR revalidation failures | any | Check the city page that failed |

The `/api/lead` route has `maxDuration = 15`, comfortably above the
worst-case ~8 s sync path. If aggregator p95 routinely exceeds 3 s, flip
the route to fire-and-forget (move the `routeLead` call into
`waitUntil` from `next/server`).

---

## Supabase

1. **`leads` table**: row count per day. Sanity check: at least one new
   row per 100 organic sessions during launch ramp; goal long-term is
   ≥4% form completion rate on organic landings.
2. **`leads` partial vs full ratio**: track `count(*) where partial =
   true` / total. Healthy ratio is roughly 1 partial per 3 full —
   higher partial share signals the email step is leaking; lower means
   the step-5 → 6 partial-save fired late.
3. **`lead_routing_log`**: review weekly for:
   - rows with `response_status` outside 200–299 → routing failures
   - `duration_ms` p95 by `destination_type` → buyer latency drift
   - rows with `response_status = 0` → network errors / aggregator
     unreachable
4. **Alerts**: simple cron via Supabase Edge Function or a separate
   script — fire to email/Slack if `leads` row count over the last 24 h
   is 0 (likely a form regression or DNS issue).

---

## Lead routing log review template

Weekly:

```sql
-- failures by destination
select destination_type, count(*)
from lead_routing_log
where created_at > now() - interval '7 days'
  and response_status not between 200 and 299
group by destination_type
order by count(*) desc;

-- p50 / p95 latency by destination
select destination_type,
       percentile_cont(0.5) within group (order by duration_ms) as p50_ms,
       percentile_cont(0.95) within group (order by duration_ms) as p95_ms
from lead_routing_log
where created_at > now() - interval '7 days'
group by destination_type;

-- contractors with no successful routes in 7 days (review!)
select c.id, c.business_name, count(l.id) filter (where l.response_status between 200 and 299) as ok
from contractors c
left join lead_routing_log l
  on l.destination_id = c.id
  and l.created_at > now() - interval '7 days'
group by c.id, c.business_name
having count(l.id) filter (where l.response_status between 200 and 299) = 0;
```

---

## Ahrefs Rank Tracker

Initial keyword set (500 keywords total, ~5 per top-100 city):

- `hvac in {city} {state}`
- `hvac contractor {city}`
- `ac repair {city}`
- `furnace repair {city}`
- `hvac near me` (with location override per city)

Set up in Ahrefs → Rank Tracker → New Project → import keyword list.
Track weekly. Expect 4–12 weeks for new pages to settle into stable
positions; the city-tier prioritization in the sitemap (Tier A → 0.7,
Tier B/C → 0.5) gives Google a hint about which to index first.

---

## OG image / social preview

After launch, paste the homepage URL into:

- Facebook Sharing Debugger
- LinkedIn Post Inspector
- Slack (the unfurl is the cleanest test)

Confirm the OG image renders at 1200×630 and the title/description match
metadata. Re-run after every `app/layout.tsx` metadata change.

---

## Phase 2 trigger criteria

Expand to cities 251–1000 (bump `PRERENDER_LIMIT` in
`app/[state]/[city]/page.tsx` and `SITEMAP_CITY_LIMIT` in
`app/sitemaps/cities-1.xml/route.ts`, redeploy) only when **all four**
conditions hold simultaneously over the same 14-day window:

1. **Indexation rate ≥60%** on the Phase 1 pages (GSC Coverage Indexed
   / Submitted ratio).
2. **At least 25 of the top 50 city pages ranking page 1** for `HVAC in
   {city}` (Ahrefs rank tracker, US desktop or mobile).
3. **Zero critical errors** in the lead routing pipeline over the
   trailing 14 days. "Critical" = `lead_routing_log` rows where both
   contractor and aggregator attempts failed for the same lead.
4. **Form completion rate >4%** on organic landings. Compute as
   `count(distinct leads where partial=false and utm_source IS NULL or
   utm_source = '(organic)') / GA4 organic landing pageviews on
   /[state]/[city] routes`.

When all four are green, the Phase 2 expansion is:

1. Run `pnpm data:build` against the full SimpleMaps CSV (will populate
   ~30k cities; the pipeline caches so reruns are cheap).
2. Commit the updated `lib/data/*.json` files.
3. Bump `PRERENDER_LIMIT` to 1000 in
   `app/[state]/[city]/page.tsx`.
4. Bump `SITEMAP_CITY_LIMIT` to 1000 in
   `app/sitemaps/cities-1.xml/route.ts` (or split into
   `cities-1.xml` + `cities-2.xml` once the count exceeds 50k).
5. Redeploy. Re-submit the sitemap in GSC.
6. New cities not in the prerender list still load on first request via
   ISR; the URL is in the sitemap so Google will eventually fetch.

---

## Anti-targets

If any of these go red, **pause expansion** and investigate:

- Crawl-budget waste: `/find-pros` showing up in GSC indexed pages.
  Check `robots.txt` + page meta.
- Duplicate-content flags in GSC. Usually means content rotator is
  producing repeats — check `lib/content/variants.ts` and the seeded
  hash inputs.
- Aggregator response rate <90% over a week — escalate to the
  aggregator partner.
- Supabase `leads` insertions dropping to zero for >2 h — page or
  function regression.
