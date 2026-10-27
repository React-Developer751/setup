# Prompt for the Content AI (Core-Craft)

Rules: Python standard library only, no external AI/model/API/internet at run time, keep every existing test green, and add tests for what is new.
Give this whole file as the prompt to a coding session that works **inside `cont/`**. It comes from a live test of the website project (Italian restaurant, gym, dental clinic, SaaS).

## Content AI (Core-Craft, folder `cont/`)

**Role.** You improve Core-Craft AI (`cont/corecraft/*`, `cont/training/*`, `cont/data/*`). It writes the texts of a small-business website from a short prompt
(English, Hinglish, Hindi). It must stay offline and pure Python. Do not touch anything outside `cont/`.

**What a live test found (fix all of it).**
1. Frames are generic service-business frames. For "Italian restaurant Forno Rosso in Mumbai, wood fired pizza, fresh pasta, tiramisu" it wrote
   "We help people with fresh pasta, wood fired pizza, and tiramisu" and "Whatever you need from wood fired pizza, just ask." A restaurant does not "help people with" a pizza.
2. The wrong niche family leaks: an Italian restaurant got "Lunch Thali", "Home Style Curry", "Starter or soup / Your main dishes" (Indian-restaurant text).
3. The same sentence is reused everywhere (hero subtitle repeated in features, pricing and testimonials headings; 6 duplicated sentences on one page).
4. Placeholders leak into the page: "Sample Customer", "John snow", "123 Sample Street", "+1 (555) 000-0000", "hello@example.com".
5. Nonsense lines: "Straight answers and fair terms for fresh pasta" (blog card), stats heading always "Results that speak for themselves".
6. Business type is detected with low confidence for common prompts; some are wrong ("bike showroom" -> clothing, "robotics lab" -> cafe).

**What to teach.**
- **Niche-specific grammar.** For each of the 72 business types add its own verbs, nouns and sentence frames, grouped by `kind` (food and drink, health and care, fitness, retail and fashion,
  software, education, home services, beauty, travel, events, creative studios, trades, nonprofit). A restaurant *serves, bakes, cooks, seats*; a clinic *treats, examines, advises*;
  a gym *trains, coaches*; a store *ships, stitches, delivers*; SaaS *automates, tracks, syncs*. Service names are never put into a "help people with X" frame unless the kind is a service kind.
- **Cuisine and sub-niche layer** under restaurants/cafes/bakeries: Italian, North Indian, South Indian, Chinese, continental, street food, bakery, tea cafe, bar, cloud kitchen.
  Dishes, menu words, steps ("Book a table", "Choose your pizza", "Pickup or dine in"), FAQ (vegetarian, booking, parties, delivery, allergies). Never mix another cuisine's dish names in.
  Same idea for clinic specialities (dental, skin, eye, physio), gym types (crossfit, yoga, zumba), shops (kurti, saree, electronics, books).
- **Strict facts.** Use only what the prompt says: name, city, listed services/dishes, offers (free shipping, COD, returns, free trial), hours, prices, phone, years. Never invent numbers,
  awards, customers or addresses. When a fact is missing, **leave the field empty** (so the page can drop the section); never output a placeholder string.
  Add a validator that rejects any output containing: `Sample`, `Lorem`, `example.com`, `555`, `John`, `Jane`, `123 `, `Your main dishes`, `Starter or soup` unless the prompt contained it.
- **Variety.** For every slot (hero title, subtitle, about, feature text, step text, FAQ answer, CTA, blog excerpt, stats heading) keep at least 8 different frames per kind and choose by a
  seed from the prompt, so two businesses of the same kind read differently. Within one page no sentence of 6+ words may appear twice (dedupe and re-pick).
- **Voice.** Short, specific, warm, concrete sensory words per niche; no filler ("passionate", "welcome to our website", "world-class"). Hero title = what they do + for whom/where.
  Each feature card = one real service from the prompt + one concrete sentence about it (what you get, how long, how to book), different for each card.
- **Hinglish and Hindi.** Hinglish (Roman letters) prompts get the same quality as English (understand "mujhe ek ... chahiye", keep fillers out of names and subjects);
  Devanagari prompts get a Hindi page. Also write natural Hindi frames for the new niches.
- **Detection.** Add 100 more labelled prompts per hard case (English, Hinglish, Hindi), include the confusing ones (bike showroom, robotics lab, pottery studio, tyre shop,
  packers and movers, kirana store), retrain `train.py` / `train_templates.py`, and report accuracy before and after. Where unsure, say `needs_review` instead of guessing a niche.
- **Training data.** Extend `training/sources.py` with more real-site copy per niche (public pages you are allowed to read), clean it, remove brand names/phones/addresses, and keep
  a hold-out set that is never trained on. Do not copy sentences verbatim: check that no 6-word span equals a source (like the existing originality check).

**Output contract (keep).** `/page` returns brand, lang, business_type, location, hero_heading, tagline, about(+title), features(title, items{title,text}), highlights, steps, faq, cta,
`needs_review`, plus new keys: `offers[]`, `hours`, `prices[{name,amount}]`, `facts_used[]`, `missing[]` (fields it refused to invent).

**Done means (measure and print the numbers).**
- On 60 fresh prompts (15 niches x 4, mixed languages): services named on the page >= 95%; 0 placeholders; 0 cross-niche words (a list per niche of forbidden words);
  0 repeated 6-word spans per page; two pages of the same niche share < 30% of their sentences.
- Business-type accuracy on the hold-out >= 90% with `needs_review` raised on the rest; all old tests (`test_corecraft.py`, `test_content_model.py`, `test_business_types.py`) still pass.
- Example that must read well: Italian restaurant Forno Rosso, Mumbai, wood fired pizza / fresh pasta / tiramisu / weekend brunch, open 12pm-11pm, online booking -> a hero like
  "Wood-fired pizza and fresh pasta in Mumbai", cards that describe each dish, steps about booking a table, no thali, no curry, no placeholders.

## How to use the results in the website project (afterwards)
After the AI is trained, this project (`ui-blocks`) needs only small wiring: use `offers/hours/prices/missing` from the Content AI, ask the Image AI for `set()` instead of single pictures,
drop sections whose fields are empty, and add an automatic page check (one navigation bar, no placeholders, no repeated sentence, a picture in every picture slot).
