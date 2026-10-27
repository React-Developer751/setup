# Website generator (offline rule-based, React + TypeScript + Vite)

One prompt ("dental clinic called Smile Care in Pune, single page" / "... multiple page website") gives a finished, static website: texts, colours,
pictures, animations, light / dark mode. No AI key is needed; the optional AI parts are marked below.

## Run it

```bash
npm install
npm run app          # the app, the API server, the image engine and the content AI, all four
# open http://localhost:5173
```

`npm run app` starts four things (each also on its own):

| Part | Command | Port | What it does | If it is not running |
|---|---|---|---|---|
| App | `npm run dev` | 5173 | the generator page (Vite) | - |
| API server | `npm run server` | 8787 | edit log, design memory, proxies to the two engines below | the site is still made; memory is kept in the browser |
| Image engine (PixelMath, folder `../normal`) | `npm run images` | 8000 | one coherent set of pictures per site (hero with calm space for the headline, About, gallery tiles) from its Studio, judged by the engine; falls back to single scenes | maths art is used instead |
| Content AI (Core-Craft, folder `../cont`) | `npm run corecraft` | 8100 | the texts of the page (hero, services, about, steps, FAQ, buttons) about the services in the prompt, in the voice of the kind of business; Hindi pages | the built-in texts are used |

Both engine folders are only run, never changed. Python 3 is needed for them.

## What it makes

* **One page or several**: the prompt decides ("single page", "landing page", "ek page" / "multi-page", "5 pages", "pages wali website"). Both are made
  from 560 stored components (`src/components`, listed in `COMPONENTS.md`; `src/generator/library/componentUse.ts` says which become page parts).
* **Colours** are judged before a site uses them (`colorJudge.ts`) and the finished page is checked in light and dark mode: a text that cannot be read
  on what is behind it gets a readable colour (`library/pageAudit.ts`).
* **Pictures**: the image AI (PixelMath), maths art, or your own photos. No external photo service is called.
* **Edit chat**: "FAQ hatao", "background light green karo", "buttons ko round karo", "pricing ko Rates rename karo", "phone 98765 43210" ... (see below).
* **Export**: one `.html` file, a folder of static files (sitemap, robots.txt, deploy files) or a Vite project. Pages of a multi-page site are switched by the address (`#/about`), so no server rules are needed.

## Settings (environment variables of the API server)

`PORT` (8787), `HOST` (127.0.0.1: local only), `EDIT_SERVER_TOKEN` (needed when HOST is not local),
`EDIT_DATA_DIR` (server/data),
`CORECRAFT_URL`, `PIXELMATH_URL`, `PIXELMATH_API_KEY`, `EDIT_RATE_PER_MINUTE`, `EDIT_IMAGES_PER_MINUTE`. Nothing is sent anywhere unless you set a key.

## Checks

```bash
npm test                      # everything: parsers, generators, colours, components, exports, server, ML (about 6 minutes)
ALL_PROJECTS=1 node scripts/test-project.mjs   # builds 14 exported Vite projects (slow)
npm run build                 # type check + production build
npm run lint
```

## Limits

* The pictures of the image AI are flat illustrations, not photographs; real photos come from the search or your uploads.
* The generator page is a large single bundle (about 7.6 MB, 1.4 MB gzip: the trained models are inside); it is made to run locally or as an internal tool.
* Forms of the generated sites only show a layout until you connect a form service.
* The Privacy and Terms pages of a multi-page site are templates, not legal advice.

## Edit chat (change a generated website by talking to it)

After a site is generated, the left panel has "Ask for a change": `FAQ hatao aur naam Zen Cafe rakho`, `make the buttons blue`,
`pricing page remove karo`, `headline: Fresh Every Day`, `my phone is 98765 43210`, `undo`. English, Hinglish and Hindi.

How it works (all in `src/generator/edit/`):

* A change is an **operation** (`edits.ts`: `rename`, `accent`, `tone`, `mode`, `remove`/`add`, `removePage`/`addPage`, `text`, `replace`,
  `contact`, `tier`, `motion`, `theme`). A site = prompt + list of operations, so undo/redo/reset are just the list, and the three
  engines, the preview and every export show the same result. `cleanOp` validates every operation, whoever produced it.
* **Understanding**, in this order:
  1. `understand.ts`: offline rules (word lists in `lexicon.ts`; splits compound commands, fixes small typos, keeps quoted texts and capitals).
  2. No external AI, model or API is used. (The old optional Anthropic server and the Pexels/Wikimedia photo search were removed.)
     Accepted/undone changes are appended to `server/data/feedback.jsonl` (git-ignored) as training examples.
  3. `intent.ts` + `clarify.ts`: when nothing else understood, a learned intent model (words; plus the embedding model when "Smart understanding" is on)
     guesses what the person wants and the chat asks the missing detail with buttons ("Simpler / Better / Premium", "Which part should go?").
* Training data and format: `src/data/training/EDIT_SPEC.md`, `edit-intents.*.jsonl`, `edit-commands.test.jsonl`; `npm run train -- --only=intents`.

