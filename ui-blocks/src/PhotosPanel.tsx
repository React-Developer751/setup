import { useState } from 'react'
import type { EditOp } from './generator/edit/edits'
import type { ScenePlan } from './generator/imageAi'
import { makePictures, type UsedScene } from './generator/edit/imageAiClient'
import { artPictures } from './generator/edit/artPictures'
import { temperature } from './generator/creativity'
import { readPicture } from './generator/edit/imageFile'

type Props = {
  defaultQuery: string
  hasPhotos: boolean
  onApply: (ops: EditOp[], label: string, used?: UsedScene[]) => void
  onClear: () => void
  /** the photos are put on the pages of the built-in templates; the 92-components page keeps its own pictures */
  /** the scenes the image engine would draw for this business (another number = other scenes) */
  planFor: (offset: number) => ScenePlan
  /** the main colour of the site: the check of a picture prefers pictures in its hues */
  accent?: string
  /** the second colour of the site */
  alt?: string
  /** the site starts in dark mode */
  dark?: boolean
  /** what the person asked for: the pictures must show this business */
  prompt?: string
}

/** how big a photo is kept: the first screen the biggest; the others are tiles (about 100 KB each) */
const SIZES = (index: number) => (index === 0 ? { side: 1280, chars: 170_000 } : index === 1 ? { side: 1000, chars: 130_000 } : { side: 800, chars: 100_000 })

/** The first screen, the about picture and the gallery get real photos: from the person's own files or drawn by the project's own engines. */
function PhotosPanel({ defaultQuery, hasPhotos, onApply, onClear, planFor, accent, alt, dark, prompt }: Props) {
  const [problem, setProblem] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [round, setRound] = useState(0)
  const [artRound, setArtRound] = useState(0)

  const draw = async () => {
    setBusy(true)
    setProblem('')
    setProgress('0 of 8')
    const answer = await makePictures(planFor(round), (done, total) => setProgress(`${done} of ${total}`), { accent, prompt })
    setBusy(false)
    setProgress('')
    if (answer.ops) {
      setRound((r) => r + 1)
      onApply(answer.ops, 'Pictures from the image AI', answer.used)
    } else setProblem(answer.problem ?? '')
  }

  // pictures made by maths (noise, fractals, colour theory; the best of many): no engine needed
  const drawArt = () => {
    setBusy(true)
    setProblem('')
    // one tick, so that the button shows its state before the pictures are worked out
    window.setTimeout(() => {
      try {
        const made = artPictures({ prompt: prompt ?? defaultQuery, accent: accent ?? '#2563eb', alt, dark, temperature: temperature(), round: artRound })
        setArtRound((r) => r + 1)
        onApply(made.ops, 'Abstract art made with maths')
      } catch {
        setProblem('Could not make the art in this browser.')
      }
      setBusy(false)
    }, 30)
  }

  const upload = async (files: FileList | null) => {
    const list = [...(files ?? [])].filter((f) => f.type.startsWith('image/')).slice(0, 8)
    if (!list.length) return
    setBusy(true)
    setProblem('')
    try {
      const pictures = await Promise.all(list.map((f, i) => readPicture(f, SIZES(i).side, false, SIZES(i).chars)))
      onApply([{ op: 'photos', hero: pictures[0], ...(pictures[1] ? { about: pictures[1] } : {}), ...(pictures.length > 2 ? { gallery: pictures.slice(2) } : {}) }], `${list.length} of my own photos`)
    } catch (error) {
      setProblem(error instanceof Error ? error.message : 'Could not read the pictures.')
    }
    setBusy(false)
  }

  return (
    <details className="rounded-xl border border-gray-200 bg-white">
      <summary className="cursor-pointer list-none px-3 py-2 text-sm font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">Real photos ▾</summary>
      <div className="space-y-2.5 px-3 pb-3 text-xs text-gray-600">
        <p>Real pictures make a site look finished. Use your own (the first one is the main picture, the second goes in the About section, the rest in the gallery).</p>
        <label className="block space-y-1">
          <span className="font-medium text-gray-700">Your own photos (up to 8)</span>
          <input type="file" accept="image/*" multiple onChange={(e) => void upload(e.target.files)} className="block w-full text-xs" />
        </label>
        <div className="space-y-1">
          <span className="font-medium text-gray-700">Or draw scenes with the image AI (PixelMath)</span>
          <p className="text-[11px] text-gray-500">Flat illustrations that fit your kind of business (sunsets, skylines, forests, galaxies, mandalas): not photos of your products. Needs: npm run images and npm run server.</p>
          <button type="button" onClick={() => void draw()} disabled={busy} className="w-full rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
            {busy && progress ? `Drawing ${progress} ...` : round ? 'Draw other scenes' : 'Draw scenes for my site'}
          </button>
        </div>
        <div className="space-y-1">
          <span className="font-medium text-gray-700">Or make abstract art with maths (no engine needed)</span>
          <p className="text-[11px] text-gray-500">Smooth noise, fractals and tree or snowflake drawings in colours worked out from your site colours: many are tried, the judge keeps the best.</p>
          <button type="button" onClick={drawArt} disabled={busy} className="w-full rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50">
            {artRound ? 'Make other art' : 'Make abstract art'}
          </button>
        </div>
        {problem && <p className="text-amber-700">{problem}</p>}
        {hasPhotos && (
          <button type="button" onClick={onClear} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100">
            Remove the photos
          </button>
        )}
      </div>
    </details>
  )
}

export default PhotosPanel
