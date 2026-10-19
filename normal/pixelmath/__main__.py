"""Command line: python3 -m pixelmath "red house near a lake at sunset" -o scene.png"""
import argparse
import os
import sys
import time

from . import __version__
from .compose import MAX_SIZE, MIN_SIZE, render
from .imagefile import save
from .learn import LearnedModel, ModelError
from .tokenizer import MAX_PROMPT_CHARS


def main(argv=None):
    try:
        return _main(argv)
    except KeyboardInterrupt:
        print("\ninterrupted", file=sys.stderr)
        return 130


def _main(argv=None):
    ap = argparse.ArgumentParser(prog="pixelmath", description="Text to image, pure maths.")
    ap.add_argument("prompt", nargs="*", help="what to draw (English, Hinglish or Devanagari)")
    ap.add_argument("-o", "--output", default="output.png", help=".png or .bmp (default output.png)")
    ap.add_argument("--size", type=int, default=512, help="square size in pixels (default 512)")
    ap.add_argument("--width", type=int)
    ap.add_argument("--height", type=int)
    ap.add_argument("--seed", type=int, default=0, help="change for a different variation")
    ap.add_argument("--model", help="trained model file made by train.py")
    ap.add_argument("--learned", choices=("auto", "always", "blend", "off"), default="auto",
                    help="auto: use the model only for prompts the built-in lexicon cannot understand")
    ap.add_argument("--explain", action="store_true", help="show how the prompt was understood")
    ap.add_argument("--version", action="version", version="pixelmath " + __version__)
    args = ap.parse_args(argv)

    try:
        prompt = " ".join(args.prompt).strip() or input("Prompt: ").strip()
    except EOFError:
        prompt = ""
    if not prompt:
        ap.error("empty prompt")
    if len(prompt) > MAX_PROMPT_CHARS:
        ap.error("prompt too long (max %d characters)" % MAX_PROMPT_CHARS)
    width, height = args.width or args.size, args.height or args.size
    if not (MIN_SIZE <= width <= MAX_SIZE and MIN_SIZE <= height <= MAX_SIZE):
        ap.error("dimensions must be between %d and %d" % (MIN_SIZE, MAX_SIZE))
    ext = os.path.splitext(args.output)[1].lower()
    if ext not in (".png", ".bmp"):
        ap.error("output must end in .png or .bmp (got %r)" % (ext or args.output))

    model = None
    if args.model:
        try:
            model = LearnedModel.load(args.model)
        except ModelError as exc:
            print("pixelmath: error: %s" % exc, file=sys.stderr)
            return 1

    t0 = time.time()
    canvas, parsed, mode = render(prompt, width, height, args.seed, model, args.learned)
    try:
        nbytes = save(args.output, width, height, canvas.to_rgb_bytes())
    except OSError as exc:
        print("pixelmath: error: cannot write %s: %s" % (args.output, exc.strerror or exc), file=sys.stderr)
        return 1
    print("saved %s (%dx%d, %d bytes, mode=%s) in %.1fs" % (
        args.output, width, height, nbytes, mode, time.time() - t0))

    from .compose import text_warnings
    for note in text_warnings(parsed):
        print("note: " + note, file=sys.stderr)
    if args.explain:
        print("time:", parsed.time, "| flags:", sorted(parsed.flags))
        for e in parsed.entities:
            print("  %-6s %-10s count=%d size=%.2f color=%s pos=%s" % (
                e.kind, e.name, e.count, e.size,
                tuple(round(c, 2) for c in e.color) if e.color else None, e.position))
        if parsed.unknown_words:
            print("not in lexicon:", ", ".join(parsed.unknown_words))
        if model is not None:
            print("model knows:", ", ".join(model.known_words(prompt)) or "(none of these words)")
    if mode == "abstract" and not parsed.entities and not parsed.flags:
        hint = "" if model else " (train a model with train.py to teach it new words)"
        print("note: no known objects in this prompt, so abstract art was generated.%s" % hint,
              file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
