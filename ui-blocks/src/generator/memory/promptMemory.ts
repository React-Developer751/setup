// The prompt memory: every prompt a person writes, what the page became (business type, idea, headline) and every edit they made to it afterwards.
// A new prompt is compared with the old ones; the ones it resembles teach it (the colour that was chosen, the parts that were taken out, the style that was set),
// so the page starts from what the earlier pages ended as. The same rows are the training data: GET /api/prompt-memory/export and /keywords on the server.
// Plain counting and word overlap, no model. Three places hold it, as in designStore.ts: the server's file, the browser, plain memory.
import { FILLER } from '../hinglish'
import type { Correction } from './correctionMemory'

export type PromptEdit = {
  at: string
  /** what the person typed or did ("make it green", "colour picker") */
  text: string
  ops: { k: 'accent' | 'remove' | 'add' | 'mood' | 'mode' | 'text'; v: string }[]
}

export type PromptRow = {
  id: string
  at: string
  prompt: string
  /** the kind of business ("yoga studio") and its type ("beauty_wellness") */
  key: string
  theme: string
  niche: string
  /** the idea (concept.ts) and the headline of the page that was made */
  concept: string
  hero: string
  pages: 'single' | 'multi'
  edits: PromptEdit[]
  /** like (up) or not like (down) the person gave to the page, and to the answers after it */
  verdict?: 'up' | 'down'
  /** the ideas that were shown for this prompt and not liked (the page was made again each time) */
  rejected?: string[]
  ratings?: { at: string; text: string; up: boolean }[]
}

export interface PromptStore {
  list(): Promise<PromptRow[]>
  /** adds the row, or replaces the row with the same id (the edits of one page grow) */
  save(row: PromptRow): Promise<void>
  readonly kind: 'server' | 'browser' | 'memory'
}

const STOP = new Set([
  'a', 'an', 'the', 'for', 'of', 'in', 'on', 'at', 'to', 'and', 'or', 'with', 'my', 'our', 'me', 'i', 'is', 'it', 'that', 'this', 'create', 'make', 'build', 'generate', 'design', 'need', 'want',
  'please', 'website', 'site', 'web', 'page', 'landing', 'banao', 'banakar', 'do', 'de', 'dena', 'ho', 'hai', 'se', 'ya', 'wala', 'wali', 'new', 'good', 'best', 'nice', 'unique', 'alag', 'hatke',
])
/** the words of a prompt that say something: lower case, no request words, plurals folded ("cafes" = "cafe") */
export const promptWords = (text: string): string[] =>
  [...new Set(text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 1 && !STOP.has(w) && !FILLER.has(w)).map((w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w)))]

/** how much two prompts say the same thing, 0 to 1 (word overlap; a short prompt inside a longer one counts nearly as much) */
export function similarity(a: string, b: string): number {
  const x = promptWords(a)
  const y = new Set(promptWords(b))
  if (!x.length || !y.size) return 0
  const shared = x.filter((w) => y.has(w)).length
  const union = x.length + y.size - shared
  const contained = shared / Math.min(x.length, y.size)
  return Math.max(shared / union, Math.min(x.length, y.size) >= 2 ? contained * 0.85 : 0)
}

export type Neighbour = { row: PromptRow; score: number }
/** the earlier prompts that resemble this one, the closest first (rows that were never edited teach nothing but the business, so they come after the edited ones at the same score) */
export function similarPrompts(prompt: string, rows: PromptRow[], limit = 4, minimum = 0.4): Neighbour[] {
  const seen = new Set<string>()
  return rows
    .map((row) => ({ row, score: similarity(prompt, row.prompt) + (row.edits.length ? 0.02 : 0) }))
    .filter((n) => n.score >= minimum)
    .sort((a, b) => b.score - a.score)
    .filter((n) => (seen.has(n.row.prompt.toLowerCase()) ? false : (seen.add(n.row.prompt.toLowerCase()), true)))
    .slice(0, limit)
}

