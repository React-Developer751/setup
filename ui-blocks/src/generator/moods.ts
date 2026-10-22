// Design moods: a design language as a set of RULES, not as code the generator has to think up. A mood says how colours are worked out from one hue
// (the page, the cards, the text, the accent, the second colour), which typeface, how round or sharp the shapes are, what a card or a button looks like
// (soft shadows, hard shadows, glow, thick borders) and which colour each PANEL of the page gets (hero, stats, testimonials, call to action, footer).
// The copywriting and the layout are made as before; the mood only restyles them, so a business of any kind can wear any mood.
import { rgbToHsl, hexToRgb, hslToRgb } from './art/color'
import { contrast } from './colorBrain'
import type { ThemeKey, Theme, Palette, PaletteMode, ColorMode } from './themes'
import type { Target } from './edit/edits'
import { sectionTokens, mixHex } from './edit/sectionColors'

export type MoodId = 'minimal-light' | 'minimal-dark' | 'soft-neo' | 'retro' | 'cyberpunk' | 'glass' | 'bold-contrast' | 'editorial' | 'playful-pop' | 'luxe-dark'
export type MoodChoice = MoodId | 'none'

/** how a panel of the page is coloured */
export type PanelRole = 'plain' | 'band' | 'soft-alt' | 'accent' | 'deep' | 'ink' | 'pop-alt'

type Colors = (h: number, h2: number, mode: ColorMode) => PaletteMode & { shadowD?: string; shadowL?: string }

export type Mood = {
  id: MoodId
  label: string
  blurb: string
  keywords: string[]
  mode: ColorMode
  font: { family: string; weights: string; variable: '--font-sans' | '--font-serif' | '--font-mono'; fallback: 'sans' | 'serif' | 'mono' }
  /** Tailwind classes put over the business theme's own */
  shape: { radius: string; heading: string; fontClass: string; surface: string; border: string; primary: string; secondary: string }
  colors: Colors
  /** what the panels look like: the first screen, the footer, the call to action, the stats, and how the other panels alternate */
  roles: { hero: PanelRole; footer: PanelRole; cta: PanelRole; stats: PanelRole; testimonials: PanelRole; rhythm: PanelRole[] }
  /** business types this mood suits best (weight 1 to 3) */
  affinity: Partial<Record<ThemeKey, number>>
}

/** the hue for a page tint: the second hue, but within 40 degrees of the main one (a pale blue page around a green tea cafe was the case that showed it) */
const nearHue = (h: number, h2: number) => h + Math.max(-40, Math.min(40, ((h2 - h + 540) % 360) - 180))
const hsl = (h: number, s: number, l: number) => `#${hslToRgb(h, s, l).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`

/** lightness of the accent moves until text on it and the accent on the page both read well */
function readable(accent: string, bg: string, surface: string): string {
  const { h, s, l } = rgbToHsl(hexToRgb(accent))
  let light = l
  const dark = rgbToHsl(hexToRgb(bg)).l < 50
  const bestOn = (c: string) => (contrast('#ffffff', c) >= contrast('#0a0a0a', c) ? '#ffffff' : '#0a0a0a')
  let out = accent
  for (let i = 0; i < 40 && Math.min(contrast(out, bg), contrast(out, surface), contrast(bestOn(out), out)) < 4.5; i += 1) {
    light += dark ? 2 : -2
    out = hsl(h, s, Math.max(14, Math.min(88, light)))
  }
  return out
}

const finish = (c: PaletteMode): PaletteMode => {
  const accent = readable(c.accent, c.bg, c.surface)
  const muted = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].reduce((m) => (Math.min(contrast(m, c.bg), contrast(m, c.surface)) >= 4.5 ? m : mixHex(c.text, 100, m)), c.muted)
  return { ...c, accent, muted: contrast(muted, c.bg) >= 4.5 ? muted : mixHex(c.text, 82, c.bg) }
}

