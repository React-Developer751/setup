// Motion brain: decides HOW the page moves, the same way the colour brain decides how it looks.
//
//   style  : picked from the business type (luxury = slow and elegant, fitness = quick and punchy,
//            playful = bouncy, professional = barely there)
//   level  : picked from the design level (normal = subtle, better = rich, premium = rich + extras)
//            or forced from the UI
//   extras : what exactly animates at that level
//
// The result is a plain JSON object ("plan"). The templates read it to decide which attributes to add, and
// the runtime (motionRuntime.ts) reads it for timings. It is seeded, so a prompt always moves the same way.
import { fromKits } from './kits'
import type { Tier } from './designBrain'
import type { ThemeKey } from './themes'

export type MotionSetting = 'auto' | 'off' | 'subtle' | 'rich'
export type MotionLevel = 'off' | 'subtle' | 'rich'
export type MotionStyle = 'smooth' | 'elegant' | 'gentle' | 'punchy' | 'bouncy' | 'minimal' | 'bold'

export type MotionFeatures = {
  /** sections, headings and cards fade / slide in while scrolling */
  reveal: boolean
  /** cards lift, buttons press */
  hover: boolean
  /** FAQ answers slide open */
  accordion: boolean
  /** numbers count up */
  countUp: boolean
  /** floating blobs and a slowly moving gradient in the hero */
  blobs: boolean
  /** light sweep across the main button */
  shimmer: boolean
  /** the steps timeline draws itself */
  draw: boolean
  /** the navigation shrinks and gets a shadow after scrolling */
  navShrink: boolean
  /** scrolling keyword strip */
  marquee: boolean
  /** testimonials rotate by themselves */
  carousel: boolean
  /** the hero headline appears word by word */
  split: boolean
  /** thin scroll progress bar */
  progress: boolean
  // the effects below were added with the business-type recipes (all optional: a plan saved before them has none)
  /** pictures zoom slowly when the pointer is over their card */
  imageZoom?: boolean
  /** the first picture drifts very slowly (a long, gentle zoom) */
  kenburns?: boolean
  /** the first picture moves a little slower than the page */
  parallax?: boolean
  /** cards tilt towards the pointer */
  tilt?: boolean
  /** a soft light follows the pointer over the cards */
  spotlight?: boolean
  /** the main buttons lean towards the pointer */
  magnetic?: boolean
  /** cards and buttons wiggle when touched */
  wiggle?: boolean
}

/** the ways a part can arrive while scrolling (data-reveal in the CSS) */
export type RevealKind = 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade' | 'blur' | 'mask'

export type MotionPlan = {
  level: MotionLevel
  style: MotionStyle
  /** milliseconds */
  duration: number
  easing: string
  /** pixels a revealed element travels */
  distance: number
  /** milliseconds between cards */
  stagger: number
  features: MotionFeatures
  /** the arrivals this business uses, in turn from one part of the page to the next (a plan saved before the recipes has none: 'up') */
  mix?: RevealKind[]
  /** the name of the recipe ("elegant", "energetic" ...), for the person to read */
  recipe?: string
  reasons: string[]
}

