// Replaces the placeholder text of a rendered stored component with the generated content.
// It works on the DOM, so the components' source code is never modified: headings, paragraphs,
// buttons, numbers and links are matched by position and structure, not by their original wording.
import type { WebsiteContent } from '../finalPrompt'
import type { Role } from './libraryRoles'

type Link = { href: string; label: string }

const BRAND_WORDS = /^(brand|tailblocks|preline)$/i
const NUMERIC = /^[\d.,]+\s?[KkMm+%]?$/
const PLACEHOLDER_NAMES = /^(Holden Caulfield|Alper Kamu|Henry Letham|Atticus Finch|Phoebe Caulfield|Josh Grazioso)$/i
const PLACEHOLDER_ROLES = /^(UI Developer|Designer|Art Director|Developer|CEO|CTO|Manager|Director Payments.*)$/i
const DEFAULT_LINKS: Link[] = [
  { href: '#home', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#features', label: 'Features' },
  { href: '#contact', label: 'Contact' },
]
const PRICE = /^\$?\s?\d[\d,.]*$/
const EMAIL = /^[\w.+-]+@[\w-]+\.[\w.]+$/
const PHONE = /^\+?[\d\s()-]{7,}$/

const take = <T,>(pool: T[], i: number, fallback: T): T => (pool.length ? pool[i % pool.length] : fallback)
const ownTextNodes = (el: Element) => [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent?.trim())
const ownText = (el: Element) => ownTextNodes(el).map((n) => n.textContent!.trim()).join(' ')
/** no child elements other than line breaks */
const isLeaf = (el: Element) => [...el.children].every((child) => child.tagName === 'BR')
const visibleText = (el: Element) => el.textContent?.replace(/\s+/g, ' ').trim() ?? ''

/** Sets the text of an element but keeps icons (svg / img) that live inside it. */
function setText(el: Element, text: string) {
  if (!el.querySelector('svg,img,input,textarea')) {
    el.textContent = text
    return
  }
  const nodes = ownTextNodes(el)
  if (nodes.length) {
    nodes[0].textContent = text + ' '
    nodes.slice(1).forEach((n) => (n.textContent = ''))
  } else {
    el.prepend(text)
  }
}

const isLabel = (el: Element) => /tracking-widest|uppercase|\btext-xs\b/.test(el.getAttribute('class') ?? '')

/** The card (repeated next to identical siblings) that contains the element, if any. */
function repeatedAncestor(el: Element, root: Element): Element | null {
  for (let node = el.parentElement; node && node !== root; node = node.parentElement) {
    const parent = node.parentElement
    if (!parent) break
    const signature = `${node.tagName}|${node.getAttribute('class')}`
    const same = [...parent.children].filter((c) => `${c.tagName}|${c.getAttribute('class')}` === signature)
    if (same.length > 1) return node
  }
  return null
}

const inRepeatedGroup = (el: Element, root: Element) => repeatedAncestor(el, root) !== null

const sentence = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

type Data = {
  title: string
  subtitle: string
  eyebrow: string
  itemTitles: string[]
  itemTexts: string[]
  itemLabels: string[]
  extraTexts?: string[]
}

function dataFor(role: Role, c: WebsiteContent): Data {
  const features = c.features.items
  const subject = sentence(c.subject) || c.brandName
  const about = c.about.paragraphs
  switch (role) {
    case 'hero':
      return {
        title: c.hero.title,
        subtitle: c.hero.subtitle,
        eyebrow: subject,
        itemTitles: features.map((f) => f.title),
        itemTexts: features.map((f) => f.text),
        itemLabels: ['New', 'Featured', 'Popular'],
      }
    case 'about':
      return {
        title: c.about.title,
        subtitle: about[0],
        eyebrow: 'Our story',
        itemTitles: c.about.points,
        itemTexts: [about[1], about[0]],
        itemLabels: ['About', 'Mission', 'Values'],
        extraTexts: about,
      }
    case 'features':
      return {
        title: c.features.title,
        subtitle: c.hero.subtitle,
        eyebrow: 'Why choose us',
        itemTitles: features.map((f) => f.title),
        itemTexts: features.map((f) => f.text),
        itemLabels: ['Feature', 'Benefit', 'Included'],
      }
    case 'links':
      return {
        title: 'Explore',
        subtitle: c.hero.subtitle,
        eyebrow: 'Explore',
        itemTitles: features.map((f) => f.title),
        itemTexts: features.map((f) => f.text),
        itemLabels: ['Company', 'Explore', 'Support'],
      }
    case 'profile':
      return {
        title: c.team.members[0].name,
        subtitle: about[0],
        eyebrow: c.team.members[0].role,
        itemTitles: c.team.members.map((m) => m.name),
        itemTexts: about,
        itemLabels: c.team.members.map((m) => m.role),
      }
    case 'blog':
      return {
        title: c.blog.title,
        subtitle: c.hero.subtitle,
        eyebrow: 'Latest',
        itemTitles: c.blog.posts.map((p) => p.title),
        itemTexts: features.map((f) => f.text),
        itemLabels: c.blog.posts.map((p) => p.tag),
      }
    case 'stats':
      return {
        title: 'Results that speak for themselves',
        subtitle: about[0],
        eyebrow: 'By the numbers',
        itemTitles: c.stats.map((s) => s.label),
        itemTexts: c.stats.map((s) => s.label),
        itemLabels: c.stats.map((s) => s.label),
      }
    case 'steps':
      return {
        title: c.steps.title,
        subtitle: c.hero.subtitle,
        eyebrow: 'Process',
        itemTitles: c.steps.items.map((s) => s.title),
        itemTexts: c.steps.items.map((s) => s.text),
        itemLabels: c.steps.items.map((_, i) => `Step ${i + 1}`),
      }
    case 'gallery':
      return {
        title: c.gallery.title,
        subtitle: about[0],
        eyebrow: 'Gallery',
        itemTitles: c.gallery.captions,
        itemTexts: features.map((f) => f.text),
        itemLabels: c.gallery.captions,
      }
    case 'pricing':
      return {
        title: c.pricing.title,
        subtitle: c.hero.subtitle,
        eyebrow: 'Pricing',
        itemTitles: c.pricing.plans.map((p) => p.name),
        itemTexts: c.pricing.plans.flatMap((p) => p.perks),
        itemLabels: ['Popular', 'Best value', 'Starter'],
      }
    case 'team':
      return {
        title: c.team.title,
        subtitle: about[0],
        eyebrow: 'Our team',
        itemTitles: c.team.members.map((m) => m.name),
        itemTexts: features.map((f) => f.text),
        itemLabels: c.team.members.map((m) => m.role),
      }
    case 'testimonial':
      return {
        title: 'What people say',
        subtitle: c.hero.subtitle,
        eyebrow: 'Testimonials',
        itemTitles: c.testimonials.map((t) => t.author),
        itemTexts: c.testimonials.map((t) => t.quote),
        itemLabels: c.testimonials.map((t) => t.role),
      }
    case 'contact':
      return {
        title: c.contact.title,
        subtitle: c.contact.text,
        eyebrow: 'Contact',
        itemTitles: ['Email', 'Phone', 'Address'],
        itemTexts: [c.contact.email, c.contact.phone, c.contact.address],
        itemLabels: ['Email', 'Phone', 'Address'],
      }
    case 'cta':
      return {
        title: c.cta.title,
        subtitle: c.hero.subtitle,
        eyebrow: subject,
        itemTitles: [c.cta.title],
        itemTexts: [c.hero.subtitle],
        itemLabels: [subject],
      }
    default:
      return { title: c.hero.title, subtitle: c.hero.subtitle, eyebrow: subject, itemTitles: [], itemTexts: [], itemLabels: [] }
  }
}

/** Walks every text node and applies `fn`; used for brand names, e-mails, prices ... */
function mapTextNodes(root: Element, fn: (text: string, node: Text) => string | undefined) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  while (walker.nextNode()) nodes.push(walker.currentNode as Text)
  nodes.forEach((node) => {
    const raw = node.textContent ?? ''
    if (!raw.trim()) return
    const replaced = fn(raw.trim(), node)
    if (replaced !== undefined) node.textContent = raw.replace(raw.trim(), replaced)
  })
}