// ───────────── the ten moods ─────────────
export const MOODS: Mood[] = [
  {
    id: 'minimal-light',
    label: 'Minimal',
    blurb: 'Quiet, light, lots of air, one calm accent.',
    keywords: ['minimal', 'minimalist', 'scandinavian', 'मिनिमल'],
    mode: 'light',
    font: { family: 'Inter', weights: '400;500;600;700', variable: '--font-sans', fallback: 'sans' },
    shape: { radius: 'rounded-lg', heading: 'tracking-tight font-semibold', fontClass: 'font-sans', surface: '', border: '', primary: '', secondary: '' },
    colors: (h, h2, mode) => finish(mode === 'light' ? { bg: hsl(h, 14, 98), surface: '#ffffff', border: hsl(h, 12, 90), text: hsl(h, 28, 9), muted: hsl(h, 10, 36), accent: hsl(h, 72, 42), alt: hsl(h2, 52, 46) } : { bg: hsl(h, 16, 8), surface: hsl(h, 14, 12), border: hsl(h, 12, 22), text: hsl(h, 14, 95), muted: hsl(h, 10, 66), accent: hsl(h, 80, 66), alt: hsl(h2, 60, 62) }),
    roles: { hero: 'plain', footer: 'ink', cta: 'accent', stats: 'plain', testimonials: 'plain', rhythm: ['plain', 'band'] },
    affinity: { modern_tech: 2, healthcare: 2, professional_services: 2, general_business: 3, education: 2, real_estate: 2, luxury_minimal: 2, nonprofit: 2 },
  },
  {
    id: 'minimal-dark',
    label: 'Minimal dark',
    blurb: 'Near-black pages, soft grey cards, one bright accent.',
    keywords: ['minimal dark', 'dark minimal', 'dark and minimal', 'sleek dark'],
    mode: 'dark',
    font: { family: 'Inter', weights: '400;500;600;700', variable: '--font-sans', fallback: 'sans' },
    shape: { radius: 'rounded-lg', heading: 'tracking-tight font-semibold', fontClass: 'font-sans', surface: '', border: '', primary: '', secondary: '' },
    colors: (h, h2, mode) => finish(mode === 'dark' ? { bg: hsl(h, 14, 6), surface: hsl(h, 12, 10), border: hsl(h, 10, 19), text: hsl(h, 10, 95), muted: hsl(h, 8, 64), accent: hsl(h, 82, 66), alt: hsl(h2, 60, 62) } : { bg: hsl(h, 14, 97), surface: '#ffffff', border: hsl(h, 12, 88), text: hsl(h, 28, 9), muted: hsl(h, 10, 36), accent: hsl(h, 72, 40), alt: hsl(h2, 52, 44) }),
    roles: { hero: 'deep', footer: 'ink', cta: 'accent', stats: 'band', testimonials: 'plain', rhythm: ['plain', 'band'] },
    affinity: { modern_tech: 3, bold_fitness: 2, automotive: 2, creative_studio: 2, luxury_minimal: 2, general_business: 1, fashion_retail: 2 },
  },
  {
    id: 'soft-neo',
    label: 'Soft (neumorphism)',
    blurb: 'One soft surface; cards and buttons are pressed out of it with gentle shadows.',
    keywords: ['neumorphism', 'neumorphic', 'neomorphism', 'neomorphic', 'soft ui', 'soft shadows'],
    mode: 'light',
    font: { family: 'Nunito', weights: '400;600;700;800', variable: '--font-sans', fallback: 'sans' },
    shape: {
      radius: 'rounded-3xl',
      heading: 'tracking-tight font-bold',
      fontClass: 'font-sans',
      surface: 'shadow-[8px_8px_18px_var(--g-shadow-d),-8px_-8px_18px_var(--g-shadow-l)]',
      border: 'border-transparent',
      primary: 'shadow-[6px_6px_14px_var(--g-shadow-d),-6px_-6px_14px_var(--g-shadow-l)]',
      secondary: 'shadow-[5px_5px_12px_var(--g-shadow-d),-5px_-5px_12px_var(--g-shadow-l)] border-transparent',
    },
    colors: (h, h2, mode) => ({ ...finish(mode === 'light' ? { bg: hsl(h, 16, 91), surface: hsl(h, 16, 91), border: hsl(h, 14, 88), text: hsl(h, 24, 20), muted: hsl(h, 12, 36), accent: hsl(h, 60, 46), alt: hsl(h2, 50, 56) } : { bg: hsl(h, 14, 15), surface: hsl(h, 14, 15), border: hsl(h, 12, 18), text: hsl(h, 14, 92), muted: hsl(h, 10, 68), accent: hsl(h, 70, 66), alt: hsl(h2, 55, 62) }), shadowD: mode === 'light' ? hsl(h, 18, 78) : hsl(h, 16, 9), shadowL: mode === 'light' ? hsl(h, 30, 99) : hsl(h, 12, 21) }),
    roles: { hero: 'plain', footer: 'plain', cta: 'plain', stats: 'plain', testimonials: 'plain', rhythm: ['plain'] },
    affinity: { healthcare: 3, beauty_wellness: 3, education: 2, pets_animals: 2, general_business: 1, nonprofit: 2, home_services: 1 },
  },
  {
    id: 'retro',
    label: 'Retro',
    blurb: 'Cream paper, thick outlines, hard offset shadows, a typewriter feel.',
    keywords: ['retro', 'vintage', 'old school', 'old-school', 'nostalgic', 'रेट्रो'],
    mode: 'light',
    font: { family: 'Space Mono', weights: '400;700', variable: '--font-mono', fallback: 'mono' },
    shape: {
      radius: 'rounded-md',
      heading: 'uppercase tracking-wider font-black',
      fontClass: 'font-mono',
      surface: 'shadow-[4px_4px_0_var(--g-border)]',
      border: 'border-2 border-(--g-border)',
      primary: 'border-2 border-(--g-border) shadow-[3px_3px_0_var(--g-border)]',
      secondary: 'border-2 shadow-[3px_3px_0_var(--g-border)]',
    },
    colors: (h, h2, mode) => finish(mode === 'light' ? { bg: hsl(42, 62, 91), surface: hsl(44, 70, 97), border: hsl(22, 45, 22), text: hsl(22, 50, 14), muted: hsl(24, 30, 32), accent: hsl(h, 72, 42), alt: hsl(h2, 66, 48) } : { bg: hsl(24, 30, 10), surface: hsl(24, 26, 15), border: hsl(40, 60, 70), text: hsl(42, 55, 90), muted: hsl(40, 25, 68), accent: hsl(h, 76, 62), alt: hsl(h2, 66, 60) }),
    roles: { hero: 'soft-alt', footer: 'ink', cta: 'accent', stats: 'pop-alt', testimonials: 'band', rhythm: ['plain', 'band', 'plain', 'soft-alt'] },
    affinity: { food_dining: 3, creative_studio: 2, automotive: 2, fashion_retail: 2, events_wedding: 1, playful_vibrant: 2, general_business: 1 },
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk',
    blurb: 'Night-black, neon lines and glow, sharp corners, a machine typeface.',
    keywords: ['cyberpunk', 'neon', 'futuristic', 'sci-fi', 'scifi', 'synthwave', 'cyber', 'हैकर', 'साइबरपंक'],
    mode: 'dark',
    font: { family: 'Orbitron', weights: '500;600;700', variable: '--font-sans', fallback: 'sans' },
    shape: {
      radius: 'rounded-none',
      heading: 'uppercase tracking-widest font-bold',
      fontClass: 'font-sans',
      surface: 'shadow-[0_0_24px_color-mix(in_oklab,var(--g-accent)_22%,transparent)]',
      border: 'border-(--g-accent)/60',
      primary: 'shadow-[0_0_22px_color-mix(in_oklab,var(--g-accent)_60%,transparent)]',
      secondary: 'border-(--g-accent)/70 shadow-[0_0_16px_color-mix(in_oklab,var(--g-accent)_30%,transparent)]',
    },
    colors: (h, h2, mode) => finish(mode === 'dark' ? { bg: hsl(255, 45, 6), surface: hsl(255, 38, 10), border: hsl(h, 70, 32), text: hsl(190, 40, 93), muted: hsl(220, 22, 68), accent: hsl(h, 100, 64), alt: hsl(h2, 100, 62) } : { bg: hsl(255, 30, 96), surface: '#ffffff', border: hsl(h, 60, 70), text: hsl(255, 50, 12), muted: hsl(255, 18, 36), accent: hsl(h, 90, 40), alt: hsl(h2, 90, 44) }),
    roles: { hero: 'deep', footer: 'ink', cta: 'accent', stats: 'pop-alt', testimonials: 'band', rhythm: ['plain', 'band'] },
    affinity: { modern_tech: 3, bold_fitness: 2, automotive: 3, creative_studio: 3, playful_vibrant: 1, education: 1 },
  },
  {
    id: 'glass',
    label: 'Glass',
    blurb: 'A deep colourful backdrop with frosted, see-through cards.',
    keywords: ['glassmorphism', 'glass', 'frosted', 'translucent'],
    mode: 'dark',
    font: { family: 'Poppins', weights: '400;500;600;700', variable: '--font-sans', fallback: 'sans' },
    shape: {
      radius: 'rounded-2xl',
      heading: 'tracking-tight font-semibold',
      fontClass: 'font-sans',
      surface: 'backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.25)]',
      border: 'border-white/20',
      primary: 'backdrop-blur-sm shadow-[0_6px_24px_color-mix(in_oklab,var(--g-accent)_35%,transparent)]',
      secondary: 'backdrop-blur-sm border-white/25',
    },
    colors: (h, h2, mode) => finish(mode === 'dark' ? { bg: hsl(h, 55, 13), surface: hsl(h, 40, 22), border: hsl(h, 40, 40), text: hsl(h, 20, 97), muted: hsl(h, 20, 78), accent: hsl(h2, 90, 68), alt: hsl(h, 85, 62) } : { bg: hsl(h, 60, 90), surface: hsl(h, 60, 97), border: hsl(h, 40, 80), text: hsl(h, 50, 14), muted: hsl(h, 20, 34), accent: hsl(h, 80, 40), alt: hsl(h2, 80, 46) }),
    roles: { hero: 'deep', footer: 'ink', cta: 'accent', stats: 'soft-alt', testimonials: 'band', rhythm: ['plain', 'soft-alt'] },
    affinity: { modern_tech: 3, beauty_wellness: 2, travel_tourism: 2, creative_studio: 2, real_estate: 2, events_wedding: 1, healthcare: 1 },
  },
  {
    id: 'bold-contrast',
    label: 'Bold',
    blurb: 'Loud flat colour, black outlines, hard shadows, huge type.',
    keywords: ['brutalist', 'brutalism', 'bold', 'loud', 'high contrast'],
    mode: 'light',
    font: { family: 'Space Grotesk', weights: '500;600;700', variable: '--font-sans', fallback: 'sans' },
    shape: {
      radius: 'rounded-none',
      heading: 'uppercase font-black tracking-tighter',
      fontClass: 'font-sans',
      surface: 'shadow-[6px_6px_0_var(--g-text)]',
      border: 'border-2 border-(--g-text)',
      primary: 'border-2 border-(--g-text) shadow-[4px_4px_0_var(--g-text)]',
      secondary: 'border-2 border-(--g-text) shadow-[4px_4px_0_var(--g-text)]',
    },
    colors: (h, h2, mode) => finish(mode === 'light' ? { bg: hsl(nearHue(h, h2), 100, 95), surface: '#ffffff', border: '#111111', text: '#111111', muted: '#3a3a3a', accent: hsl(h, 92, 46), alt: hsl(h2, 92, 52) } : { bg: '#0d0d0d', surface: '#1a1a1a', border: '#f4f4f4', text: '#f4f4f4', muted: '#bdbdbd', accent: hsl(h, 95, 62), alt: hsl(h2, 95, 60) }),
    roles: { hero: 'accent', footer: 'ink', cta: 'pop-alt', stats: 'pop-alt', testimonials: 'soft-alt', rhythm: ['plain', 'accent', 'plain', 'pop-alt'] },
    affinity: { bold_fitness: 3, creative_studio: 3, fashion_retail: 2, playful_vibrant: 2, automotive: 2, education: 1 },
  },
  {
    id: 'editorial',
    label: 'Editorial',
    blurb: 'A magazine: serif headlines, warm paper, thin rules, restrained colour.',
    keywords: ['editorial', 'magazine', 'elegant', 'classic', 'refined', 'sophisticated'],
    mode: 'light',
    font: { family: 'Fraunces', weights: '400;500;600;700', variable: '--font-serif', fallback: 'serif' },
    shape: { radius: 'rounded-sm', heading: 'font-medium tracking-tight', fontClass: 'font-serif', surface: '', border: 'border-(--g-border)', primary: '', secondary: '' },
    colors: (h, h2, mode) => finish(mode === 'light' ? { bg: hsl(40, 28, 96), surface: hsl(40, 34, 99), border: hsl(36, 18, 82), text: hsl(30, 18, 10), muted: hsl(30, 10, 34), accent: hsl(h, 52, 32), alt: hsl(h2, 42, 40) } : { bg: hsl(30, 14, 8), surface: hsl(30, 12, 12), border: hsl(34, 12, 24), text: hsl(40, 24, 93), muted: hsl(36, 12, 66), accent: hsl(h, 55, 66), alt: hsl(h2, 45, 62) }),
    roles: { hero: 'plain', footer: 'ink', cta: 'deep', stats: 'plain', testimonials: 'band', rhythm: ['plain', 'band'] },
    affinity: { professional_services: 3, luxury_minimal: 3, food_dining: 2, real_estate: 2, events_wedding: 3, beauty_wellness: 2, nonprofit: 2, fashion_retail: 2 },
  },
  {
    id: 'playful-pop',
    label: 'Playful pop',
    blurb: 'Bright, bouncy, chunky shadows, round shapes, a friendly typeface.',
    keywords: ['playful', 'cute', 'bubbly', 'cheerful', 'fun', 'मजेदार'],
    mode: 'light',
    font: { family: 'Fredoka', weights: '400;500;600;700', variable: '--font-sans', fallback: 'sans' },
    shape: {
      radius: 'rounded-3xl',
      heading: 'font-bold tracking-tight',
      fontClass: 'font-sans',
      surface: 'shadow-[0_6px_0_var(--g-border)]',
      border: 'border-2 border-(--g-border)',
      primary: 'shadow-[0_5px_0_color-mix(in_oklab,var(--g-accent)_60%,black)]',
      secondary: 'border-2 shadow-[0_4px_0_var(--g-border)]',
    },
    colors: (h, h2, mode) => finish(mode === 'light' ? { bg: hsl(nearHue(h, h2), 100, 96), surface: '#ffffff', border: hsl(h, 70, 80), text: hsl(h, 55, 16), muted: hsl(h, 25, 36), accent: hsl(h, 92, 50), alt: hsl(h2, 92, 56) } : { bg: hsl(h, 45, 12), surface: hsl(h, 40, 18), border: hsl(h, 50, 34), text: hsl(h, 30, 96), muted: hsl(h, 25, 74), accent: hsl(h, 95, 68), alt: hsl(h2, 90, 64) }),
    roles: { hero: 'soft-alt', footer: 'ink', cta: 'accent', stats: 'pop-alt', testimonials: 'soft-alt', rhythm: ['plain', 'band', 'soft-alt'] },
    affinity: { playful_vibrant: 3, education: 3, pets_animals: 3, food_dining: 2, events_wedding: 2, nonprofit: 1, beauty_wellness: 1 },
  },
  {
    id: 'luxe-dark',
    label: 'Luxe dark',
    blurb: 'Warm black, champagne accents, wide-spaced light lettering.',
    keywords: ['luxury', 'luxe', 'high-end', 'high end', 'opulent', 'लग्जरी'],
    mode: 'dark',
    font: { family: 'Cormorant Garamond', weights: '400;500;600;700', variable: '--font-serif', fallback: 'serif' },
    shape: { radius: 'rounded-sm', heading: 'font-light tracking-widest uppercase', fontClass: 'font-serif', surface: '', border: 'border-(--g-border)', primary: 'tracking-widest uppercase', secondary: 'tracking-widest uppercase' },
    colors: (h, h2, mode) => finish(mode === 'dark' ? { bg: hsl(30, 16, 6), surface: hsl(30, 13, 10), border: hsl(h, 32, 28), text: hsl(40, 28, 92), muted: hsl(36, 14, 66), accent: hsl(h, 48, 64), alt: hsl(h2, 40, 58) } : { bg: hsl(36, 24, 95), surface: hsl(36, 28, 98), border: hsl(h, 22, 78), text: hsl(30, 20, 10), muted: hsl(30, 10, 34), accent: hsl(h, 50, 34), alt: hsl(h2, 40, 38) }),
    roles: { hero: 'deep', footer: 'ink', cta: 'deep', stats: 'plain', testimonials: 'band', rhythm: ['plain', 'band'] },
    affinity: { luxury_minimal: 3, fashion_retail: 3, real_estate: 3, events_wedding: 2, beauty_wellness: 2, automotive: 2, food_dining: 1, travel_tourism: 1 },
  },
]

