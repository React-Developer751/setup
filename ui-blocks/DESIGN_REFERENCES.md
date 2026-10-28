# Design references: five live translation-service sites

Read on 2026-10-28 (HTML, computed styles, screenshots at 1440 px). Only **design and colour** were taken; no text, brand name or picture.
Each site is a custom WordPress + Tailwind theme with its own identity; what they share is the *pattern*.

## What they share (the pattern)
| Area | Pattern |
|---|---|
| Top | a thin announcement / trust strip above the header (certified, accepted by UKVI, phone, e-mail) |
| Header | sticky, white or translucent; logo left, mega-menu (Services, Languages, Locations, Pricing, Reviews, Blog), a pill "Get a quote" button, often a rating chip (4.9/5) |
| Hero | two columns: left an eyebrow chip, an H1 with one **coloured accent phrase**, a short paragraph, tick chips; right a **floating quote form card** with a coloured header. Stat tiles under the text (24 h, 50+ languages, 4.9/5, 0 cost) |
| Section heads | centred: a small uppercase eyebrow, a tight-tracked bold H2, a muted intro paragraph |
| Cards | rounded 20-28 px, white or softly tinted, a 1 px ring and a long soft shadow, a small tag chip (COURT ORDER, RELIGIOUS), icon tiles |
| Pricing | a clean table (service / delivery / price) beside a dark "get a fixed quote" card |
| Closing | one dark or gradient panel with a headline, a white button and an outlined button, a tick row |
| Footer | near-black, four columns, contact block |
| Type | a single geometric sans (Plus Jakarta Sans, Mulish, Roboto Flex), heavy weights, negative letter-spacing on headings |
| Colour | one signature hue + a warm or soft neutral page + a very dark tinted "ink" for panels; pastel glows behind the hero |

## The five signatures
| Site | Page | Ink / panels | Accent | Second | Font | Look |
|---|---|---|---|---|---|---|
| medicaltranslationsuk | mint `#eef7f4` | deep teal | teal `#12897b` | purple `#4e3781` | Roboto Flex | mint-blue-lavender mesh, glassy cards each tinted (mint, blue, lavender, peach, green, pink), dark icon tiles, mono eyebrow pills, ghost numerals |
| deathcertificatetranslations | ivory `#f7f1f4` | aubergine `#2b1722` / `#150a11` | mauve `#a05c7c` | plum `#553049` | Plus Jakarta Sans | dark panels with a faint wave pattern like a certificate's security lines, thin bordered cards, one gradient "most ordered" card, near-black pill buttons |
| divorcecertificatetranslations | warm white `#f8f8f7` | navy `#0b1b2e` | navy `#003078` | red `#c8102e` | Plus Jakarta Sans | UK-government feel, light-blue gradient cards with tag chips, stat tiles, a boxed navy gradient closing panel |
| marketingtranslationsuk | near-white `#fbf9ff` | night violet `#0b0620` | violet `#5b21e6` | pink `#ec4899` | Plus Jakarta Sans | lavender / pink / cyan glows, gradient buttons, headline words in a violet-to-pink gradient, violet-to-pink closing band |
| icatranslationsingapore | cream `#faf7f2` | indigo-ink `#0e0b1f` | coral `#ff5a3c` | violet `#6d3df2` | Mulish | cream page, coral call to action, italic violet accent words, floating mini-stat cards, white rounded cards with a violet shadow, a dark indigo quote card |

