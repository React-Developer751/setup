// The third generator: the closing call to action (one statement and two buttons). Same method as heroSpec.ts and featuresSpec.ts: a spec of choices, rules, an id ("gen/Cta_..."), a tree, a taste of its own.
import { isBlocked, tasteWeight } from './heroTaste'

export const C_LAYOUTS = ['center', 'split', 'bar', 'card', 'giant', 'left'] as const
export const C_BGS = ['plain', 'band', 'ink', 'accent', 'glow'] as const
export const C_SIZES = ['m', 'l', 'xl', 'xxl'] as const
export const C_FONTS = ['sans', 'serif', 'display'] as const
export const C_BUTTONS = ['solid', 'outline', 'pill', 'link'] as const
export const C_DECORS = ['none', 'blob', 'grid', 'dots', 'ring', 'stripes', 'grain'] as const
export const C_RADII = [0, 12, 24, 40] as const
export const C_ARRIVES = ['none', 'rise', 'scroll'] as const
export const C_PADS = ['snug', 'roomy'] as const

export type CtaSpec = {
  layout: (typeof C_LAYOUTS)[number]
  bg: (typeof C_BGS)[number]
  size: (typeof C_SIZES)[number]
  font: (typeof C_FONTS)[number]
  button: (typeof C_BUTTONS)[number]
  decor: (typeof C_DECORS)[number]
  radius: (typeof C_RADII)[number]
  arrives: (typeof C_ARRIVES)[number]
  pad: (typeof C_PADS)[number]
}

const AXES: { key: keyof CtaSpec; options: readonly (string | number)[] }[] = [
  { key: 'layout', options: C_LAYOUTS }, { key: 'bg', options: C_BGS }, { key: 'size', options: C_SIZES }, { key: 'font', options: C_FONTS }, { key: 'button', options: C_BUTTONS },
  { key: 'decor', options: C_DECORS }, { key: 'radius', options: C_RADII }, { key: 'arrives', options: C_ARRIVES }, { key: 'pad', options: C_PADS },
]

export function cValid(s: CtaSpec): boolean {
  if (s.layout === 'bar' && (s.size === 'xl' || s.size === 'xxl')) return false
  if (s.layout === 'giant' && (s.size === 'm' || s.size === 'l')) return false
  if (s.layout === 'card' && (s.bg === 'accent' || s.bg === 'ink') && s.radius === 0) return false
  if (s.font === 'serif' && s.size === 'm') return false
  if (s.font === 'display' && s.size === 'm') return false
  if (s.bg === 'accent' && (s.decor === 'blob' || s.button === 'link')) return false
  if (s.bg === 'ink' && (s.decor === 'grain' || s.decor === 'stripes')) return false
  if (s.layout === 'bar' && s.pad === 'roomy') return false
  return true
}

function fit(s: CtaSpec): CtaSpec {
  const f = { ...s }
  if (f.layout === 'bar' && (f.size === 'xl' || f.size === 'xxl')) f.size = 'l'
  if (f.layout === 'giant' && (f.size === 'm' || f.size === 'l')) f.size = 'xl'
  if (f.layout === 'bar') f.pad = 'snug'
  if ((f.font === 'serif' || f.font === 'display') && f.size === 'm') f.size = 'l'
  return f
}

export type CtaMood = 'calm' | 'bold' | 'soft' | 'dark' | 'playful' | 'any'
const LEAN: Record<CtaMood, Partial<Record<keyof CtaSpec, (string | number)[]>>> = {
  calm: { layout: ['center', 'split', 'left', 'card'], bg: ['plain', 'band', 'glow'], size: ['m', 'l'], arrives: ['none', 'scroll'], decor: ['none', 'blob', 'grain'] },
  bold: { layout: ['giant', 'split', 'center'], bg: ['accent', 'ink', 'plain'], size: ['xl', 'xxl'], font: ['display', 'sans'], decor: ['grid', 'stripes', 'ring'] },
  soft: { radius: [24, 40], layout: ['card', 'center', 'left'], bg: ['band', 'glow', 'plain'], font: ['serif', 'sans'], button: ['pill', 'solid'], decor: ['blob', 'dots', 'grain'] },
  dark: { bg: ['ink', 'glow'], decor: ['grid', 'ring', 'dots', 'none'], arrives: ['scroll', 'rise'] },
  playful: { radius: [24, 40], bg: ['accent', 'band', 'glow'], button: ['pill', 'solid'], decor: ['dots', 'ring', 'blob', 'stripes'], font: ['display', 'sans'] },
  any: {},
}

export function randomCta(rand: () => number, mood: CtaMood = 'any', avoid: CtaSpec[] = []): CtaSpec {
  for (let attempt = 0; attempt < 400; attempt += 1) {
    const s = {} as Record<string, string | number>
    for (const { key, options } of AXES) {
      const lean = LEAN[mood][key]
      const pool = lean && rand() < 0.8 ? lean : options
      const weights = pool.map((o) => tasteWeight(key, o, 'cta'))
      let r = rand() * weights.reduce((a, b) => a + b, 0)
      let pick = pool.length - 1
      for (let i = 0; i < pool.length; i += 1) {
        r -= weights[i]
        if (r <= 0) { pick = i; break }
      }
      s[key] = pool[pick]
    }
    const spec = fit(s as unknown as CtaSpec)
    if (!cValid(spec) || isBlocked(ctaId(spec))) continue
    if (avoid.some((a) => a.layout === spec.layout && a.bg === spec.bg)) continue
    return spec
  }
  return { layout: 'center', bg: 'band', size: 'l', font: 'sans', button: 'solid', decor: 'none', radius: 24, arrives: 'none', pad: 'roomy' }
}

const HEAD = 'gen/Cta_'
export function ctaId(spec: CtaSpec): string {
  let n = 0n
  for (const { key, options } of AXES) n = n * BigInt(options.length) + BigInt(options.indexOf(spec[key] as never))
  return HEAD + n.toString(36)
}

export function decodeCta(id: string): CtaSpec | undefined {
  if (!id.startsWith(HEAD)) return undefined
  let n: bigint
  try {
    n = [...id.slice(HEAD.length)].reduce((acc, ch) => acc * 36n + BigInt(parseInt(ch, 36)), 0n)
  } catch {
    return undefined
  }
  const spec: Record<string, string | number> = {}
  for (let i = AXES.length - 1; i >= 0; i -= 1) {
    const size = BigInt(AXES[i].options.length)
    spec[AXES[i].key] = AXES[i].options[Number(n % size)]
    n /= size
  }
  return n === 0n ? (spec as unknown as CtaSpec) : undefined
}

export function ctaOfId(id: string): CtaSpec | undefined {
  const spec = decodeCta(id)
  return spec && cValid(spec) ? spec : undefined
}

export const describeCta = (s: CtaSpec) => `${s.layout}, ${s.size} ${s.font} statement, ${s.button} buttons, ${s.bg} background${s.decor === 'none' ? '' : ` with ${s.decor}`}, radius ${s.radius}, ${s.arrives === 'none' ? 'still' : s.arrives}`
