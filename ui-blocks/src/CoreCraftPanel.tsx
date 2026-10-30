// Core-Craft AI, the second Content AI (optional, `npm run corecraft`): it writes pages of copy for the prompt, a gate keeps only the lines
// that really fit the business, and each accepted line can be used for the first screen with one click.
import { useState } from 'react'
import { askCoreCraft, gateCandidates, type CoreSlot, type GateContext, type Rejection, type Suggestion } from './generator/edit/corecraft'

type Props = {
  gate: () => GateContext
  prompt: string
  onUse: (slot: CoreSlot, text: string) => void
  /** Core-Craft writes the whole page where this project's own texts cannot (Hindi, a business without a text pack that names its services) */
  auto: boolean
  onAuto: (on: boolean) => void
  /** who wrote the current page, and why */
  note: string
}

const SLOT_NAME: Record<CoreSlot, string> = { heroTitle: 'Heading', heroSubtitle: 'Subheading', heroButton: 'Button' }

function CoreCraftPanel({ gate, prompt, onUse, auto, onAuto, note }: Props) {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ accepted: Suggestion[]; rejected: Rejection[]; total: number } | undefined>()
  const [error, setError] = useState('')
  const [showWhy, setShowWhy] = useState(false)

  const ask = async () => {
    setBusy(true)
    setError('')
    const pages = await askCoreCraft(prompt, 8)
    setBusy(false)
    if (!pages) return setError('The text writer did not answer. Please try again in a moment.')
    const gated = gateCandidates(pages, gate())
    setResult({ ...gated, total: gated.accepted.length + gated.rejected.length })
  }

  return (
    <section className="space-y-2 rounded-xl border border-sky-200 bg-sky-50/50 p-3" aria-label="Core-Craft AI">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Core-Craft AI (second Content AI)</h2>
        <p className="text-[11px] text-gray-600">It writes a few lines for your prompt. Only lines that name your business and fit its type are offered; the rest are kept out.</p>
      </div>
      <label className="flex items-start gap-2 text-[11px] text-gray-700">
        <input type="checkbox" checked={auto} onChange={(e) => onAuto(e.target.checked)} className="mt-0.5" />
        <span>Let Core-Craft AI write the whole page for Hindi prompts and for businesses without a text pack that name their services (undo brings the built-in texts back).</span>
      </label>
      {note && <p className="rounded-md bg-white p-2 text-[11px] text-gray-700 ring-1 ring-sky-100">{note}</p>}
      <button type="button" onClick={() => void ask()} disabled={busy} className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-50">
        {busy ? 'Asking ...' : 'Ask Core-Craft AI'}
      </button>
      {error && <p className="text-[11px] text-rose-700">{error}</p>}
      {result && (
        <div className="space-y-1.5">
          {result.accepted.length === 0 ? (
            <p className="text-[11px] text-gray-700">None of its {result.total} lines names your business, so none is offered. The built-in AI keeps the texts of this site.</p>
          ) : (
            <ul className="space-y-1">
              {result.accepted.map((s, i) => (
                <li key={`${s.slot}-${i}`} className="flex items-start justify-between gap-2 rounded-md bg-white p-2 text-xs ring-1 ring-sky-100">
                  <span>
                    <span className="mr-1 font-semibold text-sky-800">{SLOT_NAME[s.slot]}</span>
                    {s.text}
                  </span>
                  <button type="button" onClick={() => onUse(s.slot, s.text)} className="shrink-0 rounded bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-900 hover:bg-sky-200">
                    Use
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button type="button" onClick={() => setShowWhy((v) => !v)} className="text-[11px] text-gray-600 underline">
            {result.rejected.length} of {result.total} lines were kept out {showWhy ? '(hide)' : '(why?)'}
          </button>
          {showWhy && (
            <ul className="max-h-40 space-y-1 overflow-auto text-[11px] text-gray-600">
              {result.rejected.slice(0, 40).map((r, i) => (
                <li key={`${r.slot}-${i}`}>
                  <span className="font-medium">{SLOT_NAME[r.slot]}: </span>“{r.text}” <span className="text-gray-500">- {r.reason}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}

export default CoreCraftPanel
