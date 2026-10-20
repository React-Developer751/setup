// Theme definitions for the built-in templates.
//
// Colours are CSS variables (--g-bg, --g-text, --g-accent ...) so one page can switch between a light and a
// dark palette at runtime. The Tailwind classes below point at those variables and never change; only the
// variable values differ per theme / palette / mode (see `themeTokens`).

import { fromKits, KIT_KEYS, type KitKey } from './kits'

export type ThemeKey =
  | KitKey
  | 'modern_tech'
  | 'organic_nature'
  | 'bold_fitness'
  | 'luxury_minimal'
  | 'playful_vibrant'
  | 'professional_services'
  | 'healthcare'
  | 'food_dining'
  | 'education'
  | 'creative_studio'
  | 'general_business'

export const THEME_KEYS: ThemeKey[] = [
  'modern_tech',
  'organic_nature',
  'bold_fitness',
  'luxury_minimal',
  'playful_vibrant',
  'professional_services',
  'healthcare',
  'food_dining',
  'education',
  'creative_studio',
  'general_business',
  ...KIT_KEYS,
]
export type ColorMode = 'light' | 'dark'

export type Theme = {
  bg: string
  surface: string
  border: string
  text_main: string
  text_muted: string
  accent: string
  hover_accent: string
  primary_btn: string
  secondary_btn: string
  gradient: string
  badge: string
  heading: string
  radius: string
  font: string
}

const classes = (heading: string, radius: string, font: string): Theme => ({
  bg: 'bg-(--g-bg)',
  surface: 'bg-(--g-surface)',
  border: 'border-(--g-border)',
  text_main: 'text-(--g-text)',
  text_muted: 'text-(--g-muted)',
  accent: 'text-(--g-accent)',
  hover_accent: 'hover:text-(--g-accent)',
  // --g-btn / --g-on-btn: a colour of the buttons alone ("hero button green"); without them the buttons take the accent
  primary_btn: 'bg-[var(--g-btn,var(--g-accent))] text-[var(--g-on-btn,var(--g-on-accent))] whitespace-nowrap hover:brightness-110',
  secondary_btn: 'border border-(--g-border) text-(--g-text) whitespace-nowrap hover:bg-(--g-surface)',
  gradient: 'bg-linear-to-br from-(--g-grad-a) via-(--g-grad-b) to-(--g-grad-c)',
  badge: 'bg-(--g-badge) text-(--g-accent)',
  heading,
  radius,
  font,
})

export const themes: Record<ThemeKey, Theme> = {
  modern_tech: classes('tracking-tight', 'rounded-xl', 'font-sans'),
  organic_nature: classes('tracking-tight', 'rounded-3xl', 'font-serif'),
  bold_fitness: classes('uppercase italic tracking-tighter', 'rounded-none', 'font-sans'),
  luxury_minimal: classes('font-light tracking-wide', 'rounded-sm', 'font-mono'),
  playful_vibrant: classes('tracking-tight', 'rounded-3xl', 'font-sans'),
  professional_services: classes('tracking-tight', 'rounded-lg', 'font-serif'),
  healthcare: classes('tracking-tight', 'rounded-2xl', 'font-sans'),
  food_dining: classes('tracking-tight', 'rounded-2xl', 'font-serif'),
  education: classes('tracking-tight', 'rounded-xl', 'font-sans'),
  creative_studio: classes('tracking-tighter font-black', 'rounded-lg', 'font-sans'),
  general_business: classes('tracking-tight', 'rounded-xl', 'font-sans'),
  ...fromKits((kit) => classes(kit.look.heading, kit.look.radius, kit.look.font)),
}

type Base = { bg: string; surface: string; border: string; text: string; muted: string }
type PerMode<T> = { light: T; dark: T }

export type ThemeColors = {
  /** the look the theme was designed with; the toggle switches to the other one */
  defaultMode: ColorMode
  base: PerMode<Base>
  /** three accent colours: the base theme and two alternative palettes */
  accents: [PerMode<string>, PerMode<string>, PerMode<string>]
  /** second hue used in gradients */
  alt: PerMode<string>
}

