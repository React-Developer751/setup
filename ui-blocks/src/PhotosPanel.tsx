import { useState } from 'react'
import type { EditOp } from './generator/edit/edits'
import type { ScenePlan } from './generator/imageAi'
import { makePictures } from './generator/edit/imageAiClient'
import { readPicture } from './generator/edit/imageFile'
import { searchPhotos, type PhotoResult } from './generator/edit/serverEdit'

type Props = {
  defaultQuery: string
  hasPhotos: boolean
  onApply: (ops: EditOp[], label: string) => void
  onClear: () => void
  /** the photos are put on the pages of the built-in templates; the 92-components page keeps its own pictures */
  supported: boolean
  /** the scenes the image engine would draw for this business (another number = other scenes) */
  planFor: (offset: number) => ScenePlan
  /** the main colour of the site: the check of a picture prefers pictures in its hues */
  accent?: string
  /** what the person asked for: the pictures must show this business */
  prompt?: string
}

/** The first screen, the about picture and the gallery get real photos: from the photo search of the server (Pexels) or from the person's own files. */
function PhotosPanel({ defaultQuery, hasPhotos, onApply, onClear, supported, planFor, accent, prompt }: Props) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<PhotoResult>()
  const [problem, setProblem] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [round, setRound] = useState(0)

  const search = async (nextPage: number) => {
    setBusy(true)
    setProblem('')
    const answer = await searchPhotos((query || defaultQuery).trim(), nextPage)
    setBusy(false)
    if (answer.result) {
      setResult(answer.result)
      setPage(nextPage)
    } else setProblem(answer.problem ?? '')
  }

  const useFound = () => {
    if (!result) return
    const urls = result.photos.map((p) => p.url)
    onApply([{ op: 'photos', hero: urls[0], about: urls[1], gallery: urls.slice(2, 9), credit: `Photos: ${result.source}` }], 'Photos from the search')
  }

  const draw = async () => {
    setBusy(true)
    setProblem('')
    setProgress('0 of 8')
    const answer = await makePictures(planFor(round), (done, total) => setProgress(`${done} of ${total}`), { accent, prompt })
    setBusy(false)
    setProgress('')
    if (answer.ops) {
      setRound((r) => r + 1)
      onApply(answer.ops, 'Pictures from the image AI')
    } else setProblem(answer.problem ?? '')
  }

  const upload = async (files: FileList | null) => {
    const list = [...(files ?? [])].filter((f) => f.type.startsWith('image/')).slice(0, 8)
    if (!list.length) return
    setBusy(true)
    setProblem('')
    try {
      const pictures = await Promise.all(list.map((f) => readPicture(f, 1400)))
      onApply([{ op: 'photos', hero: pictures[0], ...(pictures[1] ? { about: pictures[1] } : {}), ...(pictures.length > 2 ? { gallery: pictures.slice(2) } : {}) }], `${list.length} of my own photos`)
    } catch (error) {
      setProblem(error instanceof Error ? error.message : 'Could not read the pictures.')
    }
    setBusy(false)
  }

  const field = 'w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
  return (
    <details className="rounded-xl border border-gray-200 bg-white">
      <summary className="cursor-pointer list-none px-3 py-2 text-sm font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">Real photos ▾</summary>
      <div className="space-y-2.5 px-3 pb-3 text-xs text-gray-600">
        {!supported && <p className="rounded-lg bg-amber-50 p-2 text-amber-800">The 92-components page keeps its own pictures. Switch "Built with" to Built-in templates (or Multi-page) to use real photos.</p>}
        <p>Real pictures make a site look finished. Use your own (the first one is the main picture, the second goes in the About section, the rest in the gallery), or search free photos.</p>
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
          <span className="font-medium text-gray-700">Or search free photos (needs the server with a Pexels key)</span>
          <div className="flex gap-2">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={defaultQuery || 'bakery'} className={field} aria-label="What the photos should show" />
            <button type="button" onClick={() => void search(1)} disabled={busy} className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              {busy ? '...' : 'Search'}
            </button>
          </div>
        </div>
        {problem && <p className="text-amber-700">{problem}</p>}
        {result && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-1.5">
              {result.photos.map((p, i) => (
                <img key={p.id} src={p.thumb} alt={p.alt || `photo ${i + 1}`} loading="lazy" className="aspect-[4/3] w-full rounded-md object-cover ring-1 ring-gray-200" />
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={useFound} className="flex-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700">
                Use these photos
              </button>
              <button type="button" onClick={() => void search(page + 1)} disabled={busy} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50">
                Another set
              </button>
            </div>
            <p className="text-[11px] text-gray-500">
              Photos from{' '}
              <a href={result.sourceUrl} target="_blank" rel="noreferrer" className="underline">
                {result.source}
              </a>
              : free to use; a thank-you line is added to the footer.
            </p>
          </div>
        )}
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
