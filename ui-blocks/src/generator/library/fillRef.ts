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
const LIST_OF: Record<string, string> = { tile: 'features', row: 'features', card: 'features', qa: 'faq', quote: 'testimonials', shot: 'gallery', stat: 'stats', step: 'steps', post: 'blog', para: 'paragraphs', point: 'points', plan: 'plans' }
/** how many items of the list the person added by hand (set when a part is filled): a part may grow by that many places */
let ADDED: Record<string, number> = {}
function repeat<T>(root: Element, slot: string, items: T[], fill: (el: HTMLElement, item: T, index: number) => void) {
  const slots = all(root, slot)
  const grow = ADDED[LIST_OF[slot] ?? ''] ?? 0
  const last = slots[slots.length - 1]
  // a place more for each item the person added, copied from the last one, so that the new item is not cut off
  for (let n = 0; last && n < grow && slots.length < items.length; n += 1) {
    const copy = last.cloneNode(true) as HTMLElement
    slots[slots.length - 1].after(copy)
    slots.push(copy)
  }
  slots.forEach((el, i) => {
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
function fillShow(root: Element, kind: string, c: WebsiteContent, picture: PictureFor, links: { href: string; label: string }[]) {
  ADDED = c.added ?? {}
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
      put(root, 'lead', `${sentence(andList(features.slice(0, 4 + (c.added?.features ?? 0)).map((f) => lowerFirst(f.title))))}.`)
      repeat(root, 'tile', features.slice(0, 6 + (c.added?.features ?? 0)), (el, item, i) => {
        setImg(el.querySelector('[data-slot="tile-image"]'), i + 1, 900, 1100)
        const t = el.querySelector('[data-slot="tile-title"]')
        const x = el.querySelector('[data-slot="tile-text"]')
        if (t) t.textContent = item.title
        if (x) x.textContent = short(item.text, 70)
      })
      break
    }
    case 'show-stack': {
      repeat(root, 'tile', features.slice(0, 4 + (c.added?.features ?? 0)), (el, item, i) => {
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
      put(root, 'lead', `${sentence(andList(features.slice(0, 4 + (c.added?.features ?? 0)).map((f) => lowerFirst(f.title))))}.`)
      repeat(root, 'row', features.slice(0, 6 + (c.added?.features ?? 0)), (el, item, i) => {
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
      // prices nobody wrote: one card that says to ask (the plans of the text pack are guesses about what the business sells)
      const plans = c.pricing.fromPrompt ? c.pricing.plans.slice(0, 4 + (c.added?.plans ?? 0)) : [{ name: c.labels?.quote ?? 'Get a quote', price: '', period: '', perks: [] as string[] }]
      put(root, 'title', c.pricing.title)
      repeat(root, 'plan', plans, (el, plan, i) => {
        const set = (slot: string, text: string | undefined) => {
          const n = el.querySelector(`[data-slot="${slot}"]`)
          if (!n) return
          if (text) n.textContent = text
          else n.remove()
        }
        set('plan-name', plan.name)
        set('plan-price', c.pricing.fromPrompt ? plan.price : (c.labels?.askPrice ?? 'Ask for price'))
        // a period ("/ month") only when the person wrote one; prices nobody wrote are not shown ("ask for the price")
        set('plan-period', c.pricing.fromPrompt ? plan.period : '')
        set('plan-button', c.cta.button)
        el.querySelectorAll<HTMLElement>('[data-slot="perk"]').forEach((li, k) => (plan.perks[k] ? (li.textContent = short(plan.perks[k], 60)) : li.remove()))
        if (plans.length > 1 && i === (plans.length >= 3 ? 1 : 0)) el.setAttribute('data-hot', '')
      })
      break
    }
    case 'show-faq': {
      put(root, 'title', c.titles?.faq ?? 'Frequently asked questions')
      repeat(root, 'qa', c.faq.slice(0, 6 + (c.added?.faq ?? 0)), (el, item) => {
        const q = el.querySelector('[data-slot="q"]')
        const a = el.querySelector('[data-slot="a"]')
        if (q) q.textContent = item.q
        if (a) a.textContent = item.a
      })
      break
    }
    case 'show-quotes': {
      put(root, 'title', c.titles?.testimonials ?? 'What people say')
      repeat(root, 'quote', c.testimonials.slice(0, 6 + (c.added?.testimonials ?? 0)), (el, item) => {
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
      repeat(root, 'shot', captions.slice(0, 8 + (c.added?.gallery ?? 0)), (el, caption, i) => {
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
    case 'show-stats': {
      repeat(root, 'stat', c.stats.slice(0, 4 + (c.added?.stats ?? 0)), (el, item) => {
        put(el, 'stat-value', item.value)
        put(el, 'stat-label', item.label)
      })
      break
    }
    case 'show-steps': {
      put(root, 'title', c.steps.title)
      repeat(root, 'step', c.steps.items.slice(0, 5 + (c.added?.steps ?? 0)), (el, item) => {
        put(el, 'step-title', item.title)
        put(el, 'step-text', short(item.text, 120))
      })
      break
    }
    case 'show-blog': {
      put(root, 'title', c.blog.title)
      repeat(root, 'post', c.blog.posts.slice(0, 4 + (c.added?.blog ?? 0)), (el, post, i) => {
        put(el, 'post-tag', post.tag)
        put(el, 'post-title', post.title)
        const img = el.querySelector('[data-slot="post-image"]')
        if (img) {
          img.setAttribute('src', picture(i, 900, 600))
          img.setAttribute('alt', post.title)
        }
      })
      break
    }
    case 'show-banner': {
      const offer = c.offers?.[0]
      // an announcement is an offer the person named; without one there is nothing to announce
      if (!offer) return root.setAttribute('hidden', '')
      put(root, 'text', offer)
      put(root, 'button', short(c.hero.button, 22))
      break
    }
    case 'show-about': {
      put(root, 'title', c.about.title)
      repeat(root, 'para', c.about.paragraphs.slice(0, 2 + (c.added?.paragraphs ?? 0)), (el, text) => (el.textContent = text))
      repeat(root, 'point', c.about.points.slice(0, 4 + (c.added?.points ?? 0)), (el, text) => (el.textContent = text))
      setImg(one(root, 'image'), 0, 1200, 1300)
      break
    }
    case 'show-contact': {
      const wa = c.contact.whatsapp ? `https://wa.me/${(c.contact.whatsapp.replace(/\D/g, '').replace(/^0+/, '').length === 10 ? '91' : '') + c.contact.whatsapp.replace(/\D/g, '').replace(/^0+/, '')}` : ''
      const ways: [string, string, string][] = [
        ['Phone', c.contact.phone, c.contact.phone ? `tel:${c.contact.phone.replace(/[^\d+]/g, '')}` : ''],
        ['Email', c.contact.email, c.contact.email ? `mailto:${c.contact.email}` : ''],
        ['WhatsApp', c.contact.whatsapp ?? '', wa],
        ['Address', c.contact.address, c.contact.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.contact.address)}` : ''],
        ['Hours', c.contact.hoursText ?? '', ''],
      ]
      put(root, 'title', c.contact.title)
      put(root, 'lead', c.contact.text)
      repeat(root, 'row', ways.filter((w) => w[1]), (el, [label, value, href]) => {
        put(el, 'row-label', label)
        const v = one(el, 'row-value')
        if (!v) return
        v.textContent = value
        if (href) {
          v.setAttribute('href', href)
          if (!href.startsWith('tel:') && !href.startsWith('mailto:')) v.setAttribute('target', '_blank'), v.setAttribute('rel', 'noopener')
        } else {
          v.removeAttribute('href')
        }
      })
      put(root, 'button', 'Send message')
      break
    }
    case 'show-footer': {
      const pages = links.length ? links : [{ href: '#home', label: 'Home' }, { href: '#about', label: 'About' }, { href: '#contact', label: 'Contact' }]
      const contactLines: { href?: string; label: string }[] = [
        ...(c.contact.phone ? [{ href: `tel:${c.contact.phone.replace(/[^\d+]/g, '')}`, label: c.contact.phone }] : []),
        ...(c.contact.email ? [{ href: `mailto:${c.contact.email}`, label: c.contact.email }] : []),
        ...(c.contact.address ? [{ label: c.contact.address }] : []),
        ...(c.contact.hoursText ? [{ label: c.contact.hoursText }] : []),
      ]
      put(root, 'brand', c.brandName)
      put(root, 'tagline', short(sentence(c.subject) || c.hero.subtitle, 110))
      const groups: Record<string, { title: string; items: { href?: string; label: string }[] }> = {
        pages: { title: 'Quick links', items: pages },
        offer: { title: 'What we offer', items: features.slice(0, 5).map((f) => ({ href: '#features', label: f.title })) },
        contact: { title: c.titles?.contact ?? 'Contact', items: contactLines },
      }
      all(root, 'col').forEach((col) => {
        const g = groups[col.getAttribute('data-kind') ?? '']
        if (!g || !g.items.length) return col.remove()
        const title = col.querySelector('[data-slot="col-title"]')
        if (title) title.textContent = g.title
        repeat(col, 'link', g.items.slice(0, 6), (a, item) => {
          a.textContent = item.label
          if (item.href) a.setAttribute('href', item.href)
          else a.removeAttribute('href')
        })
        col.querySelectorAll('li').forEach((li) => { if (!li.querySelector('[data-slot="link"]')) li.remove() })
      })
      put(root, 'rights', `© ${new Date().getFullYear()} ${c.brandName}. All rights reserved.`)
      put(root, 'place', c.contact.address ? short(c.contact.address, 60) : '')
      break
    }
    case 'show-nav': {
      put(root, 'brand', c.brandName)
      const pages = links.length ? links : [{ href: '#home', label: 'Home' }, { href: '#about', label: 'About' }, { href: '#contact', label: 'Contact' }]
      repeat(root, 'link', pages.slice(0, 7), (a, link) => {
        a.textContent = link.label
        a.setAttribute('href', link.href)
      })
      put(root, 'button', short(c.hero.button, 22))
      break
    }
    default:
      break
  }
}

export function fillRef(root: Element, role: Role, c: WebsiteContent, picture?: PictureFor, links: { href: string; label: string }[] = []) {
  ADDED = c.added ?? {}
  const showKind = root.querySelector('[data-ref^="show-"]')?.getAttribute('data-ref')
  if (showKind && picture) return fillShow(root, showKind, c, picture, links)
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
      put(root, 'lead', `${sentence(andList(features.slice(0, 4 + (c.added?.features ?? 0)).map((f) => lowerFirst(f.title))))}.`)
      all(root, 'card-tag').forEach((el) => el.remove())
      const more = c.labels?.learnMore ?? 'Learn more'
      repeat(root, 'card', features.slice(0, 6 + (c.added?.features ?? 0)), (el, item) => {
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
      const items = c.steps.items.slice(0, 6 + (c.added?.steps ?? 0))
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
      const plans = c.pricing.plans.slice(0, 6 + (c.added?.plans ?? 0))
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