export const themeColors: Record<ThemeKey, ThemeColors> = {
  modern_tech: {
    defaultMode: 'dark',
    base: {
      dark: { bg: '#020617', surface: '#0f172a', border: '#1e293b', text: '#ffffff', muted: '#94a3b8' },
      light: { bg: '#f8fafc', surface: '#ffffff', border: '#e2e8f0', text: '#0f172a', muted: '#475569' },
    },
    accents: [
      { dark: '#818cf8', light: '#4f46e5' },
      { dark: '#22d3ee', light: '#0e7490' },
      { dark: '#34d399', light: '#047857' },
    ],
    alt: { dark: '#d946ef', light: '#c026d3' },
  },
  organic_nature: {
    defaultMode: 'light',
    base: {
      light: { bg: '#fafaf9', surface: '#ffffff', border: '#e7e5e4', text: '#1c1917', muted: '#57534e' },
      dark: { bg: '#1c1917', surface: '#292524', border: '#44403c', text: '#fafaf9', muted: '#a8a29e' },
    },
    accents: [
      { light: '#047857', dark: '#34d399' },
      { light: '#c2410c', dark: '#fb923c' },
      { light: '#4d7c0f', dark: '#a3e635' },
    ],
    alt: { light: '#f59e0b', dark: '#f59e0b' },
  },
  bold_fitness: {
    defaultMode: 'dark',
    base: {
      dark: { bg: '#0a0a0a', surface: '#171717', border: '#262626', text: '#fafafa', muted: '#a3a3a3' },
      light: { bg: '#fafafa', surface: '#ffffff', border: '#e5e5e5', text: '#0a0a0a', muted: '#525252' },
    },
    accents: [
      { dark: '#ef4444', light: '#dc2626' },
      { dark: '#f97316', light: '#c2410c' },
      { dark: '#a3e635', light: '#4d7c0f' },
    ],
    alt: { dark: '#f97316', light: '#f97316' },
  },
  luxury_minimal: {
    defaultMode: 'dark',
    base: {
      dark: { bg: '#18181b', surface: '#27272a', border: '#3f3f46', text: '#f5f5f5', muted: '#a1a1aa' },
      light: { bg: '#fafaf9', surface: '#ffffff', border: '#e4e4e7', text: '#18181b', muted: '#52525b' },
    },
    accents: [
      { dark: '#fde68a', light: '#92400e' },
      { dark: '#fecdd3', light: '#be123c' },
      { dark: '#e2e8f0', light: '#475569' },
    ],
    alt: { dark: '#a16207', light: '#d4a017' },
  },
  playful_vibrant: {
    defaultMode: 'light',
    base: {
      light: { bg: '#fefce8', surface: '#ffffff', border: '#fbcfe8', text: '#581c87', muted: '#7e22ce' },
      dark: { bg: '#2e1065', surface: '#3b0764', border: '#6b21a8', text: '#fdf4ff', muted: '#e9d5ff' },
    },
    accents: [
      { light: '#db2777', dark: '#f472b6' },
      { light: '#0369a1', dark: '#38bdf8' },
      { light: '#c2410c', dark: '#fb923c' },
    ],
    alt: { light: '#facc15', dark: '#facc15' },
  },
  professional_services: {
    defaultMode: 'light',
    base: {
      light: { bg: '#f8fafc', surface: '#ffffff', border: '#e2e8f0', text: '#0f172a', muted: '#475569' },
      dark: { bg: '#0b1220', surface: '#111a2e', border: '#1f2b45', text: '#f1f5f9', muted: '#a3b0c7' },
    },
    accents: [
      { light: '#1d4ed8', dark: '#7aa2ff' },
      { light: '#0f766e', dark: '#5eead4' },
      { light: '#9a3412', dark: '#fdba74' },
    ],
    alt: { light: '#0ea5e9', dark: '#38bdf8' },
  },
  healthcare: {
    defaultMode: 'light',
    base: {
      light: { bg: '#f7fbfc', surface: '#ffffff', border: '#d9ecef', text: '#0c2b33', muted: '#47636b' },
      dark: { bg: '#071a1f', surface: '#0d262d', border: '#1b3d46', text: '#eefafb', muted: '#9bbcc3' },
    },
    accents: [
      { light: '#0e7490', dark: '#5fd3e6' },
      { light: '#047857', dark: '#4ade9f' },
      { light: '#1d4ed8', dark: '#8fb2ff' },
    ],
    alt: { light: '#22c55e', dark: '#4ade80' },
  },
  food_dining: {
    defaultMode: 'light',
    base: {
      light: { bg: '#fffaf5', surface: '#ffffff', border: '#f1e1d2', text: '#2a1608', muted: '#6b4a33' },
      dark: { bg: '#170d07', surface: '#241710', border: '#3d291c', text: '#fdf3e9', muted: '#c4a78f' },
    },
    accents: [
      { light: '#b91c1c', dark: '#ff8a80' },
      { light: '#b45309', dark: '#fbbf24' },
      { light: '#4d7c0f', dark: '#a3e635' },
    ],
    alt: { light: '#f59e0b', dark: '#f59e0b' },
  },
  education: {
    defaultMode: 'light',
    base: {
      light: { bg: '#f8f9ff', surface: '#ffffff', border: '#e1e4fb', text: '#16183a', muted: '#4c5080' },
      dark: { bg: '#0c0e24', surface: '#14173a', border: '#262b5c', text: '#f1f2ff', muted: '#a9aee0' },
    },
    accents: [
      { light: '#4338ca', dark: '#a5acff' },
      { light: '#0369a1', dark: '#7dd3fc' },
      { light: '#be185d', dark: '#f9a8d4' },
    ],
    alt: { light: '#f59e0b', dark: '#fbbf24' },
  },
  creative_studio: {
    defaultMode: 'dark',
    base: {
      dark: { bg: '#0b0a10', surface: '#15131d', border: '#2a2638', text: '#f7f5ff', muted: '#a9a3c2' },
      light: { bg: '#faf9ff', surface: '#ffffff', border: '#e7e3f5', text: '#18142b', muted: '#58517a' },
    },
    accents: [
      { dark: '#c084fc', light: '#7e22ce' },
      { dark: '#f472b6', light: '#be185d' },
      { dark: '#facc15', light: '#a16207' },
    ],
    alt: { dark: '#22d3ee', light: '#0891b2' },
  },
  general_business: {
    defaultMode: 'light',
    base: {
      light: { bg: '#f8fafb', surface: '#ffffff', border: '#e3e8ec', text: '#10202b', muted: '#475b69' },
      dark: { bg: '#0a1218', surface: '#111d26', border: '#1f3140', text: '#eef4f8', muted: '#a2b5c3' },
    },
    accents: [
      { light: '#0369a1', dark: '#7dd3fc' },
      { light: '#15803d', dark: '#86efac' },
      { light: '#b45309', dark: '#fcd34d' },
    ],
    alt: { light: '#38bdf8', dark: '#38bdf8' },
  },
  ...fromKits((kit) => kit.colors),
}

