// What the person's thumbs say about the generated first screens (the review page /?gen=1): for every choice of every axis ("serif", "bento", "grain") how often it was in a liked hero and in a
// hero that was not liked. With enough ratings (MIN_RATINGS) the generator draws liked choices more often and disliked ones less often; before that it draws as it did (a few thumbs are not a taste).
// Plain counting with a prior (a choice nobody rated stays at 1), no model.
type Spec = Record<string, string | number>

export type HeroRating = { id: string; up: boolean }
export const MIN_RATINGS = 20

type Counts = Record<string, Record<string, { up: number; down: number }>>
let counts: Counts = {}
let total = 0

/** `decode` turns the id of a hero into its spec (heroSpec.specOfId; given here so that the two files do not import each other) */
export function setHeroTaste(ratings: HeroRating[], decode: (id: string) => object | undefined): void {
  counts = {}
  total = 0
  for (const r of ratings) {
    const spec = decode(r.id) as Spec | undefined
    if (!spec) continue
    total += 1
    for (const [key, value] of Object.entries(spec)) {
      const entry = ((counts[key] ??= {})[String(value)] ??= { up: 0, down: 0 })
      if (r.up) entry.up += 1
      else entry.down += 1
    }
  }
}

export const tasteRatings = () => total
export const tasteActive = () => total >= MIN_RATINGS

/**
 * How much more (above 1) or less (below 1) a choice is drawn. The liked share of the heroes that had it, against the liked share of all of them, with a prior of two heroes worth
 * (a choice seen once is nudged, not decided); kept between 0.25 and 3 so that nothing is ever shut out and nothing takes over.
 */
export function tasteWeight(key: string, option: string | number): number {
  if (!tasteActive()) return 1
  const all = Object.values(counts[key] ?? {})
  const ups = all.reduce((a, c) => a + c.up, 0)
  const rated = all.reduce((a, c) => a + c.up + c.down, 0)
  if (!rated) return 1
  const base = (ups + 1) / (rated + 2)
  const own = counts[key]?.[String(option)] ?? { up: 0, down: 0 }
  const share = (own.up + 2 * base) / (own.up + own.down + 2)
  return Math.max(0.25, Math.min(3, share / base))
}

/** a table for people: per axis and choice, liked / not liked */
export function tasteTable(): { key: string; option: string; up: number; down: number }[] {
  return Object.entries(counts).flatMap(([key, options]) => Object.entries(options).map(([option, c]) => ({ key, option, up: c.up, down: c.down })))
}

