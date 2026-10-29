// What the person corrects, remembered. A correction is the strongest thing a person can say about a design: they changed the colour (so the idea's colour was
// wrong and this one is right), they removed a part (they do not want it for this kind of business), they marked the design right or turned it down.
// concept.ts starts the next idea for that kind of business from it. Local to this browser (localStorage); plain counting, no model.
import type { ConceptMemory } from '../concept'
import { noMemory } from '../concept'
import { SECTIONS } from '../edit/edits'
import { hexToRgb, rgbToHsl } from '../art/color'
import type { DesignRecord } from './designStore'

export type Correction = {
  at: string
  /** the kind of business ("cafe") and its type ("food_dining") */
  key: string
  theme: string
  kind: 'accent' | 'remove' | 'add' | 'mood' | 'mode'
  /** the idea that was on the page when they corrected it */
  conceptId?: string
  from?: string
  to?: string
  section?: string
}

export interface CorrectionStore {
  list(): Correction[]
  add(correction: Correction): void
}

export class MemoryCorrections implements CorrectionStore {
  private rows: Correction[] = []
  list() {
    return [...this.rows]
  }
  add(correction: Correction) {
    this.rows.push(correction)
  }
}

const STORE_KEY = 'website-generator-corrections'
export class LocalCorrections implements CorrectionStore {
  list(): Correction[] {
    try {
      const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(STORE_KEY)
      const rows = raw ? (JSON.parse(raw) as Correction[]) : []
      return Array.isArray(rows) ? rows.filter((r) => r && typeof r.key === 'string') : []
    } catch {
      return []
    }
  }
  add(correction: Correction) {
    try {
      const rows = [...this.list(), correction].slice(-400)
      localStorage.setItem(STORE_KEY, JSON.stringify(rows))
    } catch {
      // the memory is optional
    }
  }
}

const hueOf = (hex: string) => rgbToHsl(hexToRgb(hex)).h
const HEX = /^#[0-9a-f]{6}$/i

/** what the corrections and the verdicts say about this kind of business (a business of the same type counts when this one has nothing yet) */
export function conceptMemoryFor(corrections: Correction[], records: DesignRecord[], key: string, theme: string): ConceptMemory {
  const memory = noMemory()
  const own = corrections.filter((c) => c.key === key)
  const same = own.length ? own : corrections.filter((c) => c.theme === theme)
  for (const c of same) {
    if (c.kind === 'accent' && c.to && HEX.test(c.to)) {
      memory.chosenAccents.push(c.to.toLowerCase())
      if (c.from && HEX.test(c.from)) memory.rejectedHues.push(hueOf(c.from))
    }
  }
  // a part is taken out by default when it was removed twice for this kind of business (once is a whim, twice is a wish)
  const removed = new Map<string, number>()
  for (const c of own) if (c.kind === 'remove' && c.section) removed.set(c.section, (removed.get(c.section) ?? 0) + 1)
  for (const c of own) if (c.kind === 'add' && c.section) removed.set(c.section, (removed.get(c.section) ?? 0) - 2)
  memory.removed = [...removed.entries()].filter(([section, n]) => n >= 2 && (SECTIONS as readonly string[]).includes(section)).map(([section]) => section)
  for (const r of records) {
    if (r.key !== key || !r.concept) continue
    if (r.verdict === 'good') memory.liked.push(r.concept)
    else if (r.verdict === 'bad') memory.disliked.push(r.concept)
  }
  // an idea the person changed the colour of was not right as it was
  for (const c of own) if (c.kind === 'accent' && c.conceptId) memory.disliked.push(c.conceptId)
  return memory
}

/** the one memory of this browser */
export const correctionStore: CorrectionStore = new LocalCorrections()
