// Who is using the page: an anonymous id made once in this browser (no account, no e-mail). The server keeps a person's prompts, edits and projects under it and reads them
// back only to the same id. To use the same projects on another computer, copy the code (Tools, Project) and paste it there.
const KEY = 'ui-blocks:user'
const VALID = /^[a-f0-9]{32}$/

let memory = ''
export function userId(): string {
  try {
    const saved = localStorage.getItem(KEY) ?? ''
    if (VALID.test(saved)) return saved
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    const made = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
    localStorage.setItem(KEY, made)
    return made
  } catch {
    // no storage (a private window): the id lives as long as the page
    if (!memory) memory = [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('')
    return memory
  }
}

/** use the code of another browser (returns false when it is not a code) */
export function setUserId(code: string): boolean {
  const clean = code.trim().toLowerCase()
  if (!VALID.test(clean)) return false
  try {
    localStorage.setItem(KEY, clean)
  } catch {
    memory = clean
  }
  return true
}

let installed = false
/** every request of the page to its own /api/ carries the id (header x-user): the stores do not need to know about it */
export function installUserHeader(): void {
  if (installed || typeof window === 'undefined') return
  installed = true
  const original = window.fetch.bind(window)
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (!url.startsWith('/api/') && !url.startsWith(`${location.origin}/api/`)) return original(input, init)
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined))
    headers.set('x-user', userId())
    return original(input, { ...init, headers })
  }
}
