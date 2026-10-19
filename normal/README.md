# PixelMath Engine

Text-to-image generator written from scratch and **trainable on your own images**. No pre-trained
model, no API, no third-party package: Python standard library only (`math`, `random`, `struct`,
`zlib`, `json`, `csv`, `re`, `argparse`). Tested on Python 3.9, 3.13 and 3.14 with identical output
on all three.

```bash
# generate
python3 -m pixelmath "red house with a tree under a sunset sky" -o scene.png
python3 -m pixelmath "cyberpunk neo city at night" -o city.png --explain
python3 -m pixelmath "ek laal dil aur neela circle" -o shapes.bmp      # Hinglish works
python3 -m pixelmath "लाल घर और पेड़" -o hindi.png                        # so does Devanagari

# train on your own data, then use it
python3 train.py my_data --model my_model.json
python3 -m pixelmath "aqua mossy" --model my_model.json -o out.png

python3 -m unittest discover -s tests          # 99 tests
```

## HTTP API (Postman and other projects)

```bash
python3 serve.py --model my_model.json          # http://127.0.0.1:8000  (--model is optional; it enables /train)
```

**Postman:** Import -> choose `api/postman_collection.json` (or Import -> Link -> `http://127.0.0.1:8000/openapi.json`).
Collection variables: `baseUrl` (default `http://127.0.0.1:8000`) and `apiKey` (only if you started the server with one).
Send "Generate image (JSON -> PNG)": Postman shows the picture in the response body. For training use
"Train: upload zip (form-data)": Body -> `data` -> Select File -> a zip; Send; then "Training job status" (it fills `jobId`).

| Endpoint | What it does |
|---|---|
| `GET /health` | liveness (no key needed) |
| `POST /generate` | JSON `{"prompt","size","width","height","seed","format":"png\|bmp","learned":"auto\|always\|off","response":"binary\|base64"}` -> image bytes, or JSON with `image_base64` |
| `GET /generate?prompt=...&size=512` | same, handy in a browser |
| `POST /parse` | how a prompt is understood (entities, colours, time, unknown words, words the model knows) |
| `GET /model` | trained model info |
| `POST /train` | multipart field `data` = zip (images + `captions.csv` / `.txt` / `captions.json`), optional `epochs`, `lr`, `l2`, `val_frac`, `fresh`, `grid`, `seed`, `refit`; or a raw `application/zip` body. Returns `202` + `job_id` |
| `GET /jobs/<id>`, `GET /jobs` | training progress (`queued/extracting/reading/training/done/error`), metrics, skipped files |
| `GET /openapi.json` | OpenAPI 3 spec |

From another project:

```bash
curl -X POST http://127.0.0.1:8000/generate -H "Content-Type: application/json" \
     -d '{"prompt":"red house under a sunset sky","size":512}' -o out.png
curl -X POST http://127.0.0.1:8000/train -F "data=@my_data.zip" -F epochs=80          # then poll /jobs/<job_id>
```

```python
import json, urllib.request
req = urllib.request.Request("http://127.0.0.1:8000/generate", method="POST",
        data=json.dumps({"prompt": "blue ocean with a boat", "size": 256}).encode(),
        headers={"Content-Type": "application/json", "X-API-Key": "..."})   # key only if the server needs one
open("out.png", "wb").write(urllib.request.urlopen(req).read())
```

```js
const r = await fetch("http://127.0.0.1:8000/generate", {method: "POST", headers: {"Content-Type": "application/json"},
                      body: JSON.stringify({prompt: "mandala", size: 256, response: "base64"})});
const {image_base64, mime} = await r.json();            // from a browser page start the server with --cors-origin https://your.site
```

Errors are always JSON: `{"error": {"code": "...", "message": "..."}}` with 400/401/403/404/405/409/413/415/503.
Unknown JSON fields are rejected (a typo like `sise` gives a 400 instead of being ignored).

**Safe defaults:** listens on `127.0.0.1` only; `--host 0.0.0.0` is refused unless you set an API key (`PIXELMATH_API_KEY=...`,
sent as `X-API-Key` or `Authorization: Bearer`); Host-header check against DNS rebinding in local mode; CORS is off unless
`--cors-origin`; image size capped (`--max-size`, default 1024); at most `--max-concurrent` (2) renders at once, others queue
up to `--queue-wait` (10 s) then get 503; JSON bodies <= 64 KB; uploads <= 100 MB and <= 300 MB unzipped
(`--max-upload-mb`, `--max-unzipped-mb`); zips are unpacked with zip-slip, zip-bomb, symlink and file-count protection and
only images/captions are extracted; one training job at a time (409); a failed job never touches the existing model;
tracebacks never reach clients. It is a plain HTTP server on Python's standard library, so for use over the internet put it behind
a TLS reverse proxy (the API key is otherwise sent in clear text) and add rate limiting there.