export const PALETTE_COUNT = 3

export const defaultMode = (key: ThemeKey): ColorMode => themeColors[key].defaultMode

// WCAG relative luminance -> pick black or white text for an accent background
function luminance(hex: string) {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2)
}
// text colour (near-black or white) that has the higher contrast on the given background
export const onColor = (hex: string) => {
  const l = luminance(hex)
  const withWhite = 1.05 / (l + 0.05)
  const withBlack = (l + 0.05) / (luminance('#0a0a0a') + 0.05)
  return withBlack > withWhite ? '#0a0a0a' : '#ffffff'
}

/** One mode of a palette: the neutrals plus the accent colours. */
export type PaletteMode = Base & { accent: string; alt: string }

/** Everything the colour system needs. Presets come from `themeColors`, the colour brain makes new ones. */
export type Palette = PerMode<PaletteMode> & { name: string }

/** The hand-made palette for a theme (index 0 = base, 1..2 = alternatives). */
export function presetPalette(key: ThemeKey, paletteIndex: number): Palette {
  const colors = themeColors[key]
  const accent = colors.accents[paletteIndex % PALETTE_COUNT]
  return {
    name: `${key.replace('_', ' ')} preset ${paletteIndex % PALETTE_COUNT + 1}`,
    light: { ...colors.base.light, accent: accent.light, alt: colors.alt.light },
    dark: { ...colors.base.dark, accent: accent.dark, alt: colors.alt.dark },
  }
}

/** CSS variable values for a palette in one colour mode. */
export function paletteTokens(palette: Palette, mode: ColorMode): Record<string, string> {
  const { bg, surface, border, text, muted, accent, alt } = palette[mode]
  return {
    '--g-bg': bg,
    '--g-surface': surface,
    '--g-border': border,
    '--g-text': text,
    '--g-muted': muted,
    '--g-accent': accent,
    '--g-on-accent': onColor(accent),
    '--g-alt': alt,
    '--g-grad-a': `color-mix(in oklab, ${accent} 38%, ${bg})`,
    '--g-grad-b': surface,
    '--g-grad-c': `color-mix(in oklab, ${alt} 26%, ${bg})`,
    '--g-badge': `color-mix(in oklab, ${accent} 14%, ${bg})`,
    'color-scheme': mode,
  }
}

export const paletteTokensByMode = (palette: Palette) => ({
  light: paletteTokens(palette, 'light'),
  dark: paletteTokens(palette, 'dark'),
})
