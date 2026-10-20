// The design memory on the page: the designs made for this kind of business, which one is the right one, and what the memory learned from them.
import type { DesignRecord } from './generator/memory/designStore'
import type { Insights } from './generator/memory/designMemory'

type Props = {
  designs: DesignRecord[]
  currentId?: string
  insights: Insights
  where: 'server' | 'browser' | 'memory'
  busy: boolean
  onVerdict: (id: string, verdict: 'good' | 'bad', best: boolean) => void
  onNew: () => void
}

function DesignHistory({ designs, currentId, insights, where, busy, onVerdict, onNew }: Props) {
  if (!designs.length) return null
  return (
    <section className="space-y-2 rounded-xl border border-violet-200 bg-violet-50/50 p-3" aria-label="Design memory">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Design memory</h2>
          <p className="text-[11px] text-gray-600">Every design is kept ({where === 'server' ? 'in the server database' : 'in this browser'}). Mark the right one: the others of its round are turned down, and the next design learns from it with a colour that is new.</p>
        </div>
        <button type="button" onClick={onNew} disabled={busy} className="shrink-0 rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50">
          {busy ? '...' : 'New design from this'}
        </button>
      </div>
      <ul className="space-y-1.5">
        {designs.slice(0, 8).map((d) => (
          <li key={d.id} className={`flex items-center gap-2 rounded-lg bg-white px-2 py-1.5 ring-1 ${d.id === currentId ? 'ring-violet-400' : 'ring-gray-200'}`}>
            <span className="flex shrink-0">
              <span className="size-5 rounded-full ring-1 ring-black/10" style={{ background: d.accent }} aria-hidden />
              <span className="-ms-1.5 size-5 rounded-full ring-1 ring-black/10" style={{ background: d.alt }} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-gray-800">{d.paletteName}</span>
              <span className="block truncate text-[10px] text-gray-500">
                {d.mode} · {d.heroLayout || 'layout'} · {d.id === currentId ? 'on the page' : new Date(d.at).toLocaleDateString()}
              </span>
            </span>
            {d.verdict !== 'unrated' && <span className={`text-[10px] font-semibold ${d.verdict === 'good' ? 'text-emerald-700' : 'text-rose-600'}`}>{d.verdict === 'good' ? 'kept' : 'turned down'}</span>}
            <span className="flex shrink-0 gap-0.5">
              <button type="button" aria-label={`This is the right design: ${d.paletteName}`} aria-pressed={d.verdict === 'good'} onClick={() => onVerdict(d.id, 'good', true)} className={`rounded px-1 text-sm ${d.verdict === 'good' ? 'bg-emerald-200' : 'hover:bg-gray-100'}`}>
                ✔
              </button>
              <button type="button" aria-label={`Not this design: ${d.paletteName}`} aria-pressed={d.verdict === 'bad'} onClick={() => onVerdict(d.id, 'bad', false)} className={`rounded px-1 text-sm ${d.verdict === 'bad' ? 'bg-rose-200' : 'hover:bg-gray-100'}`}>
                ✖
              </button>
            </span>
          </li>
        ))}
      </ul>
      <ul className="space-y-0.5 text-[11px] text-gray-600">
        {insights.summary.map((line) => (
          <li key={line}>• {line}</li>
        ))}
      </ul>
    </section>
  )
}

export default DesignHistory
