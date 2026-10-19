// Is a picture of the image AI good enough for the site? Two checks that need no model download:
//   1. before drawing: does the engine understand the words of the prompt? (its /parse answer)
//   2. after drawing: is the picture empty, flat, too dark or too light, nearly one colour, or at odds with the colours of the site? (its pixels)
// A wrong answer of either check only costs another try (see imageAiClient.ts); nothing here can break a page.

export type ParseAnswer = { mode?: string; entities?: { name: string }[]; not_in_lexicon?: string[] }

/** the words of a prompt the engine knows: what is left of it when the unknown words are dropped */
export function cleanPrompt(prompt: string, parse: ParseAnswer | undefined): string {
  const unknown = new Set((parse?.not_in_lexicon ?? []).map((w) => w.toLowerCase()))
  return prompt
    .split(/\s+/)
    .filter((w) => !unknown.has(w.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, '')))
    .join(' ')
    .trim()
}

/** the prompt is understood when the engine found something to draw (a thing, or a pattern such as a mandala); a prompt of unknown words only is not */
export function promptUnderstood(parse: ParseAnswer | undefined): boolean {
  if (!parse) return true // the check itself is not available: do not block the drawing
  if ((parse.entities?.length ?? 0) > 0) return true
  return (parse.not_in_lexicon?.length ?? 0) === 0
}

export type PixelReport = { ok: boolean; score: number; reasons: string[]; stats: { mean: number; spread: number; colours: number; saturation: number; hueGap: number | null } }

const hueOf = (r: number, g: number, b: number) => {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max === min) return { h: 0, s: 0 }
  const d = max - min
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return { h: (h * 60 + 360) % 360, s: d / (255 - Math.abs(max + min - 255)) }
}

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const
}

/** `rgba` are the pixels of a small copy of the picture (about 64 pixels wide) */
export function assessPixels(rgba: ArrayLike<number>, accent?: string): PixelReport {
  const n = Math.floor(rgba.length / 4)
  if (!n) return { ok: false, score: 0, reasons: ['the picture has no pixels'], stats: { mean: 0, spread: 0, colours: 0, saturation: 0, hueGap: null } }
  let sum = 0
  let sumSq = 0
  let satSum = 0
  const seen = new Set<number>()
  const hueWeight = new Array(12).fill(0)
  for (let i = 0; i < n; i += 1) {
    const r = rgba[i * 4]
    const g = rgba[i * 4 + 1]
    const b = rgba[i * 4 + 2]
    const l = 0.299 * r + 0.587 * g + 0.114 * b
    sum += l
    sumSq += l * l
    seen.add(((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4))
    const { h, s } = hueOf(r, g, b)
    satSum += s
    if (s > 0.25 && l > 25 && l < 235) hueWeight[Math.floor(h / 30) % 12] += s
  }
  const mean = sum / n
  const spread = Math.sqrt(Math.max(0, sumSq / n - mean * mean))
  const colours = seen.size
  const saturation = satSum / n
  const reasons: string[] = []
  if (spread < 7) reasons.push('the picture is flat (one tone)')
  if (colours < 8) reasons.push('the picture has hardly any colours')
  if (mean < 14) reasons.push('the picture is almost black')
  if (mean > 244) reasons.push('the picture is almost white')

  // how far the main colour of the picture is from the main colour of the site (0 = same hue, 180 = opposite)
  let hueGap: number | null = null
  if (accent && /^#[0-9a-f]{6}$/i.test(accent)) {
    const total = hueWeight.reduce((a, b) => a + b, 0)
    if (total > 0) {
      const top = hueWeight.indexOf(Math.max(...hueWeight)) * 30 + 15
      const a = hueOf(...hexToRgb(accent)).h
      const d = Math.abs(top - a) % 360
      hueGap = d > 180 ? 360 - d : d
    }
  }

  // 0 to 1: contrast and variety count most, a picture in the hues of the site counts a little
  const contrast = Math.min(1, spread / 45)
  const variety = Math.min(1, colours / 40)
  const balance = 1 - Math.min(1, Math.abs(mean - 128) / 128)
  const fit = hueGap === null ? 0.5 : 1 - hueGap / 180
  const score = Math.round((0.35 * contrast + 0.3 * variety + 0.2 * balance + 0.15 * fit) * 100) / 100
  return { ok: reasons.length === 0 && score >= 0.4, score, reasons: reasons.length || score >= 0.4 ? reasons : ['the picture scores low (little contrast and variety)'], stats: { mean: Math.round(mean), spread: Math.round(spread), colours, saturation: Math.round(saturation * 100) / 100, hueGap: hueGap === null ? null : Math.round(hueGap) } }
}
