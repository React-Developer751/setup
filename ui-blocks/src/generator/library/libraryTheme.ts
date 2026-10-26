// Re-colours the stored components WITHOUT touching their code.
// Tailblocks components only use Tailwind's `gray`, `white` and `indigo` colours, which are CSS variables
// in Tailwind v4, so redefining them on a wrapper element re-themes everything inside it.
// Preline components use semantic tokens (--background, --primary ...); dark themes also get Preline's `.dark` mode.
import type { CSSProperties } from 'react'
import { fontVars } from '../fonts'
import { onColor, type ColorMode, type Palette, type ThemeKey } from '../themes'

const mix = (a: string, percent: number, b: string) => `color-mix(in oklab, ${a} ${percent}%, ${b})`

export function libraryThemeStyle(palette: Palette, mode: ColorMode, theme?: ThemeKey) {
  const dark = mode === 'dark'
  const { bg, surface, text, accent, alt } = palette[mode]
  const onAccent = onColor(accent)
  const accentDeep = mix(accent, 86, '#000000')

  const gray = (percent: number) => mix(text, percent, bg)
  const accentScale = {
    50: mix(accent, 8, bg),
    100: mix(accent, 18, bg),
    200: mix(accent, 30, bg),
    300: mix(accent, 50, bg),
    400: mix(accent, 75, bg),
    500: accent,
    600: accentDeep,
    700: mix(accent, 72, '#000000'),
    800: mix(accent, 58, '#000000'),
    900: mix(accent, 44, '#000000'),
    950: mix(accent, 30, '#000000'),
  }

  const style: Record<string, string> = {
    // the typeface of this business type (Tailwind's font-sans / font-serif read these variables)
    ...(theme ? { ...fontVars(theme), fontFamily: Object.values(fontVars(theme))[0] } : {}),
    background: bg,
    color: text,
    // native controls (scrollbars, form fields) follow the mode
    colorScheme: mode,
    // Tailblocks components
    '--color-white': surface,
    // the light greys of cards and borders lean towards the main colour, so the page is not only black and white
    '--color-gray-50': mix(accent, 5, bg),
    '--color-gray-100': mix(accent, 10, bg),
    '--color-gray-200': mix(accent, 18, bg),
    '--g-accent': accent,
    '--g-alt': alt ?? accent,
    '--g-band': mix(accent, 7, bg),
    '--g-glow': mix(accent, 20, 'transparent'),
    '--color-gray-300': gray(24),
    '--color-gray-400': gray(42),
    '--color-gray-500': gray(56),
    '--color-gray-600': gray(70),
    '--color-gray-700': gray(80),
    '--color-gray-800': gray(90),
    '--color-gray-900': text,
    '--color-indigo-50': accentScale[50],
    '--color-indigo-100': accentScale[100],
    '--color-indigo-200': accentScale[200],
    '--color-indigo-500': accent,
    '--color-indigo-600': accentDeep,
    // Preline components
    '--background': bg,
    '--background-1': surface,
    '--background-2': surface,
    '--foreground': text,
    '--navbar': bg,
    '--layer': surface,
    '--primary': accent,
    '--primary-hover': accentDeep,
    '--primary-focus': accentDeep,
    '--primary-active': accentDeep,
    '--primary-checked': accent,
    '--primary-foreground': onAccent,
  }
  for (const [shade, value] of Object.entries(accentScale)) style[`--primary-${shade}`] = value
  // the stored components of the other kits (Meraki, Flowbite ...) use Tailwind's blue and indigo for their buttons and links: both follow the main colour
  for (const [shade, value] of Object.entries(accentScale)) {
    style[`--color-blue-${shade}`] = value
    style[`--color-indigo-${shade}`] = value
  }

  // Preline defines several tokens as `var(--color-white)` to mean "white text / white on dark".
  // `--color-white` is re-pointed at the surface colour above (for Tailblocks' `bg-white`), so pin those tokens.
  if (dark) {
    style['--layer-foreground'] = text
    style['--secondary'] = text
    style['--tooltip'] = text
    style['--destructive-foreground'] = '#ffffff'
  } else {
    for (const token of ['foreground-inverse', 'border-line-inverse', 'secondary-foreground', 'destructive-foreground', 'tooltip-foreground', 'switch']) {
      style[`--${token}`] = '#ffffff'
    }
  }

  return { style: style as CSSProperties, dark }
}
