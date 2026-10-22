import argparse
import json
import sys

from corecraft import pipeline


def main():
    ap = argparse.ArgumentParser(description="Core-Craft AI: one prompt -> React static website (stdlib only)")
    ap.add_argument("prompt", nargs="?", help="what the business is, e.g. 'dental clinic in Pune'")
    ap.add_argument("--seed", type=int, default=None, help="repeatable output")
    ap.add_argument("--out", default="output")
    ap.add_argument("--lang", choices=["en", "hi"], help="page language (default: Hindi for Devanagari prompts)")
    ap.add_argument("--facts", help="JSON file with real details: name, city, services[], phone, email, address, hours[], "
                                    "prices[{name,price}], testimonials[{name,text}], team[{name,role}], whatsapp, years, tagline")
    ap.add_argument("--name"), ap.add_argument("--city"), ap.add_argument("--phone"), ap.add_argument("--email")
    ap.add_argument("--services", help="comma separated list of your real services")
    a = ap.parse_args()
    prompt = a.prompt or input("Describe your business: ")
    facts = {}
    if a.facts:
        with open(a.facts, encoding="utf-8") as f:
            facts = json.load(f)
    for key in ("name", "city", "phone", "email"):
        if getattr(a, key):
            facts[key] = getattr(a, key)
    if a.services:
        facts["services"] = [x.strip() for x in a.services.split(",") if x.strip()]
    try:
        r = pipeline.run(prompt, a.out, a.seed, facts or None, a.lang)
    except ValueError as e:
        sys.exit("error: %s" % e)
    print("Brand: %s | type: %s | layout: %s" % (r["brand"], r["business_type"], r["layout"]))
    for note in r["needs_review"]:
        print("  check:", note)
    print("Generated in %s: %s" % (r["dir"], ", ".join(r["files"])))
    print("Open preview.html directly, or run: cd %s && python3 -m http.server  (for the React index.html)" % r["dir"])


if __name__ == "__main__":
    main()
