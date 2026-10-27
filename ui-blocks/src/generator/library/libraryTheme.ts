// Re-colours the stored components WITHOUT touching their code.
// Tailblocks components only use Tailwind's `gray`, `white` and `indigo` colours, which are CSS variables
// in Tailwind v4, so redefining them on a wrapper element re-themes everything inside it.
// Preline components use semantic tokens (--background, --primary ...); dark themes also get Preline's `.dark` mode.
import type { CSSProperties } from 'react'
import { fontVars } from '../fonts'
import { contrast, hexToHsl } from '../colorBrain'
import { hslToHex, hueGap } from '../colorHarmony'
import { onColor, type ColorMode, type Palette, type ThemeKey } from '../themes'

const mix = (a: string, percent: number, b: string) => `color-mix(in oklab, ${a} ${percent}%, ${b})`

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
/** `percent` of a over b, as a hex colour (hex in, hex out: the contrast of it can be checked) */
function mixHex(a: string, percent: number, b: string): string {
  const [ra, ga, ba] = channels(a)
  const [rb, gb, bb] = channels(b)
  const m = (x: number, y: number) => Math.round(x * (percent / 100) + y * (1 - percent / 100)).toString(16).padStart(2, '0')
  return `#${m(ra, rb)}${m(ga, gb)}${m(ba, bb)}`
}
const isHex = (c: string) => /^#[0-9a-f]{6}$/i.test(c)

/** the greys of the components are tints of the text colour: each one is made strong enough to be read on the page, the cards and the tinted bands */
function readableGrey(text: string, bg: string, surfaces: string[], percent: number, minimum: number): string {
  if (![text, bg, ...surfaces].every(isHex)) return mix(text, percent, bg)
  let p = percent
  while (p < 100) {
    const c = mixHex(text, p, bg)
    if ([bg, ...surfaces].every((s) => contrast(c, s) >= minimum)) return c
    p += 2
  }
  return text
}

/** the stronger shade of the main colour (links and buttons): dark enough to be read on the page and to carry the button text */
function readableDeep(accent: string, bg: string, surface: string, dark: boolean): string {
  if (![accent, bg, surface].every(isHex)) return mix(accent, 86, '#000000')
  if (dark) {
    // on a dark page the main colour is a light one: links and buttons use it as it is, lightened when it is still too dark to be seen
    let c = accent
    for (let i = 0; i < 12 && contrast(c, bg) < 4.5; i += 1) c = mixHex('#ffffff', 10, c)
    return c
  }
  let p = 86
  let c = mixHex(accent, p, '#000000')
  while (p < 100 && (contrast(c, bg) < 4.6 || contrast(c, surface) < 4.6)) {
    p -= 4
    c = mixHex(accent, Math.max(p, 20), '#000000')
    if (p <= 20) break
  }
  return c
}

/** the main colour as a text colour: dark enough on a light page, light enough on a dark one, to be read on the page and on the cards */
function readableAccent(accent: string, bg: string, surface: string, dark: boolean): string {
  if (![accent, bg, surface].every(isHex)) return accent
  let c = accent
  for (let i = 0; i < 20 && (contrast(c, bg) < 4.6 || contrast(c, surface) < 4.6); i += 1) c = mixHex(dark ? '#ffffff' : '#000000', 6, c)
  return c
}

