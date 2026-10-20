// Pictures from the PixelMath image engine (the folder `normal` next to this project: a text-to-image generator in pure Python, see its README).
// Version 1.4 of the engine draws business props (138 of them: food, shops, doctors, tools, vehicles, buildings, animals, farm and building machines, rescue, dental, winter sports ...) in scenes (a desk, a cafe
// table, a room, a workshop, a landscape) as flat illustrations, plus sunsets, skylines, galaxies and mandalas. It does not draw photographs or brands.
// A business gets scenes about what it does: a bakery shop for a bakery, a doctor with a clinic, tools for a plumber ...
// This file decides WHICH scenes (a plan per business type, using only words the engine knows); the picture itself is fetched through the
// server of this project (server/index.mjs, /api/ai-image) and kept as a small JPEG inside the page (see edit/imageAiClient.ts).
import scenes from '../data/imageScenes.json'
import blocklist from '../data/imageBlocklist.json'
import { hash } from './random'
import type { ThemeKey } from './themes'

export type Scene = { prompt: string; width: number; height: number; seed: number; /** other scenes of the same business, for a redraw when this one does not work out */ alt?: string[] }
export type ScenePlan = { hero: Scene; about: Scene; gallery: Scene[]; /** the scenes were written for this very niche (pest control, tailor ...): they are trusted as they are */ fromNiche?: boolean }

type SceneSet = { hero: string[]; about: string; gallery: string[] }
const THEME_SCENES = scenes.themes as unknown as Record<ThemeKey, SceneSet>
const NICHE_SCENES = scenes.niches as unknown as Record<string, SceneSet>

const SIZES = { hero: [1024, 640], about: [800, 600], tile: [640, 480] } as const
const BLOCKED = new Set((blocklist as { blocked: string[] }).blocked)
/** the prompts the engine draws badly (learned from the checks of earlier sites) are left out, unless nothing else is left */
const usable = (list: string[]) => (list.some((p) => !BLOCKED.has(p)) ? list.filter((p) => !BLOCKED.has(p)) : list)
const make = (prompt: string, kind: keyof typeof SIZES, index: number, alt: string[] = []): Scene => ({ prompt, width: SIZES[kind][0], height: SIZES[kind][1], seed: (hash(`${prompt}|${index}`) % 997) + 1, alt: alt.filter((p) => p !== prompt && !BLOCKED.has(p)).slice(0, 3) })

/**
 * Which scenes a business gets. A niche (pest control, bakery, tailor ...) has scenes of its own (src/data/imageScenes.json: its tools,
 * its shop, its people); other businesses get the scenes of their business type. The same prompt gives the same scenes; another variation
 * starts from another headline scene and another seed.
 */
export function scenePlan(theme: ThemeKey, niche: string | undefined, variation = 0): ScenePlan {
  const own = niche ? NICHE_SCENES[niche] : undefined
  const base = THEME_SCENES[theme] ?? THEME_SCENES.general_business
  const set = own ?? base
  const heroes = usable(set.hero)
  const hero = heroes[variation % heroes.length]
  const seen = new Set([hero])
  const about = usable([set.about, ...base.hero, base.about]).find((p) => !seen.has(p)) ?? base.about
  seen.add(about)
  // six different gallery scenes: the set's own first, the business type's after them when something repeats
  const pool = usable([...set.gallery, ...base.gallery, ...base.hero])
  const gallery = pool.filter((p) => !seen.has(p) && !!seen.add(p)).slice(0, 6)
  const spare = pool.filter((p) => !gallery.includes(p) && p !== hero && p !== about)
  return { hero: make(hero, 'hero', variation, [...heroes, ...spare]), about: make(about, 'about', variation, [...usable(base.hero), ...spare]), gallery: gallery.map((p, i) => make(p, 'tile', i + variation, spare)), ...(own ? { fromNiche: true } : {}) }
}

/** every scene of every business type and niche (for the checks) */
export const allScenePrompts = () => [...new Set([...Object.values(THEME_SCENES), ...Object.values(NICHE_SCENES)].flatMap((set) => [...set.hero, set.about, ...set.gallery]))]

/** the address on this project's server that returns the picture of a scene */
export const sceneUrl = (scene: Scene) => `/api/ai-image?prompt=${encodeURIComponent(scene.prompt)}&width=${scene.width}&height=${scene.height}&seed=${scene.seed}`