const STYLE_BY_THEME: Record<ThemeKey, { style: MotionStyle; duration: number; easing: string; distance: number; stagger: number }> = {
  modern_tech: { style: 'smooth', duration: 500, easing: 'cubic-bezier(.22,1,.36,1)', distance: 18, stagger: 70 },
  luxury_minimal: { style: 'elegant', duration: 1000, easing: 'cubic-bezier(.16,1,.3,1)', distance: 14, stagger: 140 },
  organic_nature: { style: 'gentle', duration: 800, easing: 'cubic-bezier(.25,.8,.25,1)', distance: 20, stagger: 110 },
  bold_fitness: { style: 'punchy', duration: 420, easing: 'cubic-bezier(.2,.9,.2,1)', distance: 30, stagger: 55 },
  playful_vibrant: { style: 'bouncy', duration: 650, easing: 'cubic-bezier(.34,1.56,.64,1)', distance: 26, stagger: 90 },
  professional_services: { style: 'minimal', duration: 550, easing: 'ease-out', distance: 12, stagger: 80 },
  healthcare: { style: 'gentle', duration: 700, easing: 'cubic-bezier(.25,.8,.25,1)', distance: 14, stagger: 90 },
  food_dining: { style: 'gentle', duration: 700, easing: 'cubic-bezier(.22,1,.36,1)', distance: 20, stagger: 100 },
  education: { style: 'smooth', duration: 600, easing: 'cubic-bezier(.22,1,.36,1)', distance: 16, stagger: 80 },
  creative_studio: { style: 'bold', duration: 700, easing: 'cubic-bezier(.7,0,.2,1)', distance: 36, stagger: 80 },
  general_business: { style: 'minimal', duration: 550, easing: 'ease-out', distance: 12, stagger: 80 },
  ...fromKits((kit) => kit.motion),
}

/**
 * A motion recipe per kind of business: what arrives how, and which extras the kind can carry. A clinic arrives calmly, a gym punches in,
 * a restaurant lingers on its pictures, a studio plays. `subtle` is what every level has; `rich` and `premium` add on top of it.
 */
type Recipe = {
  name: string
  mix: RevealKind[]
  subtle: Partial<MotionFeatures>
  rich: Partial<MotionFeatures>
  premium: Partial<MotionFeatures>
}
const RECIPES: Record<string, Recipe> = {
  elegant: { name: 'elegant', mix: ['blur', 'fade', 'mask', 'up'], subtle: { imageZoom: true }, rich: { kenburns: true, parallax: true, shimmer: true, navShrink: true, draw: true }, premium: { split: true, progress: true, carousel: true } },
  energetic: { name: 'energetic', mix: ['left', 'right', 'scale', 'up'], subtle: { imageZoom: true }, rich: { countUp: true, shimmer: true, navShrink: true, magnetic: true, draw: true }, premium: { tilt: true, marquee: true, split: true, progress: true } },
  playful: { name: 'playful', mix: ['scale', 'up', 'left', 'right'], subtle: { wiggle: true }, rich: { blobs: true, shimmer: true, countUp: true, navShrink: true, magnetic: true }, premium: { marquee: true, carousel: true, split: true } },
  calm: { name: 'calm', mix: ['up', 'fade', 'left', 'up'], subtle: { imageZoom: true }, rich: { countUp: true, navShrink: true, draw: true }, premium: { carousel: true, progress: true, spotlight: true } },
  appetite: { name: 'appetite', mix: ['up', 'mask', 'fade', 'scale'], subtle: { imageZoom: true }, rich: { kenburns: true, parallax: true, shimmer: true, navShrink: true, draw: true }, premium: { carousel: true, marquee: true, split: true } },
  tech: { name: 'tech', mix: ['up', 'blur', 'scale', 'right'], subtle: { spotlight: true }, rich: { countUp: true, blobs: true, shimmer: true, navShrink: true, magnetic: true, draw: true }, premium: { tilt: true, split: true, progress: true, marquee: true } },
  creative: { name: 'creative', mix: ['mask', 'up', 'left', 'blur'], subtle: { imageZoom: true }, rich: { parallax: true, kenburns: true, magnetic: true, navShrink: true }, premium: { split: true, marquee: true, spotlight: true, tilt: true, progress: true } },
  wander: { name: 'wander', mix: ['fade', 'up', 'mask', 'scale'], subtle: { imageZoom: true }, rich: { kenburns: true, parallax: true, countUp: true, navShrink: true, draw: true }, premium: { carousel: true, split: true, progress: true } },
}
/** which recipe a business type uses (the type of the prompt decides: see themes.ts) */
const RECIPE_OF: Record<string, keyof typeof RECIPES> = {
  luxury_minimal: 'elegant', fashion_retail: 'elegant', events_wedding: 'elegant', beauty_wellness: 'elegant',
  bold_fitness: 'energetic', automotive: 'energetic', home_services: 'energetic',
  playful_vibrant: 'playful', pets_animals: 'playful',
  healthcare: 'calm', professional_services: 'calm', general_business: 'calm', nonprofit: 'calm', education: 'calm', organic_nature: 'calm',
  food_dining: 'appetite',
  modern_tech: 'tech',
  creative_studio: 'creative',
  travel_tourism: 'wander', real_estate: 'wander',
}

