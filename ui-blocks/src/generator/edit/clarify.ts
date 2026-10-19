// When the rules found no change in a message but the intent is clear ("something about colours"), the chat asks for the
// missing detail with buttons, or waits for a typed value (a name, a business type, a phone number). Every button is a list
// of ordinary operations, so what it does is the same as a typed command.
import { decideTheme, isBusinessWord } from '../themeClassifier'
import type { ThemeKey } from '../themes'
import type { Intent } from './intent'
import { cleanOp, type EditOp, type SectionKey } from './edits'
import { parseEdit, sectionChange, type EditContext } from './understand'

export type Choice = { label: string; ops?: EditOp[]; action?: 'newSite' | 'dismiss' }
export type Expect = 'name' | 'business' | 'contact' | 'text'
export type Clarify = { question: string; choices: Choice[]; expect?: Expect }

const SECTION_LABEL: Record<SectionKey, string> = {
  stats: 'Numbers', marquee: 'Scrolling strip', features: 'Services / features', about: 'About', steps: 'How it works', gallery: 'Gallery', pricing: 'Pricing',
  team: 'Team', testimonials: 'Reviews', blog: 'Blog', faq: 'FAQ', cta: 'Call-to-action banner', contact: 'Contact',
}
const REMOVABLE = (Object.keys(SECTION_LABEL) as SectionKey[]).filter((k) => k !== 'contact')

const accent = (label: string, hex: string): Choice => ({ label, ops: [{ op: 'accent', hex }] })

export function clarify(intent: Intent, context: EditContext): Clarify | undefined {
  switch (intent) {
    case 'tier':
      return { question: 'Do you want the design simpler or richer?', choices: [{ label: 'Simpler', ops: [{ op: 'tier', tier: 'normal' }] }, { label: 'Better', ops: [{ op: 'tier', tier: 'better' }] }, { label: 'Premium', ops: [{ op: 'tier', tier: 'premium' }] }] }
    case 'motion':
      return { question: 'How much movement should the page have?', choices: [{ label: 'No animations', ops: [{ op: 'motion', level: 'off' }] }, { label: 'Subtle', ops: [{ op: 'motion', level: 'subtle' }] }, { label: 'Rich', ops: [{ op: 'motion', level: 'rich' }] }] }
    case 'mode':
      return { question: 'Should the site start dark or light?', choices: [{ label: 'Dark', ops: [{ op: 'mode', mode: 'dark' }] }, { label: 'Light', ops: [{ op: 'mode', mode: 'light' }] }] }
    case 'recolor':
      return {
        question: 'Which colour? Pick one below, use the 🎨 picker, or type a hex like #0a7a5c. (I know about 120 colour names and many things like ocean or mango; the AI server knows every colour name.)',
        choices: [
          accent('Blue', '#2563eb'), accent('Red', '#dc2626'), accent('Green', '#16a34a'), accent('Orange', '#ea580c'), accent('Purple', '#7c3aed'), accent('Teal', '#0d9488'), accent('Pink', '#ec4899'), accent('Gold', '#ca8a04'), accent('Navy', '#1e3a8a'), accent('Maroon', '#991b1b'), accent('Black', '#000000'),
          { label: 'Warmer', ops: [{ op: 'tone', tone: 'warmer' }] }, { label: 'Cooler', ops: [{ op: 'tone', tone: 'cooler' }] }, { label: 'Brighter', ops: [{ op: 'tone', tone: 'vibrant' }] }, { label: 'Softer', ops: [{ op: 'tone', tone: 'muted' }] },
        ],
      }
    case 'remove':
      return { question: 'Which part should go?', choices: REMOVABLE.map((key) => ({ label: SECTION_LABEL[key], ops: sectionChange(key, 'remove', context) })) }
    case 'add':
      return { question: 'Which part should be added?', choices: REMOVABLE.map((key) => ({ label: SECTION_LABEL[key], ops: sectionChange(key, 'add', context) })) }
    case 'rename':
      return { question: 'What should the business be called?', choices: [], expect: 'name' }
    case 'change_business':
      return { question: 'What kind of business is it? (for example: bakery, dentist, gym, travel agency)', choices: [], expect: 'business' }
    case 'contact':
      return { question: 'What is the email, phone number or address? Type it and I will set it.', choices: [], expect: 'contact' }
    case 'set_text':
      return { question: 'Which text? Say it like: headline: Fresh Every Day, button: Order Now, subtitle: Baked with love', choices: [], expect: 'text' }
    case 'replace_text':
      return { question: 'Which word should be replaced? Say it like: replace coaches with trainers', choices: [], expect: 'text' }
    case 'rename_section':
      return { question: 'Which section should get a new name, and what name? Say it like: rename pricing to Our Plans, or: in the menu, change About to Our Story', choices: [], expect: 'text' }
    case 'move_section':
      return { question: 'Which section should move, and where? Say it like: move FAQ above pricing, gallery to the top, or: move Blog page to the end of the menu', choices: [], expect: 'text' }
    case 'resize':
      return {
        question: 'Which size should change?',
        choices: [
          { label: 'Whole page: shorter', ops: [{ op: 'size', target: 'page', axis: 'height', factor: 0.7 }] },
          { label: 'Whole page: taller', ops: [{ op: 'size', target: 'page', axis: 'height', factor: 1.3 }] },
          { label: 'Whole page: narrower', ops: [{ op: 'size', target: 'page', axis: 'width', factor: 0.8 }] },
          { label: 'Whole page: wider', ops: [{ op: 'size', target: 'page', axis: 'width', factor: 1.25 }] },
        ],
      }
    case 'align':
      return { question: 'How should the text be aligned?', choices: [{ label: 'Left', ops: [{ op: 'align', target: 'page', align: 'left' }] }, { label: 'Center', ops: [{ op: 'align', target: 'page', align: 'center' }] }, { label: 'Right', ops: [{ op: 'align', target: 'page', align: 'right' }] }] }
    case 'new_site':
      return { question: 'That sounds like a new website. Make a new one from it? (your earlier changes belong to the old site)', choices: [{ label: 'Yes, make a new website', action: 'newSite' }, { label: 'No, I meant a change', action: 'dismiss' }] }
    default:
      return undefined
  }
}