function replaceBrand(
  root: Element,
  c: WebsiteContent,
  people: { name: string; role: string }[] = c.team.members,
) {
  const handle = `@${c.brandName.toLowerCase().replace(/[^a-z0-9]+/g, '')}`
  const subject = sentence(c.subject) || c.brandName
  let person = 0
  let personRole = 0
  // the Preline wordmark is an SVG, so swap the whole logo for the brand name
  root.querySelectorAll('a[aria-label]').forEach((a) => {
    if (/^preline$/i.test(a.getAttribute('aria-label') ?? '') && a.querySelector('svg') && !ownText(a)) {
      a.textContent = c.brandName
      a.setAttribute('aria-label', c.brandName)
    }
  })
  root.querySelectorAll('[aria-label]').forEach((el) => {
    if (BRAND_WORDS.test(el.getAttribute('aria-label') ?? '')) el.setAttribute('aria-label', c.brandName)
  })
  mapTextNodes(root, (text) => {
    if (BRAND_WORDS.test(text)) return c.brandName
    if (/^placeholder$/i.test(text)) return 'Your email'
    if (PLACEHOLDER_NAMES.test(text)) return take(people, person++, people[0]).name
    if (PLACEHOLDER_ROLES.test(text)) return take(people, personRole++, people[0]).role
    if (text.startsWith('@')) return handle
    if (/^©\s*\d{4}/.test(text)) return `© ${new Date().getFullYear()} ${c.brandName}`
    if (/figma is live/i.test(text)) return `New: ${subject}`
    if (/npm i /i.test(text)) return `Welcome to ${c.brandName}`
    if (/\b(preline|tailblocks)\b/i.test(text)) return text.replace(/\b(preline|tailblocks)\b/gi, c.brandName)
    return undefined
  })
}

