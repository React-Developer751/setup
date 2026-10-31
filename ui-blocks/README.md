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

## The studio screens

* **First screen**: one prompt box. Nothing else to choose: **one page or several, the design, the colours, the words and the motion are decided from the prompt** (`autoPages` in `generator/edit/pagesIntent.ts`: what the person said, three or more things to show, a full / school / hospital / company website, or a detailed brief for a business people look around in -> pages; a short brief -> one landing page). The chat says what it chose and why.
* **Workspace**: the chat on the left (history, the box to write in at the bottom, quick ideas), the preview on the right with its own bar (Preview / Code / Json, phone / tablet / desktop, Another design, Tools, Export, open in a new tab). Everything else is in **Tools** (a panel that slides over the preview): *Design* (pages Auto / One page / Several pages, engine, design level, mood, creativity, motion), *Business* (details, photos, your data), *Project* (save, load, export), *Insights* (what it understood, design memory, picture ratings).
* **Preview**: a real device frame; the desktop is as wide as the pane allows (1024 to 1440 px, not a thumbnail); a change keeps the place the person was at; a build screen with steps shows while a new site is made.

## Motion, page depth and the Code tab

* **Motion by business type** (`src/generator/motionBrain.ts`, `motionRuntime.ts`): eight recipes (calm, energetic, elegant, appetite, tech, playful, creative, wander). Each business type uses one: parts arrive in three or four different ways (up, left, right, scale, fade, blur, picture wipe) and the extras fit the business (slow zoom of the first picture, scroll drift, card tilt, a light that follows the pointer, leaning buttons, wiggle). Pointer effects wait for a real mouse; `prefers-reduced-motion` switches everything off.
* **Page depth by business type** (`src/generator/experience.ts`): a clinic gets proof and answers first, a restaurant or a fashion house gets pictures and articles. A short prompt ("gym in Jaipur") is a full page; only words like "simple" or "basic" ask for the short one.
* **Code tab**: the whole project in a folder tree, search, coloured code, Copy and Download above every file, **Export project (.zip)**. Every file can be changed and saved:
  * the words of the page file (`const content = {...}`) change the site (`src/generator/edit/codeSync.ts`; undo works);
  * a component file is compiled in the browser (`sucrase`, loaded on the first change; it runs as a module made from a blob, so the strict content security policy needs no `eval`) and replaces the stored component in the preview and the exports; a file with a mistake is explained and not used;
  * the saved versions are in Copy, Download and the project .zip. A file the generator made again after the person changed it is marked, and they choose "Keep mine" or "Use the new file".
* Tests: `test-experience.mjs`, `test-codesync.mjs`, `test-component-compile.mjs`.

## The generator's own idea, and learning from corrections

* **A design idea** (`src/generator/concept.ts`, palettes in `src/data/concepts.json`): before a site is made, the generator thinks what the business should *look like*: coffee is brown and cream (not the pink of a default design), a gym is black with a strike of lime, a clinic is clean teal. 22 families of palettes with a reason each, built into a whole palette for both modes (every text readable). It is an edit like any other (`concept` op): it shows in the chat as "My idea for this business: ...", can be undone, and what the person changes afterwards is theirs. Add a family or a palette to `concepts.json` and it is used at once.
* **Freedom**: at Balanced creativity now and then, at Wild often, the idea is a **bet**: a bolder turn of a known palette that is on no list, said as a bet ("tell me if it is wrong"). Bets stay inside the hues the business may wear and never repeat a hue already used by that business.
* **It learns from corrections** (`memory/correctionMemory.ts`, kept in this browser): a colour the person changes the accent to becomes the accent of the next idea for that kind of business ("I used the colour you chose before ..."); a part they removed twice is left out by default; an idea they marked right is preferred and one they turned down (or changed the colour of) is avoided. Tests: `test-concept.mjs`.
* **Menu board** (`refkit/RefMenu1`): food businesses (cafe, restaurant, bakery, German cafe, chai stall) show a menu of their own items, no invented prices; if the person writes prices they are shown as prices.

## Taste: parts chosen together, learned from your own components

