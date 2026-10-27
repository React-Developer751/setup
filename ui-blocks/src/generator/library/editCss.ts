// What the person asked for about the look of the page ("buttons green", "headings bigger", "square corners", "serif font", "text grey") as CSS rules for
// the page made from the stored components. The rules are scoped to the page or to one part (data-role), so "make the hero text bigger" stays in the hero.
import type { FitTarget, SiteEdits } from '../edit/edits'
import { fontChoiceTokens } from '../fonts'
import { onColor } from '../themes'

const ROLES_OF: Record<string, string[]> = {
  header: ['nav'], hero: ['hero'], footer: ['footer'], stats: ['stats'], features: ['features'], about: ['about', 'profile'], steps: ['steps'], gallery: ['gallery'],
  pricing: ['pricing'], team: ['team'], testimonials: ['testimonial'], blog: ['blog'], faq: ['faq'], cta: ['cta'], contact: ['contact'],
}
const FAMILIES = ['indigo', 'blue', 'purple', 'violet', 'fuchsia', 'pink', 'rose', 'sky', 'cyan', 'teal', 'emerald', 'green', 'lime', 'amber', 'yellow', 'orange']
/** the classes the kits give to their buttons (the colour families all follow the main colour in this engine) */
const BUTTON_BG = [...FAMILIES.flatMap((f) => [500, 600, 700].map((n) => `.bg-${f}-${n}`)), '.bg-primary', '.bg-brand', '.bg-brand-strong'].join(',')

const scopes = (target: FitTarget): string[] => (target === 'page' ? ['[data-gen-theme]'] : (ROLES_OF[target] ?? []).map((role) => `[data-role="${role}"]`))
const under = (scope: string, selector: string) => selector.split(',').map((part) => `${scope} ${part.trim()}`).join(',')
const scale = (step: string) => (1 + 0.12 * Number(step)).toFixed(2)

/** the CSS for the looks the person chose; '' when there is none */
export function editCss(edits: SiteEdits | undefined): string {
  const rules: string[] = []
  // the page first, then the parts: a part's rule is later, so it wins
  const order = (Object.keys(edits?.styles ?? {}) as FitTarget[]).sort((a, b) => Number(b === 'page') - Number(a === 'page'))
  for (const target of order) {
    const given = edits?.styles[target]
    if (!given) continue
    // 'default' takes a look back
    const style = Object.fromEntries(Object.entries(given).filter(([, value]) => value !== 'default')) as typeof given
    for (const scope of scopes(target)) {
      if (style.buttonColor) rules.push(`${under(scope, BUTTON_BG)}{background-color:${style.buttonColor}!important;border-color:${style.buttonColor}!important;color:${onColor(style.buttonColor)}!important}`)
      if (style.headingColor) rules.push(`${under(scope, 'h1,h2,h3,h4,h5,h6')}{color:${style.headingColor}!important}`)
      if (style.textColor) rules.push(`${under(scope, 'p,li,label,td,th,dd')}{color:${style.textColor}!important}`)
      if (style.radius === 'square') rules.push(`${under(scope, '*')}{border-radius:0!important}`)
      if (style.radius === 'pill') rules.push(`${under(scope, BUTTON_BG + ',input,textarea,select')}{border-radius:9999px!important}`)
      if (style.radius === 'rounded') rules.push(`${under(scope, BUTTON_BG + ',input,textarea,select,[class*="rounded"]:not(.rounded-full):not(img)')}{border-radius:.75rem!important}`)
      if (style.headingSize) rules.push(`${under(scope, 'h1,h2,h3,h4')}{zoom:${scale(style.headingSize)}}`)
      if (style.textSize) rules.push(`${under(scope, 'p,li,label,td,th,dd')}{zoom:${scale(style.textSize)}}`)
    }
  }
  return rules.join('\n')
}

/** the typeface the person chose for the page ("serif font"): the CSS variables every font class of the page reads */
export function chosenFont(edits: SiteEdits | undefined): Record<string, string> | undefined {
  const key = edits?.styles?.page?.font
  return key && key !== 'default' ? fontChoiceTokens(key) : undefined
}
