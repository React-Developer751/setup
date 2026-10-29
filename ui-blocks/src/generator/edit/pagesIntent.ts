// Does the prompt say how many pages the site should have? "a landing page", "single page", "ek page" -> one page;
// "multi-page", "website with several pages" -> a site with pages. Nothing said -> undefined (the setting stays as it is).
const ONE = /\b(single[\s-]?page|one[\s-]?pager?|onepager|landing[\s-]?page|ek\s+(?:hi\s+)?page|sirf\s+ek\s+page|1[\s-]?page)\b/i
const MANY = /\b(multi[\s-]?pages?|multiple\s+pages?|several\s+pages?|many\s+pages?|(?:[2-9]|1\d)\s*[\s-]?pages?|(?:alag|kai|bahut|zyada|saare)\s+(?:alag\s+)?pages?|pages?\s+(?:wali|waali|wala|ki\s+website|ke\s+sath|ke\s+saath)|website\s+with\s+[^.]{0,60}?\bpages|menu\s+wali)\b/i

export function pagesWanted(prompt: string): 'single' | 'multi' | undefined {
  if (MANY.test(prompt) && !/\b(single|one|ek)\b[\s-]*(hi\s+)?page/i.test(prompt)) return 'multi'
  if (ONE.test(prompt)) return 'single'
  return undefined
}

// ─────────── nobody should have to choose "one page or several": the prompt says it, or the kind of business does ───────────
const SECTION_WORDS = /\b(about|about us|services?|contact|pricing|prices?|plans?|blog|articles?|gallery|photos?|portfolio|team|faq|questions|testimonials?|reviews?|menu|products?|courses?|admissions?|fees|departments?|doctors?|facilities|rooms?|packages?|projects?|events?|careers?|branches|locations?)\b/gi
const FULL_SITE = /\b(full|complete|entire|proper|official|corporate|company|institution|school|college|university|hospital|hotel|resort|multi[\s-]?speciality|multi[\s-]?specialty)\b[^.]{0,24}\bwebsite\b|\b(?:hospital|college|university|school|hotel|resort)\b/i
/** the kinds of business that are visited to look around (a lot to show): they get pages when the brief is detailed */
const ROOMY = new Set(['education', 'healthcare', 'food_dining', 'fashion_retail', 'luxury_minimal', 'creative_studio', 'travel_tourism', 'real_estate', 'events_wedding', 'nonprofit'])

export type PagesChoice = { mode: 'single' | 'multi'; reason: string }

/**
 * One long page or a site with pages, from what the person wrote and what kind of business it is:
 *  - they said it ("landing page", "multi-page site"): that;
 *  - they listed three or more things to show ("home, about, services, gallery, contact"), or asked for a full / company / school / hospital website: pages;
 *  - a detailed brief (fourteen words or more) for a business that is visited to look around: pages;
 *  - otherwise a landing page: one page that says what you do and how to reach you, which is what a short brief of a local business needs.
 */
export function autoPages(prompt: string, theme: string): PagesChoice {
  const said = pagesWanted(prompt)
  if (said === 'single') return { mode: 'single', reason: 'you asked for one page' }
  if (said === 'multi') return { mode: 'multi', reason: 'you asked for several pages' }
  const listed = new Map((prompt.match(SECTION_WORDS) ?? []).map((w) => [w.toLowerCase().replace(/s$/, ''), w.toLowerCase()] as const))
  if (listed.size >= 3) return { mode: 'multi', reason: `you listed ${listed.size} things to show (${[...listed.values()].slice(0, 4).join(', ')})` }
  if (FULL_SITE.test(prompt)) return { mode: 'multi', reason: 'a full website of an institution, a company or a hospital needs its own pages' }
  const words = prompt.split(/\s+/).filter((w) => w.length > 2).length
  if (words >= 14 && ROOMY.has(theme)) return { mode: 'multi', reason: 'a detailed brief for a business people look around in' }
  return { mode: 'single', reason: 'a short brief for one business: a landing page says what you do and how to reach you' }
}
