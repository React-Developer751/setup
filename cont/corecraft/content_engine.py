"""Content AI Engine: prompt -> niche, keywords, validated copy. Uses json, random, re only."""
import json
import random
import re

from .ngram_model import Model, tokens as _model_tokens
from .template_model import TemplateModel
from . import lang_hi as hi_mod
from .business_types import T as TYPES, detect_type, fallback_items, infer_kind, parse_hindi, parse_prompt
from .kind_content import (ANY, FAQ_COMMON, FAQ_LAST, FAQ_THIRD, HIGHLIGHTS, KIND_COMMON, KIND_NEUTRAL, NAME_BANK, STEPS)

STOPWORDS = set(
    "a an the and or for of to in on with my our your is are be that this it i we want need make build create "
    "website site web page banao banana chahiye mujhe ek ka ki ke se me mein hai hain called named name please "
    "simple modern good best new unique attractive".split()
)

# niche -> trigger keywords, mood, copy bank
NICHES = {
    "restaurant": {
        "keys": ["restaurant", "cafe", "coffee", "bakery", "food", "pizza", "dining", "kitchen", "chef", "dhaba", "menu", "bistro"],
        "mood": "warm",
        "name_a": ["Saffron", "Ember", "Basil", "Maple", "Copper", "Olive"],
        "name_b": ["Table", "Kitchen", "House", "Bistro", "Hearth"],
        "headings": ["Taste the Tradition", "Fresh From Our Kitchen", "Where Every Meal Is a Story", "Flavours Worth Coming Back For"],
        "taglines": ["Seasonal ingredients, cooked with care.", "Good food, warm company, zero rush."],
        "paras": [
            "Every dish begins with ingredients sourced from growers we know by name, then built slowly into plates that feel like home.",
            "From the first sip in the morning to the last course at night, our kitchen cooks what is in season and nothing less.",
            "We believe a table is the best place to slow down, so we set ours with care and keep the menu honest.",
        ],
        "features": [("Seasonal Menu", "Dishes change with the harvest so everything tastes fresh."), ("Local Sourcing", "We buy from nearby farms and bakers."), ("Private Dining", "Host birthdays and meetings in a quiet corner."), ("Takeaway", "Our favourites, packed to travel well."), ("Chef Specials", "A new creation every week."), ("Family Friendly", "Space and plates for every age.")],
        "ctas": ["Reserve a Table", "View the Menu", "Order Now"],
    },
    "fitness": {
        "keys": ["gym", "fitness", "yoga", "workout", "trainer", "training", "health", "crossfit", "sports", "wellness"],
        "mood": "bold",
        "name_a": ["Iron", "Pulse", "Apex", "Titan", "Vigor", "Surge"],
        "name_b": ["Fitness", "Lab", "Club", "Studio", "Athletics"],
        "headings": ["Stronger Every Single Day", "Train Hard. Recover Smart.", "Your Best Shape Starts Here", "Built on Discipline"],
        "taglines": ["Coaching that meets you where you are.", "Real plans, real results."],
        "paras": [
            "Our coaches build programs around your goals, your schedule and your body, then track progress so effort never goes unseen.",
            "Whether you lift, run or stretch, you get equipment that works, trainers who care and a crew that pushes you forward.",
            "Small habits compound. We help you make showing up the easy part and results the natural outcome.",
        ],
        "features": [("Personal Coaching", "One-on-one plans that adapt every week."), ("Group Classes", "High-energy sessions all day long."), ("Nutrition Guidance", "Simple meal plans that fit real life."), ("Progress Tracking", "Measure strength, stamina and habits."), ("Open Floor", "Modern machines and free weights."), ("Recovery Zone", "Stretch, foam roll and reset.")],
        "ctas": ["Start Free Trial", "Join Today", "Book a Session"],
    },
    "tech": {
        "keys": ["software", "saas", "app", "startup", "tech", "ai", "platform", "developer", "cloud", "api", "digital", "agency", "it"],
        "mood": "cool",
        "name_a": ["Nova", "Pixel", "Orbit", "Flux", "Quanta", "Helix"],
        "name_b": ["Labs", "Works", "Cloud", "Systems", "Stack"],
        "headings": ["Build Faster. Ship Smarter.", "Software That Gets Out of Your Way", "Turn Ideas Into Products", "Technology With a Human Touch"],
        "taglines": ["Reliable tools for ambitious teams.", "From first line of code to launch day."],
        "paras": [
            "We combine clean engineering with thoughtful design so your product feels fast, simple and dependable from day one.",
            "Our team replaces busywork with automation, giving you dashboards that answer questions before you ask them.",
            "Security, speed and clarity are built in, not bolted on, so you can focus on customers instead of infrastructure.",
        ],
        "features": [("Lightning Fast", "Optimised for speed at every layer."), ("Secure by Default", "Encryption and access control built in."), ("Smart Automation", "Remove repetitive tasks in minutes."), ("Live Analytics", "Clear numbers, updated in real time."), ("Easy Integrations", "Connect the tools you already use."), ("Friendly Support", "Real people who reply quickly.")],
        "ctas": ["Get Started", "Request a Demo", "Try It Free"],
    },
    "portfolio": {
        "keys": ["portfolio", "designer", "photographer", "photography", "artist", "freelancer", "creative", "personal", "resume", "illustrator", "filmmaker"],
        "mood": "elegant",
        "name_a": ["Studio", "Atelier", "Frame", "Canvas", "Mono", "Lumen"],
        "name_b": ["Creative", "Works", "Visuals", "Collective", "Folio"],
        "headings": ["Work That Speaks for Itself", "Stories Told Through Design", "Crafting Images With Intent", "Selected Work, Thoughtfully Made"],
        "taglines": ["Independent creative for brands with a point of view.", "Quietly bold, carefully made."],
        "paras": [
            "Each project starts with listening, then moves through sketches and drafts until the result feels inevitable.",
            "I partner with founders, magazines and local businesses to give ideas a clear, memorable shape.",
            "Detail matters. From typography to timing, every choice serves the story you want people to remember.",
        ],
        "features": [("Brand Identity", "Logos and systems that stay consistent."), ("Photography", "Natural light, honest moments."), ("Web Design", "Clean layouts that load fast."), ("Illustration", "Custom artwork with personality."), ("Art Direction", "A single vision across every touchpoint."), ("Motion", "Short animations that bring ideas alive.")],
        "ctas": ["See My Work", "Start a Project", "Say Hello"],
    },
    "education": {
        "keys": ["school", "course", "academy", "coaching", "tutor", "learning", "education", "college", "institute", "classes", "study", "university"],
        "mood": "friendly",
        "name_a": ["Bright", "Scholar", "Kiran", "Lumina", "Insight", "Gyan"],
        "name_b": ["Academy", "Institute", "Learning", "School", "Hub"],
        "headings": ["Learn Today, Lead Tomorrow", "Where Curiosity Grows", "Knowledge Made Simple", "Guided Learning That Works"],
        "taglines": ["Patient teachers, practical lessons.", "Every learner gets a path."],
        "paras": [
            "Our teachers break big ideas into small steps and check understanding often, so no student is left behind.",
            "Lessons mix clear explanations with practice and feedback, building confidence along with marks.",
            "From first-time learners to exam toppers, we adapt the pace and make progress easy to see.",
        ],
        "features": [("Expert Teachers", "Experienced mentors who love teaching."), ("Small Batches", "More attention for every student."), ("Practice Tests", "Prepare with real exam patterns."), ("Doubt Support", "Ask anything, anytime."), ("Flexible Timings", "Morning, evening and weekend slots."), ("Progress Reports", "Parents stay informed each month.")],
        "ctas": ["Enroll Now", "Book a Free Class", "View Courses"],
    },
    "shop": {
        "keys": ["shop", "store", "ecommerce", "fashion", "clothing", "jewellery", "jewelry", "boutique", "handmade", "dukaan", "products", "gifts", "furniture"],
        "mood": "playful",
        "name_a": ["Willow", "Indigo", "Marigold", "Thread", "Juniper", "Kora"],
        "name_b": ["Market", "Boutique", "Goods", "Collective", "Supply"],
        "headings": ["Find Something You'll Love", "Made Well, Meant to Last", "Little Luxuries for Everyday", "New Arrivals, Just for You"],
        "taglines": ["Curated pieces with honest prices.", "Delivered with care to your door."],
        "paras": [
            "Each product is chosen for quality, comfort and character, so you buy less and enjoy it more.",
            "We work directly with makers to keep prices fair and materials responsible, then ship quickly and carefully.",
            "Not happy? Send it back. We want every order to feel like a small celebration.",
        ],
        "features": [("Free Shipping", "On every order above a small minimum."), ("Easy Returns", "Change your mind within 30 days."), ("Secure Checkout", "Pay with confidence."), ("Gift Wrapping", "Ready to give, beautifully packed."), ("Handpicked Quality", "We test before we stock."), ("Member Offers", "Early access to new drops.")],
        "ctas": ["Shop Now", "Browse Collection", "Get 10% Off"],
    },
    "business": {
        "keys": [],
        "mood": "calm",
        "name_a": ["Prime", "Summit", "Clarity", "Anchor", "Meridian", "Vertex"],
        "name_b": ["Partners", "Group", "Solutions", "Services", "Co"],
        "headings": ["Solutions You Can Rely On", "Growing Together, Step by Step", "Quality Service, Every Time", "Built on Trust"],
        "taglines": ["Straightforward service and honest advice.", "Your success is our standard."],
        "paras": [
            "We listen first, then deliver clear plans, fair pricing and steady communication from start to finish.",
            "Our team brings years of experience and a simple promise: do the work properly and stand behind it.",
            "Customers return because we make things easy, keep our word and care about the outcome.",
        ],
        "features": [("Experienced Team", "Skilled people who know the details."), ("Transparent Pricing", "No surprises, ever."), ("Fast Response", "We reply the same day."), ("Custom Plans", "Solutions that fit your needs."), ("Quality Guarantee", "We fix it if it falls short."), ("Ongoing Support", "We stay with you after delivery.")],
        "ctas": ["Contact Us", "Get a Quote", "Learn More"],
    },
}

