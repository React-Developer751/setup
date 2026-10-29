// How deep a page goes for each kind of business. A clinic or a repair service is visited to find one answer (what, how much, how to reach):
// a focused page with the proof near the top. A restaurant, a fashion house or a studio is visited to look around: more pictures, more to scroll.
// The parts a page may have are drawn with these chances instead of one chance for every business (generateLibraryPage.ts).
import type { ThemeKey } from './themes'

export type Depth = 'focused' | 'standard' | 'rich'
export type OptionalPart = 'stats' | 'steps' | 'gallery' | 'blog' | 'faq' | 'links'

const DEPTH_OF: Partial<Record<ThemeKey, Depth>> = {
  healthcare: 'focused', professional_services: 'focused', home_services: 'focused', education: 'focused', nonprofit: 'focused', general_business: 'focused', automotive: 'focused',
  bold_fitness: 'standard', beauty_wellness: 'standard', pets_animals: 'standard', organic_nature: 'standard', modern_tech: 'standard',
  food_dining: 'rich', fashion_retail: 'rich', luxury_minimal: 'rich', creative_studio: 'rich', travel_tourism: 'rich', real_estate: 'rich', events_wedding: 'rich', playful_vibrant: 'rich',
}

export const depthOf = (theme: ThemeKey): Depth => DEPTH_OF[theme] ?? 'standard'

const WEIGHTS: Record<Depth, Record<OptionalPart, number>> = {
  // proof and answers first: numbers, how it works, questions; pictures and articles only now and then
  focused: { stats: 0.9, steps: 0.9, faq: 0.95, gallery: 0.35, blog: 0.25, links: 0.1 },
  standard: { stats: 0.85, steps: 0.8, faq: 0.8, gallery: 0.65, blog: 0.4, links: 0.1 },
  // a page to look around in: the gallery nearly always, articles often
  rich: { stats: 0.8, steps: 0.6, faq: 0.8, gallery: 0.95, blog: 0.65, links: 0.2 },
}
/** the optional parts a page of this depth has at least (besides the ones every page has) */
const AT_LEAST: Record<Depth, number> = { focused: 3, standard: 4, rich: 5 }
/** the order in which the missing parts are added to a page that has fewer than it should */
const PRIORITY: Record<Depth, OptionalPart[]> = {
  focused: ['faq', 'steps', 'stats', 'gallery', 'blog'],
  standard: ['faq', 'stats', 'steps', 'gallery', 'blog'],
  rich: ['gallery', 'faq', 'stats', 'blog', 'steps'],
}

export const sectionWeights = (theme: ThemeKey) => WEIGHTS[depthOf(theme)]
export const atLeast = (theme: ThemeKey) => AT_LEAST[depthOf(theme)]
export const priority = (theme: ThemeKey) => PRIORITY[depthOf(theme)]
