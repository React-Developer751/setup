// The review page of the design generator (http://localhost:5173/?gen=1): a grid of first screens made by the generator, each drawn in a frame at phone or desktop width, measured, and rated with a
// thumb. The ratings are kept (this browser and the server, per person) and teach the generator which looks are liked.
import { useEffect, useMemo, useRef, useState } from 'react'
import { buildLibraryStandalone } from './generator/exportLibrary'
import { generateLibraryPage } from './generator/library/generateLibraryPage'
import { decodeId, describeSpec, randomSpec, specId, specOfId, type HeroMood, type HeroSpec } from './generator/gen/heroSpec'
import { seededRandom } from './generator/random'
import { MIN_RATINGS, setHeroTaste, tasteActive, tasteTable } from './generator/gen/heroTaste'

const PROMPTS = ['cafe website in Jaipur', 'dental clinic website in Pune', 'law firm website', 'gym website with personal training', 'boutique clothing store website', 'SaaS startup landing page', 'yoga studio website in Rishikesh', 'kirana dukaan ki website']
const MOODS: HeroMood[] = ['any', 'calm', 'bold', 'soft', 'dark', 'playful']
const KEY = 'ui-blocks:gen-ratings'

type Rating = { id: string; up: boolean; mood: string; prompt: string }
/** a thumb belongs to a hero AND the business it was seen for: the same hero is rated again for every business */
const keyOf = (id: string, prompt: string) => `${id}|${prompt}`
const readRatings = (): Record<string, Rating> => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, Rating>
    // thumbs kept before the key held the business: they are moved to the business they were given for
    return Object.fromEntries(Object.values(raw).map((r) => [keyOf(r.id, r.prompt), r]))
  } catch {
    return {}
  }
}

