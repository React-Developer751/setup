// Fills the components of the reference kit (src/components/refkit): their parts are marked with data-slot, so every text is put in by name, not guessed.
// Nothing here writes new copy: the texts are the ones of the page's content (hero, services, steps, prices, call to action); a part with nothing to show is removed.
import type { WebsiteContent } from '../finalPrompt'
import type { Role } from './libraryRoles'

const all = (root: Element, slot: string) => [...root.querySelectorAll<HTMLElement>(`[data-slot="${slot}"]`)]
const one = (root: Element, slot: string) => root.querySelector<HTMLElement>(`[data-slot="${slot}"]`)
const put = (root: Element, slot: string, text: string | undefined) => {
  const el = one(root, slot)
  if (!el) return
  if (text) el.textContent = text
  else el.remove()
}
const short = (text: string, max: number) => (text.length <= max ? text : `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…`)
const sentence = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
/** the first letter of a service name lower-cased, but not an acronym (NHS, UKVI) */
const lowerFirst = (s: string) => (/^[A-Z]{2,}\b/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1))

/** n slots of a repeated part: the first ones get the items, the others are removed */
function repeat<T>(root: Element, slot: string, items: T[], fill: (el: HTMLElement, item: T, index: number) => void) {
  all(root, slot).forEach((el, i) => {
    if (i < items.length) fill(el, items[i], i)
    else el.remove()
  })
}

/** the last words of a headline in the colour of the page (the way the reference sites mark the key phrase) */
function accentTitle(el: HTMLElement, title: string) {
  const words = title.trim().split(/\s+/)
  el.textContent = ''
  if (words.length < 4) {
    el.textContent = title
    return
  }
  const cut = Math.min(3, Math.floor(words.length / 2))
  el.append(`${words.slice(0, -cut).join(' ')} `)
  const span = el.ownerDocument.createElement('span')
  span.className = 'text-indigo-600'
  span.textContent = words.slice(-cut).join(' ')
  el.append(span)
}

export function fillRef(root: Element, role: Role, c: WebsiteContent) {
  const features = c.features.items
  switch (role) {
    case 'hero': {
      put(root, 'eyebrow', short(sentence(c.subject) || c.brandName, 46))
      const title = one(root, 'title')
      if (title) accentTitle(title, c.hero.title)
      put(root, 'subtitle', c.hero.subtitle)
      const chips = features.map((f) => f.title).slice(0, 4)
      repeat(root, 'chip', chips, (el, text) => {
        const inner = el.querySelector('[data-slot="chip-text"]')
        if (inner) inner.textContent = text
      })
      put(root, 'button', c.hero.button)
      const second = features.length ? short(c.features.title, 24) : ''
      put(root, 'button2', second)
      put(root, 'form-title', c.contact.title)
      put(root, 'form-text', short(c.contact.text, 110))
      put(root, 'form-button', c.hero.button)
      break
    }
    case 'stats': {
      const stats = c.stats.filter((s) => s.value && s.label).slice(0, 4)
      if (stats.length < 2) return root.setAttribute('hidden', '')
      repeat(root, 'stat', stats, (el, stat) => {
        const value = el.querySelector('[data-slot="stat-value"]')
        const label = el.querySelector('[data-slot="stat-label"]')
        if (value) value.textContent = stat.value
        if (label) label.textContent = stat.label
      })
      break
    }
    case 'features': {
      put(root, 'eyebrow', c.brandName)
      put(root, 'title', c.features.title)
      put(root, 'lead', `${sentence(andList(features.slice(0, 4).map((f) => lowerFirst(f.title))))}.`)
      all(root, 'card-tag').forEach((el) => el.remove())
      const more = c.labels?.learnMore ?? 'Learn more'
      repeat(root, 'card', features.slice(0, 6), (el, item) => {
        const t = el.querySelector('[data-slot="card-title"]')
        const x = el.querySelector('[data-slot="card-text"]')
        const l = el.querySelector('[data-slot="card-link"]')
        if (t) t.textContent = item.title
        if (x) x.textContent = item.text
        if (l) l.textContent = more
      })
      break
    }
    case 'steps': {
      put(root, 'eyebrow', c.brandName)
      put(root, 'title', c.steps.title)
      const items = c.steps.items.slice(0, 6)
      repeat(root, 'step', items, (el, item, i) => {
        const set = (slot: string, text: string) => {
          const n = el.querySelector(`[data-slot="${slot}"]`)
          if (n) n.textContent = text
        }
        set('step-number', String(i + 1).padStart(2, '0'))
        set('step-label', `Step ${i + 1}`)
        set('step-title', item.title)
        set('step-text', item.text)
      })
      break
    }
    case 'pricing': {
      const plans = c.pricing.plans.slice(0, 6)
      if (!plans.length) return root.setAttribute('hidden', '')
      put(root, 'eyebrow', c.brandName)
      put(root, 'title', c.pricing.title)
      repeat(root, 'row', plans, (el, plan) => {
        const set = (slot: string, text: string) => {
          const n = el.querySelector(`[data-slot="${slot}"]`)
          if (n) n.textContent = text
        }
        set('row-name', plan.name)
        set('row-text', short(plan.perks[0] ?? '', 40))
        set('row-price', plan.price)
      })
      put(root, 'card-title', c.cta.title)
      put(root, 'card-text', short(plans[0].perks.slice(0, 2).join(' · '), 110) || c.contact.text)
      put(root, 'card-price', plans[0].price)
      put(root, 'button', c.hero.button)
      break
    }
    case 'cta': {
      put(root, 'title', c.cta.title)
      put(root, 'lead', c.contact.hoursText ? `${c.brandName}: ${c.contact.hoursText}.` : `Get in touch with ${c.brandName}.`)
      put(root, 'button', c.cta.button)
      put(root, 'button2', c.contact.title)
      const ticks = (c.offers?.length ? c.offers : c.about.points.length ? c.about.points : features.map((f) => f.title)).slice(0, 3)
      repeat(root, 'tick', ticks, (el, text) => {
        const inner = el.querySelector('[data-slot="tick-text"]')
        if (inner) inner.textContent = text
      })
      break
    }
    default:
      break
  }
}

const andList = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : (items[0] ?? ''))
