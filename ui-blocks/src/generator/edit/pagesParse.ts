// "make it multiple pages", "multi page me convert karo", "add about page and contact page", "isko ek hi page me karo": the person changes between one long page and a site of several pages.
// This is an edit like any other (op 'pages'), so it is in the chat, can be undone and is kept in the project. Naming pages ("add a pricing page") on a one-page site turns it into a site with pages.
import type { EditOp, PageKey, SectionKey } from './edits'
import { PAGES } from './edits'

export type PagesResult = { ops: EditOp[]; notes: string[]; rest: string }

const L = (re: string) => new RegExp(`(?<![\\p{L}\\p{N}])(?:${re})(?![\\p{L}\\p{N}])`, 'iu')
const PAGE = '(?:pages?|panne|pej)'
const MULTI = L(`(?:multi(?:ple)?|several|many|more|alag\\s+alag|kai|kayi|bahut|separate|different)[\\s-]*${PAGE}|${PAGE}\\s+(?:wali|wala|ki|ka)\\s+(?:website|site)|(?:website|site)\\s+(?:with|me|mein)\\s+(?:many\\s+|multiple\\s+|several\\s+)?${PAGE}`)
const SINGLE = L(`(?:single|one|ek|1|only\\s+one|sirf\\s+ek)[\\s-]*(?:hi\\s+|long\\s+|scrolling\\s+)?${PAGE}|landing\\s+page|(?:sab|sabkuch|sab\\s+kuch|everything)\\s+(?:ek\\s+hi\\s+|on\\s+one\\s+|in\\s+one\\s+)?page`)
const VERB = L('make|convert|change|turn|switch|build|create|karo|kardo|kar\\s+do|banao|bana\\s+do|badlo|badal\\s+do|chahiye|chaiye|want|need|do|de|dedo|into|to|me|mein|jodo|add|put|split|break|rakho|laga')
const ADD_PAGES = L(`(?:add|jodo|jod\\s+do|create|banao|bana\\s+do|laga(?:o|\\s+do)?|rakho|put|insert|chahiye|chaiye|want|need|include)\\s+(?:some\\s+|few\\s+|more\\s+|extra\\s+|aur\\s+|kuch\\s+)?${PAGE}`)
const PAGES_THEN_VERB = L(`${PAGE}\\s+(?:jodo|jod\\s+do|add|banao|bana\\s+do|chahiye|chaiye|lagao|laga\\s+do|add\\s+karo)`)
const SPLIT = L(`(?:split|break|divide|alag)\\s+(?:it\\s+|this\\s+|isko\\s+|ise\\s+)?(?:into|in|ko)?\\s*${PAGE}`)

const NAMES: [PageKey, string][] = [
  ['about', 'about(?:\\s+us)?|about\\s+page|hamare\\s+baare\\s+me'], ['services', 'services?|features?|what\\s+we\\s+do|offerings?'], ['pricing', 'pricing|prices?|plans?|rates?|menu\\s+prices?'],
  ['team', 'team|staff|doctors?|people'], ['gallery', 'gallery|photos?|portfolio|work'], ['blog', 'blog|news|articles?|posts?'], ['faq', 'faqs?|questions?|help'],
]

/** the pages named in a text ("about page and contact page", "pricing, gallery, blog pages") */
function namedPages(text: string): PageKey[] {
  const found: PageKey[] = []
  for (const [key, words] of NAMES) if (L(words).test(text)) found.push(key)
  return found
}

/** "menu me Home About Contact hi rakho", "pages: home, about, services only": exactly these pages */
function exactPages(t: string): PageKey[] | undefined {
  const m = t.match(/(?:^|\s)(?:pages?|menu|navbar|nav|navigation)\s*(?:me|mein|should\s+(?:have|be)|only|:|=)\s*(.+?)(?:\s+(?:hi|only|bas|sirf))?\s*(?:rakho|rakh\s+do|chahiye|chaiye|dikhao|banao|karo|kar\s+do|do|please)?\s*$/i)
  if (!m) return undefined
  const list = m[1]
  const words = list.split(/[\s,&]+|\band\b|\baur\b/i).filter(Boolean)
  const known = /^(?:home|about(?:us)?|services?|features?|pricing|prices?|menu|gallery|team|blog|faqs?|contact(?:us)?|hi|only|bas|sirf)$/i
  if (words.length < 2 || !words.every((w) => known.test(w))) return undefined
  return namedPages(list)
}

/** the page changes a message asks for; undefined when it is not about pages */
/** a page of the stored-component engine is made of its section: a Pricing page exists when the pricing part does */
const SECTION_OF: Record<PageKey, SectionKey> = { about: 'about', services: 'features', pricing: 'pricing', team: 'team', gallery: 'gallery', blog: 'blog', faq: 'faq' }

