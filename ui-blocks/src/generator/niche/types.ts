import type { ThemeKey } from '../themes'

/** hand-written text for one kind of business (src/data/niches/NICHE_SPEC.md) */
export type Niche = {
  id: string
  label: string
  theme: ThemeKey
  keywords: string[]
  heroTitles: string[]
  heroSubtitles: string[]
  button: string
  featureTitle: string
  features: { title: string; text: string }[]
  stats: { value: string; label: string }[]
  steps: { title: string; items: { title: string; text: string }[] }
  faq: { q: string; a: string }[]
  cta: { title: string; button: string }
  about: { title: string; paragraphs: string[]; points: string[] }
  /** a menu board: categories with their items (an item may carry a short note after " | ") */
  menu?: { title: string; lead?: string; categories: { name: string; items: string[] }[] }
  pricing: { title: string; plans: { name: string; price: string; period: string; perks: string[] }[] }
  gallery: { title: string; captions: string[] }
  team: { title: string; roles: string[] }
  testimonials: { quote: string; role: string }[]
  blog: { title: string; posts: { tag: string; title: string }[] }
  marquee: string[]
  contactText: string
}