function setPlaceholders(root: Element) {
  root.querySelectorAll('input[placeholder]').forEach((input) => {
    const type = input.getAttribute('type')
    if (/^placeholder$/i.test(input.getAttribute('placeholder') ?? '')) {
      input.setAttribute('placeholder', type === 'email' ? 'Your email' : 'Your name')
    }
  })
}

/** Buttons that still carry the generic word "Button". */
function fillGenericButtons(root: Element, label: string) {
  root.querySelectorAll('button, a').forEach((el) => {
    if (/^button$/i.test(ownText(el))) setText(el, label)
  })
}

function fillSection(root: Element, role: Role, c: WebsiteContent) {
  const d = dataFor(role, c)

  // numbers + their labels (stats); remember what was replaced so the heading / paragraph pass skips it
  const statElements = new Set<Element>()
  if (role === 'stats') {
    const values = [...root.querySelectorAll('h1,h2,h3,h4,p,span,div')].filter(
      (el) => el.children.length === 0 && NUMERIC.test(visibleText(el)),
    )
    values.forEach((el, i) => {
      const stat = take(c.stats, i, c.stats[0])
      el.textContent = stat.value
      el.setAttribute('data-count', '')
      statElements.add(el)
      const label = el.nextElementSibling
      if (label && label.children.length === 0) {
        label.textContent = stat.label
        statElements.add(label)
      }
    })
  }

  const numericHeading = (el: Element) => statElements.has(el)
  const headings = [...root.querySelectorAll('h1,h2,h3,h4')].filter((h) => visibleText(h) && !numericHeading(h))
  const sectionHeadings = headings.filter((h) => !isLabel(h) && !inRepeatedGroup(h, root))
  const eyebrows = headings.filter((h) => isLabel(h) && !inRepeatedGroup(h, root))

  sectionHeadings.forEach((h, i) => setText(h, i === 0 ? d.title : take(d.itemTitles, i - 1, d.title)))
  eyebrows.forEach((h) => setText(h, d.eyebrow))

  // Cards: every card gets its own index so a name and its role always belong together.
  const cardIndex = new Map<Element, number>()
  const cardOf = (el: Element) => {
    const card = repeatedAncestor(el, root) ?? root
    if (!cardIndex.has(card)) cardIndex.set(card, cardIndex.size)
    return { card, index: cardIndex.get(card)! }
  }
  const seenHeadings = new Map<Element, number>()
  headings
    .filter((h) => inRepeatedGroup(h, root))
    .forEach((h) => {
      const { card, index } = cardOf(h)
      if (isLabel(h)) return setText(h, take(d.itemLabels, index, d.eyebrow))
      const position = seenHeadings.get(card) ?? 0
      seenHeadings.set(card, position + 1)
      setText(h, position === 0 ? take(d.itemTitles, index, d.title) : take(d.itemLabels, index, d.eyebrow))
    })

  const longLeaf = (el: Element) => isLeaf(el) && visibleText(el).length > 40
  const paragraphs = [...root.querySelectorAll('p, div, span')].filter(
    (p) => (p.tagName === 'P' ? !!visibleText(p) : longLeaf(p)) && !p.closest('button,a') && !statElements.has(p),
  )
  const sectionParas = paragraphs.filter((p) => !inRepeatedGroup(p, root))
  const itemParas = paragraphs.filter((p) => inRepeatedGroup(p, root))
  sectionParas.forEach((p, i) => setText(p, i === 0 ? d.subtitle : take(d.extraTexts ?? [d.subtitle], i, d.subtitle)))
  const seenParas = new Map<Element, number>()
  itemParas.forEach((p) => {
    if (role === 'stats' && visibleText(p).length < 40) return
    const { card, index } = cardOf(p)
    const position = seenParas.get(card) ?? 0
    seenParas.set(card, position + 1)
    setText(p, role === 'stats' ? d.subtitle : take(d.itemTexts, index + position, d.subtitle))
  })

  // "CATEGORY" tags that are spans rather than headings
  let tag = 0
  mapTextNodes(root, (text) => (/^category$/i.test(text) ? take(d.itemLabels, tag++, d.eyebrow) : undefined))

  // list items (pricing perks, feature lists)
  if (role === 'pricing') {
    const items = [...root.querySelectorAll('li')].filter((li) => visibleText(li))
    items.forEach((li, i) => setText(li, take(d.itemTexts, i, 'Included')))
    let n = 0
    mapTextNodes(root, (text) => (PRICE.test(text) ? take(c.pricing.plans, n++, c.pricing.plans[0]).price.replace(/^\$/, '') : undefined))
  }

  if (role === 'contact') {
    mapTextNodes(root, (text) => (EMAIL.test(text) ? c.contact.email : PHONE.test(text) ? c.contact.phone : undefined))
    root.querySelectorAll('a[href^="mailto:"]').forEach((a) => a.setAttribute('href', `mailto:${c.contact.email}`))
    const labelOf = (el: Element) => visibleText(el).toLowerCase()
    root.querySelectorAll('h1,h2,h3,h4').forEach((h) => {
      if (labelOf(h) === 'address' && h.nextElementSibling?.tagName === 'P') h.nextElementSibling.textContent = c.contact.address
    })
    fillGenericButtons(root, 'Send message')
  }
}

