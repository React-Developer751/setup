import { useEffect, useState } from 'react'

// The screen while a new site is made (like the build screen of an AI site builder): what is being thought out right now, a sketch of the page that fills
// in step by step, and a bar that moves. The steps follow what the generator really does (reading the prompt, the design memory, the words, the pictures).
const STEPS = [
  { title: 'Reading what you wrote', note: 'the business, the place, the words that matter' },
  { title: 'Choosing a design that fits', note: 'colours, type and the feel of your kind of business' },
  { title: 'Writing the pages in your words', note: 'headline, services, questions, contact' },
  { title: 'Drawing the pictures', note: 'a first screen, an about picture and a gallery' },
  { title: 'Putting it together and checking', note: 'every part in place, readable and ready to look at' },
]
const TIPS = [
  'You can change anything afterwards by chatting: "make the buttons blue", "add a gallery".',
  'Another variation gives a different design, not the same one with new colours.',
  'The Code tab shows every file. You can edit it and download it.',
  'Rate a design right or not this one: the next ones learn from you.',
]

export function BuildingScreen({ prompt, stage, open }: { prompt: string; stage: number; open: boolean }) {
  // the screen fades out when the site is ready, and is gone after that (a new build is a new screen: the parent gives it a new key)
  const [hold, setHold] = useState(true)
  const [seconds, setSeconds] = useState(0)
  const [tip, setTip] = useState(0)
  useEffect(() => {
    if (open) return
    const id = window.setTimeout(() => setHold(false), 650)
    return () => window.clearTimeout(id)
  }, [open])
  useEffect(() => {
    if (!open) return
    const tick = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    const rotate = window.setInterval(() => setTip((t) => (t + 1) % TIPS.length), 5200)
    return () => {
      window.clearInterval(tick)
      window.clearInterval(rotate)
    }
  }, [open])
  if (!open && !hold) return null

  const done = !open
  const at = Math.min(stage, STEPS.length - 1)
  // the bar: a share for every step reached, and a slow creep inside the step that is running (it never reaches the next one by itself)
  const creep = 1 - 1 / (1 + seconds / 6)
  const progress = done ? 1 : Math.min(0.96, (at + creep * 0.9) / STEPS.length)

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Building your website"
      className={`absolute inset-0 z-30 flex items-center justify-center overflow-hidden bg-[#fbf8f5]/90 p-4 backdrop-blur-md transition-opacity duration-500 ${done ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="lv-orb lv-orb-a" aria-hidden="true" />
      <div className="lv-orb lv-orb-b" aria-hidden="true" />
      <div className="relative grid w-full max-w-3xl gap-6 md:grid-cols-[1.05fr_1fr]">
        {/* the sketch of the page: parts appear as the steps are reached */}
        <div className="lv-card hidden overflow-hidden p-3 md:block" aria-hidden="true">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-red-300" />
            <span className="size-2 rounded-full bg-amber-300" />
            <span className="size-2 rounded-full bg-emerald-300" />
            <span className="lv-skeleton ml-3 h-2 w-24 rounded-full" />
          </div>
          <div className="space-y-3 rounded-lg bg-white/70 p-3">
            <div className={`flex items-center justify-between transition-all duration-700 ${at >= 1 ? 'opacity-100' : 'opacity-20'}`}>
              <span className="lv-skeleton h-3 w-20 rounded" />
              <span className="flex gap-2">
                <span className="lv-skeleton h-2 w-8 rounded" />
                <span className="lv-skeleton h-2 w-8 rounded" />
                <span className="lv-skeleton h-2 w-8 rounded" />
              </span>
            </div>
            <div className={`space-y-2 rounded-lg p-4 transition-all duration-700 ${at >= 1 ? 'opacity-100' : 'opacity-20'}`} style={{ background: 'var(--lv-grad)', opacity: at >= 1 ? 0.18 : 0.06 }}>
              <span className="lv-skeleton block h-4 w-3/4 rounded" />
              <span className="lv-skeleton block h-4 w-1/2 rounded" />
              <span className="lv-skeleton block h-2 w-2/3 rounded" />
              <span className="lv-skeleton mt-2 block h-6 w-24 rounded-full" />
            </div>
            <div className={`grid grid-cols-3 gap-2 transition-all duration-700 ${at >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-1.5 rounded-lg bg-white p-2 ring-1 ring-black/5">
                  <span className="lv-skeleton block h-2.5 w-2/3 rounded" />
                  <span className="lv-skeleton block h-2 w-full rounded" />
                  <span className="lv-skeleton block h-2 w-5/6 rounded" />
                </div>
              ))}
            </div>
            <div className={`grid grid-cols-4 gap-2 transition-all duration-700 ${at >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}>
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="lv-skeleton block aspect-[4/3] rounded-lg" style={{ animationDelay: `${i * 160}ms` }} />
              ))}
            </div>
            <div className={`space-y-1.5 transition-all duration-700 ${at >= 4 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}>
              <span className="lv-skeleton block h-2.5 w-1/3 rounded" />
              <span className="lv-skeleton block h-8 w-full rounded-lg" />
            </div>
          </div>
        </div>

        {/* what is happening */}
        <div className="flex flex-col justify-center">
          <div className="mb-4 flex items-center gap-3">
            <span className="lv-spinner" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-bold tracking-tight text-stone-900">{done ? 'Your website is ready' : 'Building your website'}</h2>
              <p className="line-clamp-1 text-xs text-stone-500">{prompt}</p>
            </div>
          </div>
          <ol className="space-y-2.5">
            {STEPS.map((step, i) => {
              const state = done || i < at ? 'done' : i === at ? 'now' : 'next'
              return (
                <li key={step.title} className={`flex items-start gap-3 transition-opacity duration-500 ${state === 'next' ? 'opacity-45' : 'opacity-100'}`}>
                  <span
                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${state === 'done' ? 'bg-emerald-500 text-white' : state === 'now' ? 'bg-violet-600 text-white lv-pulse' : 'bg-stone-200 text-stone-500'}`}
                  >
                    {state === 'done' ? (
                      <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m5 12 5 5 9-10" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-sm ${state === 'now' ? 'font-semibold text-stone-900' : 'font-medium text-stone-700'}`}>{step.title}</span>
                    {state === 'now' && <span className="block text-xs text-stone-500">{step.note}</span>}
                  </span>
                </li>
              )
            })}
          </ol>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-stone-200" aria-hidden="true">
            <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${Math.round(progress * 100)}%`, background: 'var(--lv-grad)' }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500">
            <span>{done ? 'Done' : `${seconds}s`}</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <p className="mt-4 min-h-10 text-xs leading-relaxed text-stone-500" key={tip}>
            <span className="font-semibold text-stone-700">Tip: </span>
            {TIPS[tip]}
          </p>
        </div>
      </div>
    </div>
  )
}
