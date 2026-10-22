# Core-Craft AI in this project

`cont/` (next to this project) holds **Core-Craft AI**: a pure-Python (standard library) pipeline, prompt -> Content AI -> Asset AI -> Design AI.
This file says what it is, what was measured, and how it is used here.

## What it is
| Part | What it does |
|---|---|
| `corecraft/content_engine.py` | 7 coarse niches (restaurant, fitness, tech, portfolio, education, shop, business), a hand-written copy bank per niche, niche detection by keywords and learned vocabulary |
| `corecraft/ngram_model.py` + `data/model.json` (16 MB) | order-2 n-gram text model trained on 172 real websites (about 287k words), with an originality check (no 6-word span copied from the corpus) |
| `corecraft/template_model.py` + `data/fillers.json` | grammar frames filled with nouns learned from the crawl (ranked by how characteristic they are of a niche) |
| `asset_engine.py`, `design_engine.py` | palette from a mood, SVG graphics, a React page |
| `training/` | crawler (`fetch_corpus.py`, `sources.py`) and trainers |

Its own tests pass (17 of 17).

## What was measured (same prompts through both engines)
* **Business detection** (130 small-business prompts): this project finds a business type for 113 of 130 (and one of 95 text packs for many); Core-Craft answers
  the catch-all "business" for 67 of 130 (52%) and is wrong for several ("eye hospital" -> fitness, "stock broker" -> fitness, "game studio" -> fitness, "warehouse" -> tech).
* **Text for everyday prompts**: a hardware store, a paint shop, a toy store and a chocolate shop all get the same jewellery and clothes lines
  ("Find rings you will love", "Beautiful diamonds for every occasion"); a robotics lab and a momos stall get plumbing text ("Faucets and contracts, all under one roof");
  a cricket academy gets exam worksheets. Its text is tied to the prompt only through one noun.
* **Invented numbers**: it writes random "Years of experience" and "Happy customers" values. This project never shows invented numbers, so stats are never taken from it.
* **Fluency scoring**: a bigram language model trained on its corpus was tried as a judge of broken lines; it did not separate good lines from broken ones (AUC 0.53), so it is not used.
* **Originality of this project's text against its corpus**: 11,760 lines (all 95 text packs and 1,785 generated lines) were compared with 12,932 headings/buttons and 178,523 six-word spans of real websites.
  No line is copied; the only matches are generic interface phrases ("Book An Appointment", "What should I wear?").

## How it is used here
It is an **optional second opinion, never the default**:
* `npm run corecraft` starts `scripts/corecraft_bridge.py` (port 8100). It only imports `cont/`; nothing in `cont/` is changed (set `CORECRAFT_DIR` if it lives elsewhere).
* The project server answers `GET /api/corecraft?prompt=&n=` and `/api/health` says `corecraft: true` when it runs.
* The generator shows a **Core-Craft AI** panel only then. "Ask Core-Craft AI" asks for 8 pages of copy and a gate (`src/generator/edit/corecraft.ts`) keeps only the lines
  that (1) come from a niche that fits the business type, (2) name the business of the prompt, (3) are the right length, with no numbers or links,
  (4) start with an action that fits the business (a shop gets "Shop Now", not "Start Free") for buttons. Everything else is listed with the reason.
* Measured on 25 everyday prompts: 40 of 521 lines pass the gate; 19 of 25 prompts get at least one line. "Use" puts a line on the first screen (undo works).

Where it could grow: more niches and a corpus of small local businesses (not big brands), Hinglish prompts, and the text packs of this project as training data.