_STEM = re.compile(r"(ing|ers|er|es|s)$")


def tokenize(text):
    return [w for w in re.findall(r"[a-zA-Z\u0900-\u097F]+", text.lower()) if w not in STOPWORDS and len(w) > 1]


def _stem(w):
    s = _STEM.sub("", w)
    return s if len(s) >= 3 else w


def detect_niche(tokens, model=None):
    scores = {}
    stems = {_stem(t) for t in tokens} | set(tokens)
    for name, data in NICHES.items():
        hit = sum(1 for k in data["keys"] if k in stems or _stem(k) in stems)
        if hit:
            scores[name] = hit
    if not scores and model:
        learned = model.niche_scores([t for t in tokens])
        best = max(sorted(learned), key=lambda n: learned[n])
        return best if learned[best] > 0 else "business"
    if not scores:
        return "business"
    return max(sorted(scores), key=lambda n: scores[n])


def extract_name(prompt, niche, rng):
    m = re.search(r"[\"“'‘]([^\"”'’]{2,40})[\"”'’]", prompt)
    if m:
        return m.group(1).strip()
    m = re.search(r"(?:called|named|name is|naam)\s+([A-Z][\w&'-]*(?:\s+[A-Z][\w&'-]*){0,3})", prompt)
    if m:
        return m.group(1).strip()
    d = NICHES[niche]
    return f"{rng.choice(d['name_a'])} {rng.choice(d['name_b'])}"


