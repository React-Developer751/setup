// A thumb up or down on each picture the image AI drew: this is what teaches the main AI which scenes fit which kind of business.
export type RateItem = { label: string; thumb: string; state?: 'up' | 'down'; busy?: boolean }

type Props = {
  items: RateItem[]
  onRate: (index: number, verdict: 'up' | 'down') => void
}

function RatePictures({ items, onRate }: Props) {
  if (!items.length) return null
  return (
    <section className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3" aria-label="Rate the pictures">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Do the pictures fit your business?</h2>
        <p className="text-[11px] text-gray-600">A thumb up: that scene is used first for this kind of business next time. A thumb down: it is drawn again now and not used for this business again.</p>
      </div>
      <ul className="grid grid-cols-4 gap-2">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="space-y-1">
            <img src={item.thumb} alt={item.label} className="aspect-[4/3] w-full rounded-md object-cover ring-1 ring-gray-200" />
            <div className="flex items-center justify-between gap-1">
              <span className="truncate text-[10px] text-gray-500">{item.label}</span>
              <span className="flex gap-0.5">
                <button type="button" aria-label={`Thumb up: ${item.label}`} aria-pressed={item.state === 'up'} disabled={item.busy} onClick={() => onRate(i, 'up')} className={`rounded px-1 text-sm ${item.state === 'up' ? 'bg-emerald-200' : 'hover:bg-gray-100'} disabled:opacity-40`}>
                  👍
                </button>
                <button type="button" aria-label={`Thumb down: ${item.label}`} aria-pressed={item.state === 'down'} disabled={item.busy} onClick={() => onRate(i, 'down')} className={`rounded px-1 text-sm ${item.state === 'down' ? 'bg-rose-200' : 'hover:bg-gray-100'} disabled:opacity-40`}>
                  👎
                </button>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default RatePictures
