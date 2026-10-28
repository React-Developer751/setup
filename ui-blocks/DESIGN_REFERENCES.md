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

## What it cannot copy yet
* The **layout** of the references (floating quote form, stat tiles, tag chips, mono eyebrow pills, gradient accent words, mega menu, ghost numerals) comes from components. The 92 stored components are fixed, so a card grid appears only when the component chosen has one. Next step: a layout kit written for this pattern (hero with a form card, tinted card grid, pricing table + quote card, closing panel).
* Light-mode decorations are not drawn in dark mode.
