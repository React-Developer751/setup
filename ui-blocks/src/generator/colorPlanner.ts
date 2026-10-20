// "Think of the colours first": before a site is made, several colour ideas are worked out for the prompt (each is a real palette of the colour brain)
// and the one that looks least like the last sites is taken, so no two sites in a row come out in the same colours.
// A colour named in the prompt ("red", "gold") always wins: then every idea has that hue and the first one is used.
import { hexToHsl } from './colorBrain'
import { sampleTopK, temperature } from './creativity'
import { generateWebsite } from './generateWebsite'

const KEY = 'ui-blocks:recent-hues'
const KEEP = 4
const IDEAS = 8

const readRecent = (): number[] => {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown
    return Array.isArray(list) ? list.filter((n): n is number => typeof n === 'number').slice(-KEEP) : []
  } catch {
    return []
  }
}
const remember = (hue: number) => {
  try {
    localStorage.setItem(KEY, JSON.stringify([...readRecent(), hue].slice(-KEEP)))
  } catch {
    // the memory is optional
  }
}
const gap = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

export type ColorIdea = { variation: number; hue: number; name: string; reasons: string[] }

/** the variation number (a seed of the whole site) whose colours are new, with the reason for them */
export function planColors(prompt: string, avoid: number[] = readRecent()): ColorIdea {
  const ideas: { item: ColorIdea; score: number }[] = []
  for (let i = 0; i < IDEAS; i += 1) {
    const variation = 1 + Math.floor(Math.random() * 9000)
    const site = generateWebsite(prompt, variation)
    const hue = Math.round(hexToHsl(site.palette.light.accent).h)
    const far = avoid.length ? Math.min(...avoid.map((h) => gap(h, hue))) : 180
    ideas.push({ item: { variation, hue, name: site.palette.name, reasons: site.colorReasons }, score: far / 180 })
  }
  // the least familiar idea at a low creativity; one of the best few at a high one
  const idea = sampleTopK(ideas, temperature(), Math.random)
  remember(idea.hue)
  return idea
}
