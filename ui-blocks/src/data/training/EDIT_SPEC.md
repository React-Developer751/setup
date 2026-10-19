# Edit commands: what a person says after a website exists, and what it means

A website has been generated (a "single" page or a "multi"-page site). The person then types a change in a chat box, in English,
Hinglish (Hindi in English letters) or Hindi (Devanagari), often short, sloppy, with typos.

## Intents (labels for `edit-intents.*.jsonl`)

| intent | meaning | examples |
| --- | --- | --- |
| rename | change the business / brand name | "rename it to Green Leaf", "naam Sharma Sweets rakho", "call the shop Blue Bird" |
| recolor | change colours: a colour name or hex for buttons/links/theme, or make colours warmer/cooler/brighter/softer/darker/lighter | "make the buttons blue", "theme colour red karo", "use #ff6600", "thoda warm colors chahiye" |
| mode | the page should start in dark mode or light mode | "dark mode default karo", "make it light", "black theme" |
| remove | remove / hide a section or a page | "remove the FAQ", "pricing page hatao", "testimonials mat dikhao", "delete the blog" |
| add | add / show a section or a page | "add a gallery", "FAQ bhi daalo", "I want a pricing section", "team page add karo" |
| set_text | set the words of a headline, subtitle, button, or a section title | "change the main headline to Fresh Every Day", "button par Order Now likho", "hero subtitle: Baked with love" |
| replace_text | replace one word/phrase with another everywhere | "replace coaches with trainers", "'cafe' ki jagah 'bistro' likho" |
| contact | set email, phone number or address | "my phone is 98765 43210", "email hello@abc.com rakho", "address: 12 MG Road Pune" |
| tier | how simple or rich the design is (simple / better / premium) | "make it simpler", "premium look do", "thoda aur fancy" |
| motion | animations: off, subtle, rich | "no animations", "animation kam karo", "add more motion" |
| change_business | the business type was understood wrong; tell what it really is | "this is a restaurant, not a gym", "yeh dentist ki site hai", "treat it as a travel agency" |
| undo | go back one change | "undo", "wapas karo", "that was wrong, revert" |
| redo | redo the change that was undone | "redo", "phir se lagao" |
| reset | remove all changes | "reset everything", "sab changes hata do", "start over with the original" |
| new_site | the person describes a completely NEW website instead of editing | "create a website for a bakery in Pune", "ek gym ki website banao", "make me a portfolio for a photographer" |
| other | a question, thanks, chit-chat, or something nothing above covers | "thanks!", "what can you do?", "kya yeh free hai", "hello" |

## Sections and pages a person can name

Sections (words people use): stats (numbers, counters, statistics, achievements), marquee (scrolling strip, ticker, keywords strip),
features (features, services, offerings, what we do, menu, programs, classes), about (about us, our story, who we are), steps (how it
works, process, steps), gallery (gallery, photos, pictures, images, portfolio), pricing (pricing, plans, packages, prices, rates, fees),
team (team, staff, our people, doctors, coaches, chefs), testimonials (testimonials, reviews, feedback, what customers say, ratings),
blog (blog, news, articles, journal, posts), faq (FAQ, questions, common questions), cta (call to action banner, "get started" banner),
contact (contact form, contact section, get in touch). Hindi/Hinglish words too: "reviews" = "feedback/reviews/testimonials",
"gallery" = "photos/tasveeren", "pricing" = "daam/rate/plans" ...

Pages of a multi-page site: about, services, pricing, team, gallery, blog, faq (Home and Contact cannot be removed).

## Meaning of the operations (for `edit-commands.test.jsonl`)

Each test line: {"text": "<command>", "context": "single" | "multi", "expect": {...}}.

`expect` is exactly one of
 * {"ops": [ ... ]}               the operations, in order (empty list means "nothing can be done", e.g. removing the Contact page)
 * {"control": "undo" | "redo" | "reset"}
 * {"newSite": true}               the text describes a new website

