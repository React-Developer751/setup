// The second generator of the design program: the services part (the cards or rows under "What we offer"). Like the first screen (heroSpec.ts) it is described by a SPEC and written from it:
// how the services are laid out, what a card looks like, how it is marked (a number, a letter, a bar), whether it has a picture, how it answers a hover, how it arrives when it is scrolled to.
// The spec is encoded in the id ("gen/Features_..."); the same id is always the same part.
import { isBlocked, tasteWeight } from './heroTaste'

export const F_LAYOUTS = ['grid-3', 'grid-2', 'rows', 'bento', 'zigzag', 'columns', 'strip', 'split'] as const
export const F_CARDS = ['flat', 'bordered', 'filled', 'shadow', 'accent'] as const
export const F_MARKERS = ['number', 'letter', 'dot', 'bar', 'none'] as const
export const F_IMAGES = ['none', 'top', 'side'] as const
export const F_HOVERS = ['none', 'lift', 'border', 'tint'] as const
export const F_ARRIVES = ['none', 'rise', 'scroll'] as const
export const F_RADII = [0, 10, 20, 32] as const
export const F_HEADS = ['left', 'center'] as const
export const F_SIZES = ['m', 'l', 'xl'] as const
export const F_FONTS = ['sans', 'serif', 'display'] as const
export const F_BGS = ['plain', 'band', 'ink', 'accent'] as const
export const F_GAPS = ['tight', 'airy'] as const

export type FeaturesSpec = {
  layout: (typeof F_LAYOUTS)[number]
  card: (typeof F_CARDS)[number]
  marker: (typeof F_MARKERS)[number]
  image: (typeof F_IMAGES)[number]
  hover: (typeof F_HOVERS)[number]
  arrives: (typeof F_ARRIVES)[number]
  radius: (typeof F_RADII)[number]
  head: (typeof F_HEADS)[number]
  size: (typeof F_SIZES)[number]
  font: (typeof F_FONTS)[number]
  bg: (typeof F_BGS)[number]
  gap: (typeof F_GAPS)[number]
}

const AXES: { key: keyof FeaturesSpec; options: readonly (string | number)[] }[] = [
  { key: 'layout', options: F_LAYOUTS }, { key: 'card', options: F_CARDS }, { key: 'marker', options: F_MARKERS }, { key: 'image', options: F_IMAGES }, { key: 'hover', options: F_HOVERS }, { key: 'arrives', options: F_ARRIVES },
  { key: 'radius', options: F_RADII }, { key: 'head', options: F_HEADS }, { key: 'size', options: F_SIZES }, { key: 'font', options: F_FONTS }, { key: 'bg', options: F_BGS }, { key: 'gap', options: F_GAPS },
]

/** what does not work out: a row list and a strip need no card frame of their own to be told apart; a serif is never a small heading; a picture needs a layout that has room for it */
export function fValid(s: FeaturesSpec): boolean {
  if (s.image === 'side' && !(s.layout === 'rows' || s.layout === 'zigzag' || s.layout === 'split')) return false
  if (s.image === 'top' && (s.layout === 'rows' || s.layout === 'columns' || s.layout === 'zigzag' || s.layout === 'split')) return false
  if (s.layout === 'zigzag' && s.image !== 'side') return false
  if (s.layout === 'rows' && (s.card === 'shadow' || s.card === 'filled') && s.radius === 0) return false
  if (s.layout === 'columns' && (s.card !== 'flat' || s.marker === 'none')) return false
  if (s.layout === 'bento' && (s.card === 'flat' || s.image === 'side')) return false
  if (s.font === 'serif' && s.size === 'm') return false
  if (s.bg === 'accent' && (s.card === 'accent' || s.card === 'filled')) return false
  if ((s.bg === 'ink' || s.bg === 'accent') && s.card === 'shadow') return false
  if (s.marker === 'bar' && s.card === 'accent') return false
  if (s.arrives === 'rise' && s.hover === 'lift') return false
  return true
}

function fit(s: FeaturesSpec): FeaturesSpec {
  const f = { ...s }
  if (f.layout === 'zigzag') f.image = 'side'
  if (f.layout === 'columns') { f.card = 'flat'; if (f.marker === 'none') f.marker = 'number' }
  if (f.image === 'side' && !(f.layout === 'rows' || f.layout === 'zigzag' || f.layout === 'split')) f.image = 'none'
  if (f.image === 'top' && (f.layout === 'rows' || f.layout === 'columns' || f.layout === 'zigzag' || f.layout === 'split')) f.image = 'none'
  if (f.layout === 'bento') { if (f.card === 'flat') f.card = 'filled'; if (f.image === 'side') f.image = 'none' }
  if (f.font === 'serif' && f.size === 'm') f.size = 'l'
  return f
}