function Card({ id, prompt, width, rating, onRate }: { id: string; prompt: string; width: number; rating?: boolean; onRate: (up: boolean) => void }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [facts, setFacts] = useState<string>('')
  const [html, setHtml] = useState('')
  // (the page is drawn off screen with its own React root: not while this component is being drawn)
  useEffect(() => {
    const t = window.setTimeout(() => {
      const lib = generateLibraryPage(prompt, 3, 'better', true, 'auto', undefined, false)
      const keep = lib.sections.filter((s) => s.role === 'nav' || s.role === 'hero').map((s) => (s.role === 'hero' ? { ...s, componentId: id } : s))
      setHtml(buildLibraryStandalone({ ...lib, sections: keep }))
    }, 0)
    return () => window.clearTimeout(t)
  }, [id, prompt])
  useEffect(() => {
    const f = frame.current
    if (!f) return
    const t = window.setTimeout(() => {
      const d = f.contentDocument
      const w = f.contentWindow
      if (!d || !w) return
      const hero = d.querySelector<HTMLElement>('[data-gen="hero"]')
      const sideways = d.documentElement.scrollWidth > w.innerWidth + 1
      const title = d.querySelector<HTMLElement>('[data-slot="title"]')
      const size = title ? parseFloat(w.getComputedStyle(title).fontSize) : 0
      const img = d.querySelector<HTMLImageElement>('img[data-slot="image"]')
      setFacts([sideways && 'sideways scroll', !hero && 'not drawn', img && !img.getAttribute('src') && 'no picture', title && title.scrollWidth > title.clientWidth + 2 && 'headline clipped', hero && `${Math.round(hero.getBoundingClientRect().height)}px high`, size && `headline ${Math.round(size)}px`].filter(Boolean).join(' · '))
    }, 1400)
    return () => window.clearTimeout(t)
  }, [html, width])
  const spec = specOfId(id) as HeroSpec
  return (
    <div style={{ border: '1px solid #e7e5e4', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
      <iframe ref={frame} title={id} srcDoc={html} style={{ width, height: 620, border: 0, display: 'block', maxWidth: '100%' }} />
      <div style={{ padding: 10, fontSize: 12, lineHeight: 1.4 }}>
        <div style={{ fontWeight: 600 }}>{describeSpec(spec)}</div>
        <div style={{ color: '#78716c' }}>{id} · {facts || 'measuring ...'}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button type="button" onClick={() => onRate(true)} aria-pressed={rating === true} style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid #d6d3d1', background: rating === true ? '#dcfce7' : '#fff' }}>👍 good</button>
          <button type="button" onClick={() => onRate(false)} aria-pressed={rating === false} style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid #d6d3d1', background: rating === false ? '#fee2e2' : '#fff' }}>👎 not good</button>
        </div>
      </div>
    </div>
  )
}

export default function GenReview() {
  const [mood, setMood] = useState<HeroMood>('any')
  const [prompt, setPrompt] = useState(PROMPTS[0])
  const [batch, setBatch] = useState(1)
  const [width, setWidth] = useState(1100)
  const [ratings, setRatings] = useState<Record<string, Rating>>(readRatings)
  // the ratings the server holds for this person are merged in (a thumb given in another browser or window counts too)
  useEffect(() => {
    void fetch('/api/gen-ratings').then((r) => (r.ok ? r.json() : undefined)).then((body: { rows?: { id: string; up: boolean; mood: string; prompt: string }[] } | undefined) => {
      if (!body?.rows?.length) return
      setRatings((current) => ({ ...Object.fromEntries(body.rows!.map((r) => [keyOf(r.id, r.prompt), r])), ...current }))
    }).catch(() => undefined)
  }, [])
  // the taste of the generator follows the ratings (it starts to matter at MIN_RATINGS)
  setHeroTaste(Object.values(ratings), decodeId)
  const ids = useMemo(() => {
    // /?gen=1&ids=gen/Hero_abc,gen/Hero_def shows exactly these
    const fixed = (new URLSearchParams(location.search).get('ids') ?? '').split(',').filter((id) => !!specOfId(id))
    if (fixed.length) return fixed
    const rand = seededRandom(batch * 7919 + MOODS.indexOf(mood) * 101)
    const made: HeroSpec[] = []
    while (made.length < 8) made.push(randomSpec(rand, mood, made))
    return made.map(specId)
  }, [mood, batch])
  const rate = (id: string, up: boolean) => {
    const next = { ...ratings, [keyOf(id, prompt)]: { id, up, mood, prompt } }
    setRatings(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      // kept in the page only
    }
    void fetch('/api/gen-ratings', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, up, mood, prompt }) }).catch(() => undefined)
  }
  const table = tasteTable().filter((t) => t.up + t.down >= 2)
  // most of what people see is liked, so the useful list is the dislike rate: the choices that were not liked most often, and the ones with many thumbs and none down
  const share = (t: { up: number; down: number }) => t.down / (t.up + t.down)
  const disliked = table.filter((t) => t.up + t.down >= 8 && t.down > 0).sort((a, b) => share(b) - share(a)).slice(0, 6)
  const liked = table.filter((t) => t.up + t.down >= 25 && t.down === 0).slice(0, 6)
  const good = Object.values(ratings).filter((r) => r.up).length
  const bad = Object.values(ratings).filter((r) => !r.up).length
  return (
    <div style={{ font: '14px/1.45 system-ui', padding: 16, background: '#fafaf9', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 18, margin: '0 0 8px' }}>Design generator: first screens ({good} liked, {bad} not liked)</h1>
      <p style={{ margin: '0 0 10px', color: '#57534e' }}>
        {tasteActive() ? 'The generator now draws what you liked more often.' : `The generator starts to learn from your thumbs at ${MIN_RATINGS} ratings (${good + bad} so far): rate more, in other moods and for other businesses.`}
        {liked.length > 0 && <> <b>Never disliked:</b> {liked.map((t) => `${t.key}=${t.option} (${t.up} liked)`).join(', ')}.</>}
        {disliked.length > 0 && <> <b>Not liked most often:</b> {disliked.map((t) => `${t.key}=${t.option} (${t.down} of ${t.up + t.down})`).join(', ')}.</>}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 14 }}>
        <label>Business <select value={prompt} onChange={(e) => setPrompt(e.target.value)}>{PROMPTS.map((p) => <option key={p}>{p}</option>)}</select></label>
        <label>Mood <select value={mood} onChange={(e) => setMood(e.target.value as HeroMood)}>{MOODS.map((m) => <option key={m}>{m}</option>)}</select></label>
        <label>Width <select value={width} onChange={(e) => setWidth(Number(e.target.value))}><option value={390}>phone 390</option><option value={820}>tablet 820</option><option value={1100}>desktop 1100</option></select></label>
        <button type="button" onClick={() => setBatch((b) => b + 1)} style={{ padding: '4px 12px' }}>Another 8</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill,minmax(${Math.min(width, 520) + 8}px,1fr))`, gap: 14 }}>
        {ids.map((id) => <Card key={`${id}|${prompt}|${width}`} id={id} prompt={prompt} width={width} rating={ratings[keyOf(id, prompt)]?.up} onRate={(up) => rate(id, up)} />)}
      </div>
    </div>
  )
}