/** the typed answer to a question that waited for a value */
export function answerFor(expect: Expect, text: string, context: EditContext): { ops: EditOp[]; reply?: string } {
  const value = text.replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim()
  if (expect === 'name') {
    const parsed = parseEdit(text, context)
    if (parsed.kind === 'ops' && parsed.ops.length) return { ops: parsed.ops }
    const op = cleanOp({ op: 'rename', name: value })
    return op && value.split(/\s+/).length <= 6 ? { ops: [op] } : { ops: [], reply: 'That is a bit long for a name. Type just the business name.' }
  }
  if (expect === 'business') {
    const decision = decideTheme(value)
    const known = value.split(/\s+/).some((w) => isBusinessWord(w))
    if (decision.source !== 'default' && (known || decision.confidence >= 0.4)) return { ops: [{ op: 'theme', theme: decision.theme as ThemeKey }] }
    return { ops: [], reply: 'I do not know that business type yet. Try a word like bakery, restaurant, gym, clinic, salon, school, travel agency, shop ...' }
  }
  if (expect === 'contact') {
    const parsed = parseEdit(text, context)
    if (parsed.kind === 'ops' && parsed.ops.length) return { ops: parsed.ops }
    const field = /@/.test(value) ? 'email' : /^\+?[\d\s().-]{7,}$/.test(value) ? 'phone' : 'address'
    const op = cleanOp({ op: 'contact', field, value })
    return op ? { ops: [op] } : { ops: [], reply: 'I could not read that. Type an email, a phone number or an address.' }
  }
  const parsed = parseEdit(text, context)
  return parsed.kind === 'ops' && parsed.ops.length ? { ops: parsed.ops } : { ops: [], reply: 'I could not find the text to change. Say it like: headline: Fresh Every Day' }
}
