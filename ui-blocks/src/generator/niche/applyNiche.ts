// Finding the niche of a prompt ("pest control", "tattoo studio", "chartered accountant") and putting its hand-written text on the page.
import type { WebsiteContent } from '../finalPrompt'
import type { Post } from '../siteTypes'
import { localizePrice, writePeople, type Locale } from '../siteData'
import type { Niche } from './types'

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * A keyword as a whole word (Devanagari letters and marks count as letters). Plain English keywords also match their plural or singular:
 * "tattoo" finds "tattoos", "spoken english classes" finds "spoken english class".
 */
const keywordRegex = (keyword: string) => {
  let body = escapeRe(keyword).replace(/\s+/g, '\\s+')
  if (/^[a-z][a-z' -]*$/.test(keyword)) {
    if (/(?:ss|x|ch|sh)es$/.test(keyword)) body = `${body.slice(0, -2)}(?:es)?`
    else if (/[^s]s$/.test(keyword) && keyword.length > 3) body = `${body.slice(0, -1)}s?`
    else if (!keyword.endsWith('s')) body = `${body}(?:s|es)?`
  }
  return new RegExp(`(?<![\\p{L}\\p{M}\\p{N}])${body}(?![\\p{L}\\p{M}\\p{N}])`, 'iu')
}
const compiled = new WeakMap<Niche, RegExp[]>()
const regexesOf = (niche: Niche) => {
  let list = compiled.get(niche)
  if (!list) {
    list = niche.keywords.map(keywordRegex)
    compiled.set(niche, list)
  }
  return list
}

/**
 * The niche the prompt is about, or undefined. The business name ("called Pest Free Cafe") is not what the business does, so the
 * words after "called/named/naam" are ignored first; longer keywords weigh more ("termite treatment" beats "pest").
 */
export function detectNiche(prompt: string, niches: Niche[]): Niche | undefined {
  const described = prompt.replace(/(?<![\p{L}])(?:called|named|naam)(?![\p{L}])[\s\S]*$/iu, ' ')
  let best: { niche: Niche; score: number } | undefined
  for (const text of described.trim() ? [described, prompt] : [prompt]) {
    for (const niche of niches) {
      let score = 0
      regexesOf(niche).forEach((re, i) => {
        if (re.test(text)) score += 4 + niche.keywords[i].length
      })
      if (score > (best?.score ?? 0)) best = { niche, score }
    }
    if (best) break
  }
  return best?.niche
}

const fill = (text: string, brand: string) => text.replaceAll('{brand}', brand)

/** the niche's text on top of the content of a kit (names of people, contact details and the brand stay) */
export function applyNiche(content: WebsiteContent, niche: Niche, size: 'compact' | 'full', rand: () => number, locale?: Locale): WebsiteContent {
  const brand = content.brandName
  const pick = <T,>(items: T[]) => items[Math.floor(rand() * items.length)]
  const features = size === 'full' ? niche.features : niche.features.slice(0, 3)
  const quotes = niche.testimonials.map((t) => ({ quote: fill(t.quote, brand), author: 'Sample Customer', role: t.role }))
  const members = content.team.members.length ? content.team.members : []
  return {
    ...content,
    hero: { title: pick(niche.heroTitles), subtitle: fill(pick(niche.heroSubtitles), brand), button: niche.button },
    features: { title: niche.featureTitle, items: features },
    stats: niche.stats,
    testimonial: quotes[0],
    testimonials: quotes,
    faq: niche.faq,
    cta: { title: niche.cta.title, button: niche.cta.button },
    about: { title: niche.about.title, paragraphs: niche.about.paragraphs.map((p) => fill(p, brand)), points: niche.about.points },
    steps: { title: niche.steps.title, items: niche.steps.items },
    pricing: {
      title: niche.pricing.title,
      plans: niche.pricing.plans.map((p) => ({ ...p, price: locale ? localizePrice(p.price, locale) : p.price })),
    },
    ...(niche.menu ? { menu: niche.menu } : {}),
    gallery: { title: niche.gallery.title, captions: niche.gallery.captions },
    team: { title: niche.team.title, members: members.map((m, i) => ({ ...m, role: niche.team.roles[i % niche.team.roles.length] })) },
    blog: { title: niche.blog.title, posts: niche.blog.posts.map((p) => ({ tag: p.tag, title: fill(p.title, brand) })) },
    contact: { ...content.contact, text: fill(niche.contactText, brand) },
    marquee: niche.marquee,
  }
}

const slug = (text: string) => text.toLowerCase().replace(/['\u2019]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
const firstSentence = (text: string) => text.match(/^.*?[.?](?:\s|$)/)?.[0].trim() ?? text

/**
 * The extra data of a multi-page site (people, reviews, blog) built from the niche's own text instead of the kit's word banks.
 * `base` is what the kit would have written, `planned` the page content that already carries the niche text and the prompt's facts.
 */
export function nicheSiteData(base: WebsiteContent, planned: WebsiteContent, niche: Niche, locale: Locale, rand: () => number): WebsiteContent {
  const brand = base.brandName
  const roles = niche.team.roles
  const names = writePeople(locale, 6, rand)
  const members = names.map((name, i) => ({ name, role: roles[i % roles.length], bio: `${name.split(' ')[0]} is our ${roles[i % roles.length].toLowerCase()} at ${brand}.` }))
  const testimonials = (base.testimonials.length ? base.testimonials : planned.testimonials).slice(0, 3).map((r, i) => ({ ...r, quote: fill(niche.testimonials[i % niche.testimonials.length].quote, brand), role: niche.testimonials[i % niche.testimonials.length].role }))

  const today = new Date()
  const posts: Post[] = niche.blog.posts.map((post, i) => {
    const date = new Date(today)
    date.setDate(date.getDate() - (3 + i * 9 + Math.floor(rand() * 4)))
    const list = i === 0 ? niche.steps.items.map((s) => `${s.title}: ${s.text}`) : niche.features.slice((i - 1) * 3, (i - 1) * 3 + 3).map((f) => `${f.title}: ${f.text}`)
    const title = fill(post.title, brand)
    return {
      slug: slug(title),
      title,
      tag: post.tag,
      excerpt: firstSentence(fill(niche.about.paragraphs[i % 2], brand)),
      author: members[i].name,
      role: members[i].role,
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      readTime: `${3 + i} min read`,
      body: [
        { type: 'p', text: fill(niche.about.paragraphs[i % 2], brand) },
        { type: 'h2', text: i === 0 ? niche.steps.title : niche.featureTitle },
        { type: 'list', items: list },
        { type: 'h2', text: niche.faq[i].q },
        { type: 'p', text: niche.faq[i].a },
        { type: 'quote', text: fill(niche.testimonials[i % niche.testimonials.length].quote, brand) },
      ],
    }
  })
  return {
    ...base,
    team: { ...planned.team, members },
    gallery: planned.gallery,
    faq: planned.faq.slice(0, 8),
    testimonials,
    testimonial: testimonials[0],
    posts,
    blog: { ...planned.blog, posts: posts.map((p) => ({ tag: p.tag, title: p.title, slug: p.slug })) },
  }
}
