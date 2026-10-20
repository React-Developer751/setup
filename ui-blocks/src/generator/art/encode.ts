// The finished picture as a small JPEG that lives inside the page (a data: address), like every other picture of a site. Browser only.
import type { Img } from './buffer'

const MAX_CHARS = 440_000

export function toDataUrl(img: Img): string {
  const canvas = document.createElement('canvas')
  canvas.width = img.w
  canvas.height = img.h
  const context = canvas.getContext('2d')
  if (!context) throw new Error('no canvas')
  context.putImageData(new ImageData(new Uint8ClampedArray(img.data), img.w, img.h), 0, 0)
  let quality = 0.86
  let data = canvas.toDataURL('image/jpeg', quality)
  while (data.length > MAX_CHARS && quality > 0.4) {
    quality -= 0.1
    data = canvas.toDataURL('image/jpeg', quality)
  }
  return data
}