/** what the neighbours' edits say, as corrections for the business of the new prompt (a close neighbour counts twice: once is a whim, twice is a wish) */
export function lessonsFrom(neighbours: Neighbour[], key: string): Correction[] {
  const out: Correction[] = []
  for (const { row, score } of neighbours) {
    const weight = score >= 0.7 ? 2 : 1
    const base = { at: row.at, key, theme: row.theme, conceptId: row.concept || undefined }
    // a page that was liked is an idea to keep; one that was not liked is an idea to leave (and the next one starts away from it)
    if (row.concept && row.verdict === 'up') out.push({ ...base, kind: 'like' })
    for (const id of new Set([...(row.rejected ?? []), ...(row.verdict === 'down' && row.concept ? [row.concept] : [])])) out.push({ ...base, kind: 'dislike', conceptId: id })
    const accents = row.edits.flatMap((e) => e.ops.filter((o) => o.k === 'accent'))
    // the last colour they chose is the one they ended with
    if (accents.length) out.push({ ...base, kind: 'accent', to: accents[accents.length - 1].v })
    for (const edit of row.edits) {
      for (const op of edit.ops) {
        if (op.k === 'remove' || op.k === 'add') for (let i = 0; i < weight; i += 1) out.push({ ...base, kind: op.k, section: op.v })
        else if (op.k === 'mood' || op.k === 'mode') out.push({ ...base, kind: op.k, to: op.v })
      }
    }
  }
  return out
}

/** one line for the chat: what the new page took from the old prompts */
export function lessonNote(neighbours: Neighbour[]): string {
  if (!neighbours.length) return ''
  const edited = neighbours.filter((n) => n.row.edits.some((e) => e.ops.length))
  const disliked = neighbours.find((n) => n.row.verdict === 'down' || n.row.rejected?.length)
  if (disliked && !edited.length) return `This prompt is like one you did not like before ("${disliked.row.prompt.slice(0, 60)}"), so I tried a different idea this time.`
  const best = neighbours[0].row.prompt.slice(0, 60)
  if (!edited.length) return `This prompt is like one you wrote before ("${best}"), so I started from that page's kind of business.`
  const accents = new Set(edited.flatMap((n) => n.row.edits.flatMap((e) => e.ops.filter((o) => o.k === 'accent').map((o) => o.v))))
  const removed = new Set(edited.flatMap((n) => n.row.edits.flatMap((e) => e.ops.filter((o) => o.k === 'remove').map((o) => o.v))))
  const bits = [accents.size ? 'the colour you chose' : '', removed.size ? `the parts you removed (${[...removed].slice(0, 3).join(', ')})` : ''].filter(Boolean)
  return `This prompt is like ${neighbours.length === 1 ? 'one' : `${neighbours.length}`} you wrote before ("${best}")${bits.length ? `: I started from ${bits.join(' and ')}` : ''}.`
}

export const keepRows = (rows: PromptRow[], row: PromptRow): PromptRow[] => {
  const i = rows.findIndex((r) => r.id === row.id)
  return i < 0 ? [...rows, row] : rows.map((r, at) => (at === i ? row : r))
}

export class MemoryPrompts implements PromptStore {
  readonly kind = 'memory' as const
  rows: PromptRow[] = []
  async list() {
    return [...this.rows]
  }
  async save(row: PromptRow) {
    this.rows = keepRows(this.rows, row)
  }
}

const LOCAL_KEY = 'ui-blocks:prompt-memory'
export class BrowserPrompts implements PromptStore {
  readonly kind = 'browser' as const
  private read(): PromptRow[] {
    try {
      const rows = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]') as PromptRow[]
      return Array.isArray(rows) ? rows.filter((r) => r && typeof r.prompt === 'string' && Array.isArray(r.edits)) : []
    } catch {
      return []
    }
  }
  async list() {
    return this.read()
  }
  async save(row: PromptRow) {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(keepRows(this.read(), row).slice(-300)))
    } catch {
      // the memory is optional
    }
  }
}

export class ServerPrompts implements PromptStore {
  readonly kind = 'server' as const
  async list() {
    const res = await fetch('/api/prompt-memory?limit=2000', { signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error('no server')
    return ((await res.json()) as { rows: PromptRow[] }).rows
  }
  async save(row: PromptRow) {
    const res = await fetch('/api/prompt-memory', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(row), signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error('no server')
  }
}

let opened: Promise<PromptStore> | undefined
/** the server's file when it runs, the browser's memory when it does not */
export function openPromptMemory(): Promise<PromptStore> {
  opened ??= (async () => {
    try {
      const store = new ServerPrompts()
      await store.list()
      return store
    } catch {
      return new BrowserPrompts()
    }
  })()
  return opened
}