export const MOOD_IDS = MOODS.map((m) => m.id)

/** words that mean a mood only when "style", "look" or "mood" is said with them (they mean other things too) */
export const AMBIGUOUS_MOOD_WORDS = new Set(['bold', 'loud', 'glass', 'fun', 'classic', 'elegant', 'minimal', 'refined', 'sophisticated', 'colourful', 'colorful', 'cheerful', 'cyber', 'blur'])
export const moodById = (id: string | undefined): Mood | undefined => MOODS.find((m) => m.id === id)

// ───────────── choosing a mood ─────────────
/** a mood the person named in the prompt ("a cyberpunk gym website") */
export function moodFromText(text: string): Mood | undefined {
  const lower = text.toLowerCase()
  // the longer keyword wins ("minimal dark" before "minimal")
  const hits = MOODS.flatMap((m) => m.keywords.filter((k) => new RegExp(`(?<![\\p{L}])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}])`, 'iu').test(lower)).map((k) => ({ mood: m, length: k.length })))
  return hits.sort((a, b) => b.length - a.length)[0]?.mood
}

/** what the words of the prompt say about the look: moods they suit (more likely) and moods that would clash with them (very unlikely) */
const PROMPT_LOOK: { words: RegExp; suit: MoodId[]; avoid: MoodId[] }[] = [
  { words: /(?<![a-z])(?:yoga|spa|meditation|wellness|ayurved\w*|clinic|dental|dentist|hospital|doctor|therapy|physio\w*|pharmacy|salon|skincare|beauty)(?![a-z])/i, suit: ['soft-neo', 'minimal-light', 'editorial', 'glass'], avoid: ['cyberpunk', 'bold-contrast', 'retro'] },
  { words: /(?<![a-z])(?:wedding|bridal|bride|jewel\w*|boutique|couture|fashion|perfume|watch|luxury)(?![a-z])/i, suit: ['luxe-dark', 'editorial', 'minimal-light'], avoid: ['cyberpunk', 'playful-pop', 'bold-contrast'] },
  { words: /(?<![a-z])(?:kids?|child\w*|toys?|nursery|daycare|playschool|preschool|pets?|dogs?|cats?|puppy|candy|ice\s*cream)(?![a-z])/i, suit: ['playful-pop', 'soft-neo'], avoid: ['cyberpunk', 'luxe-dark', 'minimal-dark'] },
  { words: /(?<![a-z])(?:school|tuition|coaching|institute|academy|college|classes|university|ielts|courses?)(?![a-z])/i, suit: ['minimal-light', 'soft-neo', 'editorial', 'glass'], avoid: ['cyberpunk', 'bold-contrast', 'retro', 'luxe-dark', 'playful-pop'] },
  { words: /(?<![a-z])(?:gym|fitness|crossfit|boxing|sports?|cricket|football|martial|bike|motorcycle|garage|automotive|racing)(?![a-z])/i, suit: ['cyberpunk', 'bold-contrast', 'minimal-dark'], avoid: ['soft-neo', 'editorial'] },
  { words: /(?<![a-z])(?:tech|software|saas|startup|app|ai|crypto|gaming|games?|cyber|developer|coding)(?![a-z])/i, suit: ['cyberpunk', 'glass', 'minimal-dark', 'minimal-light'], avoid: ['retro', 'playful-pop'] },
  { words: /(?<![a-z])(?:law|lawyer|legal|advocate|attorney|consult\w*|accountant|finance|insurance|bank|ca\s+firm|tax)(?![a-z])/i, suit: ['editorial', 'minimal-light', 'minimal-dark'], avoid: ['playful-pop', 'cyberpunk', 'bold-contrast'] },
  { words: /(?<![a-z])(?:bakery|cafe|coffee|restaurant|diner|pizza|burger|sweets?|mithai|dhaba|bar|brewery|food|kitchen)(?![a-z])/i, suit: ['retro', 'editorial', 'playful-pop'], avoid: ['cyberpunk'] },
  { words: /(?<![a-z])(?:temple|mandir|church|funeral|memorial|ngo|charity|trust)(?![a-z])/i, suit: ['editorial', 'minimal-light'], avoid: ['cyberpunk', 'bold-contrast', 'playful-pop', 'retro'] },
]