export type FeaturesMood = 'calm' | 'bold' | 'soft' | 'dark' | 'playful' | 'any'
const LEAN: Record<FeaturesMood, Partial<Record<keyof FeaturesSpec, (string | number)[]>>> = {
  calm: { card: ['flat', 'bordered'], marker: ['none', 'dot', 'number'], arrives: ['none', 'scroll'], hover: ['none', 'tint', 'border'], bg: ['plain', 'band'], layout: ['grid-3', 'columns', 'rows', 'split'] },
  bold: { size: ['l', 'xl'], font: ['display', 'sans'], marker: ['number', 'bar'], layout: ['bento', 'rows', 'grid-2', 'strip'], card: ['filled', 'accent', 'bordered'], arrives: ['scroll', 'rise'] },
  soft: { radius: [20, 32], card: ['filled', 'shadow', 'flat'], font: ['serif', 'sans'], marker: ['dot', 'letter', 'none'], bg: ['plain', 'band'] },
  dark: { bg: ['ink', 'plain'], card: ['bordered', 'filled', 'flat'], hover: ['border', 'lift', 'tint'], arrives: ['scroll', 'rise'] },
  playful: { radius: [20, 32], card: ['filled', 'shadow', 'bordered'], marker: ['letter', 'number', 'dot'], layout: ['bento', 'grid-3', 'strip', 'grid-2'], hover: ['lift', 'tint'], bg: ['band', 'plain', 'accent'] },
  any: {},
}

export function randomFeatures(rand: () => number, mood: FeaturesMood = 'any', avoid: FeaturesSpec[] = []): FeaturesSpec {
  for (let attempt = 0; attempt < 400; attempt += 1) {
    const s = {} as Record<string, string | number>
    for (const { key, options } of AXES) {
      const lean = LEAN[mood][key]
      const pool = lean && rand() < 0.8 ? lean : options
      const weights = pool.map((o) => tasteWeight(key, o, 'features'))
      let r = rand() * weights.reduce((a, b) => a + b, 0)
      let pick = pool.length - 1
      for (let i = 0; i < pool.length; i += 1) {
        r -= weights[i]
        if (r <= 0) { pick = i; break }
      }
      s[key] = pool[pick]
    }
    const spec = fit(s as unknown as FeaturesSpec)
    if (!fValid(spec) || isBlocked(featuresId(spec))) continue
    if (avoid.some((a) => a.layout === spec.layout && a.card === spec.card && a.bg === spec.bg)) continue
    return spec
  }
  return { layout: 'grid-3', card: 'bordered', marker: 'number', image: 'none', hover: 'lift', arrives: 'none', radius: 20, head: 'left', size: 'l', font: 'sans', bg: 'plain', gap: 'airy' }
}

const HEAD = 'gen/Features_'
export function featuresId(spec: FeaturesSpec): string {
  let n = 0n
  for (const { key, options } of AXES) n = n * BigInt(options.length) + BigInt(options.indexOf(spec[key] as never))
  return HEAD + n.toString(36)
}

export function decodeFeatures(id: string): FeaturesSpec | undefined {
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
  return n === 0n ? (spec as unknown as FeaturesSpec) : undefined
}

export function featuresOfId(id: string): FeaturesSpec | undefined {
  const spec = decodeFeatures(id)
  return spec && fValid(spec) ? spec : undefined
}

export function countFeatures(): number {
  let n = 0
  const walk = (i: number, acc: Record<string, string | number>) => {
    if (i === AXES.length) {
      if (fValid(acc as unknown as FeaturesSpec)) n += 1
      return
    }
    for (const o of AXES[i].options) walk(i + 1, { ...acc, [AXES[i].key]: o })
  }
  walk(0, {})
  return n
}

export const describeFeatures = (s: FeaturesSpec) => `${s.layout}, ${s.card} cards, ${s.marker} marker, ${s.image === 'none' ? 'no pictures' : `${s.image} picture`}, ${s.size} ${s.font} heading (${s.head}), ${s.bg} background, ${s.hover === 'none' ? 'no hover' : `${s.hover} hover`}, ${s.arrives === 'none' ? 'still' : s.arrives}`