def validate_content(c):
    """Raise ValueError if the generated content is unusable."""
    required = ["brand", "niche", "keywords", "hero_heading", "tagline", "about", "features", "cta_primary", "cta_secondary", "cta_text", "footer",
                "highlights", "steps", "faq", "eyebrow"]
    for k in required:
        if not c.get(k):
            raise ValueError(f"missing content field: {k}")
    if len(c["features"]) < 3:
        raise ValueError("need at least 3 features")
    if len({f["title"] for f in c["features"]}) != len(c["features"]):
        raise ValueError("duplicate feature titles")
    if len(c["hero_heading"]) > 80:
        raise ValueError("hero heading too long")
    leaves = []

    def walk(x):
        if isinstance(x, str):
            leaves.append(x)
        elif isinstance(x, dict):
            for v in x.values():
                walk(v)
        elif isinstance(x, list):
            for v in x:
                walk(v)
    walk({k: v for k, v in c.items() if k not in ("generated_by", "needs_review", "ui")})
    blob = " ".join(leaves)
    if re.search(r"\{\{|\}\}|\$\{|\bTODO\b|lorem|[{}]", blob, re.I):
        raise ValueError("placeholder text found")
    for leaf in leaves:
        if c.get("lang") != "hi" and re.search(r"\b(\w+) \1\b", leaf, re.I):
            raise ValueError("repeated word found in %r" % leaf)
    for st in c.get("stats", []):
        if not st.get("value") or not st.get("label"):
            raise ValueError("incomplete stat")
    return True