/**
 * The mood of a site: the one named in the prompt, else one that suits the business type, chosen among the best few by the creativity temperature
 * (safe = none, the business type's own look; balanced = a mood most of the time; wild = always a mood).
 */
const LOUD_MOODS = new Set<MoodId>(['cyberpunk', 'bold-contrast', 'playful-pop', 'retro'])

export function chooseMood(prompt: string, theme: ThemeKey, rand: () => number, temp: number): Mood | undefined {
  const named = moodFromText(prompt)
  if (named) return named
  if (temp < 0.3) return undefined
  if (rand() > 0.55 + temp * 0.45) return undefined
  // a roulette wheel: the moods that suit the business have bigger slices; the higher the temperature, the flatter the slices
  const look = PROMPT_LOOK.filter((l) => l.words.test(prompt))
  const slices = MOODS.map((m) => {
    let w = (0.06 + (m.affinity[theme] ?? 0) / 3) ** (1 / (0.25 + temp))
    // a mood the business type has no affinity with (cyberpunk for a school, retro for a clinic) is rare, even when the creativity is high
    if ((m.affinity[theme] ?? 0) < 2) w *= 0.1
    for (const l of look) w *= l.suit.includes(m.id) ? 3 : l.avoid.includes(m.id) ? 0.04 : 1
    // the loud moods need a reason in the words (a gym, a toy shop, a game): a plain "portfolio" or "school" gets a calm look, unless the creativity is wild
    if (LOUD_MOODS.has(m.id) && temp < 0.8 && !look.some((l) => l.suit.includes(m.id))) w *= 0.12
    return { mood: m, weight: w }
  })
  let pick = rand() * slices.reduce((a, b) => a + b.weight, 0)
  for (const s of slices) {
    pick -= s.weight
    if (pick <= 0) return s.mood
  }
  return slices[0].mood
}

