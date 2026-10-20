// A genome (a few numbers and names) becomes a picture: a background made by noise or by a fractal, coloured by a colour-theory ramp,
// with lines on top (a flow field, or a tree, snowflakes, a dragon from an L-system).
import { newImg, line, type Img } from './buffer'
import { harmony, rampAt, type Scheme } from './color'
import { escapeField, expand, fit, JULIA_CONSTANTS, L_SYSTEMS, MANDELBROT_VIEWS, turtle } from './fractals'
import { Perlin } from './perlin'
import { seededRandom } from '../random'

export type Base = 'clouds' | 'ridges' | 'marble' | 'waves' | 'mandelbrot' | 'julia'
export type Overlay = 'flow' | 'tree' | 'snowflakes' | 'dragon' | 'sierpinski' | 'none'
export const BASES: Base[] = ['clouds', 'ridges', 'marble', 'waves', 'mandelbrot', 'julia']
export const OVERLAYS: Overlay[] = ['flow', 'tree', 'snowflakes', 'dragon', 'sierpinski', 'none']

export type Genome = {
  seed: number
  base: Base
  overlay: Overlay
  scheme: Scheme
  /** how big the shapes of the noise are */
  scale: number
  octaves: number
  /** how much the noise bends itself (domain warping) */
  warp: number
  contrast: number
  /** which interesting place of the Mandelbrot set / which Julia constant */
  view: number
  strokes: number
  overlayAlpha: number
  dark: boolean
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

function backgroundField(g: Genome, w: number, h: number, perlin: Perlin): Float32Array {
  if (g.base === 'mandelbrot' || g.base === 'julia') {
    const small = Math.max(48, Math.min(w, 256))
    const sh = Math.max(32, Math.round((small * h) / w))
    const field = g.base === 'mandelbrot' ? escapeField(small, sh, MANDELBROT_VIEWS[g.view % MANDELBROT_VIEWS.length], 90) : escapeField(small, sh, { cx: 0, cy: 0, zoom: 1.1 }, 90, JULIA_CONSTANTS[g.view % JULIA_CONSTANTS.length])
    // stretched to the size of the picture (bilinear): the pattern is smooth, the cost is small
    const out = new Float32Array(w * h)
    for (let y = 0; y < h; y += 1) {
      const fy = (y / h) * (sh - 1)
      const y0 = Math.floor(fy)
      const ty = fy - y0
      for (let x = 0; x < w; x += 1) {
        const fx = (x / w) * (small - 1)
        const x0 = Math.floor(fx)
        const tx = fx - x0
        const a = field[y0 * small + x0]
        const b = field[y0 * small + Math.min(small - 1, x0 + 1)]
        const c = field[Math.min(sh - 1, y0 + 1) * small + x0]
        const d = field[Math.min(sh - 1, y0 + 1) * small + Math.min(small - 1, x0 + 1)]
        const v = (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty
        out[y * w + x] = 1 - Math.exp(-v * 7)
      }
    }
    return out
  }
  const out = new Float32Array(w * h)
  const s = g.scale / Math.max(w, h)
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      let nx = x * s
      let ny = y * s
      if (g.warp > 0) {
        const wx = perlin.fbm(nx + 5.2, ny + 1.3, 2)
        const wy = perlin.fbm(nx + 9.7, ny + 8.1, 2)
        nx += g.warp * wx * 1.6
        ny += g.warp * wy * 1.6
      }
      const n = perlin.fbm(nx, ny, g.octaves)
      out[y * w + x] =
        g.base === 'clouds' ? 0.5 + 0.5 * n * 1.6
        : g.base === 'ridges' ? 1 - Math.abs(n) * 2.2
        : g.base === 'marble' ? 0.5 + 0.5 * Math.sin(nx * 3.2 + n * 7)
        : 0.5 + 0.5 * Math.sin((ny * 2.4 + n * 2.5) * Math.PI)
    }
  }
  return out
}