function fillHero(root: Element, c: WebsiteContent) {
  fillSection(root, 'hero', c)
  const subject = sentence(c.subject) || c.brandName

  // title and subtitle are always the first heading / first paragraph of a hero
  const title = root.querySelector('h1') ?? root.querySelector('h2')
  if (title) setText(title, c.hero.title)
  const subtitle = [...root.querySelectorAll('p')].find((p) => !p.closest('a,button') && visibleText(p).length > 30)
  if (subtitle) setText(subtitle, c.hero.subtitle)

  // announcement pill above the title ("We just raised $20M")
  if (title) {
    const pill = [...root.querySelectorAll('a')].find(
      (a) => a.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING && a.querySelector('p, span') && visibleText(a).length < 60,
    )
    const pillText = pill?.querySelector('p')
    if (pillText) setText(pillText, subject)
  }

  // call-to-action buttons / links
  const actions = [...root.querySelectorAll('a, button')].filter(
    (el) => ownText(el) && ownText(el).length < 40 && !el.closest('nav') && !el.querySelector('p'),
  )
  actions.forEach((el, i) => {
    if (/^(button|get started|start|learn more|get it now|explore|read more|download|watch demo)/i.test(ownText(el)) || i < 2) {
      setText(el, i === 0 ? c.hero.button : i === 1 ? 'Learn more' : c.hero.button)
      el.setAttribute('href', i === 1 ? '#features' : '#contact')
    }
  })
}

