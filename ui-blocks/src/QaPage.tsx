// The page-quality check (development only: http://localhost:5173/?qa=1&from=0&to=100). Every benchmark prompt is made into a site, opened in a frame at phone and desktop
// width, and measured: sideways overflow, broken pictures, clipped or tiny text, empty parts, tiny tap targets, script errors, the h1, the page length.
// The result is a table and JSON (window.__qa, #qa-json); `npm run qa` reads it with headless Chrome.
import { useEffect, useRef, useState } from 'react'
import prompts from './data/benchmark-prompts.json'
import { buildLibraryStandalone } from './generator/exportLibrary'
import { generateLibraryPage } from './generator/library/generateLibraryPage'
import { editsFrom } from './generator/edit/edits'
import { MemoryStore } from './generator/memory/designStore'
import { planDesign } from './generator/memory/designPlanner'
import { seededRandom } from './generator/random'

type Measure = { overflowX: boolean; brokenImages: number; clippedText: number; tinyText: number; emptyParts: number; smallTargets: number; h1: number; height: number; noAlt: number; unlabelled: number; /** what the findings are about (first three) */ examples: string[] }
export type QaRow = { prompt: string; kind: string; errors: string[]; phone: Measure; desktop: Measure; meta: { title: boolean; description: boolean; lang: boolean; reducedMotion: boolean }; problems: string[] }

function measure(doc: Document, win: Window, phone: boolean): Measure {
  const visible = (el: Element) => {
    const r = el.getBoundingClientRect()
    const s = win.getComputedStyle(el)
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0'
  }
  const name = (el: Element) => `${el.tagName.toLowerCase()}|${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 18)}|${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}|${(el.getAttribute('class') ?? '').slice(0, 40)}`
  const text = [...doc.querySelectorAll('h1,h2,h3,h4,p,a,button,li,span,label')].filter((el) => el.children.length === 0 && (el.textContent ?? '').trim().length > 3 && visible(el))
  const small = phone ? [...doc.querySelectorAll('a,button')].filter((el) => visible(el) && !el.closest('p,li') && (el.getBoundingClientRect().width < 28 || el.getBoundingClientRect().height < 28)) : []
  const clipped = text.filter((el) => !el.closest('.sr-only') && !el.classList.contains('sr-only')).filter((el) => { const s = win.getComputedStyle(el); return el.scrollWidth > el.clientWidth + 3 && s.overflowX !== 'visible' && s.textOverflow !== 'ellipsis' })
  return {
    examples: [...small.slice(0, 3).map((e) => `tap ${name(e)}`), ...clipped.slice(0, 2).map((e) => `clip ${name(e)}`)],
    overflowX: doc.documentElement.scrollWidth > win.innerWidth + 1,
    brokenImages: [...doc.images].filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).length,
    clippedText: clipped.length,
    tinyText: text.filter((el) => parseFloat(win.getComputedStyle(el).fontSize) < 11).length,
    emptyParts: [...doc.querySelectorAll<HTMLElement>('[data-role]')].filter((el) => !el.hidden && el.getBoundingClientRect().height < 24).length,
    smallTargets: small.length,
    h1: doc.querySelectorAll('h1').length,
    height: Math.round(doc.documentElement.scrollHeight),
    noAlt: [...doc.images].filter((i) => !i.hasAttribute('alt')).length,
    // fields a screen reader cannot name: no label, no aria-label, no title, no placeholder
    unlabelled: [...doc.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=checkbox]):not([type=radio]),textarea,select')].filter((f) => !f.getAttribute('aria-label') && !f.getAttribute('title') && !f.getAttribute('placeholder') && !(f.id && doc.querySelector(`label[for="${f.id}"]`)) && !f.closest('label')).length,
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export default function QaPage() {
  const params = new URLSearchParams(location.search)
  const from = Number(params.get('from') ?? 0)
  const to = Math.min(prompts.length, Number(params.get('to') ?? prompts.length))
  const [rows, setRows] = useState<QaRow[]>([])
  const [done, setDone] = useState(false)
  const frame = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    let alive = true
    void (async () => {
      const store = new MemoryStore()
      for (let i = from; i < to && alive; i += 1) {
        const item = prompts[i]
        try {
          const plan = await planDesign(item.prompt, store, { group: `g${i}`, creativity: 'balanced', temperature: 0.5, rand: seededRandom(11 + i) })
          const lib = generateLibraryPage(item.prompt, plan.variation, undefined, true, 'auto', editsFrom(plan.ops))
          const html = buildLibraryStandalone(lib).replace('<head>', '<head><script>window.__errs=[];addEventListener("error",function(e){__errs.push(String(e.message))})</script>')
          const f = frame.current!
          f.style.width = '390px'
          await new Promise<void>((resolve) => { f.onload = () => resolve(); f.srcdoc = html })
          await wait(900)
          const win = f.contentWindow!
          const phone = measure(win.document, win, true)
          f.style.width = '1280px'
          await wait(500)
          const desktop = measure(win.document, win, false)
          const doc = win.document
          const errors = ((win as unknown as { __errs?: string[] }).__errs ?? []).slice(0, 3)
          const meta = { title: !!doc.title, description: !!doc.querySelector('meta[name="description"]'), lang: !!doc.documentElement.lang, reducedMotion: html.includes('prefers-reduced-motion') }
          const problems = [
            phone.overflowX && 'phone: sideways scroll', desktop.overflowX && 'desktop: sideways scroll', (phone.brokenImages || desktop.brokenImages) && 'broken picture', (phone.clippedText > 2 || desktop.clippedText > 2) && 'clipped text',
            phone.tinyText > 0 && 'tiny text', phone.emptyParts > 0 && 'empty part', phone.smallTargets > 3 && 'small tap targets', phone.h1 !== 1 && `h1 x${phone.h1}`, desktop.height < 3200 && `short page (${desktop.height}px)`, errors.length > 0 && 'script error', !meta.description && 'no meta description', phone.noAlt > 0 && 'picture without alt', phone.unlabelled > 0 && 'form field without a name',
          ].filter(Boolean) as string[]
          setRows((list) => [...list, { prompt: item.prompt, kind: item.kind, errors, phone, desktop, meta, problems }])
        } catch (error) {
          setRows((list) => [...list, { prompt: item.prompt, kind: item.kind, errors: [String(error)], phone: {} as Measure, desktop: {} as Measure, meta: { title: false, description: false, lang: false, reducedMotion: false }, problems: ['crashed'] }])
        }
      }
      if (alive) setDone(true)
    })()
    return () => { alive = false }
  }, [from, to])

  useEffect(() => { (window as unknown as { __qa: unknown }).__qa = { done, rows } }, [done, rows])
  const bad = rows.filter((r) => r.problems.length)
  return (
    <div style={{ font: '13px/1.4 system-ui', padding: 16 }}>
      <h1 style={{ fontSize: 18 }}>Page quality check {rows.length}/{to - from} {done ? '(done)' : '...'}</h1>
      <p>{bad.length} of {rows.length} sites have a problem.</p>
      <iframe ref={frame} title="site" style={{ width: 390, height: 700, border: '1px solid #ccc', position: 'absolute', left: -3000 }} />
      <ul>{rows.map((r, i) => <li key={i} style={{ color: r.problems.length ? '#b91c1c' : '#166534' }}>{r.prompt.slice(0, 60)}: {r.problems.join(', ') || 'ok'}</li>)}</ul>
      {done && <pre id="qa-json" style={{ whiteSpace: 'pre-wrap', fontSize: 10 }}>{JSON.stringify({ done, rows })}</pre>}
    </div>
  )
}
