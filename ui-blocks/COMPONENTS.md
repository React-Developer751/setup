# The stored components

`src/components/<group>/<Name><n>.tsx` are React versions of HTML snippets of several kits (Tailblocks, Preline, Meraki UI, Flowbite ...).
The snippets themselves live next to this project (`../<group>/*.ts`, plain HTML) and are converted with `npm run components:convert <out dir>`
(`scripts/convert-all.mjs`: class -> className, SVG attributes, inline styles, `<style>` blocks; Alpine/Vue directives are dropped because React does not run them).
`npm run components:audit` checks that every component compiles and renders.

## What is stored (560 components in 55 groups)
| Kind | Groups | Used by the generator |
|---|---|---|
| Parts of a page | hero, jumbotron, features, content, blog, contact, cta, footer, gallery, portfolio, pricing, team, teams, testimonial, faq, statics, step, header, navbar | yes: the library engine picks them by role (see `generator/library/libraryRoles.ts`) |
| Page parts that are not used yet | banner, cookie, speed-dial, carousel, video, 404-page, sign-and-register, stepper, email-template, card | only in the component library |
| Widgets | alert, avatar, badge, button, clipboard, datepicker, drawer, dropdown, forms, input, kbd, list-group, mega-menu, modal, pagination, progress, qrcode, rating, select, sidebar, skeleton, spinner, tables, tabs, textarea, toast, tooltip | only in the component library (they need JavaScript that a static page does not run) |

Four source snippets are not converted (malformed HTML): clipboard/Clipboard6, drawer/Drawer11, list-group/ListGroup6, modal/Modal13.

## How a stored component becomes a part of a generated page
1. The theme (`library/libraryTheme.ts`) redefines the colour variables the kits use (gray, indigo, **blue**, Preline's tokens) from the palette of the site.
2. `library/fillContent.ts` replaces the texts by the content of the site, finds the repeated cards, and replaces every picture that points to another site
   (Unsplash, Flowbite, dummyimage, `background-image` urls, logos of other kits) by a picture of the page, a drawn one, an avatar with initials or the brand mark.
   Menu bars inside a hero, "trusted by" rows of other companies' logos and the names of the kits ("Meraki", "Flowbite") are removed or replaced.
3. In the component library ("Show in the style of a site") every group can be previewed this way.

## What the generator uses (src/generator/library/componentUse.ts)

Every group of stored components has a decision, checked by `scripts/test-components.mjs`:

- **Page parts** (in the pools of `libraryRoles.ts`, 173 components + the jumbotrons of the short page): hero, jumbotron, navbar, header, features, content, blog, statics, step, gallery, portfolio, pricing, team, teams, testimonial, contact, cta, faq, footer, and
  - `banner` (new role): an announcement bar above the menu on the long pages, made a plain bar (the originals are fixed to the screen and closed by a script),
  - `cardgrid/CardGrid1,3,4,9` (blog): a single card from `card/` shown three times under a heading,
  - `stepsection/StepSection3,6` (how it works): the two steppers that carry text, with a heading.
  `node scripts/make-cardgrids.mjs` writes `cardgrid/` and `stepsection/`.
- **Widgets** (stay in the Component Library, not drawn into a page): the rest of the 560 (alerts, avatars, badges, buttons, inputs, modals, tables, tabs, carousels ...). They are parts of an application: they need a script to work, or hold the data of an app (products, users, wallets). Where a group has a few pieces that do work as page parts they were wrapped (see above); the 20 other cards are shop, wallet, course, profile or login cards that would put the wrong content on a business site.
