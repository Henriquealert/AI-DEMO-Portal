# Alert Global Tech: AI Demo Portal

A catalogue of working AI tool demos. Each demo uses a fictional company and sample data. Planned address: demos.alertglobal.tech.

- **Next.js 16 (App Router) + TypeScript.** Pages are static; the only server code is the optional live-mode API.
- **Content-driven.** Each demo is a folder in `content/demos/`. Adding a demo means adding a folder, not code.
- **Sample mode (default).** Plays back pre-generated outputs stored in the repo.
- **Live mode (optional).** Calls Claude through a server-side route, unlocked by an access code. Hidden unless configured.

## Run locally

Requires Node.js 20.9 or later.

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3000. Live mode stays hidden until you set the environment variables below in `.env.local`.

Useful checks:

```bash
npm run check:content    # validates every demo folder and sample output
```

```bash
npm run check:contrast   # WCAG contrast for the brand colours in styles/tokens.css
```

```bash
npm run build            # production build (also type-checks)
```

## Project layout

```
app/
  page.tsx                  Home: catalogue, search, How we work
  demos/[slug]/page.tsx     Demo page template (spec sheet layout), one for every demo
  api/live/unlock           POST access code, sets a signed httpOnly cookie
  api/live/status           GET whether live mode is available / unlocked
  api/live/[slug]           POST input, returns blocks from Claude
components/                 TopBar, Footer, Catalogue, DemoCard, TryIt, OutputBlocks, Chart…
content/demos/<slug>/       One folder per demo (see below)
content/CONTENT_GUIDE.md    Rules for writing demo content and sample data
lib/schema.ts               demo.json schema (zod)
lib/blocks.ts               Output block format + JSON schema used for live mode
lib/site.ts                 Site copy: contact email, footer line, How we work steps
lib/live/                   Live-mode config, cookie signing, rate limiting
styles/tokens.css           Brand colour tokens and type scale
scripts/                    check-content, check-contrast
```

## Add a new demo

1. Create `content/demos/<slug>/` (lowercase, hyphens). The folder name is the URL: `/demos/<slug>`.
2. Add these files:

   ```
   demo.json      config: title, category, company, spec, problem, steps, stack, samples
   prompt.md      system prompt for live mode
   samples/       one input file per sample (.txt or .csv)
   outputs/       one output per sample (.json, { "blocks": [...] })
   context/       optional reference data sent with every live request
   ```

3. Copy an existing demo as a starting point. `document-intake` is the reference example.
4. Write outputs with the block types in `lib/blocks.ts`: heading, text, fields, table, checks, list, email, message, answer, chart. The same renderers display every demo, so no new code is needed unless a demo needs a new kind of output.
5. Keep `spec.manualTime` and `spec.withTool` as `"TODO"` until the figures are measured. The page shows "To be measured".
6. Run `npm run check:content`, then `npm run dev` and open the demo.

To show a "coming soon" card without a page, use a short demo.json with `"comingSoon": true` (see `content/demos/private-ai/demo.json`).

Categories are fixed in `lib/schema.ts`: DOCUMENTS, SALES, COMMUNICATION, KNOWLEDGE, REPORTING, PRIVATE AI.

## Environment variables

See `.env.example`. Never commit real values. All are server-side only. None is exposed to the browser.

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | For live mode | Claude API key. |
| `LIVE_ACCESS_CODE` | For live mode | Code visitors enter to unlock live mode. Live mode is hidden unless both this and the key are set. |
| `ANTHROPIC_MODEL` | No | Model for live mode. Defaults to `claude-opus-5-5`. |
| `LIVE_SESSION_SECRET` | Recommended | Secret for signing the live-mode cookie. Falls back to the access code. Generate with `openssl rand -hex 32`. |
| `LIVE_RATE_LIMIT_PER_HOUR` | No | Live runs per visitor IP per hour. Default 10. Rejected requests count too. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Recommended in production | Shared rate-limit store. Without it, limits are per server instance (weaker on serverless). |
| `NEXT_PUBLIC_SITE_URL` | No | Canonical URL for metadata and sitemap. Defaults to https://demos.alertglobal.tech. |

Live mode limits (in `lib/live/config.ts`):
- 5 access-code attempts per IP per 15 minutes.
- Text input limited per demo (`tryIt.maxChars` in demo.json).
- Uploads (document-intake only): PDF, PNG, JPEG or WebP, up to 4 MB.
- The live-mode cookie lasts 8 hours.

How a live request works:
- Claude gets the demo's `prompt.md` as the system prompt, plus the demo's reference data and the visitor's input.
- Structured outputs constrain the response to the block format, so live results render exactly like the samples.
- Effort is set to `low` to keep response times short.
- If a request is declined, the server-side fallback beta routes it to another model.

Because pages are static, the LIVE tags on cards and demo pages reflect the environment **at build time**. After adding or removing the key or access code, redeploy.

## Deploy to Vercel

Nothing has been deployed. When ready:

1. Push the branch to GitHub and import the repository in Vercel (New Project). The framework preset is detected as Next.js, and no build settings need changing.
2. Under Settings > Environment Variables, add the variables above. Live mode is optional: leave the key out to ship sample mode only.
3. Deploy, and check the preview URL.
4. When approved, add the domain `demos.alertglobal.tech` under Settings > Domains, and create the DNS record Vercel shows.

The live route sets `maxDuration = 60` seconds. Check this fits your Vercel plan.

## Design rules (summary)

- Hard edges: border-radius 0, hairline 1px borders, and shared-border grids.
- No gradients, no shadows, no photos, no decorative illustrations.
- Helvetica only, with tabular figures everywhere.
- **Electric Blue** marks links (as an underline), primary buttons, focus rings and active toggles. Text is always ink or ivory, so contrast never depends on the blue.
- **Acid Lime** is for status tags only, as a solid fill with ink text.
- Dark mode is the default. Light mode follows `prefers-color-scheme`.

See `TODO.md` for open items and decisions.
