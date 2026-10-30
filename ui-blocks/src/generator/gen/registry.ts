// The generators made with partKit.ts, in one list: the id tells which one a part is, and the rest of the code (drawing, source text, review page, picks, tests) goes through this list.
import { faq, faqTree } from './faqSpec'
import { gallery, galleryTree } from './gallerySpec'
import { pricing, pricingTree } from './pricingSpec'
import { quotes, quotesTree } from './quotesSpec'
import type { Node } from './heroTree'
import type { Part } from './partKit'

export type KitPart = { role: 'pricing' | 'faq' | 'testimonial' | 'gallery'; part: Part<never>; tree: (spec: never, className: string) => Node }
const entry = (role: KitPart['role'], part: unknown, tree: unknown): KitPart => ({ role, part: part as Part<never>, tree: tree as KitPart['tree'] })
export const KIT_PARTS: KitPart[] = [entry('pricing', pricing, pricingTree), entry('faq', faq, faqTree), entry('testimonial', quotes, quotesTree), entry('gallery', gallery, galleryTree)]

export const kitOfId = (id: string) => KIT_PARTS.find((k) => id.startsWith(k.part.head))
export const kitOfRole = (role: string) => KIT_PARTS.find((k) => k.role === role)
export const kitOfNs = (ns: string) => KIT_PARTS.find((k) => k.part.ns === ns)
/** the tree of a kit part by its id (undefined when the id is not one, or the rules no longer make it) */
export function kitTree(id: string, className: string): { tree: Node; spec: object } | undefined {
  const kit = kitOfId(id)
  const spec = kit && kit.part.of(id)
  return kit && spec ? { tree: kit.tree(spec as never, className), spec } : undefined
}
