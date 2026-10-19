// Site brain: decides which pages a website has, what they are called and what goes on each of them.
//
//   normal  : 4 pages   (Home, About, Services, Contact)
//   better  : + Pricing and Blog
//   premium : + Team, Gallery and FAQ
//
// Business types name the pages differently: a clinic has "Treatments" and "Our Doctors", a gym has
// "Programs" and "Coaches".
import { fromKits } from './kits'
import type { Tier } from './designBrain'
import type { LayoutChoice, LayoutId } from './finalProductionTemplate'
import type { WebsiteContent } from './finalPrompt'
import type { PageId, PagePlan, Post } from './siteTypes'
import { filterLayout } from './edit/applyEdits'
import type { SectionKey, SiteEdits } from './edit/edits'
import type { ThemeKey } from './themes'

/** Pages the builder can make. */
export const ENABLED_PAGES: PageId[] = ['home', 'about', 'services', 'pricing', 'team', 'gallery', 'blog', 'faq', 'contact', 'privacy', 'terms']

const DEFAULT_LABELS: Record<PageId, string> = {
  home: 'Home',
  about: 'About',
  services: 'Services',
  pricing: 'Pricing',
  team: 'Team',
  gallery: 'Gallery',
  blog: 'Blog',
  faq: 'FAQ',
  contact: 'Contact',
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
}

const LABELS: Partial<Record<ThemeKey, Partial<Record<PageId, string>>>> = {
  modern_tech: { services: 'Features' },
  luxury_minimal: { services: 'Collections', blog: 'Journal', team: 'Atelier' },
  organic_nature: { services: 'Offerings', blog: 'Journal' },
  bold_fitness: { services: 'Programs', team: 'Coaches', pricing: 'Memberships' },
  playful_vibrant: { services: 'Explore', blog: 'News' },
  professional_services: { team: 'Our Team', blog: 'Insights' },
  healthcare: { services: 'Treatments', team: 'Our Doctors', blog: 'Health Tips' },
  food_dining: { services: 'Menu', team: 'Chefs' },
  education: { services: 'Courses', team: 'Teachers', blog: 'Resources' },
  creative_studio: { services: 'Work', team: 'Studio', blog: 'Journal' },
  general_business: { blog: 'News' },
  ...fromKits((kit) => kit.labels),
}

/** the order pages appear in the top navigation (Contact always closes it) */
const NAV_PRIORITY: PageId[] = ['home', 'about', 'services', 'pricing', 'blog', 'team', 'gallery', 'faq']
const MAX_NAV_LINKS = 5

export const PATHS: Record<PageId, string> = {
  home: '/',
  about: '/about',
  services: '/services',
  pricing: '/pricing',
  team: '/team',
  gallery: '/gallery',
  blog: '/blog',
  faq: '/faq',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
}

export type SitePlan = {
  pages: PagePlan[]
  headerStyle: 'center' | 'left'
  labels: Record<PageId, string>
}

const testimonialsSection = (choice: LayoutChoice): LayoutId =>
  choice.testimonials === 'grid' ? 'testimonials-grid' : choice.testimonials === 'carousel' ? 'testimonials-carousel' : 'testimonial'

