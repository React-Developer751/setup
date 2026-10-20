// The design memory: every design that was made (its colours, layout, headline ...) and what the person said about it. Three places can hold it:
// the server's file database (server/data/designs.jsonl, shared by all browsers), the browser (localStorage, when no server runs) and plain memory (tests).
export type Verdict = 'good' | 'bad' | 'unrated'

export type DesignRecord = {
  id: string
  at: string
  /** the kind of business ("yoga studio"): designs are compared within it */
  key: string
  /** the designs of one round (one "Generate website" click and the variations after it): the person picks the right one of a round */
  group: string
  prompt: string
  variation: number
  creativity: string
  theme: string
  niche: string
  paletteName: string
  /** curated | evolved | formula-<harmony> */
  kind: string
  accent: string
  alt: string
  hue: number
  sat: number
  light: number
  mode: 'light' | 'dark'
  tier: string
  heroLayout: string
  layouts: string[]
  heroTitle: string
  verdict: Verdict
}

export interface DesignStore {
  /** all designs (latest first); with a key only those of that business */
  list(key?: string): Promise<DesignRecord[]>
  add(record: DesignRecord): Promise<void>
  /** a verdict; `best` also turns down the undecided designs of the same round */
  setVerdict(id: string, verdict: Verdict, best?: boolean): Promise<void>
  readonly kind: 'server' | 'browser' | 'memory'
}

export const newId = () => `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`

/** the rule of "one is right, the others are not" */
export function applyBest(rows: DesignRecord[], id: string): DesignRecord[] {
  const target = rows.find((r) => r.id === id)
  if (!target) return rows
  return rows.map((r) => (r.id === id ? { ...r, verdict: 'good' as const } : r.group && r.group === target.group && r.verdict === 'unrated' ? { ...r, verdict: 'bad' as const } : r))
}

export class MemoryStore implements DesignStore {
  readonly kind = 'memory' as const
  rows: DesignRecord[] = []
  async list(key?: string) {
    return [...this.rows].reverse().filter((r) => !key || r.key === key)
  }
  async add(record: DesignRecord) {
    this.rows.push(record)
  }
  async setVerdict(id: string, verdict: Verdict, best = false) {
    this.rows = verdict === 'good' && best ? applyBest(this.rows, id) : this.rows.map((r) => (r.id === id ? { ...r, verdict } : r))
  }
}

const LOCAL_KEY = 'ui-blocks:designs'
const LOCAL_MAX = 400

export class BrowserStore implements DesignStore {
  readonly kind = 'browser' as const
  private read(): DesignRecord[] {
    try {
      const rows = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]') as DesignRecord[]
      return Array.isArray(rows) ? rows : []
    } catch {
      return []
    }
  }
  private write(rows: DesignRecord[]) {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(rows.slice(-LOCAL_MAX)))
    } catch {
      // the memory is optional
    }
  }
  async list(key?: string) {
    return this.read().reverse().filter((r) => !key || r.key === key)
  }
  async add(record: DesignRecord) {
    this.write([...this.read(), record])
  }
  async setVerdict(id: string, verdict: Verdict, best = false) {
    const rows = this.read()
    this.write(verdict === 'good' && best ? applyBest(rows, id) : rows.map((r) => (r.id === id ? { ...r, verdict } : r)))
  }
}

export class ServerStore implements DesignStore {
  readonly kind = 'server' as const
  async list(key?: string) {
    const res = await fetch(`/api/designs?limit=800${key ? `&key=${encodeURIComponent(key)}` : ''}`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error('no server')
    return ((await res.json()) as { designs: DesignRecord[] }).designs
  }
  async add(record: DesignRecord) {
    const res = await fetch('/api/designs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(record), signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error('no server')
  }
  async setVerdict(id: string, verdict: Verdict, best = false) {
    const res = await fetch('/api/designs/verdict', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, verdict, best }), signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error('no server')
  }
}

let opened: Promise<DesignStore> | undefined
/** the server's database when it runs, the browser's memory when it does not */
export function openStore(): Promise<DesignStore> {
  opened ??= (async () => {
    try {
      const store = new ServerStore()
      await store.list('__probe__')
      return store
    } catch {
      return new BrowserStore()
    }
  })()
  return opened
}
