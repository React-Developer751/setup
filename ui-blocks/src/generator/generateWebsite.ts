// Whole pipeline: prompt -> theme -> content -> layout -> page. No AI, no API, runs in the browser.
//
// Every choice (colour palette, headline set, navbar, hero, features layout, optional sections)
// comes from a seeded random generator, so the same prompt always gives the same page, while
// different prompts - or a different `variation` number - give a different one.
import { thinkColors } from './colorBrain'
import { contentTemplates } from './contentTemplates'
import { writeContent } from './creativeBrain'
import { extractContentDetails } from './filter'
import { analyzePrompt, type Tier } from './designBrain'
import { thinkMotion, type MotionSetting } from './motionBrain'
import { generateWebsiteContent } from './finalPrompt'
import { buildLayout, compileWebsiteCode, compileWebsiteHtml, type LayoutChoice } from './finalProductionTemplate'
import { hash, seededRandom } from './random'
import { paintsFrom } from './edit/sectionColors'
import { applyChoiceEdits, applyColorEdits, applyContentEdits, filterLayout, needsLongPage, orderLayout } from './edit/applyEdits'
import { fitsFrom } from './edit/fit'
import { TARGETS, type SiteEdits } from './edit/edits'
import { decideTheme } from './themeClassifier'
import { withFont } from './fonts'
import { detectNiche } from './niche/applyNiche'
import { NICHES } from './niche/niches'
import { detectLocale } from './siteData'
import { PALETTE_COUNT, defaultMode, paletteTokensByMode, presetPalette, themes, type ThemeKey } from './themes'

/** True when this business type has hand-written template texts (the original five). */
export const hasTemplates = (theme: ThemeKey) => theme in contentTemplates

export { hash, seededRandom }

/**
 * The decisions every kind of site shares: business type, design level, colours, motion and the brand-level
 * text. A single page and a multi-page site are both built on top of this.
 *
 * `tierOverride`: force a design level; leave it out and the design brain decides from the prompt.
 * `creative`: let the copy brain write the text and the colour brain invent the palette
 * (off = the original template texts and the hand-made palettes).
 * `motionSetting`: how much the page moves; 'auto' lets the motion brain decide from the design level.
 */