def _templated(tm, niche, rng, want, slots):
    """Slots written from learned niche nouns inside grammatical frames (see template_model.py)."""
    if not tm or not tm.usable(niche):
        return {}
    page = tm.page(niche, rng, want)
    keep = {"hero_heading": ("hero_heading",), "tagline": ("tagline", "cta_text"), "about": ("about",), "features": ("features",)}
    return {k: page[k] for slot in slots if slot in keep for k in keep[slot]}


def _learned(model, niche, rng, want, slots):
    """Slots written by the trained n-gram model; any slot it cannot fill acceptably is left out."""
    if not model or niche not in model.d["niches"]:
        return {}
    out, used = {}, []

    def gen(slot, lo, hi, kind):
        # sentences must use only general or niche-core words; headings/CTAs are looser
        t = model.generate(niche, slot, rng, lo, hi, kind, want, banned=used, strict=(kind != "heading"))
        if t:
            used.append(t)
        return t

    if "hero_heading" in slots:
        out["hero_heading"] = gen("title", 2, 6, "heading")
    if "tagline" in slots:
        out["tagline"] = gen("sentence", 5, 12, "s")
    if "about" in slots:
        out["about"] = [" ".join(p) for p in ([gen("sentence", 8, 18, "s"), gen("sentence", 8, 18, "s")] for _ in range(2)) if all(p)]
    if "features" in slots:
        feats = []
        for _ in range(6):
            t, x = gen("feat_title", 2, 3, "heading"), gen("sentence", 6, 12, "s")
            if t and x:
                feats.append({"title": t, "text": x})
        out["features"] = feats
    if "ctas" in slots:
        out["ctas"] = model.pick_ctas(niche, rng, 2)
    return out


ALL_SLOTS = ("hero_heading", "tagline", "about", "features", "ctas")
DEFAULT_LEARNED = ("ctas", "hero_heading", "tagline", "about", "features")
NGRAM_SLOTS = ("ctas",)   # the n-gram generator is only trusted for CTAs; see ngram_model.py
GENERAL_POOL = "services solutions packages options consultations plans assessments support".split()
OWN_NAME_BANK = {"restaurant", "gym", "software", "photography", "school", "shop"}   # types that keep the original name banks


def _name(prompt, t, niche, rng):
    m = re.search(r"[\"“'‘]([^\"”'’]{2,40})[\"”'’]", prompt)
    if m:
        return m.group(1).strip(), False
    m = re.search(r"(?:called|named|name is|naam)\s+([A-Z][\w&'-]*(?:\s+[A-Z][\w&'-]*){0,3})", prompt)
    if m:
        return m.group(1).strip(), False
    if t and t["id"] not in OWN_NAME_BANK:
        bank = NICHES[niche]["name_a"] if niche in NICHES else NAME_BANK.get(niche, NAME_BANK["pro"])
        return f"{rng.choice(bank)} {t['label'].split('&')[-1].strip()}", True
    if niche in NICHES:
        d = NICHES[niche]
        return f"{rng.choice(d['name_a'])} {rng.choice(d['name_b'])}", True
    return f"{rng.choice(NAME_BANK['pro'])} Co", True


UI_EN = {
    "lang": "en", "about": "About", "faq": "FAQ", "contact": "Contact", "call": "Call", "email": "Email", "based_in": "Based in",
    "pricing": "Pricing", "testimonials": "What customers say", "team": "Our team", "hours": "Opening hours", "address": "Address",
    "where": "Where we work", "years": "Years of experience", "since": "Serving since", "features_title": "What We Offer",
    "steps_title": "How It Works", "faq_title": "Frequently Asked Questions", "rights": "All rights reserved.", "about_title": "About %s",
}
HI_FILLERS = ["विशेषज्ञ सलाह", "साफ़ जानकारी", "आसान संपर्क"]
EN_FILLERS = ["expert advice", "reliable service", "easy contact"]


