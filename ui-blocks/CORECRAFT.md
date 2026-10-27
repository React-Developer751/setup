# Core-Craft AI in this project

`cont/` (next to this project) holds **Core-Craft AI**: a pure-Python (standard library) pipeline, prompt -> Content AI -> Asset AI -> Design AI.
It was updated (version 2), analysed again, and is now used where it is better than this project's own engine. This file says what it is, what was measured and how it is used.

## What it is now (version 2)
| Part | What it does |
|---|---|
| `business_types.py` | 72 business types with keywords in English, Hinglish and Devanagari, a prompt parser (place, listed services, audience, phone, years) and an inference of the copy family for types that are not listed |
| `content_engine.py` | copy written **about the services the person named** ("strict" mode: only their own phrases), typical offerings only as a flagged fallback (`needs_review`), no invented numbers or testimonials, Hindi pages for Devanagari prompts (`lang_hi.py`) |
| `kind_content.py` | steps, FAQ and highlights per kind of business, none of them claims anything about a specific business |
| `ngram_model.py`, `template_model.py` + `data/` | the model trained on 172 real websites and the grammar frames |
| `asset_engine.py`, `design_engine.py` | palette, SVG art, React page (this project has its own, richer ones, so they are not used) |

Its tests pass (33 of 33).

## What was measured (same prompts through both engines)
* **Business detection** (130 small-business prompts): version 1 answered the catch-all "business" for 67; version 2 finds a listed type for 84 and infers a copy family for the other 46
  (a few are wrong: "bike showroom" -> clothing, "robotics lab" -> cafe). This project's own engine finds a type or a text pack for 113 of 130.
* **Relevance to what the person said** (15 prompts with a name, a city and 2-3 services): brand 14/15, city 15/15, **services named in the page 36/39 (92%)**
  (this project's engine: 32/39). For a business **without a text pack** this project's engine pads the page with texts of the business type next to it
  (a tyre shop with "Flexible Rentals", a pottery studio with "Same-Day Car Care Plans", a robotics lab with "One-Click Rollbacks"); Core-Craft's strict mode lists only the services named.
* **Hindi**: this project's engine answered a Devanagari prompt in English, with an invented name and none of the services. Core-Craft writes a Hindi page: the name, the heading, the services,
  the steps, the questions, the menu and the headings in Hindi.
* **Weaknesses**: its sentences are frames ("Cycles without the hassle", "Care and know-how for X"), so the same phrasing repeats; a business it takes for another type can get a wrong flavour
  ("robotics lab" read as a cafe), and where a hand-written text pack of this project exists, the pack is better.
* **Originality** of this project's text against its corpus: 11,760 lines compared with 12,932 headings/buttons and 178,523 six-word spans of real websites: nothing copied.
* **Fluency scoring** with a language model of its corpus did not separate good lines from broken ones (AUC 0.53): not used.

## How it is used here (it runs only when `npm run corecraft` is running; otherwise nothing changes)
`npm run corecraft` starts `scripts/corecraft_bridge.py` (port 8100). It only imports `cont/`; nothing in `cont/` is changed (`CORECRAFT_DIR` if it lives elsewhere).
The server answers `/api/corecraft/page` (a cleaned whole page) and `/api/corecraft` (candidate lines); `/api/health` says `corecraft: true`.

When a site is generated, `decideCore` (`src/generator/edit/corecraft.ts`) decides who writes the page:
| Prompt | Who writes the texts |
|---|---|
| Devanagari (Hindi) | **Core-Craft**: name, heading, subheading, buttons, service cards, steps, questions, menu and headings in Hindi; the English-only parts (team, prices, sample reviews, gallery, blog) are hidden |
| a business **with** a hand-written text pack (95 packs) | this project's engine |
| a business **without** a pack that names 2+ services and Core-Craft wrote it in strict mode | **Core-Craft**: service cards (exactly the named services + calm highlights), about, steps, questions (and the heading if the built-in one does not name the business) |
| anything else | this project's engine |

The result is one undoable change ("Texts from Core-Craft AI"), shown with the reason; what Core-Craft says to check (`needs_review`) is posted in the chat. What the person types afterwards wins over its texts.
A switch in the Core-Craft panel turns this off. The panel also keeps "Ask Core-Craft AI" (gated suggestions for the heading, subheading and button).

## Known limits
* The fixed words of the templates (footer, "Privacy Policy", some buttons) stay English on a Hindi page; the first-screen words ("Learn more", "Welcome to") are Hindi.
* A business Core-Craft takes for another type, with only two services, stays with the built-in AI (the padding of the business type next to it stays).
* Hinglish (Roman letters) prompts are read by the built-in AI; Core-Craft's Hindi mode needs Devanagari.


## Update (new Core-Craft + PixelMath Studio)
* English pages: Core-Craft now writes the page whenever it could tie it to 2+ services the person named (hero, services, about, steps, FAQ, buttons). Its blog notes, and the sample reviews, team and price list of the kit (made-up names and prices) are left out unless the person gave real ones. Offers ("free shipping above 999") are not shown as services; a garbled Hindi heading or the word "नाम" taken as a service is repaired.
* Pictures: `/api/ai-set` asks the image engine's Studio for one set of 6 pictures of the business (`/set`), judged by the engine (subject, text contrast, no near-duplicates); when it answers with a fallback, the scenes of the plan are drawn as before.
* The folders `cont` and `normal` may sit next to `ui-blocks` (`../cont`) or one level higher (`../../cont`); `CORECRAFT_DIR` / `PIXELMATH_DIR` override.