* `npm run learn:components` (`scripts/learn-components.mjs`) reads every component in `src/components` and writes `src/data/models/component-taste.json`: seven numbers between 0 and 1 for each (how dense, loud, soft, dark, picture-led, centred and airy). It is plain counting of the markup, no model and no network. Run it again whenever components are added.
* `src/generator/library/taste.ts`: every kind of business has a target taste (a clinic is calm and soft, a gym is loud, a fashion house is airy and picture-led), moved by the design and by the variation (each variation is a different place of the taste space, so they are different designs). The parts are chosen **together**: by how close each is to the target and how well it goes with the parts already chosen; the hero first, the menu and the footer last. The parts of a design read from a live site compete with the stored ones (they win most of the time, not always). Several whole pages are drawn and the best-fitting one is kept (a soft check: every role filled, no part twice, a balanced length).
* **Creativity** now means: *Safe* the stored layouts as they were; *Balanced* parts chosen by taste, the design's numbers/steps/prices kept; *Wild* every part competes and a variation may go far. A design the person names ("apple style") is worn as it is.
* **It learns from what the person keeps**: every design now stores its parts; a part (or one like it) that was in kept pages is preferred in the next design, one from turned-down pages is avoided (`memory/designMemory.ts`, `partsScore`). Tests: `test-taste.mjs`.

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


## Production
```bash
npm run start      # builds the page and serves it with the API on http://localhost:8787 (plus the two engines)
```
* **One process**: `server/index.mjs` serves `dist/` (hashed files cached for a year, any other address is the app) and the API. `SERVE_DIST=0` turns the page off, `DIST_DIR` points elsewhere, `HOST=0.0.0.0` needs `EDIT_SERVER_TOKEN` and a TLS reverse proxy (`TRUST_PROXY=1` behind it).
* **Security headers** on the page: a content security policy (no external scripts, `object-src 'none'`, `frame-ancestors 'none'`), `nosniff`, no framing, no referrer, no camera or microphone. Inline scripts stay allowed because the previews are frames made from text. The API refuses other origins, wrong content types and too many requests, and every stored read needs the token when one is set.
* **No external AI, model or API** is called at run time. `npm audit --omit=dev`: 0 vulnerabilities. `npm test` is the gate (tests, types, lint, build).
* **Exported sites**: each picture is a file in `assets/img` (the page is about 20 times lighter), pictures below the first screen load lazily, one `h1` per page, no tracking, no external scripts (Google Fonts are linked by the exported pages and named in their README).

## Prompt memory (learning from every prompt and edit)

Every prompt is stored with what the page became (business type, design idea, headline) and every edit the person made afterwards (colour, parts removed or added, style, texts): `server/data/prompt-memory.jsonl` (browser localStorage when no server runs, git-ignored). A new prompt is compared with the old ones by word overlap (`src/generator/memory/promptMemory.ts`); the ones it resembles teach it the colour they ended with and the parts that were taken out (a close prompt counts twice), and the chat says so. For training: `GET /api/prompt-memory/export` (jsonl, one row per page with its edits) and `GET /api/prompt-memory/keywords` (word -> business types it came with).

Thumbs in the chat: every answer that built the site or changed it has a like and a not-like button. Like keeps the idea (and the next similar prompt prefers it). Not like turns the page down, the AI says it will think of something different and makes a new design (another idea, colours, layout); the rejected idea is remembered in the prompt memory so a similar prompt later does not start from it. On a chat edit, not like takes the change back and asks what was meant.

## Working parts, publishing, per-person data, checks (the "Lovable gap" round)

* **Working parts (widgets)** (`src/generator/library/widgets.ts`, `edit/widgetParse.ts`): say in the chat "add a booking form", "map address 12 MG Road, Pune", "whatsapp chat button 9876543210", "upi id name@bank", "sale ends in 3 days", "newsletter", "video link https://youtu.be/...", "order list" (items and quantities, the order goes to WhatsApp or e-mail), "announcement ...", "analytics id G-..." (exported site only). They are data on `content.widgets`, so they are in undo, the code tab and every export. Forms use the e-mail / WhatsApp path of the page. A request that a static site cannot do (login, chatbot, card payment, database, domain) is answered with what can be done instead. "make it bigger" / "isko hata do" use the part the last change was about.
* **Publish**: Export, "Publish (get a link)" keeps the finished site on this server and serves it at `/s/<id>/` in a sandbox (its scripts cannot reach the app). Updating publishes to the same address; "Take down" removes it. Public internet needs the server on a host, or upload the "SEO-ready HTML" files.
* **Per-person data**: the page makes an anonymous id (no account) and sends it as `x-user`. Prompts, edits and projects are read back only by their owner; other people's designs only teach colours (no prompt, no text; `EDIT_SHARED_LEARNING=0` turns even that off). The training export (`/api/prompt-memory/export`, `/keywords`) is for this computer or `EDIT_ADMIN_TOKEN`. Projects are kept on the server too, every save a version (last 30), openable again from "My projects, Versions". The same code on another computer shows the same projects.
* **Checks**: `npm run benchmark` (100 fixed prompts scored, compared with `scripts/benchmark-baseline.json`; `-- --save` keeps a new baseline) and `npm run qa` (the same prompts made into sites and measured in headless Chrome at phone and desktop width: sideways scroll, broken pictures, clipped or tiny text, tap targets, script errors, h1, page length; needs `npm run app` running).

