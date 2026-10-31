// Measures many generated first screens (http://localhost:5173/?genqa=1&n=200): each is drawn at phone and desktop width, and what can be checked without eyes is checked:
// sideways scroll, a headline that does not fit, a text that cannot be read, buttons too small to tap, a missing picture, a first screen that is taller than the screen can show.
// The result is JSON (window.__genqa); `npm run qa:gen` reads it with headless Chrome.
import { useEffect, useRef, useState } from 'react'
import { buildLibraryStandalone } from './generator/exportLibrary'
import { partPage } from './genPage'
import { auditPage } from './generator/library/pageAudit'
import { randomSpec, specId, describeSpec, specOfId, type HeroMood, type HeroSpec } from './generator/gen/heroSpec'
import { kitOfNs } from './generator/gen/registry'
import { ctaId, ctaOfId, describeCta, randomCta, type CtaSpec } from './generator/gen/ctaSpec'
import { describeFeatures, featuresId, featuresOfId, randomFeatures, type FeaturesSpec } from './generator/gen/featuresSpec'
import { seededRandom } from './generator/random'

const PROMPTS = ['cafe website in Jaipur', 'dental clinic website in Pune', 'law firm website', 'gym website with personal training', 'boutique clothing store website', 'SaaS startup landing page', 'yoga studio website in Rishikesh', 'kirana dukaan ki website', 'bakery website', 'real estate agency website in Mumbai']
const MOODS: HeroMood[] = ['any', 'calm', 'bold', 'soft', 'dark', 'playful']
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export type GenRow = { id: string; spec: string; prompt: string; problems: string[]; height: { phone: number; desktop: number } }

