// What the person's thumbs say about the generated first screens (the review page /?gen=1): for every choice of every axis ("serif", "bento", "grain") how often it was in a liked hero and in a
// hero that was not liked. With enough ratings (MIN_RATINGS) the generator draws liked choices more often and disliked ones less often; before that it draws as it did (a few thumbs are not a taste).
// Plain counting with a prior (a choice nobody rated stays at 1), no model.
type Spec = Record<string, string | number>

export type HeroRating = { id: string; up: boolean }
export const MIN_RATINGS = 20

type Counts = Record<string, Record<string, { up: number; down: number }>>
let counts: Counts = {}
let total = 0
let blocked = new Set<string>()

/** `decode` turns the id of a hero into its spec (heroSpec.specOfId; given here so that the two files do not import each other) */
export function setHeroTaste(ratings: HeroRating[], decode: (id: string) => object | undefined): void {
  counts = {}
  total = 0
  const perHero: Record<string, { up: number; down: number }> = {}
  for (const r of ratings) {
    const h = (perHero[r.id] ??= { up: 0, down: 0 })
    if (r.up) h.up += 1
    else h.down += 1
    const spec = decode(r.id) as Spec | undefined
    if (!spec) continue
    total += 1
    for (const [key, value] of Object.entries(spec)) {
      const entry = ((counts[key] ??= {})[String(value)] ??= { up: 0, down: 0 })
      if (r.up) entry.up += 1
      else entry.down += 1
    }
  }
  // a hero that was not liked at least twice, and more often than liked, is not drawn again
  blocked = new Set(Object.entries(perHero).filter(([, c]) => c.down >= 2 && c.down > c.up).map(([id]) => id))
}

export const isBlocked = (id: string) => blocked.has(id)

export const tasteRatings = () => total
export const tasteActive = () => total >= MIN_RATINGS

/**
 * How much more (above 1) or less (below 1) a choice is drawn. People like most of what they see (416 thumbs: 95% liked), so the useful signal is the DISLIKES: the dislike rate of the heroes that had
 * the choice, against the dislike rate of all of them, smoothed with a prior of twelve heroes (a choice seen a few times is nudged, not decided; one seen a hundred times counts). 0.35 to 1.5: nothing is ever shut out and nothing takes over.
 */
export function tasteWeight(key: string, option: string | number): number {
  if (!tasteActive()) return 1
  const all = Object.values(counts[key] ?? {})
  const downs = all.reduce((a, c) => a + c.down, 0)
  const rated = all.reduce((a, c) => a + c.up + c.down, 0)
  if (!rated) return 1
  const base = (downs + 0.5) / (rated + 1)
  const own = counts[key]?.[String(option)] ?? { up: 0, down: 0 }
  const rate = (own.down + 12 * base) / (own.up + own.down + 12)
  return Math.max(0.35, Math.min(1.5, base / rate))
}

/** a table for people: per axis and choice, liked / not liked */
export function tasteTable(): { key: string; option: string; up: number; down: number }[] {
  return Object.entries(counts).flatMap(([key, options]) => Object.entries(options).map(([option, c]) => ({ key, option, up: c.up, down: c.down })))
}