## What the generator learned (src/generator)
Five new design moods in `moods.ts`: `clinic-mesh`, `plum-ivory`, `trust-navy`, `violet-glow`, `cream-coral`.
* a **fixed signature** palette (light and dark) per mood: they do not take the hue of the business, so they look designed instead of recoloured;
* their own typeface, now also applied in the library engine (every mood's typeface used to be ignored there);
* the colour of each panel (`roles`, plus a new `alt-ink` role): hero, stats, call to action and footer follow the reference;
* `moodCss.ts`: rounder cards with a ring and a soft shadow, pill buttons, hero backdrops (mesh, waves, glows), tinted cards, gradient closing panels;
* choice: translation, legal, immigration and document prompts prefer these designs (never the loud moods); clinics, professional services, general business, home services and tech get them often.
Say "clinic mesh", "plum and ivory", "trust navy", "violet glow" or "cream and coral" in a prompt or in the chat to ask for one.

## The layout kit (src/components/refkit)
The pattern of the references is also built as components, filled by name (`data-slot`, `fillRef.ts`), never guessed:
* `RefHero1`: eyebrow chip, headline with the last words in the accent colour, tick chips from the services, two pill buttons, a quote form card with a coloured header;
* `RefStats1`: four stat tiles (only when the page has real facts; otherwise hidden);
* `RefFeatures1`: centred head and a grid of tinted cards with a dark icon tile;
* `RefSteps1`: numbered cards with a small label and a ghost numeral;
* `RefPricing1`: a price table next to a dark quote card (only when there are prices);
* `RefCta1`: a boxed closing panel in the signature gradient, two buttons, a row of ticks.
A page in one of the five designs uses them for hero, stats, services, steps, prices and closing panel (`refPools`); the other parts (menu, about, FAQ, contact, footer) stay the stored components.
Translation / certificate prompts choose their design by kind: medical -> clinic-mesh, death or probate -> plum-ivory, court, divorce, visa or Home Office -> trust-navy, marketing -> violet-glow, Singapore or ICA -> cream-coral (`referenceMood`).

## What it cannot copy yet
* The mega menu, the floating mini-cards on the hero, the gradient on single headline words (violet-to-pink) and the "most ordered" featured card.
* The form of the hero card is a design element: it opens the visitor's mail program on the exported site (no form service is used).
* Light-mode decorations are not drawn in dark mode.

---

# Part 2: famous picture-led sites (read 2026-10-28)
Gucci, Lusion, Apple, teenage engineering, Tesla, Nowness (opened and measured); the lists of bmgmediaco (blocked), Awwwards luxury and Eleken (headings and "why it stands out" read).

## What they share
* **Type and picture first**: an oversized headline, a few words, one or two buttons, and a picture that fills the screen or a rounded card. Very few colours: black, white and one accent.
* **No frames**: tiles meet edge to edge (Gucci, Nowness), or full-width tiles follow one another (Apple, Tesla); captions are tiny capitals with wide spacing.
* **One voice of colour**: Lusion cobalt `#1a2ffb` on lavender-white `#f0f1fa`, Apple blue `#0071e3` on `#f5f5f7` / black, Tesla blue `#3e6ae1` on white, teenage engineering orange on black, Gucci and Nowness only black and white.
* Eleken's takeaways agree: dark high-contrast UI with one neon accent, bold typography, generous white space, a primary and a quiet secondary button, storytelling pictures.

| Site | Page | Type | Look |
|---|---|---|---|
| gucci.com | white | Gucci Sans (wide humanist), small uppercase, tracked | full-bleed photograph, a tiny centred wordmark, one square white "SHOP NOW", picture tiles with no gap and a one-line caption |
| nowness.com | white | Futura, light, capitals | a very wide thin wordmark, a wide film still, small caption nav, a strip of film stills |
| lusion.co | `#f0f1fa` | Aeonik, light, huge | a large rounded 3D picture card inset from the edges, a black pill and a white pill, "+" markers |
| apple.com | white / `#f5f5f7` / black | SF Pro, 600, tight tracking | tiles one under the other: headline, one line, a blue pill and an outlined pill, the product below; light and black tiles alternate |
| teenage.engineering | black | technical mono capitals | a spotlit product, thin outlined rectangular buttons, one orange accent, grayscale |
| tesla.com | white | Universal Sans, 500 | a full-screen picture, small centred menu, a solid blue and a white 4 px button side by side |

## What the generator learned
Six more design moods: `maison-noir`, `film-editorial`, `atelier-3d`, `apple-tile`, `techno-black`, `showroom-white` (fixed signature palettes and typefaces, 21 moods in all), and a **showcase kit** (`src/components/showkit`): `ShowHero1` (the picture fills the screen; each design places the text, rounds the picture and styles the buttons), `ShowTiles1` (edge-to-edge picture tiles with a small caption), `ShowStack1` (full-width product tiles, light and dark in turn), `ShowCta1` (a large closing statement). Pictures are the page's own (the image engine's set) or drawn art of the page's colours.
They are chosen by the kind of business (`showcaseMood`): fashion house, couture, handbags -> maison-noir; film, photography, magazine -> film-editorial; 3D, WebGL, digital studio -> atelier-3d; gadgets, headphones, smartphone -> apple-tile; synths, instruments, robots -> techno-black; electric cars, solar, showroom -> showroom-white. Any business can also ask by name ("apple style", "tesla style", "gucci style", "lusion style", "teenage engineering").

