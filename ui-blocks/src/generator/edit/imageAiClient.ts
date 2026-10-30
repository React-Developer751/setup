// Fetches the scenes of a plan from the server and turns them into small JPEG pictures that live inside the page (a data: address), so the finished
// site and its exports do not depend on any server. Browser only.
//
// Every picture is checked (imageCheck.ts): the engine must understand the prompt, and the drawn picture must not be empty, flat, nearly one colour
// or at odds with the colours of the site. A picture that fails is drawn again (another seed, then other words, then another scene of the business),
// up to four tries; the best one is kept. Every decision is sent to the server (image-feedback.jsonl) so that `npm run images:learn` can find the
// scenes the engine draws badly and leave them out of the next plans.
import { stripFiller } from '../hinglish'
import { sceneUrl, type Scene, type ScenePlan } from '../imageAi'
import type { EditOp } from './edits'
import { assessPixels, cleanPrompt, promptUnderstood, type ParseAnswer, type PixelReport } from './imageCheck'
import { sampleTopK, temperature } from '../creativity'
import { directPlan, mashups } from './imageDirector'
import { applyRatings, blockedByRatings, businessKey, loadRatings, syncRatings } from './imageRatings'
import { readPicture } from './imageFile'
import { detectNiche } from '../niche/applyNiche'
import { NICHES } from '../niche/niches'

export type PictureReport = { pictures: number; redrawn: number; otherScene: number; /** scenes replaced because they showed nothing of the business */ directed: number; notes: string[] }
/** a scene as it was finally drawn (the prompt can differ from the plan: another words, another scene), with the kind of picture it is */
export type UsedScene = Scene & { kind: 'hero' | 'about' | 'tile' }
export type ImageAiResult = { ops?: EditOp[]; problem?: string; report?: PictureReport; used?: UsedScene[] }

const MEMORY_KEY = 'ui-blocks:image-memory'
type Memory = Record<string, { tries: number; rejects: number }>
const readMemory = (): Memory => {
  try {
    return JSON.parse(localStorage.getItem(MEMORY_KEY) ?? '{}') as Memory
  } catch {
    return {}
  }
}
const remember = (prompt: string, accepted: boolean) => {
  try {
    const memory = readMemory()
    const entry = memory[prompt] ?? { tries: 0, rejects: 0 }
    entry.tries += 1
    if (!accepted) entry.rejects += 1
    memory[prompt] = entry
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory))
  } catch {
    // the memory is optional
  }
}
/** a prompt that was drawn badly most of the times it was tried is not tried first any more */
const mistrusted = (prompt: string) => {
  const entry = readMemory()[prompt]
  return (!!entry && entry.tries >= 4 && entry.rejects / entry.tries >= 0.75) || blockedByRatings(loadRatings()).includes(prompt)
}

