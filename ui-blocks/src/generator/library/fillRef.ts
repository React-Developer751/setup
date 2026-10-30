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
const lowerFirst = (s: string) => s.split(' ').map((w) => (/^[A-Z]{2,}/.test(w) ? w : w.toLowerCase())).join(' ')

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

/** a picture for slot i of a part (the page's own photos first, else the drawn art of the page's colours) */
export type PictureFor = (index: number, width: number, height: number) => string

/** the parts of the showcase kit (src/components/showkit): picture-led, filled by name like the reference kit */
function fillShow(root: Element, kind: string, c: WebsiteContent, picture: PictureFor) {
  const features = c.features.items
  const setImg = (el: Element | null, index: number, w: number, h: number) => {
    if (!el) return
    el.setAttribute('src', picture(index, w, h))
    el.removeAttribute('srcset')
    el.setAttribute('alt', c.brandName)
  }
  switch (kind) {
    case 'show-hero': {
      setImg(one(root, 'image'), 0, 1440, 800)
      put(root, 'eyebrow', short(sentence(c.subject) || c.brandName, 46))
      put(root, 'title', c.hero.title)
      put(root, 'subtitle', c.hero.subtitle)
      put(root, 'button', c.hero.button)
      put(root, 'button2', features.length ? short(c.features.title, 24) : '')
      break
    }
    case 'show-tiles': {
      put(root, 'title', c.features.title)
      put(root, 'lead', `${sentence(andList(features.slice(0, 4).map((f) => lowerFirst(f.title))))}.`)
      repeat(root, 'tile', features.slice(0, 6), (el, item, i) => {
        setImg(el.querySelector('[data-slot="tile-image"]'), i + 1, 900, 1100)
        const t = el.querySelector('[data-slot="tile-title"]')
        const x = el.querySelector('[data-slot="tile-text"]')
        if (t) t.textContent = item.title
        if (x) x.textContent = short(item.text, 70)
      })
      break
    }
    case 'show-stack': {
      repeat(root, 'tile', features.slice(0, 4), (el, item, i) => {
        setImg(el.querySelector('[data-slot="tile-image"]'), i + 1, 1200, 800)
        const set = (slot: string, text: string) => {
          const n = el.querySelector(`[data-slot="${slot}"]`)
          if (n) n.textContent = text
        }
        set('tile-title', item.title)
        set('tile-text', short(item.text, 90))
        set('tile-link', c.labels?.learnMore ?? 'Learn more')
        set('tile-link2', c.hero.button)
      })
      break
    }
    case 'show-type-hero': {
      setImg(one(root, 'image'), 0, 1600, 800)
      put(root, 'eyebrow', short(sentence(c.subject) || c.brandName, 46))
      put(root, 'meta', c.contact.hoursText ? short(c.contact.hoursText, 40) : c.contact.address ? short(c.contact.address, 40) : c.brandName)
      put(root, 'title', c.hero.title)
      put(root, 'subtitle', c.hero.subtitle)
      put(root, 'button', c.hero.button)
      put(root, 'button2', features.length ? short(c.features.title, 24) : '')
      break
    }
    case 'show-index': {
      put(root, 'title', c.features.title)
      put(root, 'lead', `${sentence(andList(features.slice(0, 4).map((f) => lowerFirst(f.title))))}.`)
      repeat(root, 'row', features.slice(0, 6), (el, item, i) => {
        const set = (slot: string, text: string) => {
          const n = el.querySelector(`[data-slot="${slot}"]`)
          if (n) n.textContent = text
        }
        set('row-number', String(i + 1).padStart(2, '0'))
        set('row-title', item.title)
        set('row-text', short(item.text, 80))
      })
      break
    }
    case 'show-cta': {
      put(root, 'title', c.cta.title)
      put(root, 'lead', c.contact.hoursText ? `${c.brandName}: ${c.contact.hoursText}.` : `Get in touch with ${c.brandName}.`)
      put(root, 'button', c.cta.button)
      put(root, 'button2', c.contact.title)
      break
    }
    case 'show-plans': {
      const plans = c.pricing.plans.slice(0, 4)
      put(root, 'title', c.pricing.title)
      repeat(root, 'plan', plans, (el, plan, i) => {
        const set = (slot: string, text: string | undefined) => {
          const n = el.querySelector(`[data-slot="${slot}"]`)
          if (!n) return
          if (text) n.textContent = text
          else n.remove()
        }
        set('plan-name', plan.name)
        set('plan-price', plan.price)
        set('plan-period', plan.period)
        set('plan-button', c.cta.button)
        el.querySelectorAll<HTMLElement>('[data-slot="perk"]').forEach((li, k) => (plan.perks[k] ? (li.textContent = short(plan.perks[k], 60)) : li.remove()))
        if (plans.length > 1 && i === (plans.length >= 3 ? 1 : 0)) el.setAttribute('data-hot', '')
      })
      break
    }
    case 'show-faq': {
      put(root, 'title', c.titles?.faq ?? 'Frequently asked questions')
      repeat(root, 'qa', c.faq.slice(0, 6), (el, item) => {
        const q = el.querySelector('[data-slot="q"]')
        const a = el.querySelector('[data-slot="a"]')
        if (q) q.textContent = item.q
        if (a) a.textContent = item.a
      })
      break
    }
    case 'show-quotes': {
      put(root, 'title', c.titles?.testimonials ?? 'What people say')
      repeat(root, 'quote', c.testimonials.slice(0, 6), (el, item) => {
        const set = (slot: string, text: string) => {
          const n = el.querySelector(`[data-slot="${slot}"]`)
          if (!n) return
          if (text) n.textContent = text
          else n.remove()
        }
        set('quote-text', item.quote)
        set('quote-author', item.author)
        set('quote-role', item.role)
        set('quote-initial', (item.author.trim().charAt(0) || c.brandName.charAt(0)).toUpperCase())
      })
      break
    }
    case 'show-gallery': {
      const captions = c.gallery.captions.length ? c.gallery.captions : features.map((f) => f.title)
      put(root, 'title', c.gallery.title)
      repeat(root, 'shot', captions.slice(0, 8), (el, caption, i) => {
        const img = el.querySelector('[data-slot="shot-image"]')
        if (img) {
          img.setAttribute('src', picture(i, 1000, 800))
          img.setAttribute('alt', caption)
        }
        const cap = el.querySelector('[data-slot="shot-caption"]')
        if (cap) cap.textContent = caption
      })
      break
    }
    default:
      break
  }
}