## The updated Content AI and Image AI in the page (production wiring)

* **Content AI (`cont`, the niche packs)**: `POST /pack` of the bridge (`scripts/corecraft_bridge.py`) and `GET /api/corecraft/pack` of the server tell which of the 99 niches a request is. 80 of 594 test requests were missed by the page's own keywords ("cctv", "laundry", typos such as "dentsit"); the Content AI gets 594 of 594. Its answer is used (`edit/packClient.ts`) only when it is not a guess among equals and the request's own words are the niche's words (a typo corrected into the niche, or very sure): "a website that nobody has seen before" is not made a catering site, "car repair garage" is not made a bike garage. The result is a hint for `detectNiche` (`niche/hints.ts`); the page's own keywords still win. The chat says what was recognised.
* **Image AI (`normal`, the spec)**: `GET /api/ai-spec` proxies `POST /spec` of PixelMath. When the business is one of the niches, the first screen (hero-1, 16:9), About and four gallery squares are drawn with the business named in the prompt ("... for a dental clinic website. Palette: accent #x on #y"), the colours of the site and no text. A neutral fallback picture (unknown business) is never used: the older studio set is tried then. Busy answers (503) are retried.
* Bugs found by running real prompts and fixed: pictures were drawn for the example behind the landing screen and twice for one site (the engine answered 503 to the real one); a shared city made two prompts "alike"; a headline about "website" or made of "alag type / animation ho" from the Content AI's page; jewellery and footwear headlines on a clothing store; the h1 of a page was "About us"; two equal headings in one part; text on a photo that could not be read (a veil is put between them: `veilPictures` in `library/pageAudit.ts`).

## The design generator (first screens written from a spec)

