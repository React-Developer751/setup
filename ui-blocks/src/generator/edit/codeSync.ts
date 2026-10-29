// The Code tab: a person edits the text of the page in its file (the `const content = {...}` of the page code) and the site follows. The words
// they changed become the same operations the chat makes (so undo, the preview and every export work as for any other change). What cannot be
// followed (the gallery, prices, reviews ...) is listed, and the edited file keeps their version.
import type { WebsiteContent } from '../finalPrompt'
import type { CoreBlocks, EditOp } from './edits'

const MARK = 'const content = '

/** the `{...}` of `const content = {...}` in the code of a page, with where it starts and ends; undefined when there is none or it is not valid JSON */
export function contentLiteral(code: string): { start: number; end: number; value: Record<string, unknown> } | undefined {
  const at = code.indexOf(MARK)
  if (at < 0) return undefined
  const start = code.indexOf('{', at)
  if (start < 0) return undefined
  let depth = 0
  let inString = false
  for (let i = start; i < code.length; i += 1) {
    const ch = code[i]
    if (inString) {
      if (ch === '\\') i += 1
      else if (ch === '"') inString = false
    } else if (ch === '"') inString = true
    else if (ch === '{') depth += 1
    else if (ch === '}') {
      depth -= 1
      if (depth === 0) {
        try {
          const value = JSON.parse(code.slice(start, i + 1)) as Record<string, unknown>
          return value && typeof value === 'object' ? { start, end: i + 1, value } : undefined
        } catch {
          return undefined
        }
      }
    }
  }
  return undefined
}

/** the code without its content (the rest of the file: imports, sections, colours), to tell whether a person changed more than the words */
export const codeWithoutContent = (code: string) => {
  const found = contentLiteral(code)
  return found ? `${code.slice(0, found.start)}${code.slice(found.end)}` : code
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\p{Cc}+/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '')
const pairs = (v: unknown, n: number, max: [number, number]) =>
  (Array.isArray(v) ? v : []).slice(0, n).map((x) => ({ title: str((x as { title?: unknown })?.title, max[0]), text: str((x as { text?: unknown })?.text, max[1]) })).filter((x) => x.title)

export type CodeSync = { ops: EditOp[]; applied: string[]; unsupported: string[]; problem?: string }

/** what a person changed in the words of the page file, as edit operations; `before` is the content the page has now */
export function opsFromEditedCode(code: string, before: WebsiteContent): CodeSync {
  const found = contentLiteral(code)
  if (!found) return { ops: [], applied: [], unsupported: [], problem: 'The content of the page (const content = { ... }) is not valid JSON any more: check the commas and quotes. Your text is kept in the file.' }
  const after = found.value as Partial<WebsiteContent> & Record<string, any>
  const ops: EditOp[] = []
  const applied: string[] = []
  const core: CoreBlocks = {}
  const b = before as unknown as Record<string, any>

  if (typeof after.brandName === 'string' && after.brandName.trim() && after.brandName !== before.brandName) {
    ops.push({ op: 'rename', name: str(after.brandName, 60) })
    applied.push('the name')
  }
  // the last "core" operation is the one that counts (it replaces the earlier one): so it always carries every block of the page as it is in the file,
  // never only the block the person changed (the others would go back to the generator's own words)
  const changedBlock = (key: 'hero' | 'features' | 'about' | 'steps' | 'faq' | 'cta', label: string) => {
    if (after[key] !== undefined && !same(after[key], b[key])) applied.push(label)
  }
  changedBlock('hero', 'the first screen')
  changedBlock('features', 'the services')
  changedBlock('about', 'the about part')
  changedBlock('steps', 'the steps')
  changedBlock('faq', 'the questions')
  changedBlock('cta', 'the closing part')
  if (applied.some((a) => a !== 'the name')) {
    if (after.hero) core.hero = { title: str(after.hero.title, 120), subtitle: str(after.hero.subtitle, 240), button: str(after.hero.button, 40) }
    const features = pairs(after.features?.items, 8, [40, 160])
    if (features.length) core.features = { title: str(after.features?.title, 60), items: features }
    const paragraphs = (Array.isArray(after.about?.paragraphs) ? after.about.paragraphs : []).slice(0, 3).map((p: unknown) => str(p, 420)).filter(Boolean)
    if (paragraphs.length) core.about = { title: str(after.about?.title, 80), paragraphs, points: (Array.isArray(after.about?.points) ? after.about.points : []).slice(0, 3).map((p: unknown) => str(p, 60)).filter(Boolean) }
    const steps = pairs(after.steps?.items, 5, [30, 140])
    if (steps.length) core.steps = { title: str(after.steps?.title, 60), items: steps }
    const faq = (Array.isArray(after.faq) ? after.faq : []).slice(0, 8).map((f: { q?: unknown; a?: unknown }) => ({ q: str(f?.q, 100), a: str(f?.a, 260) })).filter((f: { q: string; a: string }) => f.q && f.a)
    if (faq.length) core.faq = faq
    if (after.cta) core.cta = { title: str(after.cta.title, 70), button: str(after.cta.button, 40) }
  }
  if (Object.keys(core).length) ops.push({ op: 'core', data: core })

  if (after.contact && typeof after.contact === 'object') {
    for (const [field, key] of [['email', 'email'], ['phone', 'phone'], ['address', 'address'], ['whatsapp', 'whatsapp'], ['hours', 'hoursText']] as const) {
      const was = String(b.contact?.[key] ?? '')
      const now = String(after.contact[key] ?? '')
      if (now !== was && now.trim()) {
        ops.push({ op: 'contact', field, value: str(now, 120) })
        applied.push(`the ${field}`)
      }
    }
  }

  // everything else in the content that changed cannot be followed by the preview: the file keeps it
  const handled = new Set(['brandName', 'hero', 'features', 'about', 'steps', 'faq', 'cta', 'contact'])
  const unsupported = Object.keys(after).filter((key) => !handled.has(key) && !same(after[key], b[key]))
  return { ops, applied: [...new Set(applied)], unsupported }
}