export function planSite(
  theme: ThemeKey,
  tier: Tier,
  content: WebsiteContent,
  choice: LayoutChoice,
  rand: () => number,
  posts: Post[] = [],
  edits?: SiteEdits,
): SitePlan {
  const labels = { ...DEFAULT_LABELS, ...(LABELS[theme] ?? {}) }

  // which pages this site has
  const wanted: PageId[] = ['home', 'about', 'services', 'contact', 'privacy', 'terms']
  if (tier !== 'normal') wanted.push('pricing', 'blog')
  if (tier === 'premium') wanted.push('team', 'gallery', 'faq')
  // pages the person added or removed
  for (const page of edits?.addedPages ?? []) if (!wanted.includes(page)) wanted.push(page)
  const dropped = new Set<PageId>(edits?.hiddenPages ?? [])
  const has = (id: PageId) => wanted.includes(id) && !dropped.has(id) && ENABLED_PAGES.includes(id)
  const present = (Object.keys(PATHS) as PageId[]).filter(has)

  const navIds = [...NAV_PRIORITY.filter(has).slice(0, MAX_NAV_LINKS), 'contact' as PageId]
  const aboutSection: LayoutId = choice.aboutSide === 'left' ? 'about-left' : 'about-right'
  const faqTeaser: LayoutId[] = has('faq') ? [] : ['faq']

  const sections: Record<PageId, LayoutId[]> = {
    home: [
      choice.hero,
      ...(choice.marquee ? (['marquee'] as LayoutId[]) : []),
      ...(choice.stats ? (['stats'] as LayoutId[]) : []),
      choice.features,
      aboutSection,
      testimonialsSection(choice),
      ...(has('blog') ? (['blog'] as LayoutId[]) : []),
      'cta',
    ],
    about: ['page-header', aboutSection, 'timeline', ...(choice.stats ? (['stats'] as LayoutId[]) : []), 'team', 'cta'],
    services: ['page-header', choice.features, choice.steps === 'grid' ? 'steps-grid' : 'steps-timeline', ...faqTeaser, 'cta'],
    pricing: ['page-header', 'pricing', ...faqTeaser, 'cta'],
    team: ['page-header', 'team', 'cta'],
    gallery: ['page-header', 'gallery', 'cta'],
    blog: ['page-header', 'blog-list', 'cta'],
    faq: ['page-header', 'faq', 'cta'],
    contact: ['page-header', 'contact', 'map-block', ...faqTeaser],
    privacy: ['page-header', 'legal-body'],
    terms: ['page-header', 'legal-body'],
  }

  // heading and intro of each page, taken from the text the brains already wrote
  const copy: Record<PageId, { title: string; subtitle: string }> = {
    home: { title: content.hero.title, subtitle: content.hero.subtitle },
    about: { title: content.about.title, subtitle: content.about.paragraphs[0] },
    services: { title: content.features.title, subtitle: content.hero.subtitle },
    pricing: { title: content.pricing.title, subtitle: content.hero.subtitle },
    team: { title: content.team.title, subtitle: content.about.paragraphs[1] ?? content.about.paragraphs[0] },
    gallery: { title: content.gallery.title, subtitle: content.about.paragraphs[0] },
    blog: { title: content.blog.title, subtitle: 'Notes, guides and stories from the people behind the work.' },
    faq: { title: content.titles?.faq ?? 'Frequently asked questions', subtitle: 'Quick answers to the things people ask us most.' },
    contact: { title: content.contact.title, subtitle: content.contact.text },
    privacy: { title: 'Privacy Policy', subtitle: `How ${content.brandName} collects, uses and protects your information.` },
    terms: { title: 'Terms of Service', subtitle: `The rules for using the ${content.brandName} website and services.` },
  }

  // sections the person removed: from the home page (and from every page for the ones that repeat, like the call to action)
  const everywhere: SectionKey[] = ['stats', 'marquee', 'testimonials', 'cta', 'faq', 'blog', 'team', 'gallery', 'pricing']
  const forPage = (id: PageId, list: LayoutId[]) =>
    filterLayout(list, edits?.hidden.length ? { ...edits, hidden: edits.hidden.filter((s) => id === 'home' || everywhere.includes(s)) } : edits)

  const pages: PagePlan[] = present.map((id) => ({
    id,
    path: PATHS[id],
    label: labels[id],
    title: copy[id].title,
    subtitle: copy[id].subtitle,
    sections: forPage(id, sections[id]),
    inNav: navIds.includes(id),
  }))

  // every blog post is a page of its own
  const blog = pages.find((p) => p.id === 'blog')
  if (blog) {
    for (const post of posts) {
      pages.push({
        id: 'post',
        path: `/blog/${post.slug}`,
        label: post.title,
        title: post.title,
        subtitle: post.excerpt,
        sections: forPage('post' as PageId, ['post-body', ...(posts.length > 1 ? (['blog-related'] as LayoutId[]) : []), 'cta']),
        inNav: false,
        slug: post.slug,
      })
    }
  }

  return { pages, headerStyle: rand() < 0.5 ? 'center' : 'left', labels }
}
