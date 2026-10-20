// The main AI directs the image AI: it reads the business out of the prompt with the engine's own eyes (what the engine can draw of it, its /parse answer),
// and makes sure the pictures show that business. A scene plan made from the business TYPE alone can miss ("yoga studio" got a salon, "coffee roastery"
// a tractor); every scene whose props have nothing to do with the business is replaced by a scene made of the props the business itself asked for.
import type { ScenePlan, Scene } from '../imageAi'
import type { ParseAnswer } from './imageCheck'

export type Parse = (text: string) => Promise<ParseAnswer | undefined>

/** props that appear in many prompts without saying what the business is */
const GENERIC = new Set(['shop', 'plant', 'square', 'circle', 'star', 'city', 'worker', 'person', 'tiles', 'tile', 'abstract', 'grass', 'tree', 'house', 'sun', 'moon', 'cloud', 'road', 'sea'])

/** words of the request itself, not of the business ("create a website for a ..."): the engine would draw a monitor for "website" */
export const FILLER = new Set(['create', 'make', 'build', 'generate', 'design', 'a', 'an', 'the', 'website', 'site', 'web', 'page', 'landing', 'for', 'my', 'our', 'me', 'i', 'need', 'want', 'new', 'and', 'with', 'please'])

/** the business words of a prompt: without the request words, the brand name ("called Iron Pulse"), the place ("in Pune") and capitalised names */
export function businessText(prompt: string): string {
  const head = prompt.split(/\b(?:called|named)\b/i)[0].split(/\s+(?:in|at|near|from|of)\s+(?=[A-Z])/)[0]
  return head
    .split(/\s+/)
    .filter((w, i) => !(i > 0 && /^[A-Z][\p{L}&'-]*$/u.test(w)) && !FILLER.has(w.toLowerCase().replace(/[^\p{L}]/gu, '')))
    .join(' ')
    .replace(/[^\p{L}\p{N} ,.'-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const unique = <T,>(list: T[]) => [...new Set(list)]
const namesOf = (a: ParseAnswer | undefined) => unique((a?.entities ?? []).map((e) => e.name))

/** the props that tell what the business is, in the order of the prompt */
export async function businessProps(prompt: string, parse: Parse): Promise<string[]> {
  const text = businessText(prompt)
  if (text.length < 3) return []
  return namesOf(await parse(text)).filter((n) => !GENERIC.has(n)).slice(0, 5)
}

export type Directed = { plan: ScenePlan; props: string[]; replaced: number; notes: string[] }

/** a scene shows the business when it draws at least one of its props */
export async function shows(scene: Scene, props: string[], parse: Parse): Promise<boolean> {
  const ents = namesOf(await parse(scene.prompt))
  return ents.some((e) => props.includes(e))
}

export async function directPlan(prompt: string, plan: ScenePlan, parse: Parse, trust: Set<string> = new Set()): Promise<Directed> {
  // the scenes of a niche were written for that niche by hand: they are not second-guessed
  if (plan.fromNiche) return { plan, props: [], replaced: 0, notes: [] }
  const props = await businessProps(prompt, parse)
  if (!props.length) return { plan, props, replaced: 0, notes: [] }
  const notes: string[] = []
  let replaced = 0
  const understood = async (p: string) => {
    const a = await parse(p)
    return !!a && namesOf(a).some((e) => props.includes(e))
  }
  const swap = async (scene: Scene, candidates: string[], why: string): Promise<Scene> => {
    if (trust.has(scene.prompt) || (await shows(scene, props, parse))) return scene
    for (const candidate of candidates) {
      if (candidate !== scene.prompt && (await understood(candidate))) {
        replaced += 1
        notes.push(`${why}: "${scene.prompt}" shows nothing of this business, so "${candidate}"`)
        return { ...scene, prompt: candidate, alt: unique([scene.prompt, ...(scene.alt ?? [])]).slice(0, 3) }
      }
    }
    return scene
  }
  const [a, b, c] = props
  const heroes = unique([b ? `${a} and ${b}` : a, a, b ? `${b} and ${a}` : undefined].filter((x): x is string => !!x))
  const abouts = unique([c ? `${b ?? a} and ${c}` : `${a} with a team`, b ? `${b} with a team` : `team with ${a}`].filter((x): x is string => !!x))
  const hero = await swap(plan.hero, heroes, 'first screen')
  const about = await swap(plan.about, abouts.filter((x) => x !== hero.prompt), 'about')
  // the first tiles of the gallery show the props one by one
  const gallery: Scene[] = []
  for (let i = 0; i < plan.gallery.length; i += 1) {
    const prop = props[i]
    gallery.push(prop && i < 3 ? await swap(plan.gallery[i], [prop], 'gallery') : plan.gallery[i])
  }
  return { plan: { hero, about, gallery, ...(plan.fromNiche ? { fromNiche: true } : {}) }, props, replaced, notes }
}

// ───────────── new scenes by mixing (mutation and crossover) ─────────────
/** the settings a scene can be put in (the engine knows the time of day and the weather of a landscape) */
export const SETTINGS = ['at sunset', 'at dawn', 'at night', 'on a sunny day', 'in the snow', 'in the mountains', 'by the sea']

const pick = <T,>(list: T[], rand: () => number) => list[Math.floor(rand() * list.length)]

/**
 * New scene prompts for a business: its props in another setting (mutation) and mixed with a prop of a scene the person liked (crossover).
 * Every candidate must pass the engine's own reading (/parse): it must draw one of the business props and know every word.
 */
export async function mashups(props: string[], parse: Parse, rand: () => number, likedProps: string[] = [], count = 5): Promise<string[]> {
  if (!props.length) return []
  const [a, b] = props
  const raw: string[] = []
  const settings = [...SETTINGS].sort(() => rand() - 0.5)
  raw.push(`${a} ${settings[0]}`)
  for (const liked of likedProps.filter((l) => !props.includes(l)).slice(0, 2)) raw.push(`${pick([a, b ?? a], rand)} and ${liked}`)
  raw.push(`${a} ${settings[1]}`)
  if (b) raw.push(`${a} and ${b} ${settings[2]}`, `${b} ${settings[3]}`)
  const ok: string[] = []
  for (const candidate of raw) {
    const answer = await parse(candidate)
    if (!answer || (answer.not_in_lexicon?.length ?? 0) > 0) continue
    if (!namesOf(answer).some((e) => props.includes(e))) continue
    if (!ok.includes(candidate)) ok.push(candidate)
    if (ok.length >= count) break
  }
  return ok
}
