// Measures many generated first screens (http://localhost:5173/?genqa=1&n=200): each is drawn at phone and desktop width, and what can be checked without eyes is checked:
// sideways scroll, a headline that does not fit, a text that cannot be read, buttons too small to tap, a missing picture, a first screen that is taller than the screen can show.
// The result is JSON (window.__genqa); `npm run qa:gen` reads it with headless Chrome.
import { useEffect, useRef, useState } from 'react'
import { buildLibraryStandalone } from './generator/exportLibrary'
import { generateLibraryPage } from './generator/library/generateLibraryPage'
import { auditPage } from './generator/library/pageAudit'
import { randomSpec, specId, describeSpec, specOfId, type HeroMood, type HeroSpec } from './generator/gen/heroSpec'
import { seededRandom } from './generator/random'

const PROMPTS = ['cafe website in Jaipur', 'dental clinic website in Pune', 'law firm website', 'gym website with personal training', 'boutique clothing store website', 'SaaS startup landing page', 'yoga studio website in Rishikesh', 'kirana dukaan ki website', 'bakery website', 'real estate agency website in Mumbai']
const MOODS: HeroMood[] = ['any', 'calm', 'bold', 'soft', 'dark', 'playful']
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export type GenRow = { id: string; spec: string; prompt: string; problems: string[]; height: { phone: number; desktop: number } }

export default function GenQa() {
  const n = Number(new URLSearchParams(location.search).get('n') ?? 100)
  const [rows, setRows] = useState<GenRow[]>([])
  const [done, setDone] = useState(false)
  const frame = useRef<HTMLIFrameElement>(null)
  useEffect(() => {
    let alive = true
    void (async () => {
      // (not inside the effect itself: the pages are drawn with a React root of their own)
      await wait(50)
      const rand = seededRandom(424242)
      const made: HeroSpec[] = []
      for (let i = 0; i < n && alive; i += 1) {
        const mood = MOODS[i % MOODS.length]
        const spec = randomSpec(rand, mood, made.slice(-3))
        made.push(spec)
        const id = specId(spec)
        const prompt = PROMPTS[i % PROMPTS.length]
        const problems: string[] = []
        const height = { phone: 0, desktop: 0 }
        try {
          const lib = generateLibraryPage(prompt, 3 + (i % 5), 'better', true, 'auto', undefined, false)
          const keep = lib.sections.filter((s) => s.role === 'nav' || s.role === 'hero').map((s) => (s.role === 'hero' ? { ...s, componentId: id } : s))
          const f = frame.current!
          f.style.width = '390px'
          await new Promise<void>((resolve) => { f.onload = () => resolve(); f.srcdoc = buildLibraryStandalone({ ...lib, sections: keep }) })
          // (the first one waits for the fonts and the compiler)
          for (let tries = 0; tries < 8 && !f.contentDocument?.querySelector('[data-gen="hero"]'); tries += 1) await wait(500)
          await wait(700)
          for (const [label, width] of [['phone', 390], ['desktop', 1280]] as const) {
            f.style.width = `${width}px`
            await wait(350)
            const d = f.contentDocument!
            const w = f.contentWindow!
            const hero = d.querySelector<HTMLElement>('[data-gen="hero"]')
            if (!hero) { problems.push('not drawn'); break }
            height[label] = Math.round(hero.getBoundingClientRect().height)
            if (d.documentElement.scrollWidth > w.innerWidth + 1) problems.push(`${label}: sideways scroll`)
            const title = hero.querySelector<HTMLElement>('[data-slot="title"]')
            if (!title) problems.push(`${label}: no headline`)
            else {
              if (title.scrollWidth > title.clientWidth + 2) problems.push(`${label}: headline clipped`)
              const r = title.getBoundingClientRect()
              if (r.right > w.innerWidth + 1 || r.left < -1) problems.push(`${label}: headline outside the screen`)
            }
            const img = hero.querySelector<HTMLImageElement>('img[data-slot="image"]')
            if (!img || !img.getAttribute('src')) problems.push(`${label}: no picture`)
            else if (img.getBoundingClientRect().height < 80) problems.push(`${label}: picture too small`)
            for (const b of hero.querySelectorAll<HTMLElement>('[data-slot="button"],[data-slot="button2"]')) if (b.getBoundingClientRect().height < 40) problems.push(`${label}: small button`)
            const audit = auditPage(hero)
            if (audit.failures.length) problems.push(`${label}: ${audit.failures.length} text(s) hard to read (${audit.failures[0].text.slice(0, 18)} ${audit.failures[0].ratio})`)
            if (label === 'desktop' && height.desktop > 1000) problems.push(`desktop: taller than a screen (${height.desktop}px)`)
            if (label === 'phone' && height.phone > 1500) problems.push(`phone: very tall (${height.phone}px)`)
          }
        } catch (error) {
          problems.push(`crashed: ${String(error).slice(0, 80)}`)
        }
        setRows((list) => [...list, { id, spec: describeSpec(specOfId(id) as HeroSpec), prompt, problems: [...new Set(problems)], height }])
      }
      if (alive) setDone(true)
    })()
    return () => { alive = false }
  }, [n])
  useEffect(() => { (window as unknown as { __genqa: unknown }).__genqa = { done, rows } }, [done, rows])
  return (
    <div style={{ font: '13px/1.4 system-ui', padding: 16 }}>
      <h1 style={{ fontSize: 18 }}>Generated first screens {rows.length}/{n} {done ? '(done)' : '...'}</h1>
      <p>{rows.filter((r) => r.problems.length).length} with a finding</p>
      <iframe ref={frame} title="hero" style={{ width: 390, height: 900, border: '1px solid #ccc', position: 'absolute', left: -3000 }} />
      <ul>{rows.filter((r) => r.problems.length).slice(0, 40).map((r) => <li key={r.id + r.prompt}>{r.spec}: {r.problems.join(', ')}</li>)}</ul>
    </div>
  )
}