const log = (entry: { prompt: string; seed: number; attempt: number; accepted: boolean; score: number; reasons: string[]; stage: 'parse' | 'pixels' | 'plan' }) => {
  try {
    void fetch('/api/image-feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(entry), keepalive: true }).catch(() => undefined)
  } catch {
    // the log is optional
  }
}

const parseCache = new Map<string, ParseAnswer | undefined>()
async function askParse(prompt: string): Promise<ParseAnswer | undefined> {
  if (parseCache.has(prompt)) return parseCache.get(prompt)
  let answer: ParseAnswer | undefined
  try {
    const res = await fetch(`/api/ai-parse?prompt=${encodeURIComponent(prompt)}`, { signal: AbortSignal.timeout(10_000) })
    answer = res.ok ? ((await res.json()) as ParseAnswer) : undefined
  } catch {
    answer = undefined
  }
  parseCache.set(prompt, answer)
  return answer
}

async function fetchBlob(scene: Scene, prompt: string, seed: number): Promise<Blob> {
  const res = await fetch(sceneUrl({ ...scene, prompt, seed }), { signal: AbortSignal.timeout(60_000) })
  // 502 / 503 / 504: nothing is listening behind the proxy or the engine is not running
  if (res.status >= 502) throw new Error('down')
  if (!res.ok) throw new Error(`the image engine answered ${res.status}`)
  const blob = await res.blob()
  if (!/^image\//.test(blob.type)) throw new Error('the image engine did not return a picture')
  return blob
}

async function pixelsOf(blob: Blob, accent?: string): Promise<PixelReport> {
  try {
    const bitmap = await createImageBitmap(blob)
    const width = 64
    const height = Math.max(1, Math.round((bitmap.height / bitmap.width) * width))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) return { ok: true, score: 0.5, reasons: [], stats: { mean: 0, spread: 0, colours: 0, saturation: 0, hueGap: null } }
    context.drawImage(bitmap, 0, 0, width, height)
    bitmap.close?.()
    return assessPixels(context.getImageData(0, 0, width, height).data, accent)
  } catch {
    // a picture that cannot be read for the check is not turned away because of that
    return { ok: true, score: 0.5, reasons: [], stats: { mean: 0, spread: 0, colours: 0, saturation: 0, hueGap: null } }
  }
}

type Tries = { redrawn: number; otherScene: number; notes: string[] }

async function one(scene: Scene, accent: string | undefined, tries: Tries): Promise<{ picture: string; prompt: string; seed: number }> {
  // the tries: the prompt as planned, the same prompt with another seed, then other scenes of the business
  let prompt = scene.prompt
  if (mistrusted(prompt) && scene.alt?.[0]) {
    tries.notes.push(`"${prompt}" was drawn badly before: "${scene.alt[0]}" instead`)
    prompt = scene.alt[0]
    tries.otherScene += 1
  }
  const parse = await askParse(prompt)
  if (!promptUnderstood(parse)) {
    log({ prompt, seed: scene.seed, attempt: 0, accepted: false, score: 0, reasons: [`not understood: ${(parse?.not_in_lexicon ?? []).join(', ')}`], stage: 'parse' })
    const cleaned = cleanPrompt(prompt, parse)
    const next = cleaned.length > 2 && promptUnderstood(await askParse(cleaned)) ? cleaned : (scene.alt?.[0] ?? prompt)
    tries.notes.push(`the engine did not know the words of "${prompt}": "${next}" instead`)
    tries.otherScene += 1
    prompt = next
  }
  const plan: { prompt: string; seed: number }[] = [
    { prompt, seed: scene.seed },
    { prompt, seed: scene.seed + 101 },
    { prompt: scene.alt?.find((p) => p !== prompt) ?? prompt, seed: scene.seed + 7 },
    { prompt: scene.alt?.filter((p) => p !== prompt)[1] ?? prompt, seed: scene.seed + 13 },
  ]
  let best: { blob: Blob; score: number; prompt: string; seed: number } | undefined
  for (let i = 0; i < plan.length; i += 1) {
    const { prompt: p, seed } = plan[i]
    const blob = await fetchBlob(scene, p, seed)
    const report = await pixelsOf(blob, accent)
    log({ prompt: p, seed, attempt: i + 1, accepted: report.ok, score: report.score, reasons: report.reasons, stage: 'pixels' })
    remember(p, report.ok)
    if (!best || report.score > best.score) best = { blob, score: report.score, prompt: p, seed }
    if (report.ok) {
      if (i > 0) tries.redrawn += 1
      if (p !== prompt) tries.otherScene += 1
      best = { blob, score: report.score, prompt: p, seed }
      break
    }
    if (i > 0) tries.redrawn += 1
  }
  const chosen = best as { blob: Blob; prompt: string; seed: number }
  return { picture: await readPicture(new File([chosen.blob], 'scene.png', { type: chosen.blob.type }), Math.max(scene.width, scene.height)), prompt: chosen.prompt, seed: chosen.seed }
}

/** one picture again, for a scene the person turned down: another scene of the business (never one that was turned down) */
export async function redrawScene(scene: UsedScene, options: { accent?: string; prompt?: string } = {}): Promise<{ picture: string; scene: UsedScene } | undefined> {
  const store = loadRatings()
  const disliked = new Set(store.disliked[options.prompt ? businessKey(options.prompt) : ''] ?? [])
  disliked.add(scene.prompt)
  const candidate = (scene.alt ?? []).find((p) => !disliked.has(p))
  const next: Scene = candidate ? { ...scene, prompt: candidate, seed: scene.seed + 31, alt: (scene.alt ?? []).filter((p) => p !== candidate) } : { ...scene, seed: scene.seed + 57 }
  try {
    const made = await one(next, options.accent, { redrawn: 0, otherScene: 0, notes: [] })
    return { picture: made.picture, scene: { ...next, prompt: made.prompt, seed: made.seed, kind: scene.kind } }
  } catch {
    return undefined
  }
}

/**
 * The studio of the image engine draws the pictures of one site together (hero with calm space for the headline, About, gallery tiles) in one style and
 * judges them itself. undefined when the engine is not running or the business fits none of its niches (it then answers with a neutral picture: the
 * scenes of the plan are drawn instead, as before).
 */
/** words of the person that the image engine reads badly: the Hinglish scaffolding, offers and numbers, a business name after "school" */
export function studioQueries(prompt: string): string[] {
  const asked = prompt.replace(/\b(fashion|luxury|publishing|auction|opera|production|fashion|design|record|tea|coffee)\s+house\b/gi, '$1')
  const cleaned = stripFiller(asked.split(/[,;:.]/)[0])
    .replace(/\b(?:free|cash|order|above|over|open|online|website|site|banao|chahiye)\b.*$/i, '')
    .replace(/\b(?:chai ki tapri|tapri|tea stall)\b/i, 'chai cafe')
  // the words that start in lower case say the business; capitals are a name or a place ("Sunrise Public", "Lucknow") and only confuse the engine
  const plain = cleaned.split(/\s+/).filter((w) => w && /^[a-z]/.test(w) && !/^(?:for|in|of|at|a|an|the|and|with)$/.test(w))
  const head = (plain.length ? plain : cleaned.split(/\s+/)).filter((w, i, all) => w !== all[i - 1]).join(' ').trim()
  const words = head.split(' ').filter(Boolean)
  // the engine refuses the bare word "school" (a diving school is not a classroom): a classroom is asked for
  if (head === 'school') return [asked, 'school classroom']
  return [...new Set([asked, head, words.slice(0, 2).join(' ')].filter((q) => q.length >= 2))]
}

async function studioSet(prompt: string, accent: string | undefined, seed: number): Promise<{ ops: EditOp[]; report: PictureReport } | undefined> {
  try {
    // "fashion house" or "publishing house" is not a building: the engine would draw a house for sale. When it refuses the words as typed
    // (a fallback), the same business is asked again in plainer words
    type SetBody = { report?: { niche?: string | null; title?: string; fallback?: boolean; redrawn?: number }; images?: { role: string; mime: string; image_base64: string }[] }
    let body: SetBody = {}
    for (const asked of studioQueries(prompt)) {
      const query = new URLSearchParams({ prompt: asked, count: '6', seed: String(Math.abs(Math.round(seed)) % 999_999) })
      if (accent && /^#[0-9a-f]{6}$/i.test(accent)) query.set('accent', accent)
      const res = await fetch(`/api/ai-set?${query}`, { signal: AbortSignal.timeout(100_000) })
      if (!res.ok) return undefined
      body = (await res.json()) as SetBody
      if (body.report && !body.report.fallback && body.report.niche) break
    }
    if (!body.report || body.report.fallback || !body.report.niche) return undefined
    const pictures = (body.images ?? []).map((i) => `data:${i.mime};base64,${i.image_base64}`)
    if (pictures.length < 3) return undefined
    return {
      ops: [{ op: 'photos', hero: pictures[0], about: pictures[1], gallery: pictures.slice(2) }],
      report: { pictures: pictures.length, redrawn: body.report.redrawn ?? 0, otherScene: 0, directed: 0, notes: [`one set of ${pictures.length} pictures in the style of ${body.report.title || body.report.niche}, judged by the image engine`] },
    }
  } catch {
    return undefined
  }
}


/**
 * The image AI's own spec: the business named in "<subject>, for a <business> website" decides the scene, and every place of the page has its slot (first screen 16:9 with calm space on the
 * left, About 4:3, gallery squares). The pictures use the colours of the site and never draw text. undefined when the business is not one of the spec's (the studio set is tried then).
 */
async function specSet(prompt: string, plan: ScenePlan, accent: string | undefined, bg: string | undefined, seed: number): Promise<{ ops: EditOp[]; report: PictureReport } | undefined> {
  const niche = detectNiche(prompt, NICHES)
  if (!niche) return undefined
  const palette = accent && /^#[0-9a-f]{6}$/i.test(accent) ? ` Palette: accent ${accent}${bg && /^#[0-9a-f]{6}$/i.test(bg) ? ` on ${bg}` : ''}.` : ''
  const subjects = [
    { slot: 'hero-1', subject: plan.hero.prompt },
    { slot: 'about', subject: plan.about.prompt },
    ...plan.gallery.slice(0, 4).map((g, i) => ({ slot: `gallery-${i + 1}`, subject: g.prompt })),
  ]
  const results: (string | undefined)[] = new Array(subjects.length)
  let fell = false
  let next = 0
  const worker = async () => {
    while (next < subjects.length && !fell) {
      const i = next++
      const { slot, subject } = subjects[i]
      const query = new URLSearchParams({ prompt: `${subject}, for a ${niche.label.toLowerCase()} website.${palette}`, slot, seed: String(Math.abs(Math.round(seed)) % 999_999) })
      if (accent && /^#[0-9a-f]{6}$/i.test(accent)) query.set('accent', accent)
      if (bg && /^#[0-9a-f]{6}$/i.test(bg)) query.set('bg', bg)
      let res = await fetch(`/api/ai-spec?${query}`, { signal: AbortSignal.timeout(100_000) })
      // busy (the engine draws a few pictures at a time): wait and ask again, up to four times
      for (let again = 0; again < 4 && res.status === 503; again += 1) {
        await new Promise((r) => setTimeout(r, 2000 * (again + 1)))
        res = await fetch(`/api/ai-spec?${query}`, { signal: AbortSignal.timeout(100_000) })
      }
      if (!res.ok) {
        fell = true
        return
      }
      const body = (await res.json()) as { image_base64?: string; mime?: string; report?: { fallback?: boolean; niche?: string | null } }
      // a neutral picture for a business the image AI does not know is not a picture of this business
      if (!body.image_base64 || body.report?.fallback || !body.report?.niche) {
        fell = true
        return
      }
      results[i] = `data:${body.mime};base64,${body.image_base64}`
    }
  }
  try {
    await Promise.all([worker(), worker()])
  } catch {
    return undefined
  }
  if (fell || results.some((r) => !r)) return undefined
  const pictures = results as string[]
  return { ops: [{ op: 'photos', hero: pictures[0], about: pictures[1], gallery: pictures.slice(2) }], report: { pictures: pictures.length, redrawn: 0, otherScene: 0, directed: 0, notes: [`pictures for a ${niche.label.toLowerCase()} website from the image AI's spec: the scene of the business, the size of each place, the colours of your site, no text`] } }
}

/** the picture of every scene, two at a time; `onProgress(done, total)` tells how far it is */
export async function makePictures(basePlan: ScenePlan, onProgress: (done: number, total: number) => void, options: { accent?: string; /** the background colour of the site (the pictures of the spec use it) */ bg?: string; /** the words of the person: the pictures must show this business */ prompt?: string } = {}): Promise<ImageAiResult> {
  if (options.prompt) {
    const bySpec = await specSet(options.prompt, basePlan, options.accent, options.bg, basePlan.hero.seed).catch(() => undefined)
    if (bySpec) {
      onProgress(bySpec.report.pictures, bySpec.report.pictures)
      return { ops: bySpec.ops, report: bySpec.report }
    }
    const set = await studioSet(options.prompt, options.accent, basePlan.hero.seed)
    if (set) {
      onProgress(set.report.pictures, set.report.pictures)
      return { ops: set.ops, report: set.report }
    }
  }
  let plan = basePlan
  let directed = 0
  const directNotes: string[] = []
  const directNotes0: string[] = []
  let trusted = new Set<string>()
  if (options.prompt) {
    // what people said about the pictures of this kind of business comes first (the shared database, then the cache)
    await syncRatings()
    const rated = applyRatings(plan, loadRatings(), businessKey(options.prompt))
    plan = rated.plan
    trusted = new Set((loadRatings().liked[businessKey(options.prompt)] ?? []).map((l) => l.prompt))
    if (rated.used) directNotes0.push(`${rated.used} picture${rated.used === 1 ? '' : 's'} you liked before for this kind of business ${rated.used === 1 ? 'is' : 'are'} used again`)
    if (rated.swapped) directNotes0.push(`${rated.swapped} scene${rated.swapped === 1 ? '' : 's'} you turned down before ${rated.swapped === 1 ? 'is' : 'are'} not used`)
    try {
      const answer = await directPlan(options.prompt, plan, askParse, trusted)
      plan = answer.plan
      directed = answer.replaced
      directNotes.push(...directNotes0, ...answer.notes)
      // creative: the first screen is chosen out of new mixes of the business props, by how well each one is drawn
      const temp = temperature()
      if (temp >= 0.3 && !basePlan.fromNiche && answer.props.length && !trusted.has(plan.hero.prompt)) {
        const rand = Math.random
        const likedPrompts = (loadRatings().liked[businessKey(options.prompt)] ?? []).slice(0, 3).map((l) => l.prompt)
        const likedEntities = [...new Set((await Promise.all(likedPrompts.map((p) => askParse(p)))).flatMap((a) => (a?.entities ?? []).map((e) => e.name)))]
        const candidates = [plan.hero.prompt, ...(await mashups(answer.props, askParse, rand, likedEntities))]
        if (candidates.length > 1) {
          const scored: { item: string; score: number }[] = []
          for (const prompt of candidates) {
            try {
              const blob = await fetchBlob({ ...plan.hero, width: 320, height: 200 }, prompt, plan.hero.seed)
              const report = await pixelsOf(blob, options.accent)
              scored.push({ item: prompt, score: report.ok ? report.score : 0 })
            } catch {
              // a candidate that cannot be drawn is left out
            }
          }
          if (scored.length > 1) {
            const winner = sampleTopK(scored, temp, rand)
            if (winner !== plan.hero.prompt) {
              directNotes.push(`first screen: "${winner}", the best of ${scored.length} new mixes`)
              directed += 1
              plan = { ...plan, hero: { ...plan.hero, prompt: winner, alt: [plan.hero.prompt, ...(plan.hero.alt ?? [])].slice(0, 3) } }
            }
          }
        }
      }
      for (const note of answer.notes) log({ prompt: note.slice(0, 190), seed: 0, attempt: 0, accepted: false, score: 0, reasons: [note.slice(0, 110)], stage: 'plan' })
    } catch {
      // the direction is an extra: the plan of the business type is used as it is
    }
  }
  const scenes = [plan.hero, plan.about, ...plan.gallery]
  const pictures: string[] = new Array(scenes.length)
  const used: UsedScene[] = new Array(scenes.length)
  const tries: Tries = { redrawn: 0, otherScene: 0, notes: [] }
  let next = 0
  let done = 0
  try {
    const worker = async () => {
      while (next < scenes.length) {
        const i = next++
        const made = await one(scenes[i], options.accent, tries)
        pictures[i] = made.picture
        used[i] = { ...scenes[i], prompt: made.prompt, seed: made.seed, kind: i === 0 ? 'hero' : i === 1 ? 'about' : 'tile' }
        done += 1
        onProgress(done, scenes.length)
      }
    }
    await Promise.all([worker(), worker()])
  } catch (error) {
    const down = error instanceof TypeError || (error instanceof Error && error.message === 'down')
    return { problem: down ? 'The image engine is not running. Start it with: npm run images (and the server: npm run server).' : error instanceof Error ? error.message : 'Could not make the pictures.' }
  }
  return { used, ops: [{ op: 'photos', hero: pictures[0], about: pictures[1], gallery: pictures.slice(2) }], report: { pictures: scenes.length, redrawn: tries.redrawn, otherScene: tries.otherScene, directed, notes: [...directNotes, ...tries.notes].slice(0, 6) } }
}
