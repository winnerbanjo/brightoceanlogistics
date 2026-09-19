# Bright Ocean Logistics

A static, responsive company website for China–Nigeria sea shipping and air freight. The original homepage design is preserved and extended across nine inner pages.

## Local preview

```sh
python3 -m http.server 4173 --directory dist
```

Open http://localhost:4173.

## Editing and checks

- `src/home.html`: homepage content template.
- `src/head.html`: shared HTML head template.
- `scripts/build.py`: shared navigation, footer, inner-page content and HTML generation.
- `dist/style.css`: shared styling, responsive rules, and motion.
- `dist/app.js`: menus, progressive scroll reveals, warehouse copying, quote flow, and optional WebMCP quote preparation.

```sh
python3 scripts/build.py
python3 scripts/check.py
node --check dist/app.js
node scripts/test-interactions.cjs
```

Generated page HTML is checked in and can be hosted as static files. No installation or runtime framework is required. Fonts are requested from Google Fonts with local fallbacks; images are hosted locally.

## Vercel deployment

Import the repository with the project Root Directory left at the repository root. `vercel.json` selects the committed `dist` directory as the public output and disables framework detection and the build step. Pushes to `main` deploy the checked-in site. After content edits, run the build and checks above and commit the generated HTML before pushing.

## Pages

Home, services, sea shipping, air freight, about, shipping guide, locations, contact, shipping quote, FAQs, and a custom 404 document.

## Enquiries

Quote details stay in the current page until the customer chooses to continue to WhatsApp. The site prepares a message and keeps a visible fallback link for blocked popups. The customer reviews and sends the message in WhatsApp. No enquiry database, online payments, or live tracking system is implied. Shipment updates are obtained from the company contacts.

## Content requiring company confirmation

The supplied Chinese and English Guangzhou warehouse addresses contain different street-number descriptions. The website keeps the supplied Chinese receiving instructions and asks customers to confirm the exact street number, room, and shipping mark with Ali before dispatch. Air cargo requires separate receiving instructions. Pricing, delivery timelines, and cargo acceptance are confirmed by the company per shipment.

Motion respects reduced-motion preferences. Reveals progressively enhance otherwise visible content; no animation dependency is required to read the site.
