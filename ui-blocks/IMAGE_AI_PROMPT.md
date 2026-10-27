# Prompt for the Image AI (PixelMath)

Rules: Python standard library only, no external AI/model/API/internet at run time, keep every existing test green, and add tests for what is new.
Give this whole file as the prompt to a coding session that works **inside `normal/`**. It comes from a live test of the website project (Italian restaurant, gym, dental clinic, SaaS).

## Image AI (PixelMath, folder `normal/`)

**Role.** You improve PixelMath (`normal/pixelmath/*`, `train.py`, `tools/*`, tests). It turns a text prompt into a picture, pure Python, offline, trainable on our own images.
It is used to draw the first-screen picture, the About picture and gallery pictures of a website. Do not touch anything outside `normal/` and do not break `python3 -m unittest discover -s tests`.

**What a live test found (fix all of it).**
1. Pictures are flat illustrations that do not match the business: a birthday cake with balloons appeared in the "steps" section of an Italian restaurant.
2. Some sites got only 2 pictures; the first screen often has none (big empty hero).
3. Nothing draws food, a dish, a table setting, a clinic chair, gym equipment close-ups, a shop rack, a laptop UI, a salon, a workshop, a classroom in a style that looks premium.
4. Each picture is a big base64 JPEG (25-50 KB at small size, the page reaches 0.6-1.2 MB); the same style repeats across businesses.

**What to teach.**
- **Business scene vocabulary.** Add scenes and props (shapes, gradients, lighting, textures) for at least 40 niches: pizza on a wooden board with basil and tomatoes, pasta bowl with steam,
  tiramisu slice on a plate, cafe cup with latte art, bakery counter with loaves, thali plate, kurti on a hanger / saree folds, dental chair and smile, tooth and sparkle, dumbbells and
  kettlebell with dramatic light, yoga mat, laptop with dashboard cards, phone app screens, salon mirror and scissors, spa stones and candles, classroom board, car on a lift, flowers, wedding mandap,
  camera and lights, houseplants, construction tools. Each must be recognisable at 640x400 and not look like a clip-art sticker.
- **Quality, not just shapes.** Soft shadows, depth (layers), light direction, grain/texture, palette harmony with a given accent colour, safe zones (empty area where website text sits).
  Provide `--accent` and `--mood` (warm, cool, dark, light) so pictures match the site's colours; the picture must keep >= 4.5:1 contrast under a text zone when asked (`--text-zone left|center|bottom`).
- **Prompt understanding.** "wood fired pizza on a board", "gym with dumbbells in red light", "dental clinic reception, calm blue" must map to the right scene + props + mood; Hinglish and Hindi too.
  Refuse to draw unrelated scenes: if no scene fits, return a neutral abstract with the accent colour and say `fallback: true` (never a wrong object like a birthday cake).
- **Set consistency.** A new endpoint/function `set(prompt, count, seed)` returns 3-8 pictures for one site in ONE coherent style (same palette, lighting and stroke language) but with
  different compositions: hero (wide, text zone), about (square-ish), gallery tiles (varied). No two pictures of a set may be near-duplicates (add a perceptual-hash distance check and redraw).
- **Self-check (judge).** After drawing, score: subject present (props detected in the plan), contrast of the text zone, edge/detail density, duplicate distance. Redraw up to N times, return the
  report (`redrawn`, `fallback`, `scores`) so the website can show it.
- **Size.** No packages allowed, so add an optional palette-quantised PNG / progressive JPEG writer in pure Python to keep a 1280x640 hero under 60 KB and tiles under 25 KB.
- **Training data.** Extend `train.py` with a dataset format `{image, caption, niche, mood}` and add a small curated dataset of our own drawings per niche (made by the engine's own generators
  plus any images you own); keep a hold-out set; report before/after on the metrics below.

**Done means (measure and print the numbers).**
- For 40 niche prompts x 3 seeds: right subject recognised by the plan check >= 95%; fallback used (never a wrong object) on the rest; 0 pictures with the wrong subject.
- Every `set()` of 6 pictures: pairwise distance above the threshold, same palette family, hero has a clear text zone with contrast >= 4.5:1.
- Size targets met; generation of a 6-picture set < 20 s on a laptop; old tests still pass; new tests added for scenes, set consistency, fallback and the judge.
- Visual proof: save a contact sheet PNG per niche in `normal/samples/` (restaurant-italian, gym, dental, saas, kurti-store, salon, bakery, yoga, real-estate, school).

## How to use the results in the website project (afterwards)
After the AI is trained, this project (`ui-blocks`) needs only small wiring: use `offers/hours/prices/missing` from the Content AI, ask the Image AI for `set()` instead of single pictures,
drop sections whose fields are empty, and add an automatic page check (one navigation bar, no placeholders, no repeated sentence, a picture in every picture slot).