function drawFlow(img: Img, g: Genome, perlin: Perlin, ink: readonly [number, number, number], ink2: readonly [number, number, number], rand: () => number) {
  const { w, h } = img
  const count = Math.round(g.strokes * (w * h) / 9000)
  const f = (1.5 + g.scale * 0.35) / Math.max(w, h)
  for (let i = 0; i < count; i += 1) {
    let x = rand() * w
    let y = rand() * h
    const steps = 14 + Math.floor(rand() * 26)
    const color = i % 3 === 0 ? ink2 : ink
    const width = 0.7 + rand() * 1.1
    for (let s = 0; s < steps; s += 1) {
      const angle = perlin.fbm(x * f, y * f, 3) * Math.PI * 2.4
      const nx = x + Math.cos(angle) * 2.2
      const ny = y + Math.sin(angle) * 2.2
      line(img, x, y, nx, ny, width, color, g.overlayAlpha * 0.7)
      x = nx
      y = ny
      if (x < 0 || y < 0 || x >= w || y >= h) break
    }
  }
}

function drawLSystem(img: Img, g: Genome, name: string, ink: readonly [number, number, number], rand: () => number) {
  const system = L_SYSTEMS.find((l) => l.name === name) ?? L_SYSTEMS[0]
  const [lo, hi] = system.iterations
  const iterations = lo + Math.floor(rand() * (hi - lo + 1))
  const word = expand(system, iterations)
  const width = Math.max(0.8, Math.min(img.w, img.h) / 260)
  const place = (box: { x: number; y: number; w: number; h: number }, jitter: number) => {
    const raw = turtle(word, system.angle, jitter, rand)
    const { segments } = fit(raw.length > 14000 ? raw.filter((_, i) => i % Math.ceil(raw.length / 14000) === 0) : raw, box, 0.06)
    for (const [x1, y1, x2, y2] of segments) line(img, x1, y1, x2, y2, width, ink, g.overlayAlpha)
  }
  if (name === 'snowflake') {
    // a few flakes of different sizes
    const flakes = 3 + Math.floor(rand() * 4)
    for (let i = 0; i < flakes; i += 1) {
      const size = Math.min(img.w, img.h) * (0.25 + rand() * 0.4)
      place({ x: rand() * (img.w - size), y: rand() * (img.h - size), w: size, h: size }, 0)
    }
  } else {
    const size = Math.min(img.w, img.h) * (0.8 + rand() * 0.2)
    place({ x: (img.w - size * 1.2) / 2, y: (img.h - size) / 2, w: size * 1.2, h: size }, name === 'tree' || name === 'fern' ? 14 : 0)
  }
}

export function renderGenome(g: Genome, w: number, h: number, accent: string, alt?: string): Img {
  const img = newImg(w, h)
  const rand = seededRandom(g.seed * 7919 + 13)
  const perlin = new Perlin(g.seed)
  const pal = harmony(accent, g.scheme, g.dark, alt)
  const field = backgroundField(g, w, h, perlin)
  for (let i = 0; i < w * h; i += 1) {
    const [r, gr, b] = rampAt(pal.ramp, clamp01((field[i] - 0.5) * g.contrast + 0.5))
    img.data[i * 4] = r
    img.data[i * 4 + 1] = gr
    img.data[i * 4 + 2] = b
  }
  if (g.overlay === 'flow') drawFlow(img, g, perlin, pal.ink, pal.ink2, rand)
  else if (g.overlay === 'tree') drawLSystem(img, g, 'tree', pal.ink, rand)
  else if (g.overlay === 'snowflakes') drawLSystem(img, g, 'snowflake', pal.ink, rand)
  else if (g.overlay === 'dragon') drawLSystem(img, g, 'dragon', pal.ink, rand)
  else if (g.overlay === 'sierpinski') drawLSystem(img, g, 'sierpinski', pal.ink, rand)
  return img
}
