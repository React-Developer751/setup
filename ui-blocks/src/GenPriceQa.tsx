// The check of what the person wrote (development only: http://localhost:5173/?genqa=1&section=prices): prompts with prices are made into sites with pages, for many variations; the page of the prices must show every
// price, with its plan name next to it. (Found with a real prompt: the stored price cards put the plan name where the price goes and the prices were gone.)
import { useEffect, useRef, useState } from 'react'
import { buildLibraryStandalone } from './generator/exportLibrary'
import { generateLibraryPage } from './generator/library/generateLibraryPage'
import type { GenRow } from './GenQa'

const CASES = [
  { prompt: 'yoga studio in Rishikesh, pricing: drop-in 500 rupees, monthly 3000 rupees, retreat 12000 rupees, gallery and FAQ', plans: [['Drop-In', '500'], ['Monthly', '3,000'], ['Retreat', '12,000']] },
  { prompt: 'gym in Pune, plans: basic 999 rupees, premium 1999 rupees, personal training 4999 rupees', plans: [['Basic', '999'], ['Premium', '1,999'], ['Personal', '4,999']] },
  { prompt: 'salon in Delhi, haircut 300 rupees, facial 800 rupees, bridal makeup 7000 rupees', plans: [['Haircut', '300'], ['Facial', '800'], ['Bridal', '7,000']] },
]
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export default function GenPriceQa() {
  const n = Number(new URLSearchParams(location.search).get('n') ?? 30)
  const [rows, setRows] = useState<GenRow[]>([])
  const [done, setDone] = useState(false)
  const frame = useRef<HTMLIFrameElement>(null)
  useEffect(() => {
    let alive = true
    void (async () => {
      await wait(50)
      for (let i = 0; i < n && alive; i += 1) {
        const item = CASES[i % CASES.length]
        const variation = 1 + Math.floor(i / CASES.length) * 37 + (i % 7) * 701
        const problems: string[] = []
        let id = ''
        try {
          const lib = generateLibraryPage(item.prompt, variation, undefined, true, 'auto', undefined, true)
          id = lib.sections.find((s) => s.role === 'pricing')?.componentId ?? 'none'
          if (id === 'none') problems.push('no price page')
          else {
            const f = frame.current!
            f.style.width = '1100px'
            await new Promise<void>((resolve) => { f.onload = () => resolve(); f.srcdoc = buildLibraryStandalone(lib) })
            await wait(1200)
            const w = f.contentWindow!
            w.location.hash = '/pricing'
            await wait(600)
            const part = [...w.document.querySelectorAll<HTMLElement>('[data-role="pricing"]')].find((el) => !el.hidden && el.getBoundingClientRect().height > 40)
            const text = (part?.innerText ?? '').replace(/\s+/g, ' ')
            if (!part) problems.push('the price part is not shown')
            for (const [name, price] of item.plans) {
              if (!text.includes(price)) problems.push(`price ${price} not shown`)
              if (!new RegExp(name, 'i').test(text)) problems.push(`plan ${name} not shown`)
            }
            const brand = lib.content.brandName
            if (/^(FAQ|SEO|CTA)$/i.test(brand)) problems.push(`name is "${brand}"`)
          }
        } catch (error) {
          problems.push(`crashed: ${String(error).slice(0, 80)}`)
        }
        setRows((list) => [...list, { id, spec: id, prompt: `${item.prompt.slice(0, 22)} v${variation}`, problems: [...new Set(problems)], height: { phone: 0, desktop: 0 } }])
      }
      if (alive) setDone(true)
    })()
    return () => { alive = false }
  }, [n])
  useEffect(() => { (window as unknown as { __genqa: unknown }).__genqa = { done, rows } }, [done, rows])
  return (
    <div style={{ font: '13px/1.4 system-ui', padding: 16 }}>
      <h1 style={{ fontSize: 18 }}>Prices check {rows.length}/{n} {done ? '(done)' : '...'}</h1>
      <iframe ref={frame} title="site" style={{ width: 1100, height: 800, border: '1px solid #ccc', position: 'absolute', left: -4000 }} />
      <ul>{rows.map((r, i) => <li key={i} style={{ color: r.problems.length ? '#b91c1c' : '#166534' }}>{r.prompt} {r.id}: {r.problems.join(', ') || 'ok'}</li>)}</ul>
    </div>
  )
}
