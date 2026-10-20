// Pictures for a site made by the maths of the art/ folder: noise and fractals in colours worked out from the colour of the site, the best of
// many tried (the judge turns the rest away). No engine and no server are needed, so a site always gets pictures; the image AI is the
// first choice when it is running, this is what takes its place, and what can be added next to it.
import { hash } from '../random'
import { makeArt } from '../art/generate'
import { toDataUrl } from '../art/encode'
import { BASES, OVERLAYS } from '../art/render'
import type { EditOp } from './edits'

export type ArtSlot = { label: string; width: number; height: number }

/** the first screen, the about picture and six gallery pictures */
export const ART_SLOTS: ArtSlot[] = [
  { label: 'first screen', width: 768, height: 480 },
  { label: 'about', width: 640, height: 480 },
  ...Array.from({ length: 6 }, (_, i) => ({ label: `gallery ${i + 1}`, width: 480, height: 360 })),
]

export type ArtPictureOptions = { prompt: string; accent: string; alt?: string; dark?: boolean; temperature: number; round?: number }

/** every picture of the set looks different: each takes another kind of background and another kind of line drawing */
export function artPictures(options: ArtPictureOptions): { ops: EditOp[]; kinds: string[] } {
  const base = hash(`${options.prompt.toLowerCase()}|art|${options.round ?? 0}`)
  const pictures: string[] = []
  const kinds: string[] = []
  ART_SLOTS.forEach((slot, i) => {
    const art = makeArt({
      seed: base + i * 7919,
      accent: options.accent,
      alt: options.alt,
      dark: options.dark,
      width: slot.width,
      height: slot.height,
      temperature: options.temperature,
      prefer: { base: [BASES[(i + (options.round ?? 0)) % BASES.length], BASES[(i + 3) % BASES.length]], overlay: [OVERLAYS[i % 5], OVERLAYS[(i + 2) % 5]] },
    })
    pictures.push(toDataUrl(art.image))
    kinds.push(`${art.genome.base} + ${art.genome.overlay}`)
  })
  return { ops: [{ op: 'photos', hero: pictures[0], about: pictures[1], gallery: pictures.slice(2) }], kinds }
}
