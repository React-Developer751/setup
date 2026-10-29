import { useEffect, useRef, useState } from 'react'

// The first screen: one big prompt box, a few starting points, and what the generator does. The page behind it (GeneratorPage) opens once a prompt is sent.

const ROTATING = [
  'Meri bakery ke liye website banao, Jaipur me, eggless cakes',
  'Dental clinic in Pune: braces, implants, root canal',
  'Italian restaurant Forno Rosso in Mumbai, wood fired pizza',
  'Kurti boutique online, free shipping above 999',
  'Gym in Delhi with personal training and zumba',
  'Wedding photographer in Udaipur, portfolio site',
]

const STARTS: { icon: string; label: string; prompt: string }[] = [
  { icon: '🍽️', label: 'Restaurant', prompt: 'Italian restaurant Forno Rosso in Mumbai, wood fired pizza, fresh pasta, tiramisu, open 12pm to 11pm' },
  { icon: '🦷', label: 'Clinic', prompt: 'Dental clinic Smile Care in Pune, braces, implants, root canal' },
  { icon: '💪', label: 'Gym', prompt: 'Gym in Jaipur with personal training, zumba and a free trial' },
  { icon: '👗', label: 'Boutique', prompt: 'Kurti boutique in Jaipur, online orders, free shipping above 999' },
  { icon: '💇', label: 'Salon', prompt: 'Hair salon Prime in Delhi, haircut, facial, waxing' },
  { icon: '🎓', label: 'Coaching', prompt: 'Coaching institute for UPSC and NEET in Kota' },
  { icon: '📸', label: 'Studio', prompt: 'Wedding photographer in Udaipur, portfolio and packages' },
  { icon: '🐾', label: 'NGO', prompt: 'NGO for stray dogs, rescue and adoption' },
  { icon: '🚀', label: 'SaaS', prompt: 'SaaS tool for invoicing small shops' },
]

const POINTS: { title: string; text: string }[] = [
  { title: 'Fits the business', text: 'A clinic moves calmly, a gym punches in, a restaurant lingers on its pictures: every kind of business gets its own motion and page length.' },
  { title: 'Designs from real sites', text: 'Colours, type and layout read from award-winning and well-known sites, chosen by what you sell.' },
  { title: 'Ready to use', text: 'Working forms, call and WhatsApp links, SEO files and a clean export you can host anywhere. No AI service or API key.' },
]

export function Landing({ onSubmit, canContinue, onContinue }: {
  onSubmit: (text: string) => void
  /** the title of the work of the last visit, when there is one */
  canContinue?: string
  onContinue?: () => void
}) {
  const box = useRef<HTMLTextAreaElement>(null)
  // what is typed here (empty at first: the grey example in the box changes every few seconds)
  const [prompt, onPrompt] = useState('')
  const [hint, setHint] = useState(0)
  useEffect(() => {
    box.current?.focus()
    const id = window.setInterval(() => setHint((h) => (h + 1) % ROTATING.length), 3200)
    return () => window.clearInterval(id)
  }, [])
  const send = () => {
    const text = prompt.trim()
    if (text.length >= 2) onSubmit(text)
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-5 pb-16 pt-12 sm:pt-20">
      <div className="lv-rise flex items-center gap-2 rounded-full border border-black/5 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-stone-600 shadow-sm backdrop-blur">
        <span className="size-1.5 rounded-full bg-emerald-500" /> Works offline · no AI service, no API key
      </div>

      <h1 className="lv-rise mt-6 max-w-3xl text-center text-4xl font-extrabold leading-[1.05] tracking-tight text-stone-900 sm:text-6xl" style={{ animationDelay: '60ms' }}>
        Describe a business.<br />
        Get a <span className="lv-grad-text">website that sells.</span>
      </h1>
      <p className="lv-rise mt-5 max-w-xl text-center text-base text-stone-600 sm:text-lg" style={{ animationDelay: '120ms' }}>
        Type it in English, Hinglish or Hindi. Pages, pictures, motion and colours are made for that kind of business, and you can change anything by chatting.
      </p>

      <div className="lv-rise lv-composer mt-9 w-full max-w-2xl p-4 sm:p-5" style={{ animationDelay: '180ms' }}>
        <label htmlFor="landing-prompt" className="sr-only">
          Describe your website
        </label>
        <textarea
          id="landing-prompt"
          ref={box}
          rows={3}
          value={prompt}
          onChange={(e) => onPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder={ROTATING[hint]}
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-stone-400">One page or several, the design, the colours and the words: I decide from what you write. Enter to send.</p>
          <button type="button" onClick={send} disabled={prompt.trim().length < 2} className="lv-btn lv-btn-primary px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50">
            Build my website
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="lv-rise mt-6 flex max-w-2xl flex-wrap justify-center gap-2" style={{ animationDelay: '240ms' }}>
        {STARTS.map((start) => (
          <button key={start.label} type="button" className="lv-chip" onClick={() => onSubmit(start.prompt)}>
            <span aria-hidden="true">{start.icon}</span>
            {start.label}
          </button>
        ))}
      </div>

      {canContinue && onContinue && (
        <button type="button" onClick={onContinue} className="lv-rise lv-btn lv-btn-ghost mt-5 px-4 py-2 text-sm" style={{ animationDelay: '280ms' }}>
          Continue your last site: <b className="max-w-[16rem] truncate">{canContinue}</b>
        </button>
      )}

      <div className="lv-rise mt-14 grid w-full max-w-4xl gap-4 sm:grid-cols-3" style={{ animationDelay: '320ms' }}>
        {POINTS.map((point, i) => (
          <div key={point.title} className="lv-card p-5">
            <div className="mb-3 flex size-9 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ background: 'var(--lv-grad)' }}>
              {i + 1}
            </div>
            <h2 className="text-sm font-semibold text-stone-900">{point.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{point.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
