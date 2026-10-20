// What the person says about the pictures (a thumb up or down on each one) is the real teacher of the main AI:
//   - a picture with a thumb up: for this kind of business the same scene (with the same seed, so the very same picture) is used first next time
//   - a picture with a thumb down: that scene is not used again for this business, and a prompt that gets thumbs down again and again is left out for everyone
// Everything here is plain data in, plain data out (the browser wrapper below keeps it in localStorage).
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

/** a thumb up or down: remembered here, and sent to the server (image-feedback.jsonl) for `npm run images:learn` */
export function rateScene(prompt: string, scene: Pick<Scene, 'prompt' | 'seed'>, liked: boolean): RatingStore {
  const next = rate(loadRatings(), businessKey(prompt), scene, liked)
  saveRatings(next)
  try {
    void fetch('/api/image-feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: scene.prompt, seed: scene.seed, attempt: 0, accepted: liked, score: liked ? 1 : 0, reasons: [`thumb ${liked ? 'up' : 'down'} for: ${businessKey(prompt)}`.slice(0, 110)], stage: 'rating' }), keepalive: true }).catch(() => undefined)
  } catch {
    // the log is optional
  }
  return next
}
