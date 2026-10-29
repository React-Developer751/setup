// Picks a theme from the user's prompt with plain keyword scoring (no AI, no API, no Node-only
// libraries). Same training words as before; each prompt word that appears in a theme's
// vocabulary adds one point to that theme.
import { isVague, withoutVibe } from './hinglish'
import ensembleFile from '../data/models/ensemble.json'
import { fromKits, KIT_KEYS } from './kits'
import { blend, DEFAULT_WEIGHTS, ruleDistribution, type Distribution, type Weights } from './ml/ensemble'
import { correctionFor, hasThemeModel, predictThemeText } from './ml/learned'
import { smartModelKey, smartThemeEvidence } from './ml/smart'
import type { ThemeKey } from './themes'

const trainingData: Record<ThemeKey, string[]> = {
  modern_tech: [
    'software development startup app agency tech SaaS cloud dashboard platform',
    'AI tool chat software tech crypto cryptocurrency bitcoin blockchain exchange web3 development digital internet broadband wifi telecom cybersecurity security analytics data nft robotics chatbot automation',
  ],
  organic_nature: [
    'organic green tea coffee cafe farm fresh juice herbal plants florist flower flowers bouquet nursery',
    'nature organic honey eco friendly fruits gardening ayurveda health foods',
  ],
  luxury_minimal: [
    'premium watch luxury leather wallets diamond design interior furniture decor',
    'expensive minimalist architecture perfume high end brand portfolio classic black',
  ],
  playful_vibrant: [
    'kids toys bags cute cartoon gaming zone candy ice cream fun party',
    'creative colorful illustration festival pop art friendly comic hobby',
  ],
  bold_fitness: [
    'gym workout crossfit bodybuilding sports shoes protein shake energy drink athletics training karate taekwondo judo kickboxing mma cricket football badminton tennis swimming zumba aerobics stadium',
    'boxing dark mode heavy metal racing speed energy aggressive tactical',
  ],
  professional_services: [
    'law firm lawyer attorney legal solicitor consulting consultant accounting accountant tax finance financial advisor',
    'insurance mortgage bank banking investment wealth management agency recruitment notary compliance loan emi credit trading forex stock advisor',
  ],
  healthcare: [
    'clinic dental dentist doctor medical hospital pharmacy physiotherapy physio therapy therapist nurse',
    'health care patients optician veterinary vet skin dermatology orthodontist pediatric injury rehab rehabilitation chiropractor',
  ],
  food_dining: [
    'restaurant pizza pizzeria burger bakery kitchen dining chef menu catering grill sushi bistro brewery winery wine beer pub bar cake cakes sweets mithai chai',
    'food takeaway noodles steakhouse brunch dessert diner barbecue pasta curry biryani',
  ],
  education: [
    'school academy tutor tutoring course courses learning teacher university college coaching classes',
    'education students exam institute kindergarten preschool playschool nursery daycare training institute lessons curriculum book books bookstore library',
  ],
  creative_studio: [
    'photography photographer film video production music band artist art creative branding agency gallery museum exhibition photo shoot portrait cinematography',
    'design studio illustration animation podcast videographer freelance tattoo piercing',
  ],
  general_business: [
    'business enterprise delivery courier logistics cargo hardware paint petrol',
    'professional trusted small wholesale supplier',
  ],
  ...fromKits((kit): string[] => kit.training),
}

// no keyword matched: a neutral business page fits better than assuming the business is tech
const DEFAULT_THEME: ThemeKey = 'general_business'

// lowercase, split on non-letters, drop a plural so "shoes" matches "shoe", "gyms" matches "gym", "injuries" matches "injury"
const tokenize = (text: string) =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((w) => (w.length > 4 && w.endsWith('ies') ? `${w.slice(0, -3)}y` : w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w))

const vocabulary = Object.fromEntries(
  (Object.keys(trainingData) as ThemeKey[]).map((key) => [key, new Set(trainingData[key].flatMap(tokenize))]),
) as Record<ThemeKey, Set<string>>

// words that fit every kind of business say nothing about which one it is
const GENERIC = new Set(['shop', 'store', 'service', 'company', 'agency', 'centre', 'center', 'firm', 'online', 'business', 'local', 'house', 'club', 'website', 'site', 'page', 'new', 'best', 'studio'])

export function scoreThemes(userPrompt: string): Record<ThemeKey, number> {
  // the name ("called Shine Auto") is not what the business does
  const described = userPrompt.replace(/\b(?:called|named)\b[\s\S]*$/i, ' ')
  const useful = (text: string) => tokenize(text).filter((w) => !GENERIC.has(w))
  let words = useful(described)
  if (!words.some((w) => Object.values(vocabulary).some((v) => v.has(w)))) words = useful(userPrompt)
  // "cloud kitchen", "car wash": the last business word says what it is, the ones before only describe it
  const head = [...words].reverse().find((w) => Object.values(vocabulary).some((v) => v.has(w)))
  return (Object.keys(vocabulary) as ThemeKey[]).reduce(
    (scores, key) => ({ ...scores, [key]: words.filter((w) => vocabulary[key].has(w)).length + (head && vocabulary[key].has(head) ? 0.5 : 0) }),
    {} as Record<ThemeKey, number>,
  )
}

