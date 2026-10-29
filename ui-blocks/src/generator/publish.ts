// Publishing: the finished site goes to this app's server (POST /api/publish) and opens at /s/<id>/. The owner keeps a secret in this browser to update or take it down.
// The server serves it in a sandbox, so its scripts cannot reach the app. Plain files: the same ones the "SEO-ready HTML" download holds.
import type { ZipEntry } from './zip'

export type Published = { id: string; secret: string; url: string; at: string; bytes: number }

const KEY = 'ui-blocks:published'
const read = (): Record<string, Published> => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, Published>
  } catch {
    return {}
  }
}
export const publishedFor = (name: string): Published | undefined => read()[name]
const remember = (name: string, value: Published | undefined) => {
  try {
    const all = read()
    if (value) all[name] = value
    else delete all[name]
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // the link is shown anyway; it only cannot be updated from here later
  }
}

const b64 = (bytes: Uint8Array) => {
  let out = ''
  for (let i = 0; i < bytes.length; i += 0x8000) out += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(out)
}

/** sends the files (the first folder name of each path is dropped) and returns where the site is; updates the same address when this browser published it before */
export async function publishSite(name: string, entries: ZipEntry[]): Promise<Published> {
  const prior = publishedFor(name)
  // only the files of the site itself (the zip also holds deploy settings and a README for other hosts)
  const files = entries.filter((e) => /\.(?:html|css|js|svg|png|jpe?g|webp|gif|ico|txt|xml|json|woff2|mp4|webm)$/i.test(e.path) && !/(?:^|\/)\./.test(e.path) && !/(?:^|\/)(?:vercel|netlify|package)\.json$/i.test(e.path)).map((e) => {
    const path = e.path.replace(/^[^/]+\//, '')
    return typeof e.content === 'string' ? { path, text: e.content } : { path, b64: b64(e.content) }
  })
  const res = await fetch('/api/publish', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, files, ...(prior ? { id: prior.id, secret: prior.secret } : {}) }), signal: AbortSignal.timeout(30000) })
  const body = (await res.json().catch(() => ({}))) as { id?: string; secret?: string; url?: string; bytes?: number; error?: string }
  // the site was taken down on the server: publish again as a new one
  if (res.status === 403 && prior) {
    remember(name, undefined)
    return publishSite(name, entries)
  }
  if (!res.ok || !body.id || !body.url) throw new Error(body.error ?? 'The server could not publish the site.')
  const result: Published = { id: body.id, secret: body.secret ?? prior?.secret ?? '', url: body.url, at: new Date().toISOString(), bytes: body.bytes ?? 0 }
  remember(name, result)
  return result
}

export async function unpublishSite(name: string): Promise<void> {
  const prior = publishedFor(name)
  if (!prior) return
  const res = await fetch('/api/unpublish', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: prior.id, secret: prior.secret }), signal: AbortSignal.timeout(10000) })
  if (!res.ok && res.status !== 403) throw new Error('The server could not take the site down.')
  remember(name, undefined)
}