def _lang_of(prompt, lang):
    if lang in ("en", "hi"):
        return lang
    letters = [c for c in prompt if c.isalpha()]
    dev = [c for c in letters if "\u0900" <= c <= "\u097f"]
    return "hi" if letters and len(dev) / len(letters) > 0.3 else "en"


def _faq(niche, items, hi=False):
    common, third, last = (hi_mod.FAQ_COMMON, hi_mod.FAQ_THIRD, hi_mod.FAQ_LAST) if hi else (FAQ_COMMON, FAQ_THIRD, FAQ_LAST)
    faq = list(common)
    if items:
        goods = niche in ("shop", "store", "restaurant")
        q, a = (hi_mod.FAQ_ITEM_GOODS if goods else hi_mod.FAQ_ITEM) if hi else ("Do you offer {item}?", "Yes, {item} is one of the things we do. Get in touch for details.")
        faq.append((q.format(item=items[0]), a.format(item=items[0])))
    faq += [third.get(niche, third["pro"]), last]
    return [{"q": q, "a": a} for q, a in faq]


def _clean_user_sections(facts):
    """Sections the user supplied (prices, reviews, team, hours, address): kept verbatim, never invented."""
    out, issues = {}, []
    for key, fields in (("prices", ("name", "price")), ("testimonials", ("name", "text")), ("team", ("name", "role"))):
        rows = facts.get(key) or []
        good = [{f: str(r[f]).strip() for f in fields if r.get(f)} for r in rows if isinstance(r, dict)]
        good = [r for r in good if len(r) == len(fields)]
        if rows and len(good) != len(rows):
            issues.append("Some '%s' entries were skipped: each needs %s." % (key, " and ".join(fields)))
        if good:
            out[key] = good
    hours = facts.get("hours")
    if isinstance(hours, (list, tuple)):
        hours = [str(h).strip() for h in hours if str(h).strip()]
    elif hours:
        hours = [str(hours).strip()]
    if hours:
        out["hours"] = hours
    for key in ("address", "whatsapp"):
        if facts.get(key):
            out[key] = str(facts[key]).strip()
    return out, issues


