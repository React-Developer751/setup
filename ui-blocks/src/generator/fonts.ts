// One web font per business type. The pages use Tailwind's font-sans / font-serif / font-mono; redefining those three CSS variables on the
// page changes the typeface without touching a single template. Without a network the fallback stack is used (system fonts), so the page
// never breaks. Fonts come from Google Fonts: the exports say so in their README (visitors' browsers fetch the font files from Google).
import { themes, type ThemeKey } from './themes'

type Font = { family: string; weights: string; fallback: 'sans' | 'serif' }

const FONTS: Record<ThemeKey, Font> = {
  modern_tech: { family: 'Inter', weights: '400;500;600;700', fallback: 'sans' },
  organic_nature: { family: 'Lora', weights: '400;500;600;700', fallback: 'serif' },
  bold_fitness: { family: 'Barlow', weights: '500;600;700;800', fallback: 'sans' },
  luxury_minimal: { family: 'Jost', weights: '300;400;500', fallback: 'sans' },
  playful_vibrant: { family: 'Nunito', weights: '400;600;700;800', fallback: 'sans' },
  professional_services: { family: 'Source Serif 4', weights: '400;500;600;700', fallback: 'serif' },
  healthcare: { family: 'Nunito Sans', weights: '400;600;700', fallback: 'sans' },
  food_dining: { family: 'Playfair Display', weights: '400;500;600;700', fallback: 'serif' },
  education: { family: 'Poppins', weights: '400;500;600;700', fallback: 'sans' },
  creative_studio: { family: 'Space Grotesk', weights: '400;500;600;700', fallback: 'sans' },
  general_business: { family: 'DM Sans', weights: '400;500;600;700', fallback: 'sans' },
  real_estate: { family: 'Manrope', weights: '400;500;600;700;800', fallback: 'sans' },
  travel_tourism: { family: 'Poppins', weights: '400;500;600;700', fallback: 'sans' },
  automotive: { family: 'Barlow', weights: '500;600;700;800', fallback: 'sans' },
  beauty_wellness: { family: 'Cormorant Garamond', weights: '400;500;600;700', fallback: 'serif' },
  events_wedding: { family: 'Cormorant Garamond', weights: '400;500;600;700', fallback: 'serif' },
  pets_animals: { family: 'Nunito', weights: '400;600;700;800', fallback: 'sans' },
  fashion_retail: { family: 'Jost', weights: '300;400;500;600', fallback: 'sans' },
  home_services: { family: 'DM Sans', weights: '400;500;600;700', fallback: 'sans' },
  nonprofit: { family: 'Source Serif 4', weights: '400;500;600;700', fallback: 'serif' },
}

const STACK = {
  sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
}

const fontOf = (theme: ThemeKey) => FONTS[theme] ?? FONTS.general_business

/** The CSS variable the theme's font class reads (--font-sans, --font-serif or --font-mono) and the stack to put in it. */
export function fontVars(theme: ThemeKey): Record<string, string> {
  const font = fontOf(theme)
  const cls = themes[theme]?.font ?? 'font-sans'
  const variable = cls === 'font-serif' ? '--font-serif' : cls === 'font-mono' ? '--font-mono' : '--font-sans'
  return { [variable]: `"${font.family}", ${STACK[font.fallback]}` }
}

/** the address of the font's stylesheet */
export const fontHref = (theme: ThemeKey) => {
  const font = fontOf(theme)
  return `https://fonts.googleapis.com/css2?family=${font.family.replace(/ /g, '+')}:wght@${font.weights}&display=swap`
}

/** the <link> tags for the <head> of a page */
export const fontLinks = (theme: ThemeKey) =>
  `<link rel="preconnect" href="https://fonts.googleapis.com" />\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n<link rel="stylesheet" href="${fontHref(theme)}" />`

/** the same tokens with the font added to both colour modes */
export const withFont = <T extends Record<string, string>>(tokens: Record<'light' | 'dark', T>, theme: ThemeKey) => ({
  light: { ...tokens.light, ...fontVars(theme) },
  dark: { ...tokens.dark, ...fontVars(theme) },
})


/** the families the pages of a site use: the typeface of the business type, or the one a design mood put in the tokens (`--g-font`) */
export const fontLinksFor = (theme: ThemeKey, tokens: Record<string, string> | undefined): string => {
  const family = tokens?.['--g-font']
  const weights = tokens?.['--g-font-weights']
  if (!family || !weights) return fontLinks(theme)
  const href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weights}&display=swap`
  return `<link rel="preconnect" href="https://fonts.googleapis.com" />\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n<link rel="stylesheet" href="${href}" />`
}

/** the typefaces a person can ask for by kind ("serif font", "friendly font") */
export const FONT_CHOICES: Record<string, { family: string; weights: string; fallback: 'sans' | 'serif' | 'mono'; label: string }> = {
  serif: { family: 'Playfair Display', weights: '400;500;600;700', fallback: 'serif', label: 'classic serif' },
  sans: { family: 'Inter', weights: '400;500;600;700', fallback: 'sans', label: 'clean sans-serif' },
  mono: { family: 'Space Mono', weights: '400;700', fallback: 'mono', label: 'typewriter' },
  elegant: { family: 'Cormorant Garamond', weights: '400;500;600;700', fallback: 'serif', label: 'elegant serif' },
  rounded: { family: 'Nunito', weights: '400;600;700;800', fallback: 'sans', label: 'friendly rounded' },
  display: { family: 'Orbitron', weights: '500;600;700', fallback: 'sans', label: 'futuristic display' },
}

/** the CSS variables of a chosen typeface: every font class of the page (sans, serif, mono) reads the same family */
export function fontChoiceTokens(key: string): Record<string, string> | undefined {
  const f = FONT_CHOICES[key]
  if (!f) return undefined
  const stack = f.fallback === 'serif' ? STACK.serif : f.fallback === 'mono' ? 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' : STACK.sans
  const value = `"${f.family}", ${stack}`
  return { '--font-sans': value, '--font-serif': value, '--font-mono': value, '--g-font': f.family, '--g-font-weights': f.weights }
}
