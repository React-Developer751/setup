// The judge of the generated pictures: noise that looks like static, flat pictures, pictures that are nearly one colour and pictures that
// are too dark or too light are turned away; of the rest the one with the most contrast and variety, in hues that fit the site, scores best.
import { assessPixels, type PixelReport } from '../edit/imageCheck'
import type { Img } from './buffer'

export type ArtReport = PixelReport & { roughness: number }

/** how much neighbouring pixels differ (0 = smooth, 1 = static): a drawing with smooth parts is low, white noise is very high */
export function roughness(img: Img): number {
  const { w, h, data } = img
  let sum = 0
  let n = 0
  for (let y = 0; y < h; y += 1) {
    for (let x = 1; x < w; x += 1) {
      const i = (y * w + x) * 4
      const j = i - 4
      sum += (Math.abs(data[i] - data[j]) + Math.abs(data[i + 1] - data[j + 1]) + Math.abs(data[i + 2] - data[j + 2])) / (3 * 255)
      n += 1
    }
  }
  return n ? sum / n : 0
}

export function judge(img: Img, accent: string): ArtReport {
  const base = assessPixels(img.data, accent)
  const rough = roughness(img)
  const reasons = [...base.reasons]
  if (rough > 0.09) reasons.push('the picture looks like static (too rough)')
  // a picture with some texture scores better than a dead smooth one
  const texture = Math.min(1, rough / 0.03)
  const score = Math.round((base.score * 0.8 + texture * 0.2) * 100) / 100
  return { ...base, ok: base.ok && rough <= 0.09, reasons, score, roughness: Math.round(rough * 1000) / 1000 }
}
