// What Core-Craft AI recognised: "cctv website" is the niche cctv_security_install even where the keywords of the niche packs do not match. The page asks the Content AI once per prompt,
// keeps the answer here (and in the browser, so a restored project does not need the server) and detectNiche() uses it only when its own keywords found nothing.
const KEY = 'ui-blocks:niche-hints'
const hints = new Map<string, string>()
let loaded = false

export const hintKey = (prompt: string) => prompt.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 300)

const load = () => {
  if (loaded) return
  loaded = true
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, string>
    for (const [k, v] of Object.entries(saved)) if (typeof v === 'string' && /^[a-z0-9_]{2,60}$/.test(v)) hints.set(k, v)
  } catch {
    // the hints are a convenience
  }
}

export function nicheHint(prompt: string): string | undefined {
  load()
  return hints.get(hintKey(prompt))
}

export function setNicheHint(prompt: string, id: string): void {
  load()
  hints.set(hintKey(prompt), id)
  try {
    localStorage.setItem(KEY, JSON.stringify(Object.fromEntries([...hints].slice(-200))))
  } catch {
    // not saved
  }
}
