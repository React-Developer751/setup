// What kind of request is this? Used when the rules found no operation in a message: the guess says what the person wants
// ("something about the design level"), and the chat then asks the missing detail with buttons ("Simpler / Better / Premium").
// Two opinions: the word model (small, always available) and, when "smart understanding" is on, the meaning model.
import { smartIntent } from '../ml/smart'
import { SparseModel, type SparseFile } from '../ml/sparseModel'

export const INTENTS = ['rename', 'rename_section', 'move_section', 'resize', 'align', 'recolor', 'mode', 'remove', 'add', 'set_text', 'replace_text', 'contact', 'tier', 'motion', 'change_business', 'undo', 'redo', 'reset', 'new_site', 'other'] as const
export type Intent = (typeof INTENTS)[number]

// the word model is a separate file (1 MB): it is loaded the first time a message is not understood by the rules
let loaded: Promise<SparseModel> | undefined
const wordModel = () => (loaded ??= import('../../data/models/intent-model.json').then((file) => new SparseModel(file.default as unknown as SparseFile)))

export type IntentGuess = { intent: Intent; probability: number; source: 'words' | 'meaning' | 'both'; ranked: [Intent, number][] }

/** blends the word model with the meaning model (when it is ready); words alone otherwise */
export async function guessIntent(text: string, useMeaning = true): Promise<IntentGuess> {
  const w = (await wordModel()).predict(text).probabilities
  const m = useMeaning ? await smartIntent(text) : undefined
  const blended: Record<string, number> = {}
  for (const intent of INTENTS) blended[intent] = m ? 0.35 * (w[intent] ?? 0) + 0.65 * (m[intent] ?? 0) : (w[intent] ?? 0)
  const ranked = (Object.entries(blended) as [Intent, number][]).sort((a, b) => b[1] - a[1])
  return { intent: ranked[0][0], probability: ranked[0][1], source: m ? 'both' : 'words', ranked: ranked.slice(0, 3) }
}