/** rules the Tailwind classes of the stored components cannot express: `text-white` is the colour of the cards here (see --color-white), so text on a button, on a dark panel or in dark mode is set by these */
export const LIBRARY_CSS = `img[data-avatar]{border-radius:9999px;aspect-ratio:1/1;object-fit:cover}
@media (max-width:639px){[data-role="team"] img[data-avatar]{width:8.5rem!important;height:8.5rem!important;max-width:100%;margin-inline:auto}}
[data-gen-theme].dark .text-white{color:#fff}
[data-gen-theme] :is(.bg-indigo-500,.bg-indigo-600,.bg-indigo-700,.bg-blue-500,.bg-blue-600,.bg-blue-700,.bg-primary,.bg-brand,.bg-brand-strong).text-white{color:var(--g-on-accent)}
[data-gen-theme].dark :is(.bg-gray-800,.bg-gray-900).text-white{color:var(--background)}
@media (max-width:639px){
[data-gen-theme] :is(div,form):has(> input:not([type=checkbox]):not([type=radio])):has(> :is(button,a)),[data-gen-theme] :is(div,form):has(> :is(div,label) > input:not([type=checkbox]):not([type=radio])):has(> button){flex-direction:column!important;align-items:stretch!important;gap:.5rem}
[data-gen-theme] .flex:has(> :is(div,label) > :is(input,textarea)){flex-direction:column!important;gap:.75rem}
[data-gen-theme] .grid:has(> :is(div,label) > :is(input,textarea)){grid-template-columns:minmax(0,1fr)!important}
[data-gen-theme] .flex:has(> :is(div,label) > :is(input,textarea)) > *{width:100%!important;max-width:none!important}
[data-gen-theme] :is(div,form) > input:not([type=checkbox]):not([type=radio]),[data-gen-theme] :is(div,form) > :is(div,label):has(> input){width:100%!important;min-width:0!important;max-width:none!important}
[data-gen-theme] :is(div,form):has(> input:not([type=checkbox]):not([type=radio])) > :is(button,a){width:100%!important;margin-left:0!important}
}
[data-gen-theme] [data-fx]{color:var(--fx-l)!important}
[data-gen-theme].dark [data-fx]{color:var(--fx-d,var(--fx-l))!important}`

export function libraryThemeStyle(palette: Palette, mode: ColorMode, theme?: ThemeKey) {
  const dark = mode === 'dark'
  const { bg, surface, text, accent, alt } = palette[mode]
  const onAccent = onColor(accent)
  const accentDeep = readableDeep(accent, bg, surface, dark)
  // the main colour where it is text (links, small labels) is the readable one; as a surface it is the colour itself
  const accentText = readableAccent(accent, bg, surface, dark)

  // the surfaces a grey text can sit on: the cards, the soft band of the main colour and the tinted greys (gray-50 / 100 / 200)
  const surfaces = isHex(accent) && isHex(bg) ? [surface, mixHex(accent, 7, bg), mixHex(accent, 10, bg), mixHex(accent, 18, bg)] : []
  const gray = (percent: number, minimum = 0) => (minimum ? readableGrey(text, bg, surfaces, percent, minimum) : mix(text, percent, bg))
  const accentScale = {
    50: mix(accent, 8, bg),
    100: mix(accent, 18, bg),
    200: mix(accent, 30, bg),
    300: mix(accent, 50, bg),
    400: mix(accent, 75, bg),
    500: accentText,
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
    '--g-on-accent': onColor(accentDeep),
    '--g-alt': alt ?? accent,
    '--g-band': mix(accent, 7, bg),
    '--g-glow': mix(accent, 20, 'transparent'),
    '--color-gray-300': gray(24),
    '--color-gray-400': gray(42, 4.5),
    '--color-gray-500': gray(56, 5),
    '--color-gray-600': gray(70, 7),
    '--color-gray-700': gray(80, 9),
    '--color-gray-800': gray(90, 11),
    '--color-gray-900': text,
    '--color-indigo-50': accentScale[50],
    '--color-indigo-100': accentScale[100],
    '--color-indigo-200': accentScale[200],
    '--color-indigo-500': accentText,
    '--color-indigo-600': accentDeep,
    // Preline components
    '--background': bg,
    '--background-1': surface,
    '--background-2': surface,
    '--foreground': text,
    '--navbar': bg,
    '--layer': surface,
    '--primary': accentText,
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
    // the other colour families the kits use for their buttons, links and gradients (a purple heading, a pink badge, a green tick): all follow the main colour, so the page keeps one set of colours
    for (const family of ['purple', 'violet', 'fuchsia', 'pink', 'rose', 'sky', 'cyan', 'teal', 'emerald', 'green', 'lime', 'amber', 'yellow', 'orange']) style[`--color-${family}-${shade}`] = value
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

/** the two colours the drawn pictures (maths art, initials) use: the main colour and a partner that stays quiet. A second colour far away on the colour wheel would make every picture a rainbow. */
export function artColors(accent: string, alt: string): { accent: string; alt: string } {
  if (!isHex(accent) || !isHex(alt)) return { accent, alt }
  const a = hexToHsl(accent)
  const b = hexToHsl(alt)
  if (hueGap(a.h, b.h) <= 40) return { accent, alt }
  // the same hue as the main colour, softer and lighter
  return { accent, alt: hslToHex(a.h + (b.h > a.h ? 18 : -18), Math.min(a.s, 52), a.l > 50 ? a.l - 16 : Math.min(78, a.l + 24)) }
}
