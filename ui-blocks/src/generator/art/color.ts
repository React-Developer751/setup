// Colour theory for the pictures: from one base colour the rest are worked out by a rule (complementary, analogous, triadic, split, mono),
// never picked at random. A ramp of five colours goes from deep to light, so a number between 0 and 1 can be turned into a colour.
export type RGB = readonly [number, number, number]
export type Scheme = 'complementary' | 'analogous' | 'triadic' | 'split' | 'mono'
export const SCHEMES: Scheme[] = ['complementary', 'analogous', 'triadic', 'split', 'mono']

export function hexToRgb(hex: string): RGB {
  const n = parseInt(/^#[0-9a-f]{6}$/i.test(hex) ? hex.slice(1) : '6366f1', 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function rgbToHsl([r, g, b]: RGB): { h: number; s: number; l: number } {
  const rr = r / 255
  const gg = g / 255
  const bb = b / 255
  const max = Math.max(rr, gg, bb)
  const min = Math.min(rr, gg, bb)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: l * 100 }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === rr ? (gg - bb) / d + (gg < bb ? 6 : 0) : max === gg ? (bb - rr) / d + 2 : (rr - gg) / d + 4
  return { h: h * 60, s: s * 100, l: l * 100 }
}

export function hslToRgb(h: number, s: number, l: number): RGB {
  const hh = (((h % 360) + 360) % 360) / 360
  const ss = Math.max(0, Math.min(100, s)) / 100
  const ll = Math.max(0, Math.min(100, l)) / 100
  if (ss === 0) return [ll * 255, ll * 255, ll * 255].map(Math.round) as unknown as RGB
  const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss
  const p = 2 * ll - q
  const f = (t: number) => {
    const x = t < 0 ? t + 1 : t > 1 ? t - 1 : t
    return x < 1 / 6 ? p + (q - p) * 6 * x : x < 1 / 2 ? q : x < 2 / 3 ? p + (q - p) * (2 / 3 - x) * 6 : p
  }
  return [f(hh + 1 / 3), f(hh), f(hh - 1 / 3)].map((v) => Math.round(v * 255)) as unknown as RGB
}

/** the hues of a scheme, counted from the base hue */
export const OFFSETS: Record<Scheme, number[]> = {
  complementary: [0, 180],
  analogous: [-30, 0, 30],
  triadic: [0, 120, 240],
  split: [0, 150, 210],
  mono: [0],
}

export type Palette = { ramp: RGB[]; ink: RGB; ink2: RGB; hues: number[] }

/** a deep-to-light ramp and two ink colours (for lines) from a base colour and a rule; `dark` keeps the whole picture deep */
export function harmony(base: string, scheme: Scheme, dark: boolean, second?: string): Palette {
  const { h, s } = rgbToHsl(hexToRgb(base))
  const hues = OFFSETS[scheme].map((o) => h + o)
  if (second && scheme === 'complementary') hues[1] = rgbToHsl(hexToRgb(second)).h
  const sat = Math.max(35, Math.min(85, s))
  const a = hues[0]
  const b = hues[hues.length > 1 ? 1 : 0]
  const c = hues[hues.length > 2 ? 2 : hues.length > 1 ? 1 : 0]
  // the base hue carries the deep and the light ends; the other hues of the rule only tint the middle, and softer, so the picture does not shout
  const soft = sat * 0.62
  const ramp: RGB[] = dark
    ? [hslToRgb(a, sat * 0.8, 8), hslToRgb(a, sat, 18), hslToRgb(b, soft, 30), hslToRgb(c, soft, 44), hslToRgb(a, sat * 0.7, 62)]
    : [hslToRgb(a, sat, 26), hslToRgb(a, sat, 42), hslToRgb(b, soft, 60), hslToRgb(c, soft * 0.9, 78), hslToRgb(a, sat * 0.5, 93)]
  const ink = dark ? hslToRgb(b, sat * 0.7, 88) : hslToRgb(a, sat, 12)
  const ink2 = dark ? hslToRgb(c, sat, 70) : hslToRgb(c, sat, 30)
  return { ramp, ink, ink2, hues }
}

/** t from 0 to 1 along the ramp */
export function rampAt(ramp: RGB[], t: number): RGB {
  const x = Math.max(0, Math.min(0.9999, t)) * (ramp.length - 1)
  const i = Math.floor(x)
  const f = x - i
  const [r1, g1, b1] = ramp[i]
  const [r2, g2, b2] = ramp[i + 1]
  return [r1 + (r2 - r1) * f, g1 + (g2 - g1) * f, b1 + (b2 - b1) * f]
}
