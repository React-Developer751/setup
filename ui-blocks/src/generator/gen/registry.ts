// The generators made with partKit.ts, in one list: the id tells which one a part is, and the rest of the code (drawing, source text, review page, picks, tests, checks) goes through this list.
import { about, aboutTree } from './aboutSpec'
import { contact, contactTree } from './contactSpec'
import { faq, faqTree } from './faqSpec'
import { footer, footerTree } from './footerSpec'
import { gallery, galleryTree } from './gallerySpec'
import { nav, navTree } from './navSpec'
import { pricing, pricingTree } from './pricingSpec'
import { quotes, quotesTree } from './quotesSpec'
import type { Node } from './heroTree'
import type { Part } from './partKit'

export type KitRole = 'pricing' | 'faq' | 'testimonial' | 'gallery' | 'about' | 'contact' | 'footer' | 'nav'
export type KitPart = {
  role: KitRole
  part: Part<never>
  tree: (spec: never, className: string) => Node
  /** the repeated part the check counts (data-slot) and the slots every drawing must have */
  unit: string
  slots: string[]
}
const entry = (role: KitRole, part: unknown, tree: unknown, unit: string, slots: string[]): KitPart => ({ role, part: part as Part<never>, tree: tree as KitPart['tree'], unit, slots })
export const KIT_PARTS: KitPart[] = [
  entry('pricing', pricing, pricingTree, 'plan', ['title', 'plan', 'plan-name', 'plan-price', 'perk', 'plan-button']),
  entry('faq', faq, faqTree, 'qa', ['title', 'qa', 'q', 'a']),
  entry('testimonial', quotes, quotesTree, 'quote', ['title', 'quote', 'quote-text', 'quote-author', 'quote-role', 'quote-initial']),
  entry('gallery', gallery, galleryTree, 'shot', ['title', 'shot', 'shot-image', 'shot-caption']),
  entry('about', about, aboutTree, 'para', ['title', 'para', 'point', 'image']),
  entry('contact', contact, contactTree, 'row', ['title', 'lead', 'row', 'row-label', 'row-value', 'form', 'button']),
  entry('footer', footer, footerTree, 'col', ['brand', 'tagline', 'col', 'col-title', 'link', 'rights']),
  entry('nav', nav, navTree, 'link', ['brand', 'link', 'button']),
]

export const kitOfId = (id: string) => KIT_PARTS.find((k) => id.startsWith(k.part.head))
export const kitOfRole = (role: string) => KIT_PARTS.find((k) => k.role === role)
export const kitOfNs = (ns: string) => KIT_PARTS.find((k) => k.part.ns === ns)
/** the tree of a kit part by its id (undefined when the id is not one, or the rules no longer make it) */
export function kitTree(id: string, className: string): { tree: Node; spec: object } | undefined {
  const kit = kitOfId(id)
  const spec = kit && kit.part.of(id)
  return kit && spec ? { tree: kit.tree(spec as never, className), spec } : undefined
}
