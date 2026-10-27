// What the person types before exporting (their own phone, e-mail, address and website address) goes into the page and the files: made safe first.
import type { ExportDetails } from '../exportSite'
import type { generateLibraryPage } from './generateLibraryPage'

type Library = ReturnType<typeof generateLibraryPage>

/** a value as it is written inside a JSON string (quotes and backslashes escaped) */
const inJson = (value: string) => JSON.stringify(value).slice(1, -1)

/** The person's own email, phone and address instead of the placeholders (in the text and in the code). */
export function libraryWithDetails(lib: Library, details: ExportDetails): Library {
  const contact = { ...lib.content.contact }
  let code = lib.code
  for (const key of ['email', 'phone', 'address'] as const) {
    const to = details[key]?.trim()
    const old = contact[key]
    if (!to || to === old) continue
    // the code holds the content as JSON: the field is replaced in that form, so a quote or a backslash in the new value cannot break the file
    code = code.replace(`"${key}": ${JSON.stringify(old)}`, () => `"${key}": ${JSON.stringify(to)}`)
    // the same text elsewhere (a line of the footer ...), when it is long enough not to hit something else
    if (old && old.length >= 8) code = code.split(inJson(old)).join(inJson(to))
    contact[key] = to
  }
  return { ...lib, code, content: { ...lib.content, contact } }
}

/** the address of the finished site as the person typed it, made safe: http(s) only, no query or fragment, no trailing slash; the placeholder when it is not an address */
export function safeSiteUrl(input: string | undefined, fallback: string): string {
  try {
    const url = new URL(String(input ?? '').trim())
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return fallback
    return `${url.origin}${url.pathname.replace(/\/+$/, '')}`
  } catch {
    return fallback
  }
}
export const xmlEscape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

