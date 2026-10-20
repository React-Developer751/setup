// What the person says about the pictures (a thumb up or down on each one) is the real teacher of the main AI:
//   - a picture with a thumb up: for this kind of business the same scene (with the same seed, so the very same picture) is used first next time
//   - a picture with a thumb down: that scene is not used again for this business, and a prompt that gets thumbs down again and again is left out for everyone
// Everything here is plain data in, plain data out. The server database (image-ratings.jsonl) is shared by all browsers; localStorage is the cache and the fallback.
import type { Scene, ScenePlan } from '../imageAi'
import { businessText } from './imageDirector'

export type Liked = { prompt: string; seed: number }
export type RatingStore = {
  /** the scenes liked for a business, latest first */
  liked: Record<string, Liked[]>
  /** the prompts that were turned down for a business */
  disliked: Record<string, string[]>
  /** thumbs per prompt over all businesses */
  votes: Record<string, { up: number; down: number }>
}

export const emptyRatings = (): RatingStore => ({ liked: {}, disliked: {}, votes: {} })

/** "Create a website for a yoga studio called Zen Flow in Pune" and "yoga studio Zen Flow" are the same kind of business */
export function businessKey(prompt: string): string {
  return businessText(prompt)
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .join(' ')
}

const MAX_KEEP = 8

export function rate(store: RatingStore, key: string, scene: Pick<Scene, 'prompt' | 'seed'>, liked: boolean): RatingStore {
  const votes = { ...store.votes }
  const v = votes[scene.prompt] ?? { up: 0, down: 0 }
  votes[scene.prompt] = liked ? { ...v, up: v.up + 1 } : { ...v, down: v.down + 1 }
  const likedList = (store.liked[key] ?? []).filter((l) => l.prompt !== scene.prompt)
  const dislikedList = (store.disliked[key] ?? []).filter((p) => p !== scene.prompt)
  return {
    liked: { ...store.liked, [key]: liked ? [{ prompt: scene.prompt, seed: scene.seed }, ...likedList].slice(0, MAX_KEEP) : likedList },
    disliked: { ...store.disliked, [key]: liked ? dislikedList : [scene.prompt, ...dislikedList].slice(0, 20) },
    votes,
  }
}

/** prompts that were turned down again and again, by different sites */
export const blockedByRatings = (store: RatingStore): string[] =>
  Object.entries(store.votes)
    .filter(([, v]) => v.down >= 3 && v.down > v.up * 2)
    .map(([prompt]) => prompt)

/** the liked scenes of this business take the first places (with their seed), a disliked scene is swapped for another one of the plan */
export function applyRatings(plan: ScenePlan, store: RatingStore, key: string): { plan: ScenePlan; used: number; swapped: number } {
  const liked = store.liked[key] ?? []
  const disliked = new Set(store.disliked[key] ?? [])
  const globallyBlocked = new Set(blockedByRatings(store))
  const bad = (p: string) => disliked.has(p) || globallyBlocked.has(p)
  let used = 0
  let swapped = 0
  const slots: Scene[] = [plan.hero, plan.about, ...plan.gallery]
  const taken = new Set<string>()
  const next = slots.map((slot, i) => {
    const pick = liked[i]
    if (pick && !taken.has(pick.prompt)) {
      taken.add(pick.prompt)
      used += 1
      return { ...slot, prompt: pick.prompt, seed: pick.seed }
    }
    return slot
  })
  const result = next.map((slot) => {
    if (!bad(slot.prompt)) return slot
    const other = (slot.alt ?? []).find((p) => !bad(p) && !taken.has(p))
    if (!other) return slot
    taken.add(other)
    swapped += 1
    return { ...slot, prompt: other, alt: [slot.prompt, ...(slot.alt ?? []).filter((p) => p !== other)].slice(0, 3) }
  })
  return { plan: { ...plan, hero: result[0], about: result[1], gallery: result.slice(2) }, used, swapped }
}

/** one thumb as the server stores it */
export type RatingEvent = { key: string; prompt: string; seed: number; liked: boolean }

/** the thumbs in the order they were given -> the store the planner reads */
export function foldRatings(events: RatingEvent[]): RatingStore {
  return events.reduce((store, e) => rate(store, e.key, { prompt: e.prompt, seed: e.seed }, e.liked), emptyRatings())
}

/** thumbs that this browser has in its cache but the server does not know yet (an old browser memory moving to the database) */
export function missingEvents(local: RatingStore, shared: RatingStore): RatingEvent[] {
  const out: RatingEvent[] = []
  for (const [key, list] of Object.entries(local.liked)) for (const l of list) if (!(shared.liked[key] ?? []).some((x) => x.prompt === l.prompt)) out.push({ key, prompt: l.prompt, seed: l.seed, liked: true })
  for (const [key, list] of Object.entries(local.disliked)) for (const p of list) if (!(shared.disliked[key] ?? []).includes(p)) out.push({ key, prompt: p, seed: 0, liked: false })
  return out
}

// ───────────── the browser's memory ─────────────
const KEY = 'ui-blocks:image-ratings'
export function loadRatings(): RatingStore {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as RatingStore | null
    return raw && raw.liked && raw.disliked && raw.votes ? raw : emptyRatings()
  } catch {
    return emptyRatings()
  }
}
export function saveRatings(store: RatingStore): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    // the memory is optional
  }
}

const post = (path: string, body: unknown) => fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), keepalive: true })

/** a thumb up or down: cached here, saved in the server database (shared by all browsers) and logged for `npm run images:learn` */
export function rateScene(prompt: string, scene: Pick<Scene, 'prompt' | 'seed'>, liked: boolean): RatingStore {
  const key = businessKey(prompt)
  const next = rate(loadRatings(), key, scene, liked)
  saveRatings(next)
  try {
    void post('/api/image-ratings', { key, prompt: scene.prompt, seed: scene.seed, liked }).catch(() => undefined)
    void post('/api/image-feedback', { prompt: scene.prompt, seed: scene.seed, attempt: 0, accepted: liked, score: liked ? 1 : 0, reasons: [`thumb ${liked ? 'up' : 'down'} for: ${key}`.slice(0, 110)], stage: 'rating' }).catch(() => undefined)
  } catch {
    // the database and the log are optional
  }
  return next
}

let synced = 0
/** the thumbs of all browsers: read from the server database into the cache (once a minute at most); thumbs only this browser knows move to the database. Without a server the cache stays as it is. */
export async function syncRatings(force = false): Promise<RatingStore> {
  const local = loadRatings()
  if (!force && Date.now() - synced < 60_000) return local
  try {
    const res = await fetch('/api/image-ratings', { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return local
    const events = ((await res.json()) as { events: (RatingEvent & { at?: string })[] }).events
    const shared = foldRatings(events)
    const extra = missingEvents(local, shared)
    await Promise.all(extra.map((e) => post('/api/image-ratings', e).catch(() => undefined)))
    const merged = extra.length ? foldRatings([...events, ...extra]) : shared
    saveRatings(merged)
    synced = Date.now()
    return merged
  } catch {
    return local
  }
}
