// A picture as plain pixels (red, green, blue, alpha per pixel) and the few things drawn on it: soft lines and dots. No canvas needed, so the
// same code runs in the browser and in the tests.
import type { RGB } from './color'

export type Img = { w: number; h: number; data: Uint8ClampedArray }

export const newImg = (w: number, h: number): Img => ({ w, h, data: new Uint8ClampedArray(w * h * 4).fill(255) })

/** mixes a colour into one pixel with the given opacity */
export function blend(img: Img, x: number, y: number, [r, g, b]: RGB, a: number): void {
  if (x < 0 || y < 0 || x >= img.w || y >= img.h || a <= 0) return
  const i = (Math.floor(y) * img.w + Math.floor(x)) * 4
  const k = Math.min(1, a)
  img.data[i] += (r - img.data[i]) * k
  img.data[i + 1] += (g - img.data[i + 1]) * k
  img.data[i + 2] += (b - img.data[i + 2]) * k
}

/** a soft dot */
export function dot(img: Img, cx: number, cy: number, radius: number, color: RGB, alpha: number): void {
  const r = Math.ceil(radius)
  for (let y = -r; y <= r; y += 1) {
    for (let x = -r; x <= r; x += 1) {
      const d = Math.sqrt(x * x + y * y)
      if (d <= radius) blend(img, cx + x, cy + y, color, alpha * Math.min(1, radius + 0.5 - d))
    }
  }
}

/** a line of soft dots from one point to another */
export function line(img: Img, x1: number, y1: number, x2: number, y2: number, width: number, color: RGB, alpha: number): void {
  const length = Math.hypot(x2 - x1, y2 - y1)
  const steps = Math.max(1, Math.ceil(length / Math.max(0.5, width * 0.5)))
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    dot(img, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, Math.max(0.5, width / 2), color, alpha)
  }
}
