// Where the phrase events live: the server database (shared by everybody) when it runs, this browser's memory (and always as a copy).
// Reading merges both; one session counts once per phrase (see foldPhraseScores), so the copy never counts twice.
import { foldPhraseScores, type PhraseEvent, type PhraseScores } from './phraseScores'

const SESSION_KEY = 'ui-blocks:session'
const LOCAL_KEY = 'ui-blocks:phrase-events'
const LOCAL_MAX = 600

let memorySession = ''
/** a random id for this browser (no name, no account) */
export function sessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY)
    if (!id) {
      id = `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
      localStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    memorySession ||= `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
    return memorySession
  }
}

function readLocal(): PhraseEvent[] {
  try {
    const rows = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]') as PhraseEvent[]
    return Array.isArray(rows) ? rows : []
  } catch {
    return []
  }
}

let cache: { at: number; scores: PhraseScores; events: PhraseEvent[] } | undefined

/** keeps events: in the browser and, when the server runs, in its database */
export async function recordPhrases(events: PhraseEvent[]): Promise<void> {
  if (!events.length) return
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify([...readLocal(), ...events].slice(-LOCAL_MAX)))
  } catch {
    // the memory is optional
  }
  cache = undefined
  try {
    await fetch('/api/phrase-events', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ events }), keepalive: true, signal: AbortSignal.timeout(5000) })
  } catch {
    // no server: the browser's copy is all there is
  }
}

/** the events of everybody (server) and of this browser */
export async function loadPhraseEvents(force = false): Promise<PhraseEvent[]> {
  if (!force && cache && Date.now() - cache.at < 30_000) return cache.events
  let remote: PhraseEvent[] = []
  try {
    const res = await fetch('/api/phrase-events', { signal: AbortSignal.timeout(4000) })
    if (res.ok) remote = ((await res.json()) as { events: PhraseEvent[] }).events
  } catch {
    // no server
  }
  const events = [...remote, ...readLocal()]
  cache = { at: Date.now(), scores: foldPhraseScores(events), events }
  return events
}

export async function loadPhraseScores(force = false): Promise<PhraseScores> {
  await loadPhraseEvents(force)
  return cache?.scores ?? new Map()
}
