// Perlin noise: smooth, natural-looking randomness (clouds, waves, marble, flow). Plain random pixels look like static; this one changes gently
// from place to place, so values next to each other are close. Seeded: the same seed gives the same noise.
import { seededRandom } from '../random'

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export class Perlin {
  private perm = new Uint8Array(512)

  constructor(seed: number) {
    const rand = seededRandom(seed)
    const base = Array.from({ length: 256 }, (_, i) => i)
    for (let i = 255; i > 0; i -= 1) {
      const j = Math.floor(rand() * (i + 1))
      ;[base[i], base[j]] = [base[j], base[i]]
    }
    for (let i = 0; i < 512; i += 1) this.perm[i] = base[i & 255]
  }

  private grad(hash: number, x: number, y: number) {
    // eight directions
    switch (hash & 7) {
      case 0: return x + y
      case 1: return x - y
      case 2: return -x + y
      case 3: return -x - y
      case 4: return x
      case 5: return -x
      case 6: return y
      default: return -y
    }
  }

  /** one octave, about -1 to 1 */
  noise(x: number, y: number): number {
    const xi = Math.floor(x) & 255
    const yi = Math.floor(y) & 255
    const xf = x - Math.floor(x)
    const yf = y - Math.floor(y)
    const u = fade(xf)
    const v = fade(yf)
    const p = this.perm
    const aa = p[p[xi] + yi]
    const ab = p[p[xi] + yi + 1]
    const ba = p[p[xi + 1] + yi]
    const bb = p[p[xi + 1] + yi + 1]
    return lerp(lerp(this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf), u), lerp(this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1), u), v)
  }

  /** several octaves on top of each other (fractal Brownian motion): big shapes with finer and finer detail; about -1 to 1 */
  fbm(x: number, y: number, octaves = 4, lacunarity = 2, gain = 0.5): number {
    let sum = 0
    let amp = 1
    let freq = 1
    let norm = 0
    for (let i = 0; i < octaves; i += 1) {
      sum += amp * this.noise(x * freq, y * freq)
      norm += amp
      amp *= gain
      freq *= lacunarity
    }
    return sum / norm
  }
}
