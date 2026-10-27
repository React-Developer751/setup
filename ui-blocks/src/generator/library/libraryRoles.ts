// Which section of a page each of the 92 stored components can play.
// The generator's "component library" engine picks one component per role.
export type Role =
  | 'banner'
  | 'nav'
  | 'hero'
  | 'about'
  | 'features'
  | 'links'
  | 'profile'
  | 'blog'
  | 'stats'
  | 'steps'
  | 'gallery'
  | 'pricing'
  | 'team'
  | 'testimonial'
  | 'contact'
  | 'cta'
  | 'faq'
  | 'footer'

const range = (folder: string, name: string, from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => `${folder}/${name}${from + i}`)

// blog sections made from single cards (scripts/make-cardgrids.mjs)
const PICTURE_CARDS = [1, 3, 4, 9]

export const rolePools: Record<Role, string[]> = {
  nav: [...range('navbar', 'Navbar', 1, 11), ...range('header', 'Header', 1, 11)],
  // Hero1 needs /assets/img/hero/valley*.webp (placeholders live in public/assets/img/hero/). Hero18-28 come from other kits (their pictures are replaced by the page's own).
  // Hero11 is a sign-up box (passwords, terms): it does not belong on the page of a business
  hero: [...range('hero', 'Hero', 1, 10), ...range('hero', 'Hero', 12, 17), ...range('hero', 'Hero', 18, 28)],
  about: ['content/Content2', 'content/Content5', 'content/Content7', 'content/Content8'],
  features: ['content/Content1', 'content/Content3', 'blog/Blog2', ...range('features', 'Features', 12, 16), 'features/Features18', 'features/Features19'],
  links: ['content/Content4'],
  profile: ['content/Content6'],
  blog: [...range('blog', 'Blog', 1, 1), 'blog/Blog3', 'blog/Blog4', 'blog/Blog5', ...range('blog', 'Blog', 6, 11), ...PICTURE_CARDS.map((n) => `cardgrid/CardGrid${n}`)],
  stats: range('statics', 'Statics', 1, 3),
  steps: [...range('step', 'Step', 1, 3), 'stepsection/StepSection3', 'stepsection/StepSection6'],
  gallery: [...range('gallery', 'Gallery', 1, 10), ...range('portfolio', 'Portfolio', 1, 5)],
  pricing: range('pricing', 'Pricing', 1, 9),
  // Teams3, 6 and 7 are four screens tall: left out
  team: [...range('team', 'Team', 1, 3), 'teams/Teams1', 'teams/Teams2', 'teams/Teams4', 'teams/Teams5'],
  testimonial: range('testimonial', 'Testimonial', 1, 10),
  contact: range('contact', 'Contact', 1, 11),
  cta: range('cta', 'Cta', 1, 10),
  faq: range('faq', 'Faq', 1, 5),
  footer: range('footer', 'Footer', 1, 15),
  // an announcement bar above the menu (drawn last so the other parts of a page stay as they were)
  banner: ['banner/Banner1', 'banner/Banner2', 'banner/Banner5'],
}

// features/Features1..11 are exact copies of blog / contact / content components (see componentRegistry.ts),
// so they are covered through the originals above.
export const coveredBy: Record<string, string> = {
  'features/Features1': 'blog/Blog1',
  'features/Features2': 'blog/Blog2',
  'features/Features3': 'blog/Blog3',
  'features/Features4': 'blog/Blog4',
  'features/Features5': 'blog/Blog5',
  'features/Features6': 'contact/Contact1',
  'features/Features7': 'contact/Contact2',
  'features/Features8': 'contact/Contact3',
  'features/Features9': 'content/Content1',
  'features/Features10': 'content/Content2',
  'features/Features11': 'content/Content3',
}

export const roleOf = (id: string): Role | undefined =>
  (Object.keys(rolePools) as Role[]).find((role) => rolePools[role].includes(id))

// Which of those components fit each design level. A role that is not listed uses its full pool.
// normal  = plain, quiet components
// premium = the richer, more polished ones (Preline heroes, timelines, newsletter footers ...)
export const tierPools: Record<'normal' | 'premium', Partial<Record<Role, string[]>>> = {
  normal: {
    nav: ['navbar/Navbar1', 'navbar/Navbar2', 'navbar/Navbar3', 'navbar/Navbar6'],
    hero: ['hero/Hero9', 'hero/Hero12', 'hero/Hero13', 'hero/Hero14', 'jumbotron/Jumbotron1', 'jumbotron/Jumbotron2', 'jumbotron/Jumbotron3'],
    about: ['content/Content5', 'content/Content7'],
    features: ['content/Content1', 'blog/Blog2'],
    cta: ['cta/Cta1', 'cta/Cta5'],
    contact: ['contact/Contact1', 'contact/Contact3'],
    footer: ['footer/Footer1', 'footer/Footer4'],
  },
  premium: {
    nav: ['navbar/Navbar3', 'navbar/Navbar4', 'navbar/Navbar5', 'header/Header3', 'header/Header5', 'header/Header8'],
    hero: ['hero/Hero1', 'hero/Hero2', 'hero/Hero4', 'hero/Hero6', 'hero/Hero8', 'hero/Hero10', 'hero/Hero18', 'hero/Hero20', 'hero/Hero24', 'hero/Hero26'], // Hero5 has a developer-style npm snippet
    about: ['content/Content2', 'content/Content8'],
    features: ['content/Content1', 'content/Content3'],
    stats: ['statics/Statics1', 'statics/Statics3'],
    steps: ['step/Step1', 'step/Step3'],
    gallery: ['gallery/Gallery1', 'gallery/Gallery3'],
    pricing: ['pricing/Pricing1'],
    team: ['team/Team2', 'team/Team3'],
    testimonial: ['testimonial/Testimonial1', 'testimonial/Testimonial3'],
    blog: ['blog/Blog1', 'blog/Blog3', 'blog/Blog5'],
    cta: ['cta/Cta2', 'cta/Cta3'],
    contact: ['contact/Contact2'],
    footer: ['footer/Footer3', 'footer/Footer5'],
  },
}
