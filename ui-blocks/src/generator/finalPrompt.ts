// Builds the text content of the page from the prompt + the chosen theme.
import { withCuisine } from './cuisine'
import { scrubForeign } from './foreignWords'
import { contentTemplates } from './contentTemplates'
import type { CreativeContent } from './creativeBrain'
import { extraContent, sharedContent, type Plan } from './extraContent'
import { extractContentDetails } from './filter'
import type { LegalDocs, Milestone, OpeningHours, Post } from './siteTypes'
import type { ThemeKey } from './themes'
import { applyNiche } from './niche/applyNiche'
import type { Niche } from './niche/types'
import { extractFacts, personalize, plainStats } from './personalize'
import type { Locale } from './siteData'

type Quote = { quote: string; author: string; role: string }

export type WebsiteContent = {
  brandName: string
  subject: string
  hero: { title: string; subtitle: string; button: string }
  features: { title: string; items: { title: string; text: string }[] }
  /** `fact`: a number the person gave (kept as it is; the numbers of the kits are replaced) */
  stats: { value: string; label: string; fact?: boolean }[]
  testimonial: Quote
  faq: { q: string; a: string }[]
  cta: { title: string; button: string }
  // sections of the long page
  about: { title: string; paragraphs: string[]; points: string[] }
  steps: { title: string; items: { title: string; text: string }[] }
  /** `fromPrompt`: the prices are the ones the person wrote; the prices of a text pack are examples and are not shown on a page of their own */
  pricing: { title: string; plans: Plan[]; fromPrompt?: boolean }
  /** a menu board (food businesses): categories with their items, no prices (the prices are the owner's to write) */
  menu?: { title: string; lead?: string; categories: { name: string; items: string[] }[] }
  gallery: { title: string; captions: string[] }
  team: { title: string; members: { name: string; role: string; bio?: string }[] }
  testimonials: Quote[]
  blog: { title: string; posts: { tag: string; title: string; slug?: string }[] }
  contact: { title: string; text: string; email: string; phone: string; address: string; whatsapp?: string; hoursText?: string; /** the address is the person's own: show a real map */ showMap?: boolean }
  /** working parts the person asked for (booking form, map, WhatsApp button, UPI pay button, countdown, newsletter, video, order list, announcement, analytics): see library/widgets.ts */
  widgets?: { kind: string; value?: string; text?: string }[]
  /** the offers the person named ("free shipping above ₹999", "cash on delivery", "7-day returns"): the announcement bar of the page */
  offers?: string[]
  /** headings and menu labels the person changed (see edit/edits.ts) */
  titles?: Partial<Record<string, string>>
  navLabels?: Partial<Record<string, string>>
  /** fixed words of the templates in another language (Hindi pages of Core-Craft AI) */
  labels?: { learnMore?: string; welcome?: string }
  /** real pictures instead of the drawn ones (see edit/edits.ts) */
  photos?: { hero?: string; about?: string; gallery?: string[]; credit?: string }
  /** words for the scrolling keyword strip */
  marquee: string[]
  // extra data used by multi-page sites (a single page does not need them)
  timeline?: Milestone[]
  hours?: OpeningHours[]
  posts?: Post[]
  legal?: LegalDocs
}

/** variant 0 = the original headline set, 1.. = alternatives */
export function generateWebsiteContent(
  userPrompt: string,
  theme: ThemeKey,
  variant = 0,
  size: 'compact' | 'full' = 'full',
  /** everything written by the creative brain; when given it replaces the template texts */
  creative?: CreativeContent,
  /** a name the person chose: it replaces the one found in the prompt */
  brandOverride?: string,
  /** a hand-written niche pack and what the prompt says about this business (see niche/ and personalize.ts) */
  shaping?: { niche?: Niche; rand: () => number; locale?: Locale },
): WebsiteContent {
  const details = extractContentDetails(userPrompt, theme, shaping?.niche?.label)
  const businessName = brandOverride ?? details.businessName
  const subject = details.subject
  const templates = contentTemplates[theme] || contentTemplates.modern_tech
  const extra = extraContent[theme] || extraContent.modern_tech
  const headline = variant > 0 ? (templates.alternatives[variant - 1] ?? templates) : templates
  const withBrand = (text: string) => text.replaceAll('{brand}', businessName)

  const content: WebsiteContent = {
    brandName: businessName,
    subject,
    hero: {
      title: creative?.heroTitle ?? headline.heroTitle,
      subtitle: creative?.heroSubtitle ?? headline.heroSubtitle,
      button: templates.btnText,
    },
    features: {
      title: creative?.featureTitle ?? headline.featureTitle,
      items: size === 'full' ? [...templates.features, ...extra.moreFeatures] : templates.features,
    },
    stats: templates.stats,
    testimonial: templates.testimonial,
    faq: templates.faq,
    cta: {
      title: creative?.ctaTitle ?? headline.ctaTitle,
      button: templates.btnText,
    },
    about: {
      title: creative?.aboutTitle ?? extra.about.title,
      paragraphs: extra.about.paragraphs.map(withBrand),
      points: extra.about.points,
    },
    steps: creative ? { ...extra.steps, title: creative.stepsTitle } : extra.steps,
    pricing: extra.pricing,
    gallery: extra.gallery,
    team: sharedContent.team,
    testimonials: [templates.testimonial, ...extra.quotes],
    blog: { title: sharedContent.blogTitle, posts: extra.blog },
    contact: sharedContent.contact,
    marquee: [...templates.features, ...extra.moreFeatures].map((f) => f.title),
  }

  // the niche pack replaces the kit's wording, then the facts of the prompt (services, place, promises) go on top
  const shape = (value: WebsiteContent) => {
    if (!shaping) return value
    const base = shaping.niche ? applyNiche(value, shaping.niche, size, shaping.rand, shaping.locale) : value
    const avoid = shaping.niche ? [shaping.niche.label, ...shaping.niche.keywords, ...shaping.niche.features.map((f) => f.title)] : []
    const personal = personalize(base, extractFacts(userPrompt, subject, avoid), size, shaping.rand, !!shaping.niche)
    // example numbers of the kits are claims nobody made: plain statements instead
    const plain = withCuisine({ ...personal, stats: plainStats(personal.stats, shaping.rand, !/\b(?:ngo|charity|foundation|donat\w*|shelter|rescue|trust|store|shop|restaurants?|cafes?|bakery|tapri|chai|school)\b/i.test(userPrompt)) }, userPrompt)
    // no text pack: the cards of the business type next to it must not talk about another business
    return shaping.niche ? plain : scrubForeign(plain, userPrompt)
  }
  if (!creative) return shape(content)

  // the creative brain wrote every block: swap them all in
  return shape({
    ...content,
    hero: { ...content.hero, button: creative.button },
    features: {
      title: creative.featureTitle,
      items: size === 'full' ? creative.features : creative.features.slice(0, 3),
    },
    stats: creative.stats,
    testimonial: { ...creative.testimonials[0] },
    testimonials: creative.testimonials,
    faq: creative.faq,
    cta: { title: creative.ctaTitle, button: creative.button },
    about: { title: creative.aboutTitle, paragraphs: creative.about.paragraphs, points: creative.about.points },
    steps: { title: creative.stepsTitle, items: creative.steps },
    pricing: creative.pricing,
    gallery: creative.gallery,
    team: creative.team,
    blog: creative.blog,
    contact: { ...content.contact, text: creative.contactText },
    marquee: creative.marquee,
  })
}