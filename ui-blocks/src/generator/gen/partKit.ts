// What the later generators (pricing, FAQ, testimonials, gallery) share: a part is a list of axes, each with its choices; a spec picks one choice per axis; the id is the spec as one number.
// The first three generators (heroSpec, featuresSpec, ctaSpec) were written by hand with the same method; these four are made with this helper.
import { isBlocked, tasteWeight } from './heroTaste'
import type { HeroMood } from './heroSpec'

type Value = string | number
export type PartAxes = Record<string, readonly Value[]>

export type PartDef<S extends Record<string, Value>> = {
  /** the id starts with gen/<Prefix>_ ; ns is the same word in lower case (the taste has one space per kind of part) */
  prefix: string
  axes: PartAxes
  valid: (s: S) => boolean
  /** turns a drawn spec into a valid one when it is close (a rule that is easy to repair) */
  fit?: (s: S) => S
  lean: Partial<Record<HeroMood, Partial<Record<keyof S, Value[]>>>>
  fallback: S
  /** two parts shown next to each other should not look alike: true when a is too close to b */
  alike?: (a: S, b: S) => boolean
  describe: (s: S) => string
}

export function definePart<S extends Record<string, Value>>(def: PartDef<S>) {
  const keys = Object.keys(def.axes) as (keyof S & string)[]
  const ns = def.prefix.toLowerCase()
  const head = `gen/${def.prefix}_`
  const id = (spec: S): string => {
    let n = 0n
    for (const k of keys) n = n * BigInt(def.axes[k].length) + BigInt(def.axes[k].indexOf(spec[k]))
    return head + n.toString(36)
  }
  /** the spec of an id whatever the rules say (the thumbs of a design the rules no longer make still teach) */
  const decode = (text: string): S | undefined => {
    if (!text.startsWith(head)) return undefined
    const body = text.slice(head.length)
    if (!/^[0-9a-z]{1,30}$/.test(body)) return undefined
    let n = [...body].reduce((acc, ch) => acc * 36n + BigInt(parseInt(ch, 36)), 0n)
    const spec: Record<string, Value> = {}
    for (let i = keys.length - 1; i >= 0; i -= 1) {
      const size = BigInt(def.axes[keys[i]].length)
      spec[keys[i]] = def.axes[keys[i]][Number(n % size)]
      n /= size
    }
    return n === 0n ? (spec as S) : undefined
  }
  const of = (text: string): S | undefined => {
    const s = decode(text)
    return s && def.valid(s) ? s : undefined
  }
  const random = (rand: () => number, mood: HeroMood = 'any', avoid: S[] = []): S => {
    for (let attempt = 0; attempt < 400; attempt += 1) {
      const s: Record<string, Value> = {}
      for (const k of keys) {
        const lean = def.lean[mood]?.[k]
        const pool = lean && rand() < 0.8 ? lean : def.axes[k]
        const weights = pool.map((o) => tasteWeight(k, o, ns))
        let r = rand() * weights.reduce((a, b) => a + b, 0)
        let pick = pool.length - 1
        for (let i = 0; i < pool.length; i += 1) {
          r -= weights[i]
          if (r <= 0) { pick = i; break }
        }
        s[k] = pool[pick]
      }
      const spec = def.fit ? def.fit(s as S) : (s as S)
      if (!def.valid(spec) || isBlocked(id(spec))) continue
      if (avoid.some((a) => (def.alike ?? ((x, y) => x[keys[0]] === y[keys[0]]))(spec, a))) continue
      return spec
    }
    return def.fallback
  }
  const count = () => keys.reduce((n, k) => n * def.axes[k].length, 1)
  return { prefix: def.prefix, ns, head, id, decode, of, random, count, describe: def.describe, valid: def.valid }
}
export type Part<S extends Record<string, Value>> = ReturnType<typeof definePart<S>>