export function fillRef(root: Element, role: Role, c: WebsiteContent, picture?: PictureFor) {
  const showKind = root.querySelector('[data-ref^="show-"]')?.getAttribute('data-ref')
  if (showKind && picture) return fillShow(root, showKind, c, picture)
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
      // the menu board (food businesses): categories with their items
      if (root.querySelector('[data-ref="menu"]')) {
        const categories = (c.menu?.categories ?? []).filter((cat) => cat.items.length).slice(0, 4)
        if (!categories.length) return root.setAttribute('hidden', '')
        put(root, 'eyebrow', c.brandName)
        put(root, 'title', c.menu?.title)
        put(root, 'lead', c.menu?.lead)
        repeat(root, 'cat', categories, (card, cat) => {
          put(card, 'cat-name', cat.name)
          repeat(card, 'item', cat.items.slice(0, 6), (li, item) => {
            const [name, note] = item.split(' | ')
            put(li, 'item-name', name)
            if (note) {
              put(li, 'item-note', note)
              li.querySelector('[data-slot="item-leader"]')?.classList.add('border-b', 'border-dotted', 'border-gray-300', 'mb-1')
            } else {
              li.querySelector('[data-slot="item-note"]')?.remove()
              li.querySelector('[data-slot="item-leader"]')?.remove()
            }
          })
        })
        break
      }
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
