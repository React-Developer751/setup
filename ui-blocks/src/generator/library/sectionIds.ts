import type { Role } from './libraryRoles'

/** Anchor id for the roles that the navigation can link to. */
export const sectionIds: Partial<Record<Role, string>> = {
  hero: 'home',
  about: 'about',
  features: 'features',
  gallery: 'gallery',
  pricing: 'pricing',
  team: 'team',
  blog: 'blog',
  faq: 'faq',
  contact: 'contact',
}