export function pagesOps(text: string, context: 'single' | 'multi', sections = false): PagesResult | undefined {
  // a message may hold several requests ("rename it to X, also make it multiple pages"): the clauses about pages are read here, the others go on to the other readers
  const parts = text.split(/\s*(?:[,;]|\band\s+also\b|\balso\b|\bthen\b|\bphir\b|\bbhi\b(?=\s+\w+\s+(?:karo|kar))|\baur\b)\s*/i).map((c) => c.trim()).filter(Boolean)
  const ops: EditOp[] = []
  const notes: string[] = []
  const rest: string[] = []
  let used = false
  for (const part of parts.length ? parts : [text]) {
    const one = pagesClause(part, context, sections)
    if (one) {
      ops.push(...one.ops)
      notes.push(...one.notes)
      used = true
      // after the change the site is a site with pages (or one page): the next clauses see that
      if (one.ops.some((o) => o.op === 'pages')) context = (one.ops.find((o) => o.op === 'pages') as { mode: 'single' | 'multi' }).mode
    } else rest.push(part)
  }
  return used ? { ops, notes, rest: rest.join(', ') } : undefined
}

/** one clause: a change between one page and several (with the pages it names), or "exactly these pages"; adding or removing one page of a site with pages is for the other readers */
function pagesClause(t: string, context: 'single' | 'multi', sections: boolean): PagesResult | undefined {
  const exact = exactPages(t)
  if (exact) {
    const keep = new Set(exact)
    const ops: EditOp[] = []
    if (context === 'single') ops.push({ op: 'pages', mode: 'multi' })
    for (const page of PAGES) {
      if (keep.has(page)) ops.push(...(sections ? [{ op: 'add', section: SECTION_OF[page] } as EditOp] : [{ op: 'addPage', page } as EditOp, { op: 'add', section: SECTION_OF[page] } as EditOp]))
      else if (page !== 'about' && page !== 'services') ops.push(...(sections ? [{ op: 'remove', section: SECTION_OF[page] } as EditOp] : [{ op: 'removePage', page } as EditOp, { op: 'remove', section: SECTION_OF[page] } as EditOp]))
    }
    return { ops, notes: [`The menu now has: Home, ${[...keep].map((k) => k[0].toUpperCase() + k.slice(1)).join(', ')} and Contact.`], rest: '' }
  }
  if (!PAGE_WORD.test(t)) return undefined
  const named = namedPages(t)
  const wantsSingle = SINGLE.test(t) && (VERB.test(t) || /^\s*(?:single|one|ek)\b/i.test(t)) && !MULTI.test(t) && !/\bpage\s+(?:pe|par|per)\b/i.test(t)
  if (wantsSingle) {
    return { ops: context === 'multi' ? [{ op: 'pages', mode: 'single' }] : [], notes: [context === 'multi' ? 'It is one long page again: every part is on it, and the menu scrolls to them.' : 'It is one long page already.'], rest: '' }
  }
  const addPage = ADD_PAGES.test(t) || PAGES_THEN_VERB.test(t) || SPLIT.test(t)
  const wantsMulti = MULTI.test(t) || SPLIT.test(t) || /\b(?:convert|change|turn|switch|make)\b[^.]*\b(?:to|into|as)\b[^.]*\b(?:multi|several|pages?)\b/i.test(t)
  const pageRequest = named.length > 0 && /\bpages?\b/i.test(t) && (addPage || /\b(?:add|jodo|banao|chahiye|want|need|create|make)\b/i.test(t)) && !L('remove|delete|hatao|hata\\s+do|nikalo|nahi|nhi').test(t)
  // in a site with pages, adding or removing one page is an ordinary add / remove of its part (the other readers do it)
  if (context === 'multi') return wantsMulti && !named.length ? { ops: [], notes: ['It already has several pages. Say which one to add: "add a pricing page", "add a blog page" ...'], rest: '' } : undefined
  if (!wantsMulti && !addPage && !pageRequest) return undefined
  const ops: EditOp[] = [{ op: 'pages', mode: 'multi' }]
  for (const page of named) ops.push(...(sections ? [{ op: 'add', section: SECTION_OF[page] } as EditOp] : [{ op: 'addPage', page } as EditOp, { op: 'add', section: SECTION_OF[page] } as EditOp]))
  return { ops, notes: ['Now a site with pages (Home, About, Services, Contact and the others the business needs). Say "add a blog page", "remove the pricing page" or "one page again" to change it.'], rest: '' }
}

const PAGE_WORD = L(`${PAGE}|panne`)
export const PAGE_KEYS = PAGES