function fillNav(root: Element, c: WebsiteContent, pageLinks: Link[]) {
  const links = pageLinks.length ? pageLinks : DEFAULT_LINKS
  root.querySelectorAll<HTMLElement>('.hs-dropdown-menu, [role="menu"]').forEach((menu) => (menu.style.display = 'none'))
  const inMenu = (el: Element) => !!el.closest('.hs-dropdown-menu, [role="menu"]')

  const candidates = [...root.querySelectorAll<HTMLElement>('a, button, .hs-dropdown-toggle')].filter(
    (el) => ownText(el) && !inMenu(el) && !/toggle navigation|close/i.test(ownText(el)),
  )
  const brand = candidates.find((el) => BRAND_WORDS.test(ownText(el)))
  if (brand) {
    setText(brand, c.brandName)
  } else if (![...root.querySelectorAll('span, a, div')].some((el) => BRAND_WORDS.test(ownText(el)))) {
    // navigation that only has a logo: put the brand name next to it
    const logo = [...root.querySelectorAll('a')].find((a) => !ownText(a) && a.querySelector('svg,img') && !inMenu(a) && /flex-none/.test(a.getAttribute('class') ?? ''))
    if (logo) {
      const name = document.createElement('span')
      name.textContent = c.brandName
      name.className = 'ms-2 text-xl font-semibold'
      logo.classList.add('inline-flex', 'items-center')
      logo.appendChild(name)
    }
  }

  let linkIndex = 0
  candidates.forEach((el) => {
    if (el === brand) return
    const classes = el.getAttribute('class') ?? ''
    const isAction = /\bbg-primary\b/.test(classes) || /^(get started|sign up|start|try|book)/i.test(ownText(el))
    const isSecondaryAction = /sign in|log in|login|account|signin/i.test(ownText(el)) && /rounded-/.test(classes) && /border|bg-layer/.test(classes)
    if (isAction) {
      setText(el, c.hero.button)
      el.setAttribute('href', '#contact')
    } else if (isSecondaryAction) {
      el.style.display = 'none'
    } else if (linkIndex < links.length) {
      const link = links[linkIndex++]
      setText(el, link.label)
      el.setAttribute('href', link.href)
      if (el.hasAttribute('aria-label')) el.setAttribute('aria-label', link.label)
    } else {
      // more links than we have sections: hide the extra ones
      ;(el.closest('.hs-dropdown') as HTMLElement | null ?? el).style.display = 'none'
    }
  })
  replaceBrand(root, c)
}

function fillFooter(root: Element, c: WebsiteContent, pageLinks: Link[]) {
  const links = pageLinks.length ? pageLinks : DEFAULT_LINKS
  const columnTitles = ['Company', 'Explore', 'Support', 'Legal']
  let column = 0
  let linkIndex = 0
  const subject = sentence(c.subject) || c.hero.subtitle
  const orderWord = /^(first|second|third|fourth|fifth|sixth|seventh|eighth) link$/i

  root.querySelectorAll('h1,h2,h3,h4').forEach((h) => {
    if (/^categories$/i.test(visibleText(h))) setText(h, columnTitles[column++ % columnTitles.length])
  })
  root.querySelectorAll('a').forEach((a) => {
    if (orderWord.test(ownText(a))) {
      const link = links[linkIndex++ % links.length]
      setText(a, link.label)
      a.setAttribute('href', link.href)
    }
  })
  root.querySelectorAll('p, span, div').forEach((p) => {
    if (isLeaf(p) && visibleText(p).length > 30) setText(p, subject)
  })
  fillGenericButtons(root, 'Subscribe')
  setPlaceholders(root)
  replaceBrand(root, c)
}

// The components bring grey placeholder pictures (dummyimage.com). The pictures the person added (or drew with the image AI) take their place;
// without pictures a soft gradient in the colours of the site stands there, never a grey "720 x 600" box.
import { makeArt } from '../art/generate'
import { toDataUrl } from '../art/encode'
import { temperature } from '../creativity'
import { hash } from '../random'
const artCache = new Map<string, string>()
/** a picture made by maths (noise, fractals, the colours of the site) for a box that has no photo; the same box of the same page always gets the same one */
function artFor(seed: string, colors: { accent: string; alt: string }, w: number, h: number): string | undefined {
  const key = `${seed}|${colors.accent}|${colors.alt}|${w}x${h}`
  const cached = artCache.get(key)
  if (cached) return cached
  try {
    const width = Math.min(480, w)
    const height = Math.round((width * h) / w)
    const art = makeArt({ seed: hash(key), accent: colors.accent, alt: colors.alt, width, height, population: 8, generations: 1, temperature: temperature() })
    const url = toDataUrl(art.image)
    artCache.set(key, url)
    return url
  } catch {
    return undefined
  }
}