export function planWebsite(
  userPrompt: string,
  variation = 0,
  tierOverride?: Tier,
  creative = true,
  motionSetting: MotionSetting = 'auto',
  /** a multi-page site needs the full text even at the normal design level */
  options: { fullContent?: boolean; edits?: SiteEdits } = {},
) {
  const edits = options.edits
  const prompt = userPrompt.trim()
  const rand = seededRandom(hash(`${prompt.toLowerCase()}|${variation}`))
  const pick = <T,>(items: readonly T[]): T => items[Math.floor(rand() * items.length)]

  // a niche ("pest control", "tattoo studio") has its own text; what the person corrected or chose wins over it
  const decision = decideTheme(prompt)
  const niche = edits?.theme || decision.source === 'correction' ? undefined : detectNiche(prompt, NICHES)
  const themeKey = edits?.theme ?? niche?.theme ?? decision.theme
  const brain = analyzePrompt(prompt, themeKey)
  const tier = edits?.tier ?? tierOverride ?? brain.tier
  const size = tier === 'normal' && !options.fullContent && !needsLongPage(edits) ? 'compact' : 'full'
  const paletteIndex = Math.floor(rand() * PALETTE_COUNT)
  const headlineVariant = Math.floor(rand() * ((contentTemplates[themeKey]?.alternatives.length ?? 0) + 1))

  // every random value is drawn in a fixed order, so switching level keeps the same look and feel
  const drawn: LayoutChoice = {
    size,
    nav: pick(['navbar-left', 'navbar-center']),
    hero: pick(['hero-split', 'hero-split-reverse', 'hero-centered']),
    features: pick(['features-cards', 'features-list', 'features-rows']),
    aboutSide: pick(['left', 'right']),
    steps: pick(['grid', 'timeline']),
    testimonials: pick(['none', 'single', 'grid', 'grid']),
    stats: rand() < 0.8,
    faq: rand() < 0.75,
    gallery: rand() < 0.7,
    team: rand() < 0.7,
    blog: rand() < 0.5,
    marquee: false,
  }
  // normal keeps it short and plain, premium switches every section on and picks the richer layouts
  const baseChoice: LayoutChoice =
    tier === 'normal'
      ? { ...drawn, hero: drawn.hero === 'hero-split-reverse' ? 'hero-split' : drawn.hero, features: 'features-cards', testimonials: 'single', stats: false, faq: false }
      : tier === 'premium'
        ? { ...drawn, hero: drawn.hero === 'hero-split-reverse' ? 'hero-split' : drawn.hero, steps: 'timeline', testimonials: 'grid', stats: true, faq: true, gallery: true, team: true, blog: true }
        : drawn

  // sections the person removed or added
  const choice = applyChoiceEdits(baseChoice, edits)

  // creative brains get their own seeded streams, so turning them on never shuffles the layout choices above
  const details = extractContentDetails(prompt, themeKey, niche?.label)
  const brand = edits?.brand ?? details.businessName
  // business types without hand-written template texts (law firm, clinic ...) always use the brains
  const useBrains = creative || !hasTemplates(themeKey)
  const copy = useBrains ? writeContent(themeKey, brand, seededRandom(hash(`${prompt.toLowerCase()}|copy|${variation}`)), false, niche ? undefined : prompt) : undefined
  const colors = useBrains ? thinkColors(prompt, themeKey, seededRandom(hash(`${prompt.toLowerCase()}|color|${variation}`))) : undefined
  const palette = applyColorEdits(colors?.palette ?? presetPalette(themeKey, paletteIndex), themeKey, edits)

  // the motion brain has its own seeded stream too; some motion needs its own sections
  const motion = thinkMotion(themeKey, tier, edits?.motion ?? motionSetting, seededRandom(hash(`${prompt.toLowerCase()}|motion|${variation}`)))
  if (size === 'full') {
    if (motion.features.marquee) choice.marquee = true
    if (motion.features.carousel && choice.testimonials !== 'none') choice.testimonials = 'carousel'
  }

  const theme = themes[themeKey]
  const tokens = withFont(paletteTokensByMode(palette), themeKey)
  const initialMode = edits?.mode ?? defaultMode(themeKey)
  const content = applyContentEdits(generateWebsiteContent(prompt, themeKey, headlineVariant, size, copy, edits?.brand, { niche, rand: seededRandom(hash(`${prompt.toLowerCase()}|niche|${variation}`)), locale: detectLocale(prompt) }), edits, detectLocale(prompt).currency)

  return {
    prompt,
    variation,
    size,
    themeKey,
    niche,
    paletteIndex,
    headlineVariant,
    choice,
    theme,
    content,
    tokens,
    initialMode,
    brain,
    tier,
    motion,
    palette,
    copy,
    brand,
    brainsForced: !creative && useBrains,
    colorReasons: colors?.reasons ?? [],
    /** what the drawn pictures are made from: different per prompt and per variation */
    visuals: { themeKey, seed: hash(`${prompt.toLowerCase()}|${variation}|art`) },
  }
}

/** A single landing page: the plan above laid out as one scrolling page. */
export function generateWebsite(
  userPrompt: string,
  variation = 0,
  tierOverride?: Tier,
  creative = true,
  motionSetting: MotionSetting = 'auto',
  /** changes the person asked for (see edit/edits.ts) */
  edits?: SiteEdits,
) {
  const plan = planWebsite(userPrompt, variation, tierOverride, creative, motionSetting, { edits })
  const { theme, content, tokens, initialMode, tier, motion, choice } = plan
  const layoutIds = orderLayout(filterLayout(buildLayout(choice), edits), edits)
  // sizes and alignments of single parts ("make the pricing section shorter")
  const fits = fitsFrom(edits, TARGETS)
  // parts with a colour of their own ("footer green")
  const paints = paintsFrom(edits, plan.palette)

  return {
    themeKey: plan.themeKey,
    /** the id of the niche pack the text comes from (pest_control, tattoo_studio ...), if the prompt names one */
    niche: plan.niche?.id,
    paletteIndex: plan.paletteIndex,
    headlineVariant: plan.headlineVariant,
    choice,
    theme,
    content,
    layoutIds,
    tokens,
    initialMode,
    brain: plan.brain,
    tier,
    motion,
    palette: plan.palette,
    copy: plan.copy,
    brainsForced: plan.brainsForced,
    colorReasons: plan.colorReasons,
    visuals: plan.visuals,
    html: compileWebsiteHtml(theme, layoutIds, content, tokens, initialMode, tier, motion, plan.visuals, paints, fits),
    code: compileWebsiteCode(theme, layoutIds, content, tokens, initialMode, tier, motion, plan.visuals, paints, fits),
  }
}