export default function GenQa() {
  const n = Number(new URLSearchParams(location.search).get('n') ?? 100)
  const section = new URLSearchParams(location.search).get('section')
  const features = section === 'features'
  const cta = section === 'cta'
  const kit = kitOfNs(section ?? '')
  const [rows, setRows] = useState<GenRow[]>([])
  const [done, setDone] = useState(false)
  const frame = useRef<HTMLIFrameElement>(null)
  useEffect(() => {
    let alive = true
    void (async () => {
      // (not inside the effect itself: the pages are drawn with a React root of their own)
      await wait(50)
      const rand = seededRandom(424242)
      const made: (HeroSpec | FeaturesSpec | CtaSpec)[] = []
      for (let i = 0; i < n && alive; i += 1) {
        const mood = MOODS[i % MOODS.length]
        const spec = kit ? (kit.part.random(rand, mood, made.slice(-3) as never[]) as never) : cta ? randomCta(rand, mood, made.slice(-3) as CtaSpec[]) : features ? randomFeatures(rand, mood, made.slice(-3) as FeaturesSpec[]) : randomSpec(rand, mood, made.slice(-3) as HeroSpec[])
        made.push(spec)
        const id = kit ? kit.part.id(spec as never) : cta ? ctaId(spec as CtaSpec) : features ? featuresId(spec as FeaturesSpec) : specId(spec as HeroSpec)
        const prompt = PROMPTS[i % PROMPTS.length]
        const problems: string[] = []
        const height = { phone: 0, desktop: 0 }
        try {
          const role = kit ? kit.role : cta ? 'cta' : features ? 'features' : 'hero'
          const f = frame.current!
          f.style.width = '390px'
          await new Promise<void>((resolve) => { f.onload = () => resolve(); f.srcdoc = buildLibraryStandalone(partPage(prompt, 3 + (i % 5), role, id)) })
          // (the first one waits for the fonts and the compiler)
          for (let tries = 0; tries < 8 && !f.contentDocument?.querySelector('[data-gen]'); tries += 1) await wait(500)
          await wait(700)
          for (const [label, width] of [['phone', 390], ['desktop', 1280]] as const) {
            f.style.width = `${width}px`
            await wait(350)
            const d = f.contentDocument!
            const w = f.contentWindow!
            const hero = d.querySelector<HTMLElement>(kit ? `[data-gen="${kit.part.ns === 'quotes' ? 'quotes' : kit.part.ns}"]` : `[data-gen="${role}"]`)
            if (!hero) { problems.push('not drawn'); break }
            height[label] = Math.round(hero.getBoundingClientRect().height)
            if (d.documentElement.scrollWidth > w.innerWidth + 1) problems.push(`${label}: sideways scroll`)
            if (kit) {
              const t = hero.querySelector<HTMLElement>('[data-slot="title"]')
              if (kit.role !== 'nav' && kit.role !== 'footer' && (!t || t.textContent!.trim().length < 3)) problems.push(`${label}: no heading`)
              else if (t && t.scrollWidth > t.clientWidth + 2) problems.push(`${label}: heading clipped`)
              const unit = hero.querySelectorAll<HTMLElement>(`[data-slot="${kit.unit}"]`)
              if (!unit.length && kit.role !== 'contact') problems.push(`${label}: nothing shown`)
              if (kit.role === 'gallery') {
                for (const im of hero.querySelectorAll<HTMLImageElement>('img[data-slot="shot-image"]')) if (!im.getAttribute('src')) problems.push(`${label}: a picture without source`)
                if ([...unit].some((u) => w.getComputedStyle(u).display !== 'none' && u.getBoundingClientRect().height < 40)) problems.push(`${label}: a picture collapsed`)
              }
              if (kit.role === 'about') {
                const im = hero.querySelector<HTMLImageElement>('img[data-slot="image"]')
                if (!im || !im.getAttribute('src')) problems.push(`${label}: no picture`)
              }
              if (kit.role === 'contact') {
                const fields = [...hero.querySelectorAll<HTMLElement>('input, textarea')].filter((f) => f.getBoundingClientRect().height > 20)
                if (kit.part.of(id) && ((kit.part.of(id) ?? { layout: '' }) as { layout: string }).layout !== 'info' && fields.length < 3) problems.push(`${label}: the form is not shown`)
                if (hero.querySelector('form') && !hero.querySelector('form [type="submit"]')) problems.push(`${label}: no send button`)
              }
              if (kit.role === 'footer' && hero.querySelectorAll('[data-slot="link"]').length < 3) problems.push(`${label}: few links`)
              if (kit.role === 'nav') {
                const shown = [...hero.querySelectorAll<HTMLElement>('[data-slot="link"]')].filter((a) => a.getBoundingClientRect().width > 0)
                const burger = hero.querySelector<HTMLElement>('.gn-burger')
                const box = hero.querySelector<HTMLInputElement>('.gn-check')
                if (label === 'desktop' && ((kit.part.of(id) ?? { layout: '' }) as { layout: string }).layout !== 'minimal' && shown.length < 2) problems.push('desktop: the menu is hidden')
                if (label === 'phone') {
                  if (!burger || burger.getBoundingClientRect().width < 20) problems.push('phone: no menu button')
                  else if (box) {
                    box.checked = true
                    await wait(120)
                    const open = [...hero.querySelectorAll<HTMLElement>('[data-slot="link"]')].filter((a) => a.getBoundingClientRect().width > 0)
                    box.checked = false
                    if (open.length < 2) problems.push('phone: the menu does not open')
                  }
                }
                const bar = hero.getBoundingClientRect().height
                if (bar > 260) problems.push(`${label}: tall menu bar (${Math.round(bar)}px)`)
              }
              if (kit.role === 'pricing') {
                if ([...hero.querySelectorAll('[data-slot="plan-price"]')].some((n) => !(n.textContent ?? '').trim())) problems.push(`${label}: a plan without price`)
                for (const b of hero.querySelectorAll<HTMLElement>('[data-slot="plan-button"]')) if (b.getBoundingClientRect().width && b.getBoundingClientRect().height < 36) problems.push(`${label}: small button`)
              }
              if ([...unit].some((u) => u.scrollWidth > u.clientWidth + 2 && w.getComputedStyle(u).overflowX !== 'auto')) problems.push(`${label}: an item sticks out`)
              const auditK = auditPage(hero)
              if (auditK.failures.length) problems.push(`${label}: ${auditK.failures.length} text(s) hard to read (${auditK.failures[0].text.slice(0, 18)} ${auditK.failures[0].ratio})`)
              if (label === 'phone' && height.phone > 3600) problems.push(`phone: very tall (${height.phone}px)`)
              continue
            }
            if (cta) {
              const t = hero.querySelector<HTMLElement>('[data-slot="title"]')
              if (!t || t.textContent!.trim().length < 3) problems.push(`${label}: no statement`)
              else if (t.scrollWidth > t.clientWidth + 2) problems.push(`${label}: statement clipped`)
              for (const b of hero.querySelectorAll<HTMLElement>('[data-slot="button"],[data-slot="button2"]')) if (b.getBoundingClientRect().height < 40) problems.push(`${label}: small button`)
              if (!hero.querySelector('[data-slot="button"]')) problems.push(`${label}: no button`)
              const auditC = auditPage(hero)
              if (auditC.failures.length) problems.push(`${label}: ${auditC.failures.length} text(s) hard to read (${auditC.failures[0].text.slice(0, 18)} ${auditC.failures[0].ratio})`)
              if (label === 'phone' && height.phone > 1100) problems.push(`phone: very tall (${height.phone}px)`)
              continue
            }
            if (features) {
              const tiles = [...hero.querySelectorAll<HTMLElement>('[data-slot="tile"]')]
              if (!tiles.length) problems.push(`${label}: no service shown`)
              if (tiles.some((t) => t.scrollWidth > t.clientWidth + 2 && w.getComputedStyle(t).overflowX !== 'auto')) problems.push(`${label}: a service sticks out of its card`)
              if (tiles.some((t) => (t.querySelector('h3')?.textContent ?? '').trim().length < 2)) problems.push(`${label}: a service without a name`)
              if (tiles.some((t) => parseFloat(w.getComputedStyle(t.querySelector('p') ?? t).fontSize) < 12)) problems.push(`${label}: tiny text`)
              if (label === 'phone' && height.phone > 3200) problems.push(`phone: very tall (${height.phone}px)`)
              const audit0 = auditPage(hero)
              if (audit0.failures.length) problems.push(`${label}: ${audit0.failures.length} text(s) hard to read (${audit0.failures[0].text.slice(0, 18)} ${audit0.failures[0].ratio})`)
              continue
            }
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
        setRows((list) => [...list, { id, spec: kit ? kit.part.describe(kit.part.of(id) as never) : cta ? describeCta(ctaOfId(id) as CtaSpec) : features ? describeFeatures(featuresOfId(id) as FeaturesSpec) : describeSpec(specOfId(id) as HeroSpec), prompt, problems: [...new Set(problems)], height }])
      }
      if (alive) setDone(true)
    })()
    return () => { alive = false }
  }, [n, features, cta, kit])
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
