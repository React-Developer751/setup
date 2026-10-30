// The first generator of the design program: a first screen (hero) is not picked from a list, it is described by a SPEC (a handful of choices: how the parts are laid out, how the picture is shaped,
// how big and in which typeface the headline is, how the buttons look, what is drawn behind it, how it moves) and written as code from that spec (heroTree.ts, heroEmit.ts).
// The choices below are the "axes". Rules (`valid`) keep the combinations that do not work out of the way (a giant headline in a narrow column, a circle picture on a full-bleed layout).
// The spec is small and exact: it is encoded in the id of the component ("gen/Hero_3k9x..."), so the same id is always the same hero, and a project that holds the id can draw it again.

import { tasteWeight } from './heroTaste'

export const LAYOUTS = ['split-right', 'split-left', 'center-stack', 'type-led', 'bleed-overlay', 'offset-card', 'bento', 'stack-wide'] as const
export const MEDIA = ['rect', 'arch', 'circle', 'tilt', 'blob'] as const
export const SCALES = ['m', 'l', 'xl', 'xxl'] as const
export const FONTS = ['sans', 'serif', 'display'] as const
export const WEIGHTS = [500, 600, 700, 800] as const
export const RADII = [0, 10, 20, 32] as const
export const BUTTONS = ['solid', 'outline', 'pill', 'link'] as const
export const EYEBROWS = ['chip', 'caps', 'line'] as const
export const DECORS = ['none', 'blob', 'grid', 'dots', 'grain', 'ring', 'stripes'] as const
export const BACKGROUNDS = ['plain', 'band', 'glow', 'accent', 'ink'] as const
export const MOTIONS = ['none', 'rise', 'stagger', 'float', 'kenburns'] as const
export const HEIGHTS = ['compact', 'tall', 'full'] as const

export type HeroSpec = {
  layout: (typeof LAYOUTS)[number]
  media: (typeof MEDIA)[number]
  scale: (typeof SCALES)[number]
  font: (typeof FONTS)[number]
  weight: (typeof WEIGHTS)[number]
  radius: (typeof RADII)[number]
  button: (typeof BUTTONS)[number]
  eyebrow: (typeof EYEBROWS)[number]
  decor: (typeof DECORS)[number]
  bg: (typeof BACKGROUNDS)[number]
  motion: (typeof MOTIONS)[number]
  height: (typeof HEIGHTS)[number]
}

const AXES: { key: keyof HeroSpec; options: readonly (string | number)[] }[] = [
  { key: 'layout', options: LAYOUTS }, { key: 'media', options: MEDIA }, { key: 'scale', options: SCALES }, { key: 'font', options: FONTS }, { key: 'weight', options: WEIGHTS }, { key: 'radius', options: RADII },
  { key: 'button', options: BUTTONS }, { key: 'eyebrow', options: EYEBROWS }, { key: 'decor', options: DECORS }, { key: 'bg', options: BACKGROUNDS }, { key: 'motion', options: MOTIONS }, { key: 'height', options: HEIGHTS },
]

/** what does not work out: the layouts that fill the screen with the picture take no shaped picture or background; a giant headline needs the width; a serif is never heavy */
export function valid(s: HeroSpec): boolean {
  if (s.layout === 'bleed-overlay' && (s.media !== 'rect' || s.bg !== 'plain' || s.decor !== 'none' || s.motion === 'float')) return false
  if (s.layout === 'bleed-overlay' && s.height === 'compact') return false
  if ((s.layout === 'type-led' || s.layout === 'stack-wide' || s.layout === 'bento') && s.media !== 'rect' && s.media !== 'arch') return false
  if (s.scale === 'xxl' && !(s.layout === 'type-led' || s.layout === 'center-stack' || s.layout === 'stack-wide' || s.layout === 'bleed-overlay')) return false
  if (s.scale === 'm' && (s.layout === 'type-led' || s.layout === 'bleed-overlay')) return false
  if (s.font === 'serif' && s.weight > 600) return false
  if (s.font === 'display' && s.weight < 700) return false
  if (s.bg === 'accent' && s.decor === 'blob') return false
  if (s.bg === 'ink' && (s.decor === 'grain' || s.decor === 'stripes')) return false
  if (s.media === 'circle' && (s.layout === 'center-stack' || s.layout === 'offset-card')) return false
  if (s.media === 'blob' && s.radius === 0) return false
  if (s.button === 'link' && s.bg === 'accent') return false
  if (s.layout === 'bento' && (s.bg === 'accent' || s.bg === 'ink' || s.height === 'full')) return false
  if (s.layout === 'offset-card' && (s.bg === 'accent' || s.bg === 'ink')) return false
  return true
}