// ───────────── applying a mood ─────────────
const bothModes = <T,>(make: (mode: ColorMode) => T) => ({ light: make('light'), dark: make('dark') })

/** the palette of a mood from a base hue (the unique hue the colour planner chose) and a second hue */
export function moodPalette(mood: Mood, hue: number, altHue0: number, baseName = '', trustAlt = false): { palette: Palette; tokens: Record<ColorMode, Record<string, string>> } {
  // the second colour stays within 70 degrees of the first (a neighbour, not a clash): neon green on a maroon page was the case that showed it
  const gap = ((altHue0 - hue + 540) % 360) - 180
  // (a pair that was chosen by a designer, curated or premium, keeps its second hue: "Emerald and Gold" must not turn into emerald and olive; colorHarmony.ts quietens it if it is loud)
  const altHue = trustAlt && mood.id !== 'glass' ? altHue0 : hue + Math.sign(gap || 1) * Math.min(70, Math.max(25, Math.abs(gap)))
  const made = bothModes((mode) => mood.colors(hue, altHue, mode))
  const strip = (c: ReturnType<Colors>): PaletteMode => ({ bg: c.bg, surface: c.surface, border: c.border, text: c.text, muted: c.muted, accent: c.accent, alt: c.alt })
  const palette: Palette = { name: baseName ? `${mood.label}: ${baseName}` : `${mood.label}: hue ${Math.round(hue)}`, light: strip(made.light), dark: strip(made.dark) }
  const extra = (c: ReturnType<Colors>): Record<string, string> => (c.shadowD ? { '--g-shadow-d': c.shadowD, '--g-shadow-l': c.shadowL ?? '#ffffff' } : {})
  return { palette, tokens: { light: extra(made.light), dark: extra(made.dark) } }
}