## Limits
* The pictures of the image engine are illustrations: the designs lean on photography, so the look is closer in structure and colour than in feeling. Upload real photos ("Real photos" panel) for the full effect.
* No WebGL, scroll-driven motion, custom cursors or video.

---

# Part 3: award-winning studios (read 2026-10-28)
Bruno Simon, Active Theory, Resn, Locomotive, Unseen, Moooi, Uncommon, Obys, 14islands, Immersive Garden.
**What was really seen and what not:** in this browser (no GPU) most of these WebGL sites only show their loader. Seen: Bruno Simon (neon-purple grid and a glowing ring loader), Unseen (charcoal / blush preloader with a big "N"), Uncommon (loud teal page, condensed italic headline, phone mock-ups), Moooi (taupe page, thin large serif), Resn (`#141414` loader). Measured from their HTML and CSS: fonts, colours, titles, descriptions. Locomotive answered with a bot check (Cloudflare): it was not opened, a bot check is not bypassed. The rest of the pattern is general knowledge of this kind of site, not a measurement.

## What they share
* A near-black (`#000`, `#030303`, `#121212`) or very light (`#f8f8f8`, `#e8e8e8`) page; a tiny wordmark; tiny navigation; a loader with a counter.
* **Giant type**, often a serif display next to a grotesk (Saol Display + Neue Montreal at Unseen, Obys serif, PS Times + Helvetica Neue at Immersive Garden), very tight tracking.
* Warm neutrals with charcoal (Unseen blush `#efded9`, Moooi sand `#e3d9c6`).
* Loud accents only where the site is playful (Uncommon teal and yellow, Bruno Simon neon purple and pink, handwritten Amatic SC).
* Work is shown as a numbered index with thin rules, or as large picture tiles; buttons are text links with an underline.

## What the generator learned
Four more design moods (25 in all): `noir-lab` (near-black, off-white type, text links), `blush-serif` (blush and sand, a huge serif), `neon-arcade` (indigo night, hot pink and cyan neon, glowing rounded tiles), `studio-index` (light grey, giant black type, a numbered index of work), and two more parts for the showcase kit: `ShowTypeHero1` (tiny labels, a giant headline, text links and one wide picture strip) and `ShowIndex1` (a numbered index of the services).
Chosen by the kind of business: immersive or experiential studios -> noir-lab; game studios and arcades -> neon-arcade; furniture, lighting, ceramics, interior design -> blush-serif; creative or design agencies and portfolios -> studio-index. Or ask by name ("obys style", "moooi style", "bruno simon style", "active theory style").

## Limits
No WebGL, 3D worlds, scroll-driven motion, cursor effects or preloaders: only their type, colour, layout and pace are taken.

---

# Part 4: the learned designs are now the default look
Before, only prompts with the right keywords (translation, fashion, 3D ...) wore the designs read from live sites; a dentist, a lawyer or a bakery still got the old generic look (7 of 12 real prompts). Now:
* **Every business kind has its own ordered list of learned designs** (`LEARNED_FOR` in `moods.ts`): local services (clinic, law, plumber, school, NGO) wear the content-first designs of the translation sites (quote card, tinted cards, steps); brands, products, studios and fashion wear the picture-led ones.
* **Below a wild creativity only these designs are chosen** (about 90% of the sites in a plain run); the ten general moods stay for a person who names one and for wild creativity. A **safe** creativity keeps the stored components with no design on top.
* **A colour the person names ("red pizza shop") is theirs**: the designs with fixed colours are not chosen on their own, and the colour judge is not run over them.
* The tests that assumed made-up palettes (premium share, unique hues, colour judge, design memory) run at a wild creativity; the learned designs are checked for contrast in `test-moods.mjs` and for structure in `test-refkit.mjs`.
