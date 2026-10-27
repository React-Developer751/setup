// Replaces the placeholder text of a rendered stored component with the generated content.
// It works on the DOM, so the components' source code is never modified: headings, paragraphs,
// buttons, numbers and links are matched by position and structure, not by their original wording.
import type { WebsiteContent } from '../finalPrompt'
import type { Role } from './libraryRoles'

type Link = { href: string; label: string }

const BRAND_WORDS = /^(brand|tailblocks|preline|meraki|flowbite|windster)$/i
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
  // an icon next to one element that holds the words (<p><svg/><span>text</span></p>): the words are in that element
  const holders = [...el.children].filter((child) => !/^(svg|img|input|textarea|br)$/i.test(child.tagName) && child.textContent?.trim())
  if (!nodes.length && holders.length === 1) return setText(holders[0], text)
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
    case 'faq':
      return {
        title: 'Frequently asked questions',
        subtitle: c.hero.subtitle,
        eyebrow: 'FAQ',
        itemTitles: c.faq.map((f) => f.q),
        itemTexts: c.faq.map((f) => f.a),
        itemLabels: ['Question', 'Answer', 'Help'],
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
    case 'banner':
      return { title: c.cta.title, subtitle: c.cta.title, eyebrow: subject, itemTitles: [], itemTexts: [], itemLabels: [] }
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
    if (/^company name$/i.test(text)) return 'Your name'
    if (PLACEHOLDER_NAMES.test(text)) return take(people, person++, people[0]).name
    if (PLACEHOLDER_ROLES.test(text)) return take(people, personRole++, people[0]).role
    if (text.startsWith('@')) return handle
    if (/^©\s*\d{4}/.test(text)) return `© ${new Date().getFullYear()} ${c.brandName}`
    if (/figma is live/i.test(text)) return `New: ${subject}`
    if (/npm i /i.test(text)) return `Welcome to ${c.brandName}`
    if (/\b(preline|tailblocks|meraki(?:\s?ui)?|flowbite|windster)\b/i.test(text)) return text.replace(/\b(preline|tailblocks|meraki(?:\s?ui)?|flowbite|windster)\b/gi, c.brandName)
    return undefined
  })
}

const DUMMY_FIELD = /^(placeholder|john doe|jane doe|johndoe@example\.com|you@example\.com|name@example\.com|name@company\.com|your company|company name|full name|first name|last name|email address|email|message|phone number|name)$/i
/** the fields of a form say what they are for ("Your name"), never a made-up person ("John Doe") */
function setPlaceholders(root: Element) {
  root.querySelectorAll('input, textarea').forEach((field) => {
    const type = (field.getAttribute('type') ?? 'text').toLowerCase()
    if (['checkbox', 'radio', 'submit', 'button', 'hidden', 'file'].includes(type)) return
    const holder = field.getAttribute('placeholder') ?? ''
    const label = (field.getAttribute('name') ?? field.getAttribute('id') ?? '').toLowerCase()
    const area = field.tagName === 'TEXTAREA'
    if (holder && (DUMMY_FIELD.test(holder) || /example|john|jane|doe/i.test(holder))) {
      field.setAttribute('placeholder', area ? 'How can we help you?' : type === 'email' ? 'Your email' : type === 'tel' || /phone|mobile/.test(label) ? 'Your phone number' : /last/.test(label) ? 'Last name' : /first/.test(label) ? 'First name' : 'Your name')
    }
    // a value that is already in the field would be sent as it is
    if (field.hasAttribute('value') && /example|john|jane|doe|placeholder/i.test(field.getAttribute('value') ?? '')) field.removeAttribute('value')
  })
}

/** Buttons that still carry the generic word "Button". */
function fillGenericButtons(root: Element, label: string) {
  root.querySelectorAll('button, a').forEach((el) => {
    if (/^button$/i.test(ownText(el))) setText(el, label)
  })
}

/** a line of a contact part: its e-mail, its phone, its address; a long line is the kit's own description (the blurb is already there) */
function contactFact(was: string, c: WebsiteContent): string | undefined {
  if (EMAIL.test(was)) return c.contact.email
  if (PHONE.test(was)) return c.contact.phone
  return was.length <= 45 && /\d|,/.test(was) ? c.contact.address : undefined
}

/**
 * The rows of a contact part (an icon, a label and the e-mail, the phone or the address): each row keeps the kind of fact it had, so the label always
 * fits the line next to it ("Phone" over the phone number), and the kit's own descriptions are dropped. Rows that were handled are marked data-crow.
 */