/** the choices that follow from another choice are made to fit it (a full-bleed picture is a plain rectangle with no background of its own), so that no layout is lost to the rules */
function fit(s: HeroSpec): HeroSpec {
  const f = { ...s }
  if (f.layout === 'bleed-overlay') Object.assign(f, { media: 'rect', bg: 'plain', decor: 'none', height: f.height === 'compact' ? 'tall' : f.height, motion: f.motion === 'float' ? 'rise' : f.motion })
  if ((f.layout === 'type-led' || f.layout === 'stack-wide' || f.layout === 'bento') && f.media !== 'rect' && f.media !== 'arch') f.media = 'rect'
  if (f.scale === 'xxl' && !(f.layout === 'type-led' || f.layout === 'center-stack' || f.layout === 'stack-wide' || f.layout === 'bleed-overlay')) f.scale = 'xl'
  if (f.font === 'serif' && f.weight > 600) f.weight = 600
  if (f.font === 'display' && f.weight < 700) f.weight = 700
  return f
}

/** a spec made from a random stream; `mood` leans the choices (calm: quiet and soft, bold: big and loud) without fixing them */
export type HeroMood = 'calm' | 'bold' | 'soft' | 'dark' | 'playful' | 'any'
const LEAN: Record<HeroMood, Partial<Record<keyof HeroSpec, (string | number)[]>>> = {
  calm: { scale: ['m', 'l'], weight: [500, 600], font: ['serif', 'sans'], motion: ['none', 'rise', 'float'], decor: ['none', 'blob', 'grain'], bg: ['plain', 'band', 'glow'], button: ['solid', 'link', 'outline'] },
  bold: { scale: ['xl', 'xxl'], weight: [700, 800], font: ['display', 'sans'], motion: ['stagger', 'rise', 'kenburns'], decor: ['grid', 'stripes', 'ring', 'none'], bg: ['plain', 'accent', 'ink'], button: ['solid', 'pill'] },
  soft: { radius: [20, 32], media: ['arch', 'blob', 'rect', 'circle'], font: ['serif', 'sans'], decor: ['blob', 'dots', 'grain'], bg: ['plain', 'band', 'glow'], button: ['pill', 'solid'] },
  dark: { bg: ['ink', 'glow', 'plain'], decor: ['grid', 'ring', 'dots', 'none'], motion: ['stagger', 'kenburns', 'float'], scale: ['l', 'xl', 'xxl'] },
  playful: { radius: [20, 32], media: ['blob', 'tilt', 'arch', 'circle'], decor: ['dots', 'blob', 'ring', 'stripes'], bg: ['band', 'accent', 'glow'], button: ['pill', 'solid'], weight: [700, 800], font: ['display', 'sans'] },
  any: {},
}

export function randomSpec(rand: () => number, mood: HeroMood = 'any', avoid: HeroSpec[] = []): HeroSpec {
  for (let attempt = 0; attempt < 400; attempt += 1) {
    const s = {} as Record<string, string | number>
    for (const { key, options } of AXES) {
      const lean = LEAN[mood][key]
      // a leaned axis takes its leaned options 80% of the time: the generator may still surprise
      const pool = lean && rand() < 0.8 ? lean : options
      // what the person's thumbs say (heroTaste.ts) makes liked choices more likely and disliked ones less likely
      const weights = pool.map((o) => tasteWeight(key, o))
      let r = rand() * weights.reduce((a, b) => a + b, 0)
      let pick = pool.length - 1
      for (let i = 0; i < pool.length; i += 1) {
        r -= weights[i]
        if (r <= 0) { pick = i; break }
      }
      s[key] = pool[pick]
    }
    const spec = fit(s as unknown as HeroSpec)
    if (!valid(spec)) continue
    // the same layout, picture shape and look as one of the heroes just made is not a new hero
    if (avoid.some((a) => a.layout === spec.layout && a.media === spec.media && a.bg === spec.bg && a.decor === spec.decor)) continue
    return spec
  }
  return { layout: 'split-right', media: 'rect', scale: 'l', font: 'sans', weight: 600, radius: 20, button: 'solid', eyebrow: 'chip', decor: 'none', bg: 'plain', motion: 'rise', height: 'tall' }
}

/** how many different valid specs there are (counted, not guessed) */
export function countSpecs(): number {
  let n = 0
  const walk = (i: number, acc: Record<string, string | number>) => {
    if (i === AXES.length) {
      if (valid(acc as unknown as HeroSpec)) n += 1
      return
    }
    for (const o of AXES[i].options) walk(i + 1, { ...acc, [AXES[i].key]: o })
  }
  walk(0, {})
  return n
}

const HEAD = 'gen/Hero_'
/** the spec as a short id: one base-36 number from the index of each choice (a mixed radix number) */
export function specId(spec: HeroSpec): string {
  let n = 0n
  for (const { key, options } of AXES) n = n * BigInt(options.length) + BigInt(options.indexOf(spec[key] as never))
  return HEAD + n.toString(36)
}

export function specOfId(id: string): HeroSpec | undefined {
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
  if (n !== 0n) return undefined
  const result = spec as unknown as HeroSpec
  return valid(result) ? result : undefined
}

/** one line for people ("split, arch picture, big serif headline, pill buttons, glow, rise") */
export const describeSpec = (s: HeroSpec) => `${s.layout}, ${s.media} picture, ${s.scale} ${s.font} headline, ${s.button} buttons, ${s.bg} background${s.decor === 'none' ? '' : ` with ${s.decor}`}, ${s.motion === 'none' ? 'still' : s.motion}`