/** the recipe (the kind of feel) of a business type: motion and the taste of the page both start from it */
export const archetypeOf = (theme: string): string => RECIPE_OF[theme] ?? 'calm'

const NONE: MotionFeatures = {
  reveal: false, hover: false, accordion: false, countUp: false, blobs: false, shimmer: false,
  draw: false, navShrink: false, marquee: false, carousel: false, split: false, progress: false,
}

export function thinkMotion(theme: ThemeKey, tier: Tier, setting: MotionSetting, rand: () => number, bold = false): MotionPlan {
  const base = STYLE_BY_THEME[theme] ?? STYLE_BY_THEME.general_business
  const reasons: string[] = []

  // 1) level: forced from the UI, or decided from the design level
  const level: MotionLevel = setting === 'auto' ? (tier === 'normal' ? 'subtle' : 'rich') : setting
  reasons.push(
    setting === 'auto'
      ? `${tier} design level -> ${level} motion`
      : `motion set to ${setting} by you`,
  )

  // 2) what moves at that level: the arrivals and the hover of every page, then the extras of the recipe of this kind of business
  // a prompt that asks to stand out gets the showy recipe where the business type would otherwise move calmly
  const key = RECIPE_OF[theme] ?? 'calm'
  const recipe = RECIPES[bold && key === 'calm' ? 'creative' : key]
  const features: MotionFeatures =
    level === 'off'
      ? NONE
      : {
          reveal: true,
          hover: true,
          accordion: true,
          countUp: false,
          blobs: false,
          shimmer: false,
          draw: false,
          navShrink: false,
          marquee: false,
          carousel: false,
          split: false,
          progress: false,
          ...recipe.subtle,
          // the extras of the recipe: the rich level has its own, the premium design level the showy ones as well
          ...(level === 'rich' ? recipe.rich : {}),
          ...(level === 'rich' && (tier === 'premium' || bold) ? recipe.premium : {}),
        }
  if (level !== 'off') reasons.push(`${base.style} style fits the ${theme.replace('_', ' ')} theme`)
  if (level !== 'off') reasons.push(`${recipe.name} recipe: parts arrive by ${recipe.mix.slice(0, level === 'rich' ? 4 : 3).join(', ')}${Object.entries(features).filter(([key, on]) => on && !['reveal', 'hover', 'accordion'].includes(key)).length ? `; also ${Object.entries(features).filter(([key, on]) => on && !['reveal', 'hover', 'accordion'].includes(key)).map(([key]) => key).join(', ')}` : ''}`)

  // 3) a little seeded variation so two pages of one theme do not move identically
  const jitter = 0.9 + rand() * 0.2
  return {
    level,
    style: base.style,
    duration: Math.round(base.duration * jitter),
    easing: base.easing,
    distance: base.distance,
    stagger: base.stagger,
    features,
    // a quiet page keeps three arrivals, a rich one all four
    mix: recipe.mix.slice(0, level === 'rich' ? 4 : 3),
    recipe: recipe.name,
    reasons,
  }
}

/** Motion that is switched off completely (used by tests and as a safe default). */
export const noMotion = (): MotionPlan => ({
  level: 'off', style: 'minimal', duration: 500, easing: 'ease-out', distance: 12, stagger: 80, features: NONE, reasons: ['motion off'],
})