/** the business theme's classes with the mood's shapes put over them */
export function moodTheme(theme: Theme, mood: Mood): Theme {
  const s = mood.shape
  return {
    ...theme,
    radius: s.radius,
    heading: s.heading,
    font: s.fontClass,
    surface: s.surface ? `${theme.surface} ${s.surface}` : theme.surface,
    border: s.border ? `${theme.border} ${s.border}` : theme.border,
    primary_btn: s.primary ? `${theme.primary_btn} ${s.primary}` : theme.primary_btn,
    secondary_btn: s.secondary ? `${theme.secondary_btn} ${s.secondary}` : theme.secondary_btn,
  }
}

const STACKS = {
  sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  serif: 'ui-serif, Georgia, Cambria, "Times New Roman", serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
}
/** the CSS variable of the typeface of the mood */
export const moodFontVars = (mood: Mood): Record<string, string> => ({ [mood.font.variable]: `"${mood.font.family}", ${STACKS[mood.font.fallback]}` })

// ───────────── the colour of each panel ─────────────
/** the background colour a role gives a panel, from the palette of the mode the page starts in */
export function roleColor(role: PanelRole, p: PaletteMode, alt = false): string | undefined {
  switch (role) {
    case 'plain': return undefined
    case 'band': return mixHex(p.accent, 9, p.bg)
    case 'soft-alt': return mixHex(p.alt, 14, p.bg)
    case 'accent': return p.accent
    case 'pop-alt': return alt ? p.alt : mixHex(p.accent, 22, p.bg)
    case 'deep': return mixHex(p.accent, 20, rgbToHsl(hexToRgb(p.bg)).l < 50 ? '#050508' : '#12121a')
    case 'ink': return rgbToHsl(hexToRgb(p.bg)).l < 50 ? mixHex(p.accent, 12, '#030305') : mixHex(p.accent, 16, '#0d0d14')
  }
}

/**
 * Which panel gets which colour: the mood's rules for the first screen, the footer, the call to action, the stats and the reviews, and its rhythm
 * for all the others (every second panel a little different), in the order the panels have on the page.
 */
export function panelColors(mood: Mood, layoutIds: string[], palette: Palette, mode: ColorMode, targetOf: (id: string) => Target | undefined): Partial<Record<Target, string>> {
  const p = palette[mode]
  const out: Partial<Record<Target, string>> = {}
  let rhythm = 0
  let altFlip = false
  for (const id of layoutIds) {
    const target = targetOf(id)
    if (!target || target === 'header') continue
    let role: PanelRole
    if (target === 'hero') role = mood.roles.hero
    else if (target === 'footer') role = mood.roles.footer
    else if (target === 'cta') role = mood.roles.cta
    else if (target === 'stats') role = mood.roles.stats
    else if (target === 'testimonials') role = mood.roles.testimonials
    else if (target === 'contact') role = 'plain'
    else role = mood.roles.rhythm[rhythm++ % mood.roles.rhythm.length]
    altFlip = !altFlip
    const color = roleColor(role, p, altFlip)
    if (color) out[target] = color
  }
  return out
}

export { sectionTokens }