## How it works

| Part | File | Job |
|---|---|---|
| Tokenizer, parser, vectorizer | `tokenizer.py` | English/Hinglish/Devanagari text -> entities (object, colour, size, position, count) + scene flags; 32-number hashed text vector |
| Style network | `neural.py` | Tiny fixed-seed MLP -> per-prompt hue/brightness/grain variation (untrained) |
| Scene composer + painters | `compose.py`, `painter.py`, `raster.py` | Anti-aliased signed-distance shapes, noise terrain, glow; draws sun, sea, city, trees, shapes, mandalas... |
| **Learned model** | `learn.py` | Word -> appearance model trained from *your* images (below) |
| Image readers | `imageread.py` | PNG (all types, Adam7), BMP, baseline JPEG, written from scratch |
| File writers | `imagefile.py` | PNG and BMP bytes, atomic write |
| Training command | `trainer.py` / `train.py` | CLI described below |

Routing: if the built-in lexicon understands the prompt, the procedural painters draw it. If it understands
nothing (e.g. "aqua mossy") and a trained model knows a word of it, the model draws it. `--learned always`
prefers the model whenever it knows any word; `--learned off` ignores it.

## Training on your own data

### What "training" means here (read this first)

The model learns, from your (image, caption) pairs, **what each word looks like at colour-grid level**:
palette, brightness, where the light and dark regions sit. It is a bag-of-words linear regressor from
words to a 16x16 colour grid (trained with AdaGrad, held-out validation, early stopping). It combines words
it learned separately: after seeing "aqua mossy" and "coral sandy" it can draw "aqua sandy".

It **cannot** learn detailed shapes or objects. Output from the learned path is a smooth colour/lighting field
with procedural texture, not a drawing of a dog. Detailed objects come from the procedural painters; to add a
new object, add a painter (`painter.py`) and its words (`tokenizer.py`). Learning real detail needs
GPU-scale neural networks, which is outside "pure Python, no external model".

### Data format

Put images (`.png`, `.jpg`, `.jpeg`, `.bmp`) in a folder. Captions are found in this order:

1. `captions.csv` in that folder, columns `file,caption` (also accepted: `filename/image/path/name` and
   `text/prompt/description/label`) or `captions.json` (`{"a.png": "caption"}`).
2. A `.txt` next to the image with the same name (`a.png` + `a.txt`).
3. The folder and file name (`sunset/beach_01.jpg` -> "sunset beach"). Works, but descriptive captions train much better.

Folder names are added to every caption inside that folder (`wallpapers/Big_Sur.jpg` -> "wallpaper big sur"),
so name folders by a real label or keep them neutral. A `captions.csv` / `captions.json` may sit in the data root
or in any sub-folder. Unsupported files (webp, heic, gif, tiff, truncated or corrupt images) are listed as skipped,
never silently used.

