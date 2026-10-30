// What the person's thumbs say about the generated parts (the review page /?gen=1): for every choice of every axis ("serif", "bento", "grain") how often it was in a liked part and in one that was
// not liked. With enough ratings (MIN_RATINGS) the generator draws the choices that are not disliked more often and the disliked ones less often; before that it draws as it did (a few thumbs are not
// a taste). One taste per kind of part ("hero", "features"): the thumbs of the first screens say nothing about the services part. Plain counting with a prior, no model.
type Spec = Record<string, string | number>

export type HeroRating = { id: string; up: boolean }
export const MIN_RATINGS = 20

type Counts = Record<string, Record<string, { up: number; down: number }>>
const spaces: Record<string, { counts: Counts; total: number }> = {}
const blockedIds = new Set<string>()
const space = (ns: string) => (spaces[ns] ??= { counts: {}, total: 0 })

/** the kind of part an id belongs to ("gen/Hero_x" -> "hero") */
export const kindOfId = (id: string) => id.match(/^gen\/([A-Za-z]+)_/)?.[1].toLowerCase() ?? 'hero'

/** `decode` turns the id of a part into its spec (given here so that this file and the spec files do not import each other); the ratings of other kinds of parts are ignored */
export function setHeroTaste(ratings: HeroRating[], decode: (id: string) => object | undefined, ns = 'hero'): void {
  const sp: { counts: Counts; total: number } = (spaces[ns] = { counts: {}, total: 0 })
  const perId: Record<string, { up: number; down: number }> = {}
  for (const r of ratings) {
    if (kindOfId(r.id) !== ns) continue
    const h = (perId[r.id] ??= { up: 0, down: 0 })
    if (r.up) h.up += 1
    else h.down += 1
    const spec = decode(r.id) as Spec | undefined
    if (!spec) continue
    sp.total += 1
    for (const [key, value] of Object.entries(spec)) {
      const byOption = (sp.counts[key] ??= {})
      const entry = (byOption[String(value)] ??= { up: 0, down: 0 })
      if (r.up) entry.up += 1
      else entry.down += 1
    }
  }
  // a part that was not liked at least twice, and more often than liked, is not drawn again
  for (const id of [...blockedIds]) if (kindOfId(id) === ns) blockedIds.delete(id)
  for (const [id, c] of Object.entries(perId)) if (c.down >= 2 && c.down > c.up) blockedIds.add(id)
}

export const isBlocked = (id: string) => blockedIds.has(id)
export const tasteRatings = (ns = 'hero') => space(ns).total
export const tasteActive = (ns = 'hero') => space(ns).total >= MIN_RATINGS

/**
 * How much more (above 1) or less (below 1) a choice is drawn. People like most of what they see (416 thumbs: 95% liked), so the useful signal is the DISLIKES: the dislike rate of the parts that had
 * the choice, against the dislike rate of all of them, smoothed with a prior of twelve parts (a choice seen a few times is nudged, not decided; one seen a hundred times counts). 0.35 to 1.5: nothing is
 * ever shut out and nothing takes over.
 */
export function tasteWeight(key: string, option: string | number, ns = 'hero'): number {
  if (!tasteActive(ns)) return 1
  const all = Object.values(space(ns).counts[key] ?? {})
  const downs = all.reduce((a, c) => a + c.down, 0)
  const rated = all.reduce((a, c) => a + c.up + c.down, 0)
  if (!rated) return 1
  const base = (downs + 0.5) / (rated + 1)
  const own = space(ns).counts[key]?.[String(option)] ?? { up: 0, down: 0 }
  const rate = (own.down + 12 * base) / (own.up + own.down + 12)
  return Math.max(0.35, Math.min(1.5, base / rate))
}

/** a table for people: per axis and choice, liked / not liked */
export function tasteTable(ns = 'hero'): { key: string; option: string; up: number; down: number }[] {
  return Object.entries(space(ns).counts).flatMap(([key, options]) => Object.entries(options).map(([option, c]) => ({ key, option, up: c.up, down: c.down })))
}
