// A Markov chain over the headlines of a business type: it learns which word may follow which from the headlines the copywriting brain and the
// hand-written templates already produce, and strings them together in a new way. The temperature flattens the chances (a high one lets rare
// continuations through). A new line is only used when it passes the gate: the right length, no repeated word, not a copy of a known headline,
// not ending in the middle of a phrase.
const START = '\u0002'
const END = '\u0003'
const STOP_END = new Set(['your', 'the', 'a', 'an', 'and', 'for', 'with', 'to', 'of', 'in', 'on', 'at', 'by', 'from', 'every', 'each', 'our', 'is', 'are', 'that', 'where', 'whose'])

export class Markov {
  private bigrams = new Map<string, Map<string, number>>()
  private trigrams = new Map<string, Map<string, number>>()
  private known = new Set<string>()

  constructor(sentences: string[]) {
    for (const sentence of sentences) {
      const words = sentence.trim().split(/\s+/).filter(Boolean)
      if (words.length < 3) continue
      this.known.add(sentence.trim().toLowerCase())
      const chain = [START, START, ...words, END]
      for (let i = 2; i < chain.length; i += 1) {
        this.add(this.bigrams, chain[i - 1], chain[i])
        this.add(this.trigrams, `${chain[i - 2]} ${chain[i - 1]}`, chain[i])
      }
    }
  }

  private add(table: Map<string, Map<string, number>>, from: string, to: string) {
    const row = table.get(from) ?? new Map<string, number>()
    row.set(to, (row.get(to) ?? 0) + 1)
    table.set(from, row)
  }

  size(): number {
    return this.known.size
  }

  isKnown(text: string): boolean {
    return this.known.has(text.trim().toLowerCase())
  }

  private next(prev2: string, prev1: string, temp: number, rand: () => number): string {
    // the trigram row when there is one with a choice, the bigram row otherwise
    const tri = this.trigrams.get(`${prev2} ${prev1}`)
    const row = tri && tri.size > 1 ? tri : (this.bigrams.get(prev1) ?? tri)
    if (!row) return END
    // counts to the power 1/heat: a low temperature sharpens the chances, a high one flattens them
    const power = 1 / Math.max(0.25, temp * 2)
    const entries = [...row.entries()].map(([word, count]) => [word, count ** power] as const)
    const total = entries.reduce((a, [, w]) => a + w, 0)
    let pick = rand() * total
    for (const [word, weight] of entries) {
      pick -= weight
      if (pick <= 0) return word
    }
    return entries[entries.length - 1][0]
  }

  /** one new line, or undefined when the chain wandered off */
  generate(temp: number, rand: () => number, maxWords = 10): string | undefined {
    let prev2 = START
    let prev1 = START
    const words: string[] = []
    for (let i = 0; i < maxWords + 2; i += 1) {
      const word = this.next(prev2, prev1, temp, rand)
      if (word === END) break
      words.push(word)
      prev2 = prev1
      prev1 = word
    }
    const text = words.join(' ').replace(/\s+([,.!?:])/g, '$1')
    return words.length >= 3 && words.length <= maxWords ? text : undefined
  }

  /** the gate: a new, complete, tidy line */
  passes(text: string, opts: { maxLength: number; repeats: (text: string) => boolean; coherent?: (text: string) => boolean }): boolean {
    const words = text.split(/\s+/)
    if (words.length < 4 || words.length > 10 || text.length > opts.maxLength) return false
    if (this.isKnown(text)) return false
    if (!/^[A-Z0-9"']/.test(text)) return false
    const last = words[words.length - 1].replace(/[^\p{L}]/gu, '').toLowerCase()
    if (STOP_END.has(last)) return false
    if (opts.repeats(text)) return false
    if (opts.coherent && !opts.coherent(text)) return false
    if (words.some((w, i) => i > 0 && w.toLowerCase() === words[i - 1].toLowerCase())) return false
    // brackets and quotes must be closed
    if ((text.match(/"/g)?.length ?? 0) % 2 || (text.match(/\(/g)?.length ?? 0) !== (text.match(/\)/g)?.length ?? 0)) return false
    return true
  }
}

/** the first new line that passes the gate in a few tries */
export function newLine(model: Markov, temp: number, rand: () => number, opts: { maxLength: number; repeats: (text: string) => boolean; coherent?: (text: string) => boolean }, tries = 40): string | undefined {
  for (let i = 0; i < tries; i += 1) {
    const text = model.generate(temp, rand)
    if (text && model.passes(text, opts)) return text
  }
  return undefined
}
