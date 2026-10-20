// The main AI directs the image AI: it reads the business out of the prompt with the engine's own eyes (what the engine can draw of it, its /parse answer),
// and makes sure the pictures show that business. A scene plan made from the business TYPE alone can miss ("yoga studio" got a salon, "coffee roastery"
// a tractor); every scene whose props have nothing to do with the business is replaced by a scene made of the props the business itself asked for.
import type { ScenePlan, Scene } from '../imageAi'
import type { ParseAnswer } from './imageCheck'

export type Parse = (text: string) => Promise<ParseAnswer | undefined>

/** props that appear in many prompts without saying what the business is */
const GENERIC = new Set(['shop', 'plant', 'square', 'circle', 'star', 'city', 'worker', 'person', 'tiles', 'tile', 'abstract', 'grass', 'tree', 'house', 'sun', 'moon', 'cloud', 'road', 'sea'])

/** the business words of a prompt: without the brand name ("called Iron Pulse"), the place ("in Pune") and capitalised names */
export function businessText(prompt: string): string {
  const head = prompt.split(/\b(?:called|named)\b/i)[0].split(/\s+(?:in|at|near|from|of)\s+(?=[A-Z])/)[0]
  return head
    .split(/\s+/)
    .filter((w, i) => i === 0 || !/^[A-Z][\p{L}&'-]*$/u.test(w))
    .join(' ')
    .replace(/[^\p{L}\p{N} ,.'-]+/gu, ' ')
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

export async function directPlan(prompt: string, plan: ScenePlan, parse: Parse): Promise<Directed> {
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
    if (await shows(scene, props, parse)) return scene
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
