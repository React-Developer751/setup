// The "brain": reads a short prompt and decides how rich the design should be.
//
//   normal  -> short, simple page
//   better  -> full landing page (the default)
//   premium -> every section, roomier spacing, richer components
//
// It is plain scoring, no AI: every clue in the prompt adds or removes points, the total picks the tier,
// and every point is recorded in `reasons` so the decision can be explained (and tuned).
import type { ThemeKey } from './themes'

export type Tier = 'normal' | 'better' | 'premium'

export type BrainResult = {
  tier: Tier
  score: number
  /** human readable list of what moved the score */
  reasons: string[]
}

type Clue = { words: string[]; points: number; cap: number; label: string }

const CLUES: Clue[] = [
  {
    label: 'premium words',
    points: 3,
    cap: 6,
    words: ['premium', 'luxury', 'luxurious', 'high-end', 'exclusive', 'elite', 'boutique', 'bespoke', 'artisan', 'upscale', 'prestige', 'signature', 'handcrafted', 'expensive', 'fancy', 'rich'],
  },
  {
    label: 'quality words',
    points: 1,
    cap: 2,
    words: ['better', 'modern', 'professional', 'attractive', 'beautiful', 'unique', 'stunning', 'creative', 'polished', 'sleek', 'elegant', 'best', 'amazing', 'awesome'],
  },
  {
    label: 'simple words',
    points: -3,
    cap: -6,
    words: ['simple', 'basic', 'plain', 'quick', 'normal', 'minimal', 'small', 'starter', 'easy', 'cheap', 'budget', 'tiny', 'short'],
  },
]

const NEGATIONS = ['not', 'no', "don't", 'dont', 'without', 'never', 'non']

// Business types lean one way: luxury brands expect a richer page, a small shop usually needs less.
const THEME_LEAN: Partial<Record<ThemeKey, { points: number; label: string }>> = {
  luxury_minimal: { points: 2.5, label: 'luxury-type business' },
}

export const TIER_THRESHOLDS = { premium: 3.5, normal: -1.5 }

const tokenize = (prompt: string) => prompt.toLowerCase().split(/[^a-z0-9'-]+/).filter(Boolean)

export function analyzePrompt(prompt: string, theme?: ThemeKey): BrainResult {
  const words = tokenize(prompt)
  const reasons: string[] = []
  let score = 0

  for (const clue of CLUES) {
    let subtotal = 0
    const hits: string[] = []
    words.forEach((word, i) => {
      if (!clue.words.includes(word)) return
      // "not premium" / "no luxury" flips the meaning of the next word
      const negated = NEGATIONS.includes(words[i - 1] ?? '')
      subtotal += negated ? -clue.points : clue.points
      hits.push(negated ? `not ${word}` : word)
    })
    if (!hits.length) continue
    const capped = clue.cap > 0 ? Math.min(subtotal, clue.cap) : Math.max(subtotal, clue.cap)
    if (capped === 0) continue
    score += capped
    reasons.push(`${clue.label} (${hits.join(', ')}) ${capped > 0 ? '+' : ''}${capped}`)
  }

  const lean = theme ? THEME_LEAN[theme] : undefined
  if (lean) {
    score += lean.points
    reasons.push(`${lean.label} +${lean.points}`)
  }

  // How much the user told us: a bare 3-word prompt asks for little, a detailed one expects more.
  const meaningful = words.filter((w) => w.length > 2).length
  // a short prompt ("gym in Jaipur") is what a business owner types: it is not a request for a poor page, so it does not lower the score;
  // only words that ask for it ("simple", "basic", "small") do
  if (meaningful <= 4) {
    reasons.push(`short prompt (${meaningful} words): a full page all the same`)
  } else if (meaningful >= 30) {
    score += 2
    reasons.push(`detailed prompt (${meaningful} words) +2`)
  } else if (meaningful >= 15) {
    score += 1
    reasons.push(`descriptive prompt (${meaningful} words) +1`)
  }

  const tier: Tier = score >= TIER_THRESHOLDS.premium ? 'premium' : score <= TIER_THRESHOLDS.normal ? 'normal' : 'better'
  if (!reasons.length) reasons.push('no strong clues, using the default level')
  return { tier, score, reasons }
}

/** Extra Tailwind spacing / size swaps per tier, applied to the generated markup. */
export const tierSwaps: Record<Tier, [string, string][]> = {
  normal: [
    ['py-20', 'py-14'],
    ['py-24', 'py-16'],
    ['md:py-28', 'md:py-20'],
    ['md:py-32', 'md:py-24'],
  ],
  better: [],
  premium: [
    ['py-20', 'py-28'],
    ['py-24', 'py-32'],
    ['md:py-28', 'md:py-36'],
    ['md:py-32', 'md:py-40'],
    ['md:text-6xl', 'md:text-7xl'],
    ['lg:text-6xl', 'lg:text-7xl'],
    ['md:text-4xl', 'md:text-5xl'],
    ['border p-8', 'border p-8 shadow-xl'],
  ],
}