Tips: caption what is *visible* ("orange sky over dark mountains, calm lake"); 50+ varied images is a sensible
start; digits are ignored; one word can be shared by many images (that is how it learns the word's look).

### Commands

```bash
python3 examples/make_demo_dataset.py demo_data         # optional: a ready-made tiny dataset
python3 train.py demo_data --model demo_model.json      # first run creates the model
python3 train.py new_images --model demo_model.json     # later: add new data, old data is kept
python3 train.py my_data --model m.json --fresh         # start over (old file is kept as m.json.bak)
python3 train.py my_data --model m.json --preview prev/ # also save what the model predicts
```

Options: `--epochs 80`, `--lr 0.3`, `--l2 1e-4`, `--val-frac 0.15`, `--patience 8`, `--grid 16`
(new models only), `--no-refit`, `--seed`, `--words N`.

The training samples are stored inside the model file, so every run retrains on old + new data together
(no forgetting). Adding the same images again is a no-op. Each save also writes `<model>.bak`.

### Reading the report

```
held-out check (10 images never trained on): rmse 6.6 vs 63.8 for the 'average image' baseline -> 99% lower error
```

15% of the data is held out and never trained on; the number compares the model's error on it with the error of
just predicting the average image. Under ~10% improvement means it learned little (more or more varied data
needed). With a small dataset the single-split number is **noisy** (22 held-out images gave 44-60% across runs on the same data;
a 6-split cross-validation gave 30%): trust it as a rough signal, and expect it to stabilise as you add data. It is
optimistic if your dataset has many near-duplicate images (same caption, same scene).
After choosing the best epoch, the model is retrained on all data for that many epochs (`--no-refit` to skip).
Below 10 samples no held-out check is possible and training mostly memorises (a warning is printed).

### What was verified

* **Real external data, clean-room:** 136 real wallpaper photos (HEIC converted to JPEG, captions from file names such
  as `Catalina_Sunset`, `Chroma_Red_Light`) plus 10 real photos with a `captions.csv`, mixed with deliberately broken
  files, trained from a fresh copy of the project on Python 3.9 and then used from 3.14 and updated with 3.13.
  Words learned the right colours from the photos (red hue 0 deg, orange 15, yellow 53, blue 209, purple 246,
  pink 337; `dark` came out near black, `light` pale). Cross-validated gain over the average-image baseline on
  this small noisy set: about 30%, flat across learning rates 0.03-0.3, so the defaults were left unchanged.
  What the model draws is a *blurry colour/layout field* (e.g. "colorful candles orange background" gives an orange
  top and coloured vertical stripes), as described above.
* Synthetic data with known answers: held-out word pairs never seen together were drawn with RMSE 5.0/255
  vs 80.9 for the average image; new words added later learned the right colours.
* Hard random-prototype data (500 samples, 80 words): held-out RMSE 8.5 vs 42.3 baseline (noise floor ~7.7).
* Readers: PNG matrix of every colour type x bit depth x filter type x Adam7; BMP 8/24/32-bit; real 4K photos
  (PNG and JPEG) give thumbnails within 1.8/255 of the exact box average; JPEG vs PNG of the same photo within 2/255.

### Reader limits

* JPEG: baseline/sequential Huffman only (cameras and web). Progressive and arithmetic JPEG, WebP, HEIC, TIFF
  are rejected with a clear message per file (the run continues and lists skipped files). Re-save as PNG.
* EXIF rotation is ignored (a phone photo stored sideways trains sideways). CMYK JPEG is unsupported.
* PNG alpha is composited on white. Images are centre-cropped to a square before shrinking.
* Pure Python speed: a 4K photo loads in ~2 s (JPEG) to ~4 s (PNG); a 500-sample, 80-epoch training run (16x16 grid) takes about
  35 s. JPEG decoding reads only block averages (1/8 scale), which is all a thumbnail needs.

## Production notes

Checked in an audit of this project:

| Area | Result |
|---|---|
| Crash resistance | Fuzzed with 1500+ random prompts incl. empty, binary, Devanagari, 20k-char and 6000-digit inputs at several sizes; one real crash found (huge digit string) and fixed, kept as a regression test |
| Determinism | Same prompt + seed gives byte-identical output on Python 3.9, 3.13, 3.14 |
| Limits | Prompt <= 2000 chars; size 16..2048 px per side (2048x2048 = ~14 s, ~600 MB RAM; 4096 would need ~2.4 GB so it is refused); counts capped at 24 |
| Errors | Bad extension, unwritable path, missing/corrupt model, bad image: clear message and exit code, no tracebacks |
| Files | Images and models are written to a temp file then renamed, so an interrupted run never leaves a half-written file |
| Model file | Plain JSON (no pickle, nothing executable); strictly validated on load (format, version, shapes, finite numbers) |
| Speed | 512x512 ~1 s, 1024x1024 ~3 s |
| Hostile input | 12,000 randomly corrupted PNG/BMP/JPEG files and 1,500 corrupted model files: every one either decodes or is rejected with a clear error; no crashes, no hangs, peak RAM 38 MB (a bug where a forged PNG header allocated 300 MB was found and fixed) |
| Interrupts and bad paths | Ctrl-C leaves the model file untouched with a short message; unwritable or missing model folder is detected *before* training starts; corrupt model suggests `--fresh` |
| Tests | 99 unit/integration tests (also run with `-W error::ResourceWarning`) |

Not verified: Windows/Linux (developed on macOS), Python 3.8 or earlier (declared `>=3.9`), and building the wheel
from `pyproject.toml` (no setuptools available offline; the metadata and entry points were validated). Packages
nothing external, so `python3 -m pixelmath` and `python3 train.py` work straight from the folder.

Your training images stay on your machine (nothing is sent anywhere). Whether you may train on a given image is
your responsibility; no LICENSE file is included for the project itself, choose your own. Third-party licence texts live in
`LICENSES/` (currently the SIL OFL 1.1 notice for the Noto Sans Devanagari-derived skeletons).

## What it can draw (procedural path)

**Business props (flat-illustration style, 138 of them, see `business_check/props_gallery.png`)**

| Area | Props |
|---|---|
| Food and drink | pizza, coffee/tea cup, croissant, bread, burger, cake, cupcake, ice cream, plate of pasta, wine glass |
| Retail | shoes, shopping bag, gift box, t-shirt, watch, sale tag, shopping cart |
| Tech and office | laptop, monitor/dashboard, phone, tablet, camera, headphones, book, document, certificate, globe, pencil, chart, light bulb, graduation cap |
| People | person, student, doctor, chef, businessperson, team, yoga/meditation, wedding couple |
| Vehicles | car, truck/van, bus, bicycle, airplane |
| Buildings | hotel/resort, villa, apartment, university/school, hospital/clinic, cafe, bakery, restaurant, shop/boutique |
| Home | sofa, lamp, plant, bed, chair, bookshelf |
| Wellness, events, trust, web | lotus, candles, balloons, trophy, dumbbell, medical cross, suitcase, bouquet, tent, chat bubbles, review card, shield, coins, map pin |
| Pets and farm animals | dog, cat, rabbit, goldfish, parrot, cow, sheep, horse, chicken, elephant |
| Machinery and energy | tractor, excavator, tower crane, forklift, wind turbine, solar panels, factory |
| Tools and trades | wrench, hammer, screwdriver, drill, saw, paint roller, tap/faucet, toolbox, ladder, hard hat, scissors, sewing machine, thread spool, plug, gear, comb, broom, bucket |
| Playground, sports, kids, workers | swing, slide, seesaw, football, cricket set, child, construction worker |
| Emergency and rescue | ambulance, fire truck, police car, firefighter, police officer, fire hydrant, fire extinguisher |
| Dental and medical kit | tooth, toothbrush, dental chair, dentist, pills, stethoscope, syringe, thermometer |
| Winter sports | skier, ice skater, snowboard, skis, ice skate, snowman, sled, ice hockey |

Words, plurals, Hinglish (`kitab`, `gaadi`, `dukaan`...) and phrases (`coffee shop`, `ice cream`, `gift box`) map to props, and
**business concepts** bring a small composition: `translation` (globe + documents + chat), `assignment` (documents + pencil + book),
`software` (monitor + laptop), `marketing` (chart + laptop), `wellness` (lotus + candles + plant), `wedding`, `party`, `travel`,
`legal`, `education`, `healthcare`, `office`, and trades and services: `plumber`, `carpenter`, `electrician`, `painter`, `construction`, `mechanic`/`garage`, `repair`/`workshop`, `tailor`, `salon`/`barber`, `cleaning`, `pets`/`vet`, `farm`, `zoo`/`safari`, `playground`/`park`, `sports`, `energy`/`solar`, `emergency`/`fire`/`safety`, `dental`, `pharmacy`, `healthcare`, `skiing`, `skating`, `winter sports` (snow and ice ground are added automatically). Colours bind to the next noun (`red car`, `blue sofa`).

**Where things are drawn:** props go into a **scene** (a desk, a cafe table, a room, a studio, a party, a garden arch, depending on
what you asked for) or, when the prompt has outdoor words, buildings, vehicles or a time of day, into the **landscape**
(`car driving on a road at sunset`, `dairy farm with cows`, `construction site with a crane`, `ice skating rink`). When a scene is crowded the layout drops the extra props of a concept first (`secondary`), puts small things such as tools in a foreground row of their own and keeps everything inside the picture. Tools go on a workbench (workshop scene), pets on a floor. Saying `interior`, `inside`, `table` or `desk` draws a venue from the inside
(`restaurant dining table` -> plates, glass, candle on a table).

**Older renderers:** sun, moon, stars, clouds, rainbow, mountains, hills, trees, palm trees, islands, forest, house, city, sea,
beach, desert, flowers, birds, boat, road, planet, galaxy; day/sunset/dawn/night, snow, rain, fog, cyberpunk, space; shapes
(circle, square, triangle, star, heart, ring, polygons); mandala, geometric patterns, abstract art (palette from any colour words,
e.g. `blue abstract background`).

Words outside the lexicon are ignored (`--explain` lists them) unless a trained model knows them.

### Readable text
Put text in quotes and it is written into the picture with built-in stroke fonts (no font files):
Latin capitals and digits (`. , ! ? - & % + : / ( ) $` and the rupee sign), **Hindi/Devanagari** (consonants, vowels, matras, half forms, conjuncts,
reph, digits) and **103 common Chinese characters**. Lowercase Latin is drawn as capitals; unsupported characters (Arabic, Thai, rare Chinese) are
dropped and the CLI/API says so.

```bash
python3 -m pixelmath 'coffee shop sign "BEAN & BREW"' -o shop.png        # on the shop sign (also hotel signs and sale tags)
python3 -m pixelmath 'tea shop sign "चाय की दुकान"' -o chai.png           # Hindi on the sign
python3 -m pixelmath 'blue circle logo "ACME" on white background' -o logo.png
python3 -m pixelmath 'poster "SUMMER SALE" "UP TO 50% OFF" red background' -o poster.png   # headline + subtitle
python3 -m pixelmath 'coffee shop "咖啡 COFFEE"' -o cafe.png
```
The first quoted text goes on a sign/tag if the scene has one, otherwise it becomes the headline (dark or light automatically, with a soft
plate on busy backgrounds); a logo shape carries its text in the middle. Up to 3 texts, 40 characters each.

**Honest limits of the non-Latin fonts.** They are hand-drawn stroke fonts, always checked by eye, not a typographer's work:
* Devanagari reads correctly for ordinary Hindi words (all consonants, matras, half forms, a set of common conjuncts such as ज्ञ, क्ष,
  द्य, ह्म, ष्ट, reph and rakar), but it is a **single-stroke skeleton font, not a typographic font**: every letter is drawn with one
  pen weight, so fine details of the original design (stroke contrast, small lobes and terminals) are lost, and the rarer conjuncts and
  combinations of several signs are approximations that were not all inspected. The glyph skeletons were derived (centre-line
  extraction plus manual clean-up) from Noto Sans Devanagari Regular, (c) The Noto Project Authors, SIL Open Font License 1.1. No font
  file or outline data is shipped; the licence text is in `LICENSES/OFL-NotoSansDevanagari.txt` and the derivation is described in the
  PROVENANCE note of `pixelmath/devanagari.py` (dev tool: `tools/ttf_outlines.py`, see `tools/README.md`). Keep that notice if you
  redistribute the module.
* Chinese covers 103 simple/common characters. Phrases such as 咖啡, 茶, 酒, 面, 饭菜, 美食, 公司, 医院, 学校, 开业大吉 work; **欢迎光临 (光, 临
  missing) and 特价 (价 withheld) do not**: missing characters are dropped, and ones that looked wrong (他 年 车 长 新 折 价 我 肉 光 药 热 福 冷 你 家 在)
  are deliberately withheld.
* Whenever such text is drawn the CLI prints a note and the API returns `warnings` (JSON) or an `X-PixelMath-Warning` header: proof-read it.

### Adding your own prop (about 20 lines)
Create a function in `pixelmath/props/*.py` that draws in unit space (`c.rect/circle/ellipse/poly/path/arc/ring`, origin at the base,
height 1) and register it with `@prop("name", aspect=..., place="ground|table|sky", nominal=..., words=(...))`. Then
`python3 examples/props_gallery.py gallery.png --names name` to look at it, and the tests check that it stays inside its declared
box, takes colours, is reachable by a word and does not clash with existing words.

### Learned style for prop scenes
With a trained model (`--model`), prop scenes borrow the **backdrop colours** the model associates with your prompt words
(mode `scene+style`; `learned: blend` forces it, `off` disables it). Objects stay sharp because they are drawn by the painters; only
the palette comes from your images. See `business_check/own_images_blend_demo.png` (rows: your photos, model-only image, props without
model, props with the model's palette).

## History: issues found in the original reference code

1. The prompt changed one number only, so output was noise unrelated to the text.
2. `math.tan()` exploded (values > 1000) and saturated the blue channel.
3. Its BMP header was 50 bytes but declared a pixel offset of 54 (corrupt file).
4. BMP rows need 4-byte padding and BGR order; both were missing.
5. "Pure NumPy" contradicted "zero dependencies"; this version uses no NumPy.

`zlib` is Python's standard-library DEFLATE compressor, which the PNG format itself requires.
