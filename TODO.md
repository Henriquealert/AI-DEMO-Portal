# Open TODOs and decisions

## TODOs left in the code

| # | Where | What is needed |
|---|---|---|
| 1 | `styles/tokens.css` | Electric Blue and Acid Lime are still stand-ins. Deep Ink (#101b32) and Soft Ivory (#f5f4ef) were sampled from the logo file: confirm them against the guidelines. After any change, run `npm run check:contrast`. |
| 2 | `styles/tokens.css` (`--on-accent`) | Blue button labels are ivory (3.99:1 with the stand-in blue, passes for 19px bold). Re-check when the real blue is in. |
| 3 | `app/layout.tsx` (`themeColor`) | Uses the sampled ink and ivory. Update if the confirmed values differ. |
| 4 | `public/brand/alert-mark.png` | The logo mark was cut from the 800px PNG you sent. An SVG master would be sharper at large sizes: send it and it drops in as the mask source. |
| 5 | `app/layout.tsx` | Open Graph share image, 1200x630, at `public/og.png`. Title and description tags are already set. |
| 6 | Every `content/demos/*/demo.json` | `spec.manualTime` and `spec.withTool` are "TODO" (shown as "To be measured"). Replace them with measured figures only. |

## Decisions needed from you

1. **Domain vs email.** The site links to `alertglobal.tech` but the sales email is `sales@alertglobaltech.com`. Please confirm both are correct.
2. **"Book a Demo" target.** It is currently `mailto:sales@alertglobaltech.com` with the subject "Book a Demo: AI tools". Switch it to a booking link when you have one (`lib/site.ts`, `demoMailto`).
3. **Live mode in production.**
   - Do you want it on at launch?
   - If so, decide the access code, who gets it and the hourly limit (default 10 per IP).
   - Upstash Redis is recommended for reliable rate limits on Vercel.
4. **Live-mode model and cost.**
   - Default: `claude-opus-5-5` at low effort, with the server-side refusal fallback enabled.
   - You can change the model with `ANTHROPIC_MODEL`.
   - Live mode has not been run against the real API: I had no key here. The request format, limits and error handling are tested, but the first real run should be checked.
5. **How We Work copy** (`lib/site.ts`). I wrote the four step descriptions. Please review, especially "We stay accountable after launch".
6. **Home intro label.** "Alert Global Tech · AI demos" above the H1. Keep or remove.
7. **Fictional names.** All company and person names were invented. Please do a quick search on the ones customers will see most, to be sure none is a real business:
   - **Demo companies:** Tessaro, Vantrell, Marrowbay, Kestwell, Ondamar, Halbrook.
   - **Suppliers:** Brindlecove, Northvale Fastener Supply, Quillmere.
   - **Customers in samples:** Halberd Controls, Corvane Water Systems, Brightfold Home Goods, Quillon Supply Co., Whitlock Garden Supply.
   - **Competitors mentioned:** Tarrow Freight Lines, Bellwick Logistics.
   - **Products and others:** Penmoor DocScan, The Ledger Weekly.
8. **Sample prices.** The quote-builder price list and the invoice amounts are fictional sample data for fictional companies, not Alert prices. Confirm you are comfortable showing them.
9. **Language.** The site is English only. The content structure allows adding ES/PT later.
10. **Private AI.** A placeholder card only. It names Amazon Bedrock and Claude as the stack. Confirm, or change the card text when the page is ready.
11. **Category labels.** CATEGORIES are fixed in `lib/schema.ts`. Tell me if you want different names or order.

## Choices I made (easy to change)

- **Logo:** the "a!" mark sits in the top bar only (one logo per page). It takes the text colour, so it is ivory on dark and ink on light. The original navy square is used as the favicon and app icon.
- **Acid Lime accents:**
  - Always a solid fill with ink text, never text colour.
  - Status tags and the "Sample output" tag.
  - The "hours back." highlight in the home H1, the only highlight on that screen.
  - The processing bar.
  - A 3px edge on the catalogue card under the pointer.
- **Fictional company logos:**
  - Simple geometric marks in `content/demos/<slug>/logo.svg`.
  - They show on cards, in the demo header and in the spec table.
  - They use the text colour, so they work in both modes. They are invented for the demos and are not based on any real brand.

- **No MDX.** All demo copy lives in `demo.json`, which kept each demo to one config file. MDX can be added if longer write-ups are needed.
- **Contrast:**
  - Links are ink or ivory text with an Electric Blue underline, so small text never depends on the blue's contrast.
  - Primary buttons use a 19px bold label (WCAG large text).
  - With the stand-in blue, small blue text failed AA in both modes.
- **Status tags:**
  - **SAMPLE** is outlined.
  - **NEW, BETA and LIVE** use Acid Lime fills, so lime appears only when a status needs attention.
- **Charts:** a single series in Electric Blue, with square ends to match the hard-edge rule. They have hover and keyboard tooltips and a "Data table" view under each chart.
- **Inbox triage:** messages expand to show the summary and the draft. Every draft is labelled "not sent".
