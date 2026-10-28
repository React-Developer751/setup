// Pictures of an exported site: the generator keeps them inside the page (data: addresses) so the preview needs no server; an exported site is lighter and cacheable
// when each picture is its own file, and pictures below the first screen load when they come near.
import type { ZipEntry } from './zip'

const decode = (b64: string): Uint8Array => {
  const raw = atob(b64)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i)
  return bytes
}

/** every data: picture of 3 KB or more becomes a file (the same picture once); the first picture of the page loads at once, the others lazily */
export function hoistImages(html: string, dir = 'assets/img'): { html: string; files: ZipEntry[] } {
  const files: ZipEntry[] = []
  const known = new Map<string, string>()
  const out = html.replace(/data:image\/(jpeg|png|webp|gif);base64,([A-Za-z0-9+/=]{3000,})/g, (_all, kind: string, data: string) => {
    const key = `${kind}|${data.length}|${data.slice(0, 80)}|${data.slice(-80)}`
    let path = known.get(key)
    if (!path) {
      path = `${dir}/pic-${known.size + 1}.${kind === 'jpeg' ? 'jpg' : kind}`
      known.set(key, path)
      files.push({ path, content: decode(data) })
    }
    return path
  })
  let first = true
  const lazy = out.replace(/<img\b([^>]*?)(\/?)>/g, (tag, attrs: string, close: string) => {
    if (/\bloading=/.test(attrs)) return tag
    if (first) {
      first = false
      return `<img${attrs} decoding="async"${close}>`
    }
    return `<img${attrs} loading="lazy" decoding="async"${close}>`
  })
  return { html: lazy, files }
}

/** the stored components use h1 for every heading; a page has one: the first stays, the others become h2 (search engines and screen readers read the outline) */
export function oneHeading(html: string): string {
  let opened = 0
  let closed = 0
  return html.replace(/<(\/?)h1\b/g, (tag, slash: string) => {
    if (slash) return (closed += 1) === 1 ? tag : '</h2'
    return (opened += 1) === 1 ? tag : '<h2'
  })
}