Operations (JSON):
 * {"op":"rename","name":"Green Leaf"}
 * {"op":"accent","hex":"#2563eb"}          a colour for buttons / links / the theme. Colour words -> hex:
     red #dc2626, orange #ea580c, yellow #eab308, green #16a34a, teal #0d9488, blue #2563eb, navy #1e3a8a, purple #7c3aed,
     pink #ec4899, brown #92400e, black #000000, white #ffffff, gray #6b7280, gold #ca8a04, maroon #991b1b, sky blue #0ea5e9,
     lime #84cc16, cyan #06b6d4, violet #8b5cf6, indigo #4f46e5, magenta #c026d3, peach #fb923c, olive #65a30d, coral #f87171.
     Hindi/Hinglish: lal=red, neela/nila=blue, hara=green, peela=yellow, kala/kaala=black, safed=white, gulabi=pink, narangi=orange,
     jamuni/baingani=purple, bhura=brown, sunehri/golden=gold, aasmani=sky blue. A hex written by the person is used as given (lower case).
 * {"op":"tone","tone":"warmer|cooler|vibrant|muted|darker|lighter"}
     warmer (garam/warm colours), cooler (thanda/cool colours), vibrant (bright, colourful, vivid, bold colours), muted (soft, pastel,
     subtle, dull), darker (gehra), lighter (halka)
 * {"op":"mode","mode":"dark"} or "light"
 * {"op":"remove","section":"<section key>"}  and {"op":"removePage","page":"<page key>"}
 * {"op":"add","section":"<section key>"}     and {"op":"addPage","page":"<page key>"}
     Section keys: stats marquee features about steps gallery pricing team testimonials blog faq cta contact
     Page keys: about services pricing team gallery blog faq
     RULE: in a "single" page only the section operation is produced. In a "multi" site, a section that has its own page produces BOTH, the
     page operation first, then the section operation: pricing, team, gallery, blog, faq (same key), features (page key "services"), about
     (page key "about"). stats, marquee, steps, testimonials, cta only produce the section operation. Contact cannot be removed (ops: []).
 * {"op":"text","field":"heroTitle|heroSubtitle|heroButton|featuresTitle|aboutTitle|ctaTitle|contactTitle","text":"Fresh Every Day"}
     headline / main heading / hero title / title of the page -> heroTitle; subtitle / tagline / subheading / sub heading / short description
     under the headline -> heroSubtitle; button / hero button / main button label -> heroButton; the title of the features/services section ->
     featuresTitle; about title -> aboutTitle; call-to-action banner title -> ctaTitle; contact heading -> contactTitle.
 * {"op":"replace","from":"coaches","to":"trainers"}
 * {"op":"contact","field":"email|phone|address","value":"..."}
 * {"op":"tier","tier":"normal|better|premium"}     simple/basic/minimal/short -> normal; better/nicer/more -> better; premium/luxury/rich/fancy/pro -> premium
 * {"op":"motion","level":"off|subtle|rich"}       no/stop/disable/band karo animations -> off; little/less/kam -> subtle; more/rich/zyada -> rich
 * {"op":"theme","theme":"<business type key>"}   modern_tech organic_nature luxury_minimal playful_vibrant bold_fitness professional_services
     healthcare food_dining education creative_studio general_business real_estate travel_tourism automotive beauty_wellness events_wedding
     pets_animals fashion_retail home_services nonprofit

A command can contain several changes ("remove the FAQ and rename it to Zen Cafe"): the operations come out in the order spoken.
If a person gives a colour AND says "buttons", still one accent operation. Text inside quotes or after "to"/"as"/":" is the new text, keep
its capitalisation exactly as written.

## Colour operations added later (not in the labelled test sets)

 * {"op":"sectionColor","target":"header|hero|footer|<section key>","hex":"#16a34a"}   background colour of ONE part ("footer green", "header lal"); text on top adapts
 * {"op":"clearSectionColor","target":"footer"}                                          that part has the normal colours again
 * {"op":"harmony","kind":"complementary|analogous|triadic|split"}                       turns the main colour round the colour wheel ("opposite colour", "matching colour")
 * {"op":"alt","hex":"#ea580c"}                                                          the second colour of the palette ("second colour orange")
 * Colour words also come from things, places, brands and moods ("ocean", "mango jaisa", "like Spotify", "trustworthy colours"): see THING_COLORS in lexicon.ts.