Checks: `npm run test:edit` (engines, undo, server against a fake model, schema = code, parser floor), `npm run eval:edit` (parser on labelled
commands), `npm run eval:intents` (free-language examples; add `-- --meaning` for the embedding model).

### Colours in the chat

`buttons marigold`, `theme like Spotify`, `ocean jaisa`, `trustworthy colours` (about 120 colour names + ~150 things, places, brands and moods, see `THING_COLORS`),
`header red footer green` / `header lal, footer hara` (one part gets its own background; its text adapts), `complementary colour`, `second colour orange`,
`surprise me`, plus a colour picker and "colour from my logo / photo" (main + second colour) in the chat. Unknown names: the chat shows colour buttons.

## Niche packs and personal details

* `src/data/niches/batch-*.json`: hand-written text for 60 specific kinds of business (pest control, tattoo studio, chartered accountant, scrap dealer,
  coworking, kirana ...). A prompt that names one (English, Hinglish or Hindi keywords) gets that niche's headline, services, steps, FAQ, plans, team roles,
  reviews and blog instead of the neighbouring kit's wording. Format and honesty rules: `src/data/niches/NICHE_SPEC.md`; checks: `npm run check:niches`,
  `npm run eval:niches`. A business type chosen in the chat or a correction in the page always wins over the niche.
* `src/generator/personalize.ts`: what the prompt says about *this* business (services, audience, place, "24x7", "home delivery", "free inspection",
  "10 years of experience") goes into the hero line, one feature card per service, the FAQ, the keyword strip and the address. Nothing is invented.
  The kits' example numbers ("15 years", "5k+ meals", "100%") are replaced by plain statements.
* `npm run build:lite -- --models-url=https://your-cdn/models/` builds without the 150 MB embedding model (dist 190 MB -> 40 MB); host `public/models/` at that address.
* `npm test` runs everything: edit chat, niches, end-to-end conversations, the site audit and the model checks.

## Business details, photos, projects and publishing

* **Your business details** (left panel): WhatsApp number (a round WhatsApp button on every page), opening hours, address (a real Google map on the contact page),
  and your own services and prices (they become the feature cards and the price list). The same things can be typed in the chat:
  `services: haircut 300, facial 800`, `whatsapp 98765 43210`, `timings: Mon-Sat 9am-7pm, Sun closed`.
* **Real photos**: upload your own (first = main picture, second = About, the rest = gallery).
  Photos are used by the built-in templates (multi-page and single page), not by the "92 components" page.
* **Typography**: every business type has its own Google web font (`src/generator/fonts.ts`); without a network the system fonts are used.
  The exports say that visitors' browsers contact Google Fonts and how to turn that off.
* **My projects**: save in this browser, download/open a `.website.json` file (also on another computer); the last session can be continued after a reload.
* **Publishing**: the SEO folder export now contains `netlify.toml`, `_headers` (security headers, caching), `.nojekyll` and `DEPLOY.md`
  (Netlify, Cloudflare Pages, GitHub Pages, shared hosting; what to change before going live).
* Checks: `npm test` (also `npm run test:business`, `npm run test:projects`).

## Pictures from the image AI (PixelMath, the `normal` folder)

The folder `../normal` holds PixelMath, a text-to-image engine in pure Python with an HTTP API (its own README explains it). It is used as a second
source of pictures, next to uploads:

```bash
npm run images      # starts the engine (python3 ../normal/serve.py, port 8000); the folder is only run, never changed
npm run server      # this project's server: /api/ai-image asks the engine, /api/health says images: true
npm run dev         # the page: Real photos > "Draw scenes for my site"
```

* Engine v1.4 draws **business props** (138: food, shops, doctors, tools, vehicles, buildings, animals ...) in scenes (a desk, a cafe table, a room, a workshop,
  a landscape) as flat illustrations, plus sunsets, skylines, galaxies and mandalas; no photographs, brands or faces with detail.
  `src/data/imageScenes.json` gives every business type and 55 niches their own scenes in words the engine understands (a bakery shop for a bakery,
  a doctor with a clinic, tools and a ladder for a plumber, solar panels for a solar installer ...). Edit that file to change what is drawn;
  `src/generator/imageAi.ts` picks from it.
* One click draws 8 pictures (first screen, About, 6 for the gallery), turns them into small JPEGs inside the page (so exports do not need the engine)
  and puts them on the site like other photos (undo, projects and exports work the same). "Draw other scenes" gives a new set.
* Settings: `PIXELMATH_URL` (default http://127.0.0.1:8000), `PIXELMATH_API_KEY` (if the engine runs with a key: sent by the server, never by the page),
  `PIXELMATH_DIR` and `PIXELMATH_PORT` for `npm run images`, `EDIT_IMAGES_PER_MINUTE` (default 90).
* Check: `npm run test:images` (plans, words, the server's proxy against a fake engine, and the real engine when it runs).
