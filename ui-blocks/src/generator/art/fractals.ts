// Shapes from equations instead of drawing: the Mandelbrot and Julia sets (what happens to a number when it is squared again and again) and
// L-systems (a word that rewrites itself: a few rules grow trees, snowflakes and dragons).
import { seededRandom } from '../random'

export type View = { cx: number; cy: number; zoom: number }

/** the smooth escape time of every pixel, 0 to 1 (0 = the point stays inside the set) */
export function escapeField(w: number, h: number, view: View, maxIter: number, julia?: { re: number; im: number }): Float32Array {
  const out = new Float32Array(w * h)
  const aspect = w / h
  const span = 3 / view.zoom
  for (let py = 0; py < h; py += 1) {
    for (let px = 0; px < w; px += 1) {
      const x0 = view.cx + (px / w - 0.5) * span * aspect
      const y0 = view.cy + (py / h - 0.5) * span
      let x = julia ? x0 : 0
      let y = julia ? y0 : 0
      const cr = julia ? julia.re : x0
      const ci = julia ? julia.im : y0
      let i = 0
      while (i < maxIter && x * x + y * y <= 256) {
        const t = x * x - y * y + cr
        y = 2 * x * y + ci
        x = t
        i += 1
      }
      // smooth colouring: no hard steps between the bands
      out[py * w + px] = i >= maxIter ? 0 : (i + 1 - Math.log2(Math.max(1e-9, Math.log2(Math.max(1.0001, Math.sqrt(x * x + y * y)))))) / maxIter
    }
  }
  return out
}

/** places on the edge of the Mandelbrot set that are worth looking at (deep zoom points) */
export const MANDELBROT_VIEWS: View[] = [
  { cx: -0.745, cy: 0.113, zoom: 60 },
  { cx: -0.7453, cy: 0.1127, zoom: 600 },
  { cx: -0.16, cy: 1.0405, zoom: 40 },
  { cx: -1.25066, cy: 0.02012, zoom: 150 },
  { cx: 0.275, cy: 0.007, zoom: 60 },
  { cx: -0.5, cy: 0, zoom: 0.9 },
  { cx: -1.7685, cy: -0.0014, zoom: 300 },
]

export const JULIA_CONSTANTS = [
  { re: -0.8, im: 0.156 }, { re: 0.285, im: 0.01 }, { re: -0.4, im: 0.6 }, { re: -0.70176, im: -0.3842 }, { re: 0.355, im: 0.355 }, { re: -0.835, im: -0.2321 },
]

// ───────────── L-systems ─────────────
export type LSystem = { name: string; axiom: string; rules: Record<string, string>; angle: number; iterations: [number, number] }

export const L_SYSTEMS: LSystem[] = [
  { name: 'snowflake', axiom: 'F++F++F', rules: { F: 'F-F++F-F' }, angle: 60, iterations: [3, 4] },
  { name: 'dragon', axiom: 'FX', rules: { X: 'X+YF+', Y: '-FX-Y' }, angle: 90, iterations: [9, 12] },
  { name: 'tree', axiom: 'X', rules: { X: 'F+[[X]-X]-F[-FX]+X', F: 'FF' }, angle: 22.5, iterations: [4, 5] },
  { name: 'sierpinski', axiom: 'F-G-G', rules: { F: 'F-G+F+G-F', G: 'GG' }, angle: 120, iterations: [4, 6] },
  { name: 'fern', axiom: 'X', rules: { X: 'F+[[X]-X]-F[-FX]+X', F: 'FF' }, angle: 25, iterations: [4, 5] },
]

export const expand = (system: LSystem, iterations: number): string => {
  let word = system.axiom
  for (let i = 0; i < iterations; i += 1) {
    let next = ''
    for (const ch of word) next += system.rules[ch] ?? ch
    word = next
    if (word.length > 400_000) break
  }
  return word
}

export type Segment = [number, number, number, number]

/** the lines a turtle draws when it reads the word: F and G go forward, + and - turn, [ and ] save and return */
export function turtle(word: string, angleDeg: number, jitter = 0, rand: () => number = seededRandom(1)): Segment[] {
  const segments: Segment[] = []
  let x = 0
  let y = 0
  let heading = -90
  const stack: [number, number, number][] = []
  for (const ch of word) {
    if (ch === 'F' || ch === 'G') {
      const rad = (heading * Math.PI) / 180
      const nx = x + Math.cos(rad)
      const ny = y + Math.sin(rad)
      segments.push([x, y, nx, ny])
      x = nx
      y = ny
    } else if (ch === '+') heading += angleDeg + (rand() - 0.5) * jitter
    else if (ch === '-') heading -= angleDeg + (rand() - 0.5) * jitter
    else if (ch === '[') stack.push([x, y, heading])
    else if (ch === ']') {
      const top = stack.pop()
      if (top) [x, y, heading] = top
    }
  }
  return segments
}

/** the lines moved and scaled to fit a box (with a margin) */
export function fit(segments: Segment[], box: { x: number; y: number; w: number; h: number }, margin = 0.08): { segments: Segment[]; scale: number } {
  if (!segments.length) return { segments, scale: 1 }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [x1, y1, x2, y2] of segments) {
    minX = Math.min(minX, x1, x2)
    maxX = Math.max(maxX, x1, x2)
    minY = Math.min(minY, y1, y2)
    maxY = Math.max(maxY, y1, y2)
  }
  const sw = Math.max(1e-6, maxX - minX)
  const sh = Math.max(1e-6, maxY - minY)
  const scale = Math.min((box.w * (1 - 2 * margin)) / sw, (box.h * (1 - 2 * margin)) / sh)
  const ox = box.x + (box.w - sw * scale) / 2 - minX * scale
  const oy = box.y + (box.h - sh * scale) / 2 - minY * scale
  return { segments: segments.map(([x1, y1, x2, y2]) => [x1 * scale + ox, y1 * scale + oy, x2 * scale + ox, y2 * scale + oy] as Segment), scale }
}