## Business operations added later

 * {"op":"contact","field":"whatsapp|hours","value":"..."}    (besides email, phone, address)
 * {"op":"services","items":[{"name":"Haircut","price":"300"}, ...]}   feature cards + price list ("500/kg" keeps its unit)
 * {"op":"photos","hero":"https://...","about":"https://...","gallery":["https://..."],"credit":"Photos: Pexels"} and {"op":"clearPhotos"}

## Layout operations (renaming a section, moving it, making it shorter / narrower, aligning it)

Targets: section keys (stats marquee features about steps gallery pricing team testimonials blog faq cta contact), plus `header` (navigation bar),
`hero` (first screen), `footer`; the word "page / whole site / poori website / sab sections / everything" is the target `page`.
People call the same section by many words (see "Sections and pages a person can name" above): services = features, reviews = testimonials,
"call to action / banner" = cta, "how it works" = steps ...

 * {"op":"title","target":"<section key>","text":"Our Plans"}
     the HEADING of a section: "rename the pricing section to Our Plans", "pricing ka title Our Plans karo", "features section heading: What We Do",
     "gallery ka naam Our Work rakho", "FAQ ko Got Questions? naam do". Allowed targets: features about steps pricing gallery team testimonials blog faq cta contact.
     No quotes needed; keep the capitalisation the person typed.
 * {"op":"navLabel","target":"home|about|services|pricing|team|gallery|blog|faq|contact","text":"Treatments"}
     the name of a page in the MENU / navbar / tab / link ("rename Services in the menu to Treatments", "menu me About ko Our Story karo",
     "navbar me pricing ka naam Rates likho", "change the Blog link to News"). services = the features / services page. Words that make it a nav label:
     menu, navbar, nav, navigation, tab, link (and "page" in a multi-page site: "pricing page ka naam Rates karo" = navLabel).
     Plain "section ... rename" with none of those words is a `title`.
 * {"op":"move","section":"<section key>","where":"top|bottom|up|down|before|after","target":"<section key>"}
     order of sections on the page. `target` only with before/after. "move pricing above about" = pricing before about; "FAQ ko sabse neeche karo" = faq bottom;
     "gallery ko top par lao" = gallery top; "testimonials ko features ke baad rakho" = after; "move team up" = up (one step); "pehle features phir about" is NOT supported.
     "swap A and B" is not used in the tests (avoid it).
     In a multi-page site the words page / menu / nav / tab make it a page move instead:
 * {"op":"movePage","page":"<page key>","where":"top|bottom|up|down|before|after","target":"<page key>"}
     order of pages in the menu: "move Pricing before About in the menu", "blog page ko menu me last karo". Home cannot be moved.
     Page keys: about services pricing team gallery blog faq contact (not home).
 * {"op":"size","target":"<target>","axis":"height|width","factor":0.7}   or   {"op":"size","target":"...","axis":"...","px":600}
     height = how tall the part is (words: height, tall, short, shorter, lambai, ooncha, padding, spacing, gap, space, upar-neeche ki jagah, ऊंचाई);
     width = how wide (width, wide, narrow, narrower, wider, chaurai, chauda, patla, चौड़ाई, container).
     factor: slightly less/ thoda kam / a bit = 0.85;  less / kam / smaller / shorter / narrower / reduce = 0.7;  much less / bahut kam / half = 0.5;
             slightly more = 1.15;  more / zyada / bigger / taller / wider / increase = 1.3;  much more / double = 1.6.
             "reduce by 20%" = 0.8, "increase by 50%" = 1.5, "make it 60%" = 0.6.   An exact size in pixels ("width 800px", "height 500 px") uses `px`, not factor.
     "make the gallery smaller" without an axis = height. "spacing/gap/padding kam karo" = height.
 * {"op":"align","target":"<target>","align":"left|center|right"}
     "center the pricing heading", "faq ko left align karo", "text right me karo", "poori website center". 
 * {"op":"resetLayout"} or {"op":"resetLayout","target":"<target>"}
     "reset the sizes", "pricing ka size normal karo", "layout reset" (all sizes, alignments and moves) ; undo/redo/reset (control) are different and stay as they are.

Compound commands give several operations in the order spoken. If a command both names a section and a size, one `size` operation. If the target of a
size/align change is not named, the whole page (`page`) is meant ("make everything narrower").