function fillContactRows(root: Element, c: WebsiteContent) {
  const cards = new Set<Element>()
  root.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach((h) => {
    const card = repeatedAncestor(h, root)
    if (card) cards.add(card)
  })
  const kinds = ['email', 'phone', 'address'] as const
  type Kind = (typeof kinds)[number]
  const labels: Record<Kind, string> = { email: 'Email', phone: 'Phone', address: 'Address' }
  const facts: Record<Kind, string> = { email: c.contact.email, phone: c.contact.phone, address: c.contact.address }
  const rows: { card: Element; heading: Element; leaves: Element[]; hint?: Kind }[] = []
  cards.forEach((card) => {
    const heading = card.querySelector('h1,h2,h3,h4,h5,h6')
    if (!heading || card.querySelector('form,input,textarea')) return
    const leaves = [...card.querySelectorAll('p,span,a,div,li')].filter((e) => isLeaf(e) && visibleText(e) && !heading.contains(e) && !e.closest('button'))
    const values = leaves.filter((e) => visibleText(e).length <= 60)
    if (!values.length) return
    const said = visibleText(heading)
    // what the row is about: its own label, its value, its icon
    const icon = card.querySelector('svg path')?.getAttribute('d') ?? ''
    const hint: Kind | undefined = /mail/i.test(said) ? 'email' : /phone|call|mobile|tel\b/i.test(said) ? 'phone' : /address|location|office|visit|find us|where/i.test(said) ? 'address'
      : values.some((e) => EMAIL.test(visibleText(e))) ? 'email' : values.some((e) => PHONE.test(visibleText(e))) ? 'phone'
      : /^M3 8l7\.89|^M21 8|M3 8l7\.89 5\.26/.test(icon) ? 'email' : /^M3 5a2 2 0 012-2h3\.28|^M2 3/.test(icon) ? 'phone' : /^M17\.657 16\.657|^M12 2C|^M15 11a3/.test(icon) ? 'address' : undefined
    rows.push({ card, heading, leaves, hint })
  })
  const taken = new Set<Kind>()
  // rows that know what they are keep it (once); the rest take what is left, in order
  rows.forEach((row) => {
    if (row.hint && !taken.has(row.hint)) taken.add(row.hint)
    else row.hint = undefined
  })
  rows.forEach((row) => {
    const kind = row.hint ?? kinds.find((k) => !taken.has(k))
    if (!kind) return row.card.remove()
    taken.add(kind)
    setText(row.heading, labels[kind])
    // one line with the fact; the kit's other lines (a description, a second number) go
    let placed = false
    row.leaves.forEach((e) => {
      if (!row.card.contains(e)) return
      if (!placed && visibleText(e).length <= 60) {
        setText(e, facts[kind])
        placed = true
      } else e.remove()
    })
    row.card.setAttribute('data-crow', '')
  })
}