/** The keyword rules alone: the theme they pick, or the default when no keyword matches. */
export function predictThemeByRules(userPrompt: string): ThemeKey {
  const scores = scoreThemes(userPrompt)
  // the specific business types come first, so on a tie "travel agency" is a travel business, not a generic agency
  const keys = [...KIT_KEYS, ...(Object.keys(scores) as ThemeKey[]).filter((key) => !(KIT_KEYS as string[]).includes(key))]
  const best = keys.reduce((a, b) => (scores[b] > scores[a] ? b : a), keys[0])
  // whoever takes the pictures is a creative business, whatever the pictures are of ("wedding photographer")
  if (/photograph|videograph|cinematograph/i.test(userPrompt)) return 'creative_studio'
  // a cause is a cause, whatever it is about ("NGO for girl education")
  if (/\b(?:ngo|charity|non-?profit|foundation)\b/i.test(userPrompt)) return 'nonprofit'
  return scores[best] > 0 ? best : DEFAULT_THEME
}

/** True when the word is one of the business words the classifier knows ("bakery", "repair", "clinic" ...). */
export const isBusinessWord = (word: string) => {
  const [token] = tokenize(word)
  return !!token && Object.values(vocabulary).some((words) => words.has(token))
}

// ───────────── putting the opinions together ─────────────
type Tuned = Weights & { ruleSharpness?: number; abstain?: number }
const TUNED = ensembleFile as unknown as Record<string, Tuned>
/** the weights tuned for the embedding model that is in use (or for none) */
const weightsFor = (model: string | undefined): Tuned => (model && TUNED[model]) || TUNED.default || { ...DEFAULT_WEIGHTS }

/** what the keyword rules say, as probabilities (nothing when no keyword matched) */
export function ruleEvidence(userPrompt: string): Distribution | undefined {
  const scores = scoreThemes(userPrompt)
  const keys = Object.keys(scores) as ThemeKey[]
  // the two firm rules (pictures -> creative, causes -> nonprofit) are certain
  const firm = /photograph|videograph|cinematograph/i.test(userPrompt) ? 'creative_studio' : /\b(?:ngo|charity|non-?profit|foundation)\b/i.test(userPrompt) ? 'nonprofit' : undefined
  if (firm) return Object.fromEntries(keys.map((key) => [key, key === firm ? 1 : 0]))
  return ruleDistribution(scores, weightsFor(smartThemeEvidence(userPrompt) ? smartModelKey() : undefined).ruleSharpness)
}

export type ThemeDecision = {
  theme: ThemeKey
  confidence: number
  /** who decided: a correction typed in the page, or the blend of rules / learned model / meaning model */
  source: 'correction' | 'blend' | 'default'
  sources: string[]
  probabilities: Distribution
}

/**
 * The business type of a prompt. Sources, in order of authority:
 *   1. a correction the person made for this exact text,
 *   2. the blend of the keyword rules, the model learned from examples, and (when switched on and ready) the embedding model.
 */
/** the business itself, without the request, the name and what it offers: "pottery studio" from "Create a website for a pottery studio called Clay Room in Pune with workshops and mugs" */
export function businessHead(prompt: string): string {
  const body = prompt.replace(/^\s*(?:please\s+)?(?:create|build|make|design|generate|i\s+(?:need|want)|need|want)\s+(?:me\s+)?(?:a|an|the)?\s*(?:[\w-]+\s+){0,2}?(?:landing\s*page|web\s*site|website|web\s*page|page|site)\s+(?:for|of)\s+(?:a|an|the|my|our)?\s*/i, '').replace(/^\s*(?:a|an|the|my|our)\s+/i, '')
  const cut = body.search(/\s+(?:called|named|naam)\b|\s+(?:with|offering|selling|providing|having|including|featuring|teaching|serving)\s|[,.;]|\s+(?:in|at|near)\s+[A-Z]/)
  return (cut > 0 ? body.slice(0, cut) : body).trim()
}

/** the classification of the business itself first (the services it lists carry words of other businesses: "workshops" is no garage); the whole prompt when the head says nothing */
export function decideTheme(rawPrompt: string): ThemeDecision {
  // "unique website banakar do" / "create a stunning website": looks and request words say nothing about the business, so they must not vote
  const userPrompt = /[a-z]/i.test(rawPrompt) ? withoutVibe(rawPrompt) || rawPrompt : rawPrompt
  if (userPrompt === rawPrompt && isVague(rawPrompt)) return { theme: DEFAULT_THEME, confidence: 0, source: 'default', sources: [], probabilities: {} }
  const head = businessHead(userPrompt)
  if (head && head.length >= 3 && head.length < userPrompt.trim().length) {
    const d = decideThemeFor(head)
    if (d.source === 'blend' && d.confidence >= 0.3) return d
  }
  return decideThemeFor(userPrompt)
}

function decideThemeFor(userPrompt: string): ThemeDecision {
  const corrected = correctionFor(userPrompt)
  if (corrected) return { theme: corrected as ThemeKey, confidence: 1, source: 'correction', sources: ['correction'], probabilities: { [corrected]: 1 } }
  const learned = hasThemeModel() && userPrompt.trim() ? predictThemeText(userPrompt) : undefined
  const smart = smartThemeEvidence(userPrompt)
  const weights = { ...DEFAULT_WEIGHTS, ...weightsFor(smart ? smartModelKey() : undefined) }
  const result = blend({ rules: ruleEvidence(userPrompt), learned: learned?.probabilities, meaning: smart?.meaning, probe: smart?.probe }, weights)
  // the learned model gives "no opinion" (equal probabilities) for text it has no feature of: such a result is not a decision
  if (!result || result.confidence < (weights.abstain ?? 0.12)) return { theme: DEFAULT_THEME, confidence: 0, source: 'default', sources: [], probabilities: {} }
  return { theme: result.label as ThemeKey, confidence: result.confidence, source: 'blend', sources: result.sources, probabilities: result.probabilities }
}

export const predictTheme = (userPrompt: string): ThemeKey => decideTheme(userPrompt).theme