def generate_content(prompt, seed=None, use_model=True, learned=DEFAULT_LEARNED, facts=None, lang=None):
    """prompt (+ optional facts) -> website copy for any kind of business.

    1. detect the business type (66 listed types, English / Hinglish / Devanagari keywords); if it is not listed,
       infer the copy family from the nouns of the description;
    2. read what the user stated (place, services, audience, phone, email, years) and merge `facts`
       (name, city, services, phone, email, years, address, hours, prices, testimonials, team, whatsapp, tagline);
    3. write copy from frames. With 3+ services (or in Hindi) the copy is about the user's own phrases only; otherwise
       the type's typical offerings fill the gaps and are flagged in needs_review;
    4. add fixed blocks (highlights, steps, FAQ) that make no factual claims about the business.
    lang: 'en' / 'hi' (default: Hindi when the prompt is mostly Devanagari)."""
    rng = random.Random(seed)
    model = Model.load() if use_model else None
    facts = facts or {}
    parsed = parse_prompt(prompt)
    for k_in, k_out in (("services", "items"), ("city", "place"), ("phone", "phone"), ("email", "email"), ("years", "years"), ("audience", "audience")):
        if facts.get(k_in):
            parsed[k_out] = list(facts[k_in]) if k_out == "items" else str(facts[k_in])
    user_sections, issues = _clean_user_sections(facts)
    lang = _lang_of(prompt, lang)
    hi = lang == "hi"
    tid, conf = detect_type(prompt)
    if hi:
        hp = parse_hindi(prompt, TYPES[tid]["keys"] if tid else ())
        parsed["place"] = parsed["place"] or hp["place"]
        if not facts.get("services"):
            parsed["items"] = parsed["items"] or hp["items"]
    ui = hi_mod.UI if hi else UI_EN
    tokens = tokenize(prompt)
    t = TYPES.get(tid)
    review = list(issues)
    inferred_label = None
    if t:
        niche = t["niche"]
    else:   # unlisted type: infer the copy family from the nouns; the trained vocabulary is the last resort
        niche, inferred_label, _ = infer_kind(prompt)
        if niche:
            review.append("Business type is not in the list; the '%s' copy family was inferred from your words. Say the type (e.g. 'dental clinic') for better copy." % niche)
        elif model:
            sc = model.niche_scores(tokens)
            best = max(sorted(sc), key=lambda n: sc[n])
            niche = best if sc[best] > 2.0 else None
        if niche is None:
            niche = "pro"
            review.append("Business type was not recognised, so the copy is general. Add the type (e.g. 'dental clinic') or list your services.")
    d_niche = NICHES.get(niche)
    brand, invented = (facts["name"].strip(), False) if facts.get("name") else _name(prompt, t, niche, rng)
    if invented:
        review.append("No business name was given; '%s' is a placeholder." % brand)
    if t and conf < 3.0:
        review.append("Business type '%s' was detected with low confidence. If it is wrong, say what kind of business it is (e.g. 'dental clinic')." % t["label"])
    brand_tokens = set(tokenize(brand))
    keywords = [w for w in dict.fromkeys(tokens) if w not in brand_tokens][:6] or [niche]
    items = list(parsed["items"])
    place = parsed["place"]
    if t and t["offers"] and not facts.get("services"):   # a typical offering the prompt itself names ("... repair and accessories shop") counts as stated
        said = set(re.findall(r"[a-z]+", prompt.lower()))
        for w in t["offers"]:   # exact word match only (repair -> repairs); loose stems promoted "cleaning" to "deep cleans"
            head = w.split()[-1]
            if (head in said or head[:-1] in said or head[:-2] in said) and w not in items and not any(w in i or i in w for i in items):
                items.append(w)
        items = items[:6]
    label = (hi_mod.LABELS.get(tid, hi_mod.DEFAULT_LABEL) if hi else (t["label"] if t else (inferred_label or "Business")))
    if (not t or tid == "shop") and not items:
        items = fallback_items(prompt, place)
    real_items = list(items)
    if hi and len(items) < 3:   # Hindi pages never mix in English offerings: pad with neutral Hindi service names
        items = items + [x for x in HI_FILLERS if x not in items][:3 - len(items)]
        review.append("Few services were given, so neutral Hindi service names were added. List your own services for a better page.")
    elif not t and len(items) < 3:   # unlisted type: no guessed offerings either; neutral service names fill the page
        items = items + [x for x in EN_FILLERS if x not in items][:3 - len(items)]
        review.append("Only %d service(s) were given, so neutral service names were added. List 3 or more of your own services for a better page." % len(real_items))
    strict = hi or len(items) >= 3 or not t
    hero_items = real_items or ([label] if strict else None)   # headlines talk about real services (or the business type), never about fillers

    if strict:
        pool = None
    elif t and t["offers"]:
        common = KIND_COMMON.get(niche, []) if niche in ("care", "pro", "business", "hosting", "org") else []   # generic extras only where they are valid for any such business
        pool = t["offers"] + [w for w in common if w not in t["offers"]]
    elif not t:
        pool = KIND_NEUTRAL.get(niche) or GENERAL_POOL
    else:
        pool = None
    tm = TemplateModel.load()
    chosen = ALL_SLOTS if learned == "all" else learned
    page = tm.page(niche, rng, keywords, offers=pool, items=items, place=place, strict=strict, lang=hi_mod.LANG if hi else None, hero_items=hero_items) if (tm and niche in NICHE_KEYS) else {}
    L = _learned(model, niche, rng, set(keywords), chosen if learned == "all" else [x for x in chosen if x in NGRAM_SLOTS]) if (model and niche in NICHES and not hi) else {}
    if learned == "all" and L:
        base_feats = page["features"]
        page.update({k: v for k, v in L.items() if k in ("hero_heading", "tagline", "about", "features") and v})
        have = {f["title"].lower() for f in page["features"]}
        page["features"] = page["features"] + [f for f in base_feats if f["title"].lower() not in have][:max(0, 6 - len(page["features"]))]
    if not page:
        raise ValueError("no copy family for niche %r" % niche)
    if facts.get("tagline"):
        page["tagline"] = str(facts["tagline"]).strip()

    if not strict:
        typical = [f["title"] for f in page["features"] if f["title"].lower() not in {i.lower() for i in (title_case(x) for x in items)}]
        if typical and t and t["offers"]:
            review.append("Typical %s offerings were used for: %s. List your real services (3 or more) to replace them." % (label.lower(), ", ".join(typical)))
    if not place:
        review.append("No location was given; add a city to make the copy local.")
    if hi:
        ctas = hi_mod.CTAS.get(niche, hi_mod.CTAS["pro"])
    else:
        ctas = t["ctas"] if t else ((L.get("ctas") or ("Get Started", "Contact Us")) if L else ("Get Started", "Contact Us"))
    stats = []
    if parsed["years"]:
        m = re.search(r"\d+", parsed["years"])
        stats.append({"value": (m.group(0) + "+") if m and len(m.group(0)) <= 2 else (m.group(0) if m else parsed["years"]), "label": ui["years"] if m and len(m.group(0)) <= 2 else ui["since"]})
    if place:
        stats.append({"value": place, "label": ui["where"]})
    contact = {k: parsed[k] for k in ("phone", "email") if parsed.get(k)}
    if place:
        contact["place"] = place
    for k in ("address", "whatsapp"):
        if user_sections.get(k):
            contact[k] = user_sections[k]
    if user_sections.get("hours"):
        contact["hours"] = user_sections["hours"]
    mood = t["mood"] if t else (d_niche["mood"] if d_niche else "calm")
    eyebrow = label + (" \u00b7 " + place if place else "")
    steps = (hi_mod.STEPS if hi else STEPS).get(niche) or (hi_mod.STEPS if hi else STEPS)["pro"]
    highlights = (hi_mod.HIGHLIGHTS if hi else HIGHLIGHTS).get(niche) or (hi_mod.HIGHLIGHTS if hi else HIGHLIGHTS)["pro"]
    content = {
        "brand": brand,
        "niche": niche,
        "business_type": tid or "general",
        "type_label": label,
        "lang": lang,
        "ui": ui,
        "mood": mood,
        "keywords": keywords,
        "eyebrow": eyebrow,
        "location": place or "",
        "audience": parsed["audience"] or "",
        "hero_heading": page["hero_heading"],
        "tagline": page["tagline"],
        "about_title": ui["about_title"] % brand if "%s" in ui["about_title"] else f"{ui['about_title']} {brand}",
        "about": page["about"],
        "features_title": ui["features_title"] if hi else rng.choice(["What We Offer", "Our Services", "How We Can Help"] if niche in ("care", "pro", "business", "hosting", "org") else ["What We Offer", "Why Choose Us", "What You Get"]),
        "features": page["features"],
        "highlights": [{"title": a, "text": b} for a, b in highlights],
        "stats": stats,
        "steps_title": ui["steps_title"],
        "steps": [{"title": a, "text": b} for a, b in steps],
        "faq_title": ui["faq_title"],
        "faq": _faq(niche, items, hi),
        "contact": contact,
        "cta_primary": ctas[0],
        "cta_secondary": ctas[1],
        "cta_text": page["cta_text"],
        "cta_title": rng.choice(hi_mod.CTA_TITLES if hi else ["Ready when you are", "Let's get started", "Your next step is one click away"]),
        "footer": f"\u00a9 {brand}. {ui['rights']}",
        "generated_by": {"business_type": f"{tid} (confidence {conf:.1f})" if tid else ("inferred: %s" % niche if inferred_label else "not recognised"), "items_from_prompt": items, "place": place or "", "mode": "strict (your phrases only)" if strict else "typical offerings fill gaps", "copy": "frames + user phrases" + (" + n-gram" if learned == "all" else "")},
        "needs_review": review,
    }
    if user_sections.get("prices"):
        content["pricing"] = user_sections["prices"]
    if user_sections.get("testimonials"):
        content["testimonials"] = user_sections["testimonials"]
    if user_sections.get("team"):
        content["team"] = user_sections["team"]
    validate_content(content)
    return content


def title_case(w):
    return " ".join(x if x.isupper() else x[:1].upper() + x[1:] for x in w.split())


from .template_data import NICHE as _NICHE_FRAMES   # noqa: E402

NICHE_KEYS = set(_NICHE_FRAMES)
