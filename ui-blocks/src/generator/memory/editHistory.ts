// The edit history: every chat command is stored with what it changed, and an undo right after it is a thumb down for that reading.
// A command that was undone again and again is not applied blindly the next time: the page asks first.
// Plain data functions on top, the stores (server database / browser / memory) below.
export type EditLogRow = {
  id: string
  at: string
  key: string
  text: string
  /** the command in lower case, without filler words and punctuation, so "Make it blue!" and "make it blue please" are one command */
  norm: string
  context: 'single' | 'multi'
  /** what the command changed, in words */
  ops: string[]
  via: 'rules' | 'server' | 'choice'
  undone: boolean
}

const FILLER = new Set(['please', 'pls', 'plz', 'kindly', 'can', 'you', 'could', 'the', 'a', 'an', 'it', 'karo', 'kar', 'do', 'dena', 'de', 'zara', 'ek', 'bar', 'bhai', 'yaar', 'now', 'just'])

export function normaliseCommand(text: string): string {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}#]+/u)
    .filter((w) => w && !FILLER.has(w))
    .join(' ')
}

export const newLogId = () => `e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`

export function logRow(text: string, key: string, context: 'single' | 'multi', ops: string[], via: EditLogRow['via']): EditLogRow {
  return { id: newLogId(), at: new Date().toISOString(), key, text: text.slice(0, 300), norm: normaliseCommand(text).slice(0, 300), context, ops: ops.slice(0, 12), via, undone: false }
}

export type UndoStats = { tries: number; undone: number; rate: number }

/** how often this command was given and how often it was undone */
export function undoStats(rows: EditLogRow[], text: string): UndoStats {
  const norm = normaliseCommand(text)
  if (!norm) return { tries: 0, undone: 0, rate: 0 }
  const same = rows.filter((r) => r.norm === norm)
  const undone = same.filter((r) => r.undone).length
  return { tries: same.length, undone, rate: same.length ? undone / same.length : 0 }
}

/** undone at least twice and in most of the cases: the reading of this command is probably not what the person means */
export const isDoubtful = (stats: UndoStats): boolean => stats.undone >= 2 && stats.rate >= 0.6

/** what the page says instead of applying a command that keeps being undone */
export function doubtQuestion(stats: UndoStats, ops: string[], previous: string[][]): string {
  const did = ops.length ? ops.join('; ') : 'that change'
  const other = previous.map((p) => p.join('; ')).filter((p) => p && p !== did)[0]
  return `You undid this command ${stats.undone} of ${stats.tries} times before. I would do: ${did}.${other ? ` Earlier it also meant: ${other}.` : ''} Shall I do it anyway, or tell me more exactly what you want (which section, which colour, left or right)?`
}

// ───────────── the stores ─────────────
export interface EditLogStore {
  readonly kind: 'server' | 'browser' | 'memory'
  list(key?: string): Promise<EditLogRow[]>
  add(row: EditLogRow): Promise<void>
  markUndone(id: string): Promise<void>
}

export class MemoryEditLog implements EditLogStore {
  readonly kind = 'memory' as const
  rows: EditLogRow[] = []
  async list(key?: string) {
    return this.rows.filter((r) => !key || r.key === key)
  }
  async add(row: EditLogRow) {
    this.rows.push(row)
  }
  async markUndone(id: string) {
    this.rows = this.rows.map((r) => (r.id === id ? { ...r, undone: true } : r))
  }
}

const LOCAL_KEY = 'ui-blocks:edit-log'
const LOCAL_MAX = 400
export class BrowserEditLog implements EditLogStore {
  readonly kind = 'browser' as const
  private read(): EditLogRow[] {
    try {
      const rows = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]') as EditLogRow[]
      return Array.isArray(rows) ? rows : []
    } catch {
      return []
    }
  }
  private write(rows: EditLogRow[]) {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(rows.slice(-LOCAL_MAX)))
    } catch {
      // the memory is optional
    }
  }
  async list(key?: string) {
    return this.read().filter((r) => !key || r.key === key)
  }
  async add(row: EditLogRow) {
    this.write([...this.read(), row])
  }
  async markUndone(id: string) {
    this.write(this.read().map((r) => (r.id === id ? { ...r, undone: true } : r)))
  }
}

export class ServerEditLog implements EditLogStore {
  readonly kind = 'server' as const
  async list(key?: string) {
    const res = await fetch(`/api/edit-log?limit=1500${key ? `&key=${encodeURIComponent(key)}` : ''}`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error('no server')
    return ((await res.json()) as { rows: EditLogRow[] }).rows
  }
  async add(row: EditLogRow) {
    const res = await fetch('/api/edit-log', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(row), signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error('no server')
  }
  async markUndone(id: string) {
    const res = await fetch('/api/edit-log/undo', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }), signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error('no server')
  }
}

let opened: Promise<EditLogStore> | undefined
/** the server's database when it runs, the browser's memory when it does not */
export function openEditLog(): Promise<EditLogStore> {
  opened ??= (async () => {
    try {
      const store = new ServerEditLog()
      await store.list('__probe__')
      return store
    } catch {
      return new BrowserEditLog()
    }
  })()
  return opened
}