const DUMMY = /dummyimage\.com\/(\d+)x(\d+)/
const blank = (w: number, h: number) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"/>`)}`
/** a round avatar with the initials of a person, in the colours of the site (for the pictures of reviews and team members) */
const initialsOf = (name: string) => (name.replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?')
const avatar = (name: string, accent: string, alt: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${accent}"/><stop offset="1" stop-color="${alt}"/></linearGradient></defs><rect width="200" height="200" fill="url(#g)"/><text x="100" y="100" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="78" text-anchor="middle" dominant-baseline="central">${initialsOf(name).replace(/[<>&]/g, '')}</text></svg>`)}`

function fillImages(root: Element, role: Role, c: WebsiteContent, colors?: { accent: string; alt: string }) {
  if ((role === 'testimonial' || role === 'team') && colors) {
    const names = role === 'testimonial' ? c.testimonials.map((t) => t.author) : c.team.members.map((m) => m.name)
    let n = 0
    root.querySelectorAll('img').forEach((img) => {
      if (!DUMMY.test(img.getAttribute('src') ?? '')) return
      img.setAttribute('src', avatar(names[n++ % Math.max(1, names.length)] ?? c.brandName, colors.accent, colors.alt))
      img.removeAttribute('srcset')
      img.classList.add('object-cover')
    })
    return
  }
  const photos = c.photos
  const gallery = photos?.gallery ?? []
  const pool = role === 'hero' ? [photos?.hero] : role === 'about' || role === 'profile' ? [photos?.about] : role === 'gallery' ? gallery : [...gallery, photos?.about, photos?.hero]
  const own = pool.filter((p): p is string => !!p)
  let next = 0
  root.querySelectorAll('img').forEach((img) => {
    const m = DUMMY.exec(img.getAttribute('src') ?? '')
    if (!m) return
    const w = Number(m[1])
    const h = Number(m[2])
    if (w >= 200 && h >= 100 && own.length) {
      img.setAttribute('src', own[next++ % own.length])
      img.removeAttribute('srcset')
      img.classList.add('object-cover')
      return
    }
    if (w >= 200 && h >= 100 && colors) {
      const art = artFor(`${role}|${next++}`, colors, w, h)
      if (art) {
        img.setAttribute('src', art)
        img.classList.add('object-cover')
        return
      }
    }
    img.setAttribute('src', blank(w, h))
    img.style.background = 'linear-gradient(135deg, var(--g-accent, #6366f1), color-mix(in oklab, var(--g-accent, #6366f1) 70%, var(--g-alt, #a855f7)))'
  })
}

const TITLE_KEY: Partial<Record<Role, string>> = { features: 'features', about: 'about', profile: 'about', steps: 'steps', gallery: 'gallery', pricing: 'pricing', team: 'team', testimonial: 'testimonials', blog: 'blog' }
/** A heading the person asked for ("rename pricing to Our Plans") must show, also in a stored component that has no heading of its own. */
function ensureTitle(root: Element, role: Role, c: WebsiteContent) {
  const key = TITLE_KEY[role]
  const text = key ? (c as unknown as Record<string, { title?: string } | undefined>)[key]?.title : undefined
  if (!key || !text || !c.titles?.[key] || visibleText(root).includes(text)) return
  const section = root.querySelector('section') ?? root
  const holder = (section.firstElementChild as HTMLElement | null) ?? (section as HTMLElement)
  const h = root.ownerDocument.createElement('h2')
  h.className = 'title-font sm:text-3xl text-2xl font-medium text-gray-900 text-center mx-auto mb-10 px-5 pt-10'
  h.textContent = text
  section.insertBefore(h, holder === section ? section.firstChild : holder)
}

export function fillContent(root: Element, role: Role, c: WebsiteContent, links: Link[], colors?: { accent: string; alt: string }) {
  try {
    if (role !== 'nav' && role !== 'footer') fillImages(root, role, c, colors)
    if (role === 'nav') return fillNav(root, c, links)
    if (role === 'footer') return fillFooter(root, c, links)
    if (role === 'hero') fillHero(root, c)
    else fillSection(root, role, c)
    fillGenericButtons(root, role === 'contact' ? 'Send message' : c.hero.button)
    setPlaceholders(root)
    ensureTitle(root, role, c)
    replaceBrand(root, c, role === 'testimonial' ? c.testimonials.map((t) => ({ name: t.author, role: t.role })) : c.team.members)
  } catch (error) {
    console.warn(`fillContent(${role}) skipped:`, error)
  }
}