function fillSection(root: Element, role: Role, c: WebsiteContent) {
  const d = dataFor(role, c)
  if (role === 'contact') fillContactRows(root, c)

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
  const headings = [...root.querySelectorAll('h1,h2,h3,h4')].filter((h) => visibleText(h) && !numericHeading(h) && !h.closest('[data-crow]'))
  const sectionHeadings = headings.filter((h) => !isLabel(h) && !inRepeatedGroup(h, root))
  const eyebrows = headings.filter((h) => isLabel(h) && !inRepeatedGroup(h, root))

  sectionHeadings.forEach((h, i) => {
    // "Follow us" above the social icons stays what it is
    if (role === 'contact' && /follow|social|connect/i.test(visibleText(h))) return
    setText(h, i === 0 ? d.title : take(d.itemTitles, i - 1, d.title))
  })
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
    (p) => (p.tagName === 'P' ? !!visibleText(p) : longLeaf(p)) && !p.closest('button,a') && !statElements.has(p) && !p.closest('[data-crow]'),
  )
  const sectionParas = paragraphs.filter((p) => !inRepeatedGroup(p, root))
  const itemParas = paragraphs.filter((p) => inRepeatedGroup(p, root))
  sectionParas.forEach((p, i) => {
    if (role === 'contact' && i > 0) {
      // a line with an icon in front of it is a row (the pin, the phone, the envelope): it keeps a fact even when its text had no digits
      const fact = contactFact(visibleText(p), c) ?? (p.querySelector('svg') ? c.contact.address : undefined)
      return fact ? setText(p, fact) : p.remove()
    }
    setText(p, i === 0 ? d.subtitle : take(d.extraTexts ?? [d.subtitle], i, d.subtitle))
  })
  const seenParas = new Map<Element, number>()
  itemParas.forEach((p) => {
    if (role === 'stats' && visibleText(p).length < 40) return
    if (role === 'contact') {
      const fact = contactFact(visibleText(p), c)
      return fact ? setText(p, fact) : p.remove()
    }
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
    // the map of the stored component shows a made-up place ("My Business Name, Izmir"): the real address of the person, or no map at all
    root.querySelectorAll('iframe').forEach((frame) => {
      if (!/google\.[a-z.]+\/maps/i.test(frame.getAttribute('src') ?? '')) return
      if (c.contact.showMap && c.contact.address) frame.setAttribute('src', `https://maps.google.com/maps?q=${encodeURIComponent(c.contact.address)}&output=embed`)
      else {
        const panel = root.ownerDocument.createElement('div')
        panel.className = frame.getAttribute('class') ?? ''
        panel.setAttribute('role', 'img')
        panel.setAttribute('aria-label', 'Map')
        panel.style.background = 'linear-gradient(135deg, var(--g-accent, #6366f1), color-mix(in oklab, var(--g-accent, #6366f1) 60%, var(--g-alt, #a855f7)))'
        panel.style.minHeight = '16rem'
        frame.replaceWith(panel)
      }
    })
    root.querySelectorAll('form').forEach((form) => {
      // the kit's headline inside the form card ("Phone", "Contact us") is the title of the form
      const card = form.parentElement
      const head = card && [...card.querySelectorAll('h1,h2,h3,h4,h5,h6')].find((h) => !form.contains(h) && /^(email|phone|address|get in touch|contact us)$/i.test(visibleText(h)))
      if (head && card?.querySelectorAll('h1,h2,h3,h4,h5,h6').length) setText(head, 'Send us a message')
    })
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
  // the same line twice (a component that shows its text in two places): once
  const lines = new Set<string>()
  root.querySelectorAll('p').forEach((p) => {
    const text = visibleText(p)
    if (text.length > 30 && lines.has(text)) p.remove()
    else lines.add(text)
  })

  // announcement pill above the title ("We just raised $20M")
  if (title) {
    const pill = [...root.querySelectorAll('a')].find(
      (a) => a.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING && a.querySelector('p, span') && visibleText(a).length < 60,
    )
    const pillText = pill?.querySelector('p')
    if (pillText) setText(pillText, subject)
  }

  // a list of selling points of the kit ("From US glasses dealers", "Fast shipping") is the list of what this business offers
  const points = c.features.items.map((f) => f.title)
  root.querySelectorAll('li').forEach((li, i) => {
    if (!li.closest('nav') && visibleText(li) && visibleText(li).length < 60 && (isLeaf(li) || [...li.children].every((ch) => /^(svg|span|p|div)$/i.test(ch.tagName)))) setText(li, take(points, i, points[0] ?? c.hero.title))
  })

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
  root.querySelectorAll<HTMLElement>('.hs-dropdown-menu, [role="menu"]').forEach((menu) => menu.remove())
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
  const kindOf = (el: HTMLElement) => {
    const classes = el.getAttribute('class') ?? ''
    // a business page has no accounts: "Log in", "Sign in", "Register" of the kit are hidden
    if (/^(sign in|log in|login|signin|register|my account|account)\b/i.test(ownText(el))) return 'secondary'
    if (/sign in|log in|login|account|signin/i.test(ownText(el)) && /rounded-/.test(classes) && /border|bg-layer/.test(classes)) return 'secondary'
    if (/\bbg-primary\b/.test(classes) || /^(get started|sign up|start|try|book)/i.test(ownText(el))) return 'action'
    return 'link'
  }
  // a menu with fewer places than the site has pages keeps the first ones and always the last (the contact page)
  const places = candidates.filter((el) => el !== brand && kindOf(el) === 'link').length
  const shown = places > 0 && links.length > places ? [...links.slice(0, places - 1), links[links.length - 1]] : links
  candidates.forEach((el) => {
    if (el === brand) return
    const isAction = kindOf(el) === 'action'
    const isSecondaryAction = kindOf(el) === 'secondary'
    if (isAction) {
      setText(el, c.hero.button)
      el.setAttribute('href', '#contact')
    } else if (isSecondaryAction) {
      el.style.display = 'none'
    } else if (linkIndex < shown.length) {
      const link = shown[linkIndex++]
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
  let column = 0
  let linkIndex = 0
  const subject = sentence(c.subject) || c.hero.subtitle
  const orderWord = /^(first|second|third|fourth|fifth|sixth|seventh|eighth) link$/i

  // the titles of the link columns ("Industries", "Solutions" ...) belong to the other kit
  const titleWord = /^(categories|industries|solutions|products?|resources|company|quick links?|use cases|services|support|legal|contact us|explore|about us|navigation|links|platform|developers)$/i
  root.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span').forEach((h) => {
    if (isLeaf(h) && titleWord.test(visibleText(h))) setText(h, ['Quick links', 'What we offer', 'Support', 'Contact'][column++ % 4])
  })
  root.querySelectorAll('a').forEach((a) => {
    if (orderWord.test(ownText(a))) {
      const link = links[linkIndex++ % links.length]
      setText(a, link.label)
      a.setAttribute('href', link.href)
    }
  })
  // the link columns: the pages of this site, then what it offers, then the small print (the names of the other kit's links go)
  const own = (a: Element) => ownText(a)
  const keep = /^(privacy|terms|cookies?|©|brand)/i
  const columns = new Map<Element, Element[]>()
  root.querySelectorAll('button').forEach((b) => {
    const text = visibleText(b)
    if (/^(view demo|learn more|watch demo)/i.test(text)) setText(b, 'Contact us')
    else if (/^(get started|start free|sign up|try for free)/i.test(text)) setText(b, c.hero.button)
  })
  root.querySelectorAll('a').forEach((a) => {
    const text = own(a)
    if (!text || text.length > 32 || keep.test(text) || a.querySelector('img') || text === c.brandName) return
    if (/^(view demo|get started|start free|sign up|sign in|log in|try for free|download|learn more)/i.test(text)) {
      setText(a, c.hero.button)
      a.setAttribute('href', '#contact')
      return
    }
    const column = a.parentElement?.tagName === 'LI' ? a.parentElement.parentElement : a.parentElement
    if (column) columns.set(column, [...(columns.get(column) ?? []), a])
  })
  const sets: Link[][] = [links, c.features.items.slice(0, 5).map((f) => ({ href: '#features', label: f.title })), [{ href: '#contact', label: 'Contact' }, { href: '#', label: 'Privacy Policy' }, { href: '#', label: 'Terms' }]]
  const titles = ['Quick links', 'What we offer', 'Support']
  ;[...columns.entries()].filter(([, group]) => group.length >= 2).forEach(([column, group], k) => {
    // three columns at most: a fourth would repeat the third
    if (k >= sets.length) {
      const head = column.previousElementSibling
      if (head && !head.querySelector('a') && visibleText(head).length < 30) head.remove()
      return column.remove()
    }
    const set = sets[k]
    group.forEach((a, i) => {
      if (i < set.length) {
        setText(a, set[i].label)
        a.setAttribute('href', set[i].href)
      } else (a.parentElement?.tagName === 'LI' ? a.parentElement : a).remove()
    })
    // the title of the column
    // the title is the first thing in the column, or the element before it
    const inside = column.firstElementChild && !column.firstElementChild.querySelector('a') && column.firstElementChild.tagName !== 'A' && isLeaf(column.firstElementChild) ? column.firstElementChild : undefined
    const head = inside ?? column.previousElementSibling ?? column.parentElement?.previousElementSibling
    if (head && !head.querySelector('a') && isLeaf(head) && visibleText(head) && visibleText(head).length < 32) setText(head, titles[k])
  })
  root.querySelectorAll('p, span, div').forEach((p) => {
    if (isLeaf(p) && visibleText(p).length > 30) setText(p, subject)
  })
  // a newsletter line of the kit ("Join 31,000+ others ..."), the made-up phone and e-mail, the year of the kit's copyright
  root.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,div').forEach((el) => {
    if (isLeaf(el) && /\d{2},\d{3}\+|never miss out/i.test(visibleText(el))) setText(el, 'Stay in touch with ' + c.brandName)
  })
  mapTextNodes(root, (text) => (EMAIL.test(text) ? c.contact.email : PHONE.test(text) ? c.contact.phone : /^(©|copyright)/i.test(text) && text.length < 90 ? `© ${new Date().getFullYear()} ${c.brandName}. All rights reserved.` : undefined))
  fillGenericButtons(root, 'Subscribe')
  setPlaceholders(root)
  replaceBrand(root, c)
  // a footer always says whose it is
  if (!visibleText(root).includes(c.brandName)) {
    const line = root.ownerDocument.createElement('div')
    line.className = 'px-6 py-4 text-center text-sm opacity-70'
    line.textContent = `© ${new Date().getFullYear()} ${c.brandName}`
    root.appendChild(line)
  }
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
/** a picture of another site (Unsplash, Flowbite ...): the stored components of the other kits come with such links, and a generated page must not depend on them */
const REMOTE = /^https?:\/\//i
/** the size of an <img>: its width and height, else its Tailwind size classes (size-12, w-16 h-16 ...), else a landscape picture */
function sizeOfImage(img: Element): { w: number; h: number; small: boolean } {
  const px = (v: string | null) => (v && /^\d+$/.test(v) ? Number(v) : undefined)
  const cls = img.getAttribute('class') ?? ''
  const unit = (m: RegExpMatchArray | null) => (m ? Number(m[1]) * 4 : undefined)
  const sq = unit(cls.match(/(?:^|\s)size-(\d+)(?:\s|$)/))
  const w = px(img.getAttribute('width')) ?? sq ?? unit(cls.match(/(?:^|\s)w-(\d+)(?:\s|$)/))
  const h = px(img.getAttribute('height')) ?? sq ?? unit(cls.match(/(?:^|\s)h-(\d+)(?:\s|$)/))
  const round = /rounded-full/.test(cls)
  const width = w ?? (round ? 64 : 640)
  const height = h ?? (round ? width : Math.round(width * 0.66))
  return { w: width, h: height, small: Math.max(width, height) <= 96 }
}
const blank = (w: number, h: number) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"/>`)}`
/** a round avatar with the initials of a person, in the colours of the site (for the pictures of reviews and team members) */
const initialsOf = (name: string) => (name.replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?')
const avatar = (name: string, accent: string, alt: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${accent}"/><stop offset="1" stop-color="${alt}"/></linearGradient></defs><rect width="200" height="200" fill="url(#g)"/><text x="100" y="100" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="78" text-anchor="middle" dominant-baseline="central">${initialsOf(name).replace(/[<>&]/g, '')}</text></svg>`)}`

/** a small mark of the brand for the logos of the other kits (a rounded square with the first letter, in the colours of the site) */
const brandMark = (name: string, accent: string, alt: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${accent}"/><stop offset="1" stop-color="${alt}"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#g)"/><text x="32" y="43" text-anchor="middle" font-family="system-ui,sans-serif" font-size="32" font-weight="700" fill="#fff">${initialsOf(name).slice(0, 1).replace(/[<>&]/g, '')}</text></svg>`)}`

/** backgrounds that point at a picture of another site (inline style or a bg-[url(...)] class): the page's own picture, a drawn one, or the colours of the site */
function fillBackgrounds(root: Element, role: Role, c: WebsiteContent, colors?: { accent: string; alt: string }) {
  const photos = c.photos
  const own = (role === 'hero' ? [photos?.hero] : role === 'about' || role === 'profile' ? [photos?.about] : role === 'gallery' ? photos?.gallery ?? [] : [photos?.about, photos?.hero]).filter((p): p is string => !!p)
  let n = 0
  root.querySelectorAll<HTMLElement>('[style*="url("], [class*="bg-[url("]').forEach((el) => {
    const inline = el.style.backgroundImage
    const fromClass = /bg-\[url\(['"]?(https?:[^)'"\]]+)/.exec(el.getAttribute('class') ?? '')
    const remote = /url\(["']?https?:/i.test(inline) || !!fromClass
    if (!remote) return
    const rect = { w: 1200, h: 700 }
    const art = own.length ? own[n++ % own.length] : colors ? artFor(`${role}|bg${n++}`, colors, rect.w, rect.h) : undefined
    el.style.backgroundImage = art ? `url("${art}")` : 'linear-gradient(135deg, var(--g-accent, #6366f1), color-mix(in oklab, var(--g-accent, #6366f1) 70%, var(--g-alt, #a855f7)))'
    if (art) el.style.backgroundSize = 'cover'
    // the class that carried the address of the picture goes (the picture of the page took its place)
    el.setAttribute('class', (el.getAttribute('class') ?? '').split(/\s+/).filter((token) => !/^bg-\[url\(/.test(token)).join(' '))
  })
}

function fillImages(root: Element, role: Role, c: WebsiteContent, colors?: { accent: string; alt: string }) {
  const photos = c.photos
  const gallery = photos?.gallery ?? []
  const people = role === 'testimonial' ? c.testimonials.map((t) => t.author) : role === 'team' ? c.team.members.map((m) => m.name) : [c.brandName]
  const pool = role === 'hero' ? [photos?.hero] : role === 'about' || role === 'profile' ? [photos?.about, ...gallery.slice(0, 3)] : role === 'gallery' ? gallery : [...gallery, photos?.about, photos?.hero]
  const own = pool.filter((p): p is string => !!p)
  // every part starts at another picture, so the same scene is not on the page four times
  const START: Partial<Record<Role, number>> = { features: 1, steps: 2, team: 2, testimonial: 3, blog: 3, pricing: 4, cta: 5, faq: 1 }
  let next = START[role] ?? 0
  let person = 0
  root.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') ?? ''
    const dummy = DUMMY.exec(src)
    const remote = REMOTE.test(src)
    if (!dummy && !remote) return
    const size = dummy ? { w: Number(dummy[1]), h: Number(dummy[2]), small: Math.max(Number(dummy[1]), Number(dummy[2])) < 200 } : sizeOfImage(img)
    // the logo of another kit: the brand mark of this site
    if (remote && /logo|brand/i.test(src) && colors) {
      img.setAttribute('src', brandMark(c.brandName, colors.accent, colors.alt))
      img.removeAttribute('srcset')
      return
    }
    // a person: initials in the colours of the site (the pictures of reviews and team members, and the small round pictures of authors)
    if (colors && (role === 'team' || (role === 'testimonial' && (dummy || size.small)) || (remote && size.small && /rounded-full|rounded-xl|rounded-lg/.test(img.getAttribute('class') ?? '')))) {
      img.setAttribute('src', avatar(people[person++ % Math.max(1, people.length)] ?? c.brandName, colors.accent, colors.alt))
      img.removeAttribute('srcset')
      img.classList.add('object-cover')
      return
    }
    const { w, h } = size
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
        img.removeAttribute('srcset')
        img.classList.add('object-cover')
        return
      }
    }
    img.setAttribute('src', blank(w, h))
    img.removeAttribute('srcset')
    img.style.background = 'linear-gradient(135deg, var(--g-accent, #6366f1), color-mix(in oklab, var(--g-accent, #6366f1) 70%, var(--g-alt, #a855f7)))'
  })
}

const TITLE_KEY: Partial<Record<Role, string>> = { faq: 'faq', features: 'features', about: 'about', profile: 'about', steps: 'steps', gallery: 'gallery', pricing: 'pricing', team: 'team', testimonial: 'testimonials', blog: 'blog' }
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


const LOGO_WORDS = /^(google|forbes|amazon|microsoft|spotify|airbnb|slack|stripe|netflix|uber|shopify|notion|meta|facebook|twitter|linkedin|paypal|adobe|oracle|ibm|intel|dropbox|zoom|github|figma|vercel|tesla|apple|samsung|mailchimp|hubspot|salesforce|asana|trello)$/i
const PLACEHOLDER_CATEGORY = /^(web design|app design|branding|animation|ui\/ux|ui ux|illustration|graphic design|photography|development|seo|marketing|mobile apps?|templates?)$/i

/** What the components of the other kits leave behind: names of well-known companies in "trusted by" lines, the filter words of a design portfolio, billing switches. */
function cleanLeftovers(root: Element, role: Role, c: WebsiteContent) {
  // the wordmarks of other companies, drawn as wide pictures (Google, Forbes ... next to a review or under a hero): a wide, flat drawing with no words around it
  root.querySelectorAll('svg').forEach((svg) => {
    const box = (svg.getAttribute('viewBox') ?? '').split(/[\s,]+/).map(Number)
    const classes = svg.getAttribute('class') ?? ''
    const height = Number(classes.match(/(?:^|\s)h-(\d+)(?:\s|$)/)?.[1] ?? NaN)
    // a wordmark is a wide drawing with a small fixed height (h-8); a wave that divides two parts is as wide as the page
    const wordmark = (box[2] <= 220 && !Number.isNaN(box[2])) || (height <= 14 && !/\babsolute\b|\bw-full\b/.test(classes))
    if (box.length === 4 && box[3] > 0 && box[2] / box[3] >= 2.2 && box[2] >= 60 && wordmark && !svg.closest('button, a, nav, form')) {
      const parent = svg.parentElement
      svg.remove()
      if (parent && parent !== root && !visibleText(parent) && !parent.querySelector('img,svg,input')) parent.remove()
    }
  })
  // app-store badges and "sign in with Google" of the other kits: this business has no app and no account
  root.querySelectorAll('a, button').forEach((el) => {
    if (/(google play|app store|play store|download on|get it on|(sign|log) ?(in|up) with|continue with (google|github|facebook|apple))/i.test(visibleText(el))) el.remove()
  })
  // a company name that stands alone ("Google", "Forbes") is a logo of another business
  root.querySelectorAll('*').forEach((el) => {
    if (el.children.length === 0 && LOGO_WORDS.test(visibleText(el))) {
      const parent = el.parentElement
      el.remove()
      if (parent && parent !== root && !visibleText(parent) && !parent.querySelector('img,svg,input')) parent.remove()
    }
  })
  const d = dataFor(role, c)
  let k = 0
  mapTextNodes(root, (text) => (PLACEHOLDER_CATEGORY.test(text) ? take(role === 'gallery' ? c.gallery.captions : d.itemTitles.length ? d.itemTitles : [d.eyebrow], k++, d.eyebrow) : undefined))
  if (role === 'pricing') {
    // a billing switch (monthly / annually, "save 20%") means nothing next to the prices of this business
    root.querySelectorAll('button, span, label').forEach((el) => {
      if (!root.contains(el) || !/^(monthly|annually|biannually|yearly|billed)/i.test(visibleText(el))) return
      let box: Element | null = el.parentElement
      while (box && box !== root && !/monthly/i.test(visibleText(box))) box = box.parentElement
      let bar: Element | null = el
      while (bar?.parentElement && bar.parentElement !== root && visibleText(bar.parentElement).length < 90 && !bar.parentElement.querySelector('h1,h2,h3,h4,li')) bar = bar.parentElement
      if (bar && bar !== root && visibleText(bar).length < 90) bar.remove()
    })
    // the check-list of a plan: its own perks, not "5 exclusive widgets"
    const perkSpans = [...root.querySelectorAll('span')].filter((el) => isLeaf(el) && visibleText(el) && el.previousElementSibling?.tagName.toLowerCase() === 'svg')
    const seen = new Map<Element, number>()
    perkSpans.forEach((el) => {
      const card = repeatedAncestor(el, root) ?? root
      const n = seen.get(card) ?? 0
      seen.set(card, n + 1)
      const index = [...seen.keys()].indexOf(card)
      const plan = take(c.pricing.plans, index, c.pricing.plans[0])
      setText(el, take(plan.perks, n, plan.perks[0] ?? 'Included'))
    })
    // the same line twice in one plan: once is enough
    root.querySelectorAll('p').forEach((p) => {
      const key = visibleText(p)
      const card = repeatedAncestor(p, root) ?? root
      const done = ((card as unknown as { __seen?: Set<string> }).__seen ??= new Set())
      if (done.has(key)) p.remove()
      else done.add(key)
    })
  }
}

/** The announcement bars of the other kits are fixed to the top of the screen and can be closed with a script: here a plain bar at the top of the page. */
function fillBanner(root: Element, c: WebsiteContent) {
  root.querySelectorAll('[data-dismiss-target], [data-dismiss], .sr-only').forEach((close) => close.remove())
  root.querySelectorAll<HTMLElement>('.fixed, .sticky').forEach((bar) => {
    bar.classList.remove('fixed', 'sticky', 'z-50')
    bar.classList.add('relative')
    ;[...bar.classList].filter((name) => /^(top|bottom|start|end|left|right|inset)-/.test(name)).forEach((name) => bar.classList.remove(name))
  })
  root.querySelectorAll('input').forEach((input) => input.getAttribute('type') === 'email' && input.setAttribute('placeholder', 'Your email'))
  const heading = root.querySelector('h1,h2,h3,h4')
  if (heading) {
    setText(heading, c.cta.title)
    const text = heading.nextElementSibling
    if (text && text.tagName === 'P') setText(text, c.hero.subtitle.split(/(?<=[.!?])\s/)[0] ?? c.hero.subtitle)
  } else {
    // one line of text with a link: the line is the message, the link the action
    const line = [...root.querySelectorAll('p, span')].find((el) => ownText(el) && !el.closest('a,button'))
    if (line) setText(line, c.cta.title)
    ;[...root.querySelectorAll('span')].filter((el) => el !== line && isLeaf(el) && visibleText(el).length > 12 && !el.closest('a,button') && !el.classList.contains('sr-only')).forEach((el) => el.remove())
  }
  root.querySelectorAll('a').forEach((a) => {
    if (!a.closest('button')) {
      setText(a, c.hero.button)
      a.setAttribute('href', '#contact')
    }
  })
  root.querySelectorAll('button').forEach((b) => {
    if (ownText(b)) setText(b, c.hero.button)
  })
}

/** The title block of an inner page: its name, a line about it, the way back home. The title and the line are on the part itself (data-title, data-text). */
function fillPageHead(root: Element) {
  const el = root as HTMLElement
  const title = el.dataset.title ?? ''
  const text = el.dataset.text ?? ''
  const h = root.querySelector('h1')
  if (h) setText(h, title)
  const lines = [...root.querySelectorAll('p')].filter((p) => !p.querySelector('a'))
  const intro = lines.find((p) => /text-gray-500|text-gray-300/.test(p.getAttribute('class') ?? '') && visibleText(p).length > 12)
  if (intro) setText(intro, text)
  root.querySelectorAll('p').forEach((p) => {
    if (p === intro) return
    if (p.querySelector('a')) {
      const last = [...p.querySelectorAll('span')].pop()
      if (last) setText(last, title)
    } else if (/^home$/i.test(visibleText(p))) setText(p, el.dataset.home ?? 'Home')
  })
}

const norm = (text: string) => text.replace(/\s+/g, ' ').trim()
function textsOf(root: Element): string[] {
  const out: string[] = []
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const text = norm(walker.currentNode.textContent ?? '')
    if (text) out.push(text)
  }
  return out
}

/**
 * What the filling did not reach: a sentence that is still the kit's own ("Top 10 Ui kit you can get on Blox's collection", "From US glasses dealers", "CEO, Jeny Consultency").
 * Such a text is replaced by the text of this business that belongs there (a heading by a title, a line by a description) or taken away (a date).
 */
function scrubLeftovers(root: Element, before: Set<string>, role: Role, c: WebsiteContent) {
  const d = dataFor(role, c)
  const known = new Set([d.title, d.subtitle, d.eyebrow, ...d.itemTitles, ...d.itemTexts, ...d.itemLabels, ...(d.extraTexts ?? []), c.hero.button, c.hero.title, c.hero.subtitle, c.contact.email, c.contact.phone, c.contact.address, c.contact.text, c.brandName, ...c.testimonials.flatMap((t) => [t.author, t.role, t.quote]), ...c.faq.flatMap((f) => [f.q, f.a])].filter(Boolean).map(norm))
  const roles = c.testimonials.map((t) => t.role).filter(Boolean)
  let title = 0
  let line = 0
  let person = 0
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  while (walker.nextNode()) nodes.push(walker.currentNode as Text)
  for (const node of nodes) {
    const text = norm(node.textContent ?? '')
    const el = node.parentElement
    if (!text || !el || !before.has(text) || known.has(text) || el.closest('.sr-only, svg, script, style')) continue
    const words = text.split(' ').length
    if (/placeholder/i.test(text)) {
      el.remove()
      continue
    }
    if (words < 3) continue
    if (/^(on:?\s)?\d{1,2}\s\w{3,9}\.?\s\d{4}$/i.test(text) || /^\w{3,9}\.?\s\d{1,2},\s\d{4}$/.test(text) || /^on:/i.test(text)) {
      el.remove()
      continue
    }
    if (/consult|manager at|(?:ceo|cto|cfo|founder|designer|developer),/i.test(text)) {
      node.textContent = take(roles, person++, roles[0] ?? 'Customer')
      continue
    }
    if (el.closest('a, button')) {
      node.textContent = role === 'contact' ? 'Send message' : c.hero.button
      continue
    }
    if (/^h[1-6]$/i.test(el.tagName)) {
      node.textContent = take(d.itemTitles, title++, d.title)
      continue
    }
    node.textContent = words > 8 ? take(d.itemTexts.length ? d.itemTexts : [d.subtitle], line++, d.subtitle) : take(d.itemTitles.length ? d.itemTitles : [d.title], title++, d.title)
  }
}

export function fillContent(root: Element, role: Role, c: WebsiteContent, links: Link[], colors?: { accent: string; alt: string }) {
  try {
    if (role === 'pagehead') return fillPageHead(root)
    const original = new Set(textsOf(root))
    // the heroes of the other kits bring a menu bar of their own ("glasses Search", a shopping cart): the page has its navigation already
    if (role === 'hero') {
      root.querySelectorAll('nav').forEach((bar) => bar.remove())
      // (a header that holds the heading of the hero is the hero itself, not a menu bar)
      root.querySelectorAll('header').forEach((bar) => bar.querySelector('h1, h2') || bar.remove())
      // "trusted by" rows of the logos of other companies (Facebook, Amazon ...): not the logos of this business
      root.querySelectorAll('div, ul').forEach((row) => {
        const kids = [...row.children]
        if (kids.length >= 3 && !visibleText(row) && kids.every((k) => k.tagName === 'svg' || k.tagName === 'IMG' || k.querySelector('svg, img'))) row.remove()
      })
    }
    fillImages(root, role, c, colors)
    fillBackgrounds(root, role, c, colors)
    if (role === 'banner') return fillBanner(root, c)
    if (role === 'nav') {
      fillNav(root, c, links)
      // a made-up sentence of the kit inside the menu ("Some text as placeholder")
      root.querySelectorAll('p, div, span').forEach((el) => isLeaf(el) && /placeholder/i.test(visibleText(el)) && el.remove())
      return
    }
    if (role === 'footer') return fillFooter(root, c, links)
    if (role === 'hero') fillHero(root, c)
    else fillSection(root, role, c)
    fillGenericButtons(root, role === 'contact' ? 'Send message' : c.hero.button)
    cleanLeftovers(root, role, c)
    scrubLeftovers(root, original, role, c)
    setPlaceholders(root)
    ensureTitle(root, role, c)
    replaceBrand(root, c, role === 'testimonial' ? c.testimonials.map((t) => ({ name: t.author, role: t.role })) : c.team.members)
  } catch (error) {
    console.warn(`fillContent(${role}) skipped:`, error)
  }
}
