// Path C: an optional AI server (server/index.mjs) reads the requests the offline rules could not understand.
// The server only returns operations; they are checked here with cleanOp exactly like those of the rules, so a wrong or
// hostile answer can never do more than the rules can. When the server is not running everything still works offline.
import { cleanOp, type EditOp } from './edits'
import type { Control, EditContext } from './understand'

export type SiteState = {
  brand: string
  context: EditContext
  /** section keys that are on the page now */
  sections: string[]
  /** page keys of a multi-page site */
  pages: string[]
}

export type ServerAnswer = { ops: EditOp[]; control?: Control; newSite?: boolean; reply?: string }

const TIMEOUT_MS = 25_000

export async function serverHealth(): Promise<boolean> {
  try {
    const res = await fetch('/api/health', { signal: AbortSignal.timeout(2500) })
    if (!res.ok) return false
    const body = (await res.json()) as { ok?: boolean; ai?: boolean }
    return !!body.ok && !!body.ai
  } catch {
    return false
  }
}

/** is the image engine (PixelMath) reachable through the server of this project? */
export async function imageEngineUp(): Promise<boolean> {
  try {
    const res = await fetch('/api/health', { signal: AbortSignal.timeout(2500) })
    return res.ok && !!((await res.json()) as { images?: boolean }).images
  } catch {
    return false
  }
}

export async function askServer(text: string, state: SiteState): Promise<ServerAnswer | undefined> {
  try {
    const res = await fetch('/api/edit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, state }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!res.ok) return undefined
    const body = (await res.json()) as { ops?: unknown[]; control?: string; newSite?: boolean; reply?: string }
    const ops = (Array.isArray(body.ops) ? body.ops : []).map(cleanOp).filter((op): op is EditOp => !!op).slice(0, 12)
    const control = body.control === 'undo' || body.control === 'redo' || body.control === 'reset' ? body.control : undefined
    return { ops, control, newSite: body.newSite === true, reply: typeof body.reply === 'string' ? body.reply.slice(0, 300) : undefined }
  } catch {
    return undefined
  }
}

/** tells the server what the person did with an answer, so that the examples can be collected for training the offline parser */
export function sendFeedback(entry: { text: string; ops: EditOp[]; accepted: boolean; source: 'rules' | 'server' }): void {
  try {
    void fetch('/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(entry), keepalive: true }).catch(() => undefined)
  } catch {
    // feedback is optional
  }
}

export type Photo = { id: number; url: string; thumb: string; alt: string; credit: string; creditUrl: string; pageUrl: string }
export type PhotoResult = { photos: Photo[]; source: string; sourceUrl: string; /** the answer was saved earlier (the internet did not answer) */ offline?: boolean }

/** pictures for a search ("pest control"), from the optional photo service of the server; undefined when it is not there */
export async function searchPhotos(query: string, page = 1): Promise<{ result?: PhotoResult; problem?: string }> {
  try {
    const res = await fetch(`/api/photos?q=${encodeURIComponent(query)}&page=${page}`, { signal: AbortSignal.timeout(20_000) })
    if (res.status === 503) return { problem: 'The photo search is not switched on: start the server with PEXELS_API_KEY=your-key (free at pexels.com/api), or upload your own pictures.' }
    if (res.status === 429) return { problem: 'Too many searches: wait a minute.' }
    if (res.status === 502) return { problem: 'The photo search needs the internet and this search is not saved yet. Try again when you are online, or upload your own pictures (the image AI works offline).' }
    if (!res.ok) return { problem: 'The photo search did not answer. You can upload your own pictures instead.' }
    const body = (await res.json()) as PhotoResult
    // only https addresses are ever used on a page
    const photos = (body.photos ?? []).filter((p) => /^https:\/\//.test(p.url) && /^https:\/\//.test(p.thumb))
    return photos.length ? { result: { ...body, photos } } : { problem: 'No pictures found for that. Try other words.' }
  } catch {
    return { problem: 'The server is not running (npm run server) or not reachable. You can upload your own pictures instead.' }
  }
}

/** a photo of a search result, copied through the server (it keeps a copy, so a photo that was loaded once works again without the internet); the address itself when the server cannot */
export async function loadPhoto(url: string): Promise<Blob | undefined> {
  for (const address of [`/api/photo-file?u=${encodeURIComponent(url)}`, url]) {
    try {
      const res = await fetch(address, { signal: AbortSignal.timeout(25_000) })
      if (res.ok && (res.headers.get('content-type') ?? '').startsWith('image/')) return await res.blob()
    } catch {
      // the next way
    }
  }
  return undefined
}
