// Does the prompt say how many pages the site should have? "a landing page", "single page", "ek page" -> one page;
// "multi-page", "website with several pages" -> a site with pages. Nothing said -> undefined (the setting stays as it is).
const ONE = /\b(single[\s-]?page|one[\s-]?pager?|onepager|landing[\s-]?page|ek\s+(?:hi\s+)?page|sirf\s+ek\s+page|1[\s-]?page)\b/i
const MANY = /\b(multi[\s-]?page|multiple\s+pages|several\s+pages|many\s+pages|[2-9]\s*[\s-]?pages?\b|(?:alag|kai|bahut)\s+(?:alag\s+)?pages?|pages?\s+wali|full\s+website\s+with\s+pages)\b/i

export function pagesWanted(prompt: string): 'single' | 'multi' | undefined {
  if (MANY.test(prompt) && !/\b(single|one|ek)\b[\s-]*(hi\s+)?page/i.test(prompt)) return 'multi'
  if (ONE.test(prompt)) return 'single'
  return undefined
}