`src/generator/gen/`: a first screen (hero) is not taken from a list, it is **written** from a spec of 12 choices (layout x8, picture shape x5, headline size x4, typeface x3, weight x4, corner radius x4,
buttons x4, eyebrow x3, decoration x7, background x5, motion x5, height x3), after rules that keep out combinations that do not work. `heroSpec.ts` is the space and the id (`gen/Hero_xxxxx` says everything
about the hero), `heroTree.ts` writes the elements and the scoped CSS (the page's colour variables, no Tailwind class: an exported site would miss a class that was not in the built stylesheet),
`heroEmit.ts` draws the tree with React and prints it as the TSX of a component (Code tab, project export), `heroPick.ts` decides which pages get one (safe: never; balanced: ~40%; wild: ~70%; "unique/alag hatke" leans to it;
a named design, a resized first screen and short pages keep the stored one). It is filled by the same page filler as the showcase kit (slots eyebrow, meta, title, subtitle, button, button2, image).

* Look at them and rate them: **`/?gen=1`** (business, mood, phone/tablet/desktop; 8 heroes at a time; thumbs are kept per person: `/api/gen-ratings`).
* Measure many: **`npm run qa:gen`** (200 heroes at phone and desktop width: sideways scroll, clipped headline, unreadable text, small buttons, missing picture, too tall). Last run: 240 heroes, 5 findings (all "a bit taller than a screen").
* Tests: `scripts/test-gen.mjs` (ids round-trip, 400 random heroes almost all different, every hero draws all its parts and its source compiles).
* Honest size of the space: 11.9 million valid specs by the count of `countSpecs()`; many of them look alike, so treat it as thousands of clearly different looks, not millions.

### The services part (second generator)

`gen/featuresSpec.ts` / `featuresTree.ts`: the cards or rows under "What we offer", written from 12 choices (layout x8: three or two columns, rows, bento, zigzag, columns, strip, split; card style x5; marker x5 (number, letter, dot, bar); picture x3; hover x4; how it arrives x3 (on load, or as it is scrolled to, CSS only); corner radius; heading size, font, alignment; background; spacing).
Same ids (`gen/Features_...`), same one-tree-two-outputs rule, same filler (the showcase kit's tiles). Look at them and rate them: **`/?gen=1&section=features`**; measure: `npm run qa:gen -- 100 --features`.
The taste of the services part is its own (the thumbs of the first screens say nothing about it), and starts to count at 20 ratings.

### The closing banner (third generator)

`gen/Cta_…` (`ctaSpec.ts`, `ctaTree.ts`): 6 layouts (center, split, bar, card, giant, left), 5 backgrounds, 4 sizes, 3 fonts, 4 button looks, 7 decors, radius, arrival motion, padding. Slots of the showcase kit's closing part (`show-cta`: title, lead, button, button2). Review at `/?gen=1&section=cta`, check with `npm run qa:gen -- 60 --cta`. Its taste is its own and starts at 20 ratings.

### Pricing, FAQ, testimonials, gallery (fourth to seventh generator)

Made with one helper (`gen/partKit.ts`: axes, rules, id, taste) and listed in `gen/registry.ts`: `gen/Pricing_…` (5 layouts incl. a dotted-leader menu list, 4 card looks, highlight styles), `gen/Faq_…` (accordion with native `<details>`, two-column, grid, list, numbered), `gen/Quotes_…` (single, grid, stack, wall, slider, split; initials instead of fake faces), `gen/Gallery_…` (grid, masonry, mosaic, strip, featured, wide, polaroid; captions below / overlay / on hover). Their slots (`show-plans`, `show-faq`, `show-quotes`, `show-gallery`) are filled in `library/fillRef.ts`. Review: `/?gen=1&section=pricing|faq|quotes|gallery`; check: `npm run qa:gen -- 40 --section=gallery`. Testimonials stay hidden while a page only has the sample ones (no invented reviews).

### About, contact, footer, navigation (eighth to eleventh generator)

Same helper and registry. `gen/About_…` (picture left/right, centred, columns, wide picture, big lead; points as ticks, cards, numbers or chips), `gen/Contact_…` (split, form-left, centred, cards, stack; real `<form>`, the ways to reach are only the facts the person gave: `tel:`, `mailto:`, WhatsApp, a map link), `gen/Footer_…` (columns, bar, centred, big brand, split; pages, services, contact, small print), `gen/Nav_…` (bar, centre, split, pill, stack, minimal; sticky or not; the phone menu is a plain checkbox, no script). Slots `show-about`, `show-contact`, `show-footer`, `show-nav` are filled in `library/fillRef.ts` (the page links come from the page). Check: `npm run qa:gen -- 40 --section=nav|footer|about|contact`.

Height and resize edits ("make the hero taller", "hero 900px high") work on generated parts: the wrapper sets `--gp-scale` and `--gp-min`, the parts use them. The design stays the same.

### What the page may say without the person's word

- **Pricing.** Plans made from the prices the person wrote carry no perks (nobody wrote them). Prices nobody wrote show one card, "Get a quote" / "Ask for price", not the pack's guesses of plans.
- **FAQ.** An answer of a text pack that promises something specific (a time, a guarantee, a certificate, "free", a refund, a price) is replaced by "message us"; the question stays. Answers made from the person's own words (`own: true`) stay (`personalize.safeFaq`).
- **Blog.** A blog has no articles behind it, so it is on the page only when the person asked ("with a blog", "add a blog"); "no blog" wins.
- **Name.** When the prompt gave no name the generator makes one up. Download, project export and publishing wait (Tools, Project) until the person writes theirs or presses "Keep"; the chat form asks too.
- **Photos.** The image AI draws illustrations, not photographs. The chat form after a new site takes the person's own photos (first = main picture, second = About, the rest the gallery) and they replace the drawn ones.
- **Kind of business.** The business named first decides it ("Gym in Pune with personal training and diet plans" is a gym, not a dietitian; "NGO for stray dogs" is about the dogs): `niche/applyNiche.ts`.

### Variety, pictures, colours, headlines

- **More generated parts.** Numbers (`gen/Stats_…`), steps (`gen/Steps_…`), notes (`gen/Blog_…`) and the announcement bar (`gen/Banner_…`) are generated too (partKit, `registry.ts`, slots `show-stats|steps|blog|banner`). The announcement bar is shown only when the person named an offer (it used to repeat the call to action). At a balanced creativity the generated part is chosen most of the time (first screen 65%, services 60%, closing banner 55%, the other parts 55%; wild 80 to 90%): the thumbs on the first screens, services and banners were 95% likes. Safe creativity and the short page keep the stored parts.
- **Pictures.** The image AI is asked for 10 scenes per site (first screen, about, gallery 1 to 6, card 1 and 2; the extra four may fail without failing the set). `fillContent.picturesFor` gives each part its own: the gallery takes them in order, the cards and the notes start at the far end, so the same scene is not next to itself.
- **Colours.** A law firm or a clinic keeps to a narrow band around its hint (`colorBrain.allowedBand`): never violet or pink, also for a bold turn.
- **Headlines.** The subject of "X software for Y" is X (`filter.ts`), the headlines of the hero, the services and the call to action name that business (`creativeBrain.ts`), the empty praise of the tech lexicon ("Rock-Solid", "Lightning Speed") is gone, and the lines under the headline say who it is for and the plans from the price the person wrote. The card sentences for a service the person named no longer say "handled by people who do this every day".

### What the person wrote, what the page claims, how people reach them

Found by testing real prompts (see the analysis in the session notes) and fixed:
- **Reading the prompt** (`personalize.ts`): a firm named with "&" or "and" ("Sharma & Associates", "Rao and Partners") is the brand, not services; "family and property law" is two services; a sum, a number of something ("12 rooms", "class 10"), the word for a price list ("fees", "plans"), a part of the website ("portfolio website") or an amenity ("lake view") is not a service (the details go into the line under the headline); prices without names ("plans 499 and 999 per month") become two plans (Basic, Pro) and the period said once is for both.
- **Claims** (`edit/claims.ts`): a law firm or a clinic shows only the services it named. For every site the chat says what the page wrote that the person did not say (services of the text pack, the highlights strip) with buttons: keep only my services / remove the highlights strip / keep everything.
- **Name and contact** (`BusinessForm.tsx`, shown in the chat after a new site): the name when it was made up, phone, e-mail, WhatsApp, address, hours, services and prices. Every site has a contact part with a form (the stored contact parts without one are replaced by `gen/Contact_…`).
- **Messages from the contact form** (`server/index.mjs`): `POST /api/lead?site=<id>` keeps the message for the owner (the site is published at `/s/<id>/`, or `site=draft&u=<id>` for the preview in the app); `GET /api/leads` reads the messages of the caller (Tools, Business, "Messages from your contact form"). Small, rate limited (30 an hour per address and site), answers any origin because a published site runs in a sandbox (origin "null"). `LEAD_WEBHOOK` sends each message to a URL of the owner. A site that is not published here falls back to the e-mail or WhatsApp of the business. Check in a real browser: `node --experimental-websocket scripts/qa-leads.mjs`; tests: `scripts/test-leads.mjs`.

**Prices.** The price part says what the person wrote and nothing more: a period ("/ month") only when they wrote one ("per class"). A business that sells by plans or sessions (gym, yoga/salon, course, software) has a price page without being asked; its plans say "Ask for price" until the person writes real prices. Clinics, law firms, NGOs, shops have none unless asked ("without pricing" always wins). `npm run qa:gen -- 30 --prices` checks that every price the person wrote is on the price page.

`node scripts/gen-selfrate.mjs 40 pricing faq quotes gallery` writes likes (`auto:true`) for designs that passed the browser check, on the person's instruction that what is built this way counts as liked.

## Editing a built site, and businesses without a pack

- **Item-level edits** (`src/generator/edit/itemParse.ts`): the second service, the third FAQ, a named plan, a review, a step, a stat, an about paragraph or a gallery caption can be changed, added or removed ("pehli service ka naam X karo", "FAQ me naya sawal jodo: …", "remove the Pro plan"). A missing item gets an honest "I could not find …" note instead of a wrong change.
- **Single texts**: hero title, subtitle ("under the headline write: …"), button, section titles and the business name; opening hours ("sunday ko band rakho"); replace a phrase everywhere ("Jaipur ki jagah Udaipur").
- **Controls**: "another design" / "kuch alag design" redraws the same business; reset and undo as before. **Letters**: bold, italic and UPPERCASE for headings or text, per part or for the page. Underline, letter spacing and shadows are still refused with an answer.
- **Businesses with no pack** (`src/generator/bespoke.ts`): a kite workshop, a robot-toy shop, a pet-taxi: when the subject words are not in any niche pack the copy comes from a neutral mode (shop, service, learn, event, …) built around the person's own words, with its own design and pictures, never a foreign pack's claims.
- Checks: `scripts/eval-edit.mjs` (917 commands, about 98%), `eval-edit-real/heldout/blind3.mjs` (compare the result, not the label), `scripts/test-edit-real.mjs` in `npm test`.
- Added items are never cut off: services, questions, reviews and so on that the person adds get an extra place in the part (`content.added`, a copy of the last place), and "rounded corners" reaches the cards and pictures of the generated parts too.
- The upper small line of the first screen ("upar wali line me likho: …", "eyebrow") is the `subject` text. A made-up business name is shown with a bar above the preview ("keep it" or type the real one), not only at export.
- **People with an audience and software** (`bespoke.ts`, modes `creator` and `software`): an influencer, a YouTuber, a podcast, a freelance designer get a first-person page (work with me, media kit, a brief), their audience numbers (250K followers, 1.2M subscribers) become the stats, and Core-Craft AI does not write such a page. Software gets a demo instead of a quote, and the features the person listed are its cards. Names: Instagram, Spotify, Python, Flutter, "1.2M" and games are never a business name; a made-up placeholder says whose page it is ("My Channel", "My Podcast"). Check: `scripts/test-open-world.mjs`.
- A personal page keeps to its own pictures (`creatorSceneKey` in `imageAi.ts`: gaming, fashion, video, podcast, food, design), the games or tools the person names go in the line under the headline, a word of the subject that Core-Craft AI took for the name is swapped for the page's name, and the placeholder-name bar over the preview has the field to type the real name.

## Login, register and a dashboard (demo, no backend)

Say "login aur dashboard add karo" (or "add a register page", "member area chahiye") and the site gets `#/login`, `#/register`, `#/forgot` and, after logging in, `#/app` with a sidebar, four figures, a chart and the pages of the business with example rows (`src/generator/app/`): a clinic gets Appointments, Patients and Billing; a gym Members, Classes and Payments; a shop or a bakery Orders, Products or Menu and Customers; office software Desks, Meeting rooms, Visitors and Facility requests; a creator Collaborations, a content calendar and Messages; and so on (`appProfiles.ts`; any other business gets Requests, Customers and Messages built from its own services). Rows are written from the business (its services, plans and audience numbers), the same every time. In the demo app the person can add, edit, delete, search and sort rows.

It is a demo and says so on every screen: the accounts (the password is only stored as a hash), the session and the rows live in this browser (`localStorage`); there is no server, no e-mail ("forgot password" explains that) and nobody is kept out. The runtime is plain DOM code (`appRuntime.ts`, turned into `appRuntimeJs.ts` by `npm run gen`) that takes the colours of the page, so it works the same in the preview and in the exports. "Remove the dashboard" takes it away again. Check: `scripts/test-app.mjs`.

## Taking what the AI learned to another computer

`server/data` stays out of git (it holds browsers' ids, published sites and pictures), but the learning travels: `npm run learning:export` writes a cleaned copy of the learning files (prompts, edits, thumbs, design and phrase memory, image feedback) to `server/seed/` (e-mails and phone numbers are replaced, browser ids are hashed), which is committed. On another computer the edit server runs `learning:import` by itself when it starts and adds the rows it does not have yet (running it twice adds nothing). Prompt memory is kept per browser, so a new browser does not read the old prompts back; the shared learning (designs, colours, phrases, ratings, image feedback) is used by every browser. Run the export before you push, when the memory has grown.

The pages of the dashboard can be changed from the chat: "dashboard se Billing hatao", "dashboard me Reports page add karo", "dashboard me Patients ko Clients naam do", "Patients table me Age column jodo" (the last page cannot be removed). The demo app is in all three exports: the live preview, the one-file .html and the static .zip carry it in their script, and the React project (.zip) gets `app/appRuntime.ts` and `app/appProfiles.ts` through ThemeScope (`scripts/test-project.mjs` builds such a project with Vite and checks that the login and the dashboard are in it).
