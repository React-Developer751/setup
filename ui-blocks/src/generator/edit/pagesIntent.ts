// Does the prompt say how many pages the site should have? "a landing page", "single page", "ek page" -> one page;
// "multi-page", "website with several pages" -> a site with pages. Nothing said -> undefined (the setting stays as it is).
const ONE = /\b(single[\s-]?page|one[\s-]?pager?|onepager|landing[\s-]?page|ek\s+(?:hi\s+)?page|sirf\s+ek\s+page|1[\s-]?page)\b/i
const MANY = /\b(multi[\s-]?pages?|multiple\s+pages?|several\s+pages?|many\s+pages?|(?:[2-9]|1\d)\s*[\s-]?pages?|(?:alag|kai|bahut|zyada|saare)\s+(?:alag\s+)?pages?|pages?\s+(?:wali|waali|wala|ki\s+website|ke\s+sath|ke\s+saath)|website\s+with\s+[^.]{0,60}?\bpages|menu\s+wali)\b/i

export function pagesWanted(prompt: string): 'single' | 'multi' | undefined {
  if (MANY.test(prompt) && !/\b(single|one|ek)\b[\s-]*(hi\s+)?page/i.test(prompt)) return 'multi'
  if (ONE.test(prompt)) return 'single'
  return undefined
}
