// Photos from Wikimedia Commons (free licences, no key): the search, the choice of what fits a business site, and the ranking by how well a photo's title,
// description and categories match what was asked. Used by server/index.mjs when there is no Pexels key.
const STOP = new Set(['the', 'and', 'for', 'with', 'from', 'shop', 'store', 'best', 'new', 'your', 'our', 'near', 'photo', 'photos', 'picture', 'pictures', 'image', 'images', 'website', 'site', 'called', 'named'])
const strip = (html) => String(html ?? '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim()
export const queryWords = (query) => [...new Set(String(query).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 3 && !STOP.has(w)))]
const FREE = /^(CC0|CC BY|CC BY-SA|Public domain|PD)/i
const NOT_A_PHOTO = /logo|map|diagram|icon|flag|screenshot|poster|cover|painting|drawing|stamp|coin|sketch|engraving|illustration|statue of|portrait of|passport|selfie/i

/** the photos of a Commons answer that suit a business site, the best matches first: big landscape JPEGs, a free licence (no NC / ND), at most two of one photographer */
export function rankCommons(found, query, limit = 9) {
  const words = queryWords(query)
  const need = Math.max(1, Math.ceil(words.length / 2))
  const seen = new Map()
  return Object.values(found?.query?.pages ?? {})
    .map((p) => ({ p, info: p.imageinfo?.[0] }))
    .filter(({ p, info }) => info && info.mime === 'image/jpeg' && info.width >= 1000 && info.height >= 600 && info.width > info.height && FREE.test(info.extmetadata?.LicenseShortName?.value ?? '') && !/-NC|-ND/i.test(info.extmetadata?.LicenseShortName?.value ?? '') && !NOT_A_PHOTO.test(p.title))
    .map(({ p, info }) => {
      const title = strip(p.title.replace(/^File:/, '').replace(/\.\w+$/, '')).toLowerCase()
      const text = `${strip(info.extmetadata?.ImageDescription?.value)} ${strip(info.extmetadata?.Categories?.value)}`.toLowerCase()
      const hit = (w) => (title.includes(w) ? 2 : text.includes(w) ? 1 : 0)
      const matched = words.filter((w) => hit(w) > 0).length
      const score = words.reduce((sum, w) => sum + hit(w), 0)
      return { p, info, matched, score, index: p.index ?? 0 }
    })
    .filter((x) => !words.length || x.matched >= need)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .filter(({ info }) => {
      const artist = strip(info.extmetadata?.Artist?.value) || 'unknown'
      seen.set(artist, (seen.get(artist) ?? 0) + 1)
      return seen.get(artist) <= 2
    })
    .slice(0, limit)
    .map(({ p, info }) => ({
      id: p.pageid,
      url: info.thumburl,
      thumb: String(info.thumburl).replace(/\/\d+px-/, '/400px-'),
      alt: strip(p.title.replace(/^File:/, '').replace(/\.\w+$/, '')).slice(0, 140),
      credit: `${strip(info.extmetadata?.Artist?.value).slice(0, 60) || 'Wikimedia Commons'} (${info.extmetadata?.LicenseShortName?.value})`,
      creditUrl: info.descriptionurl ?? '',
      pageUrl: info.descriptionurl ?? '',
    }))
}

async function ask(base, query, page, fetchImpl) {
  const api = new URL(`${base}/w/api.php`)
  for (const [k, v] of Object.entries({ action: 'query', format: 'json', generator: 'search', gsrnamespace: '6', gsrsearch: `${query} filetype:bitmap`, gsrlimit: '50', gsroffset: String((page - 1) * 50), prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiextmetadatafilter: 'LicenseShortName|Artist|ImageDescription|Categories', iiurlwidth: '1280' })) api.searchParams.set(k, v)
  const res = await fetchImpl(api, { headers: { 'user-agent': 'ui-blocks-website-generator/1.0 (local tool)' }, signal: AbortSignal.timeout(15_000) })
  if (!res.ok) throw new Error(`Commons answered ${res.status}`)
  return res.json()
}

/** photos for a search: the words as they are, then (when too few fit) the two longest words alone; undefined when Commons cannot be reached */
export async function searchCommons({ base, query, page = 1, fetchImpl = fetch }) {
  const first = rankCommons(await ask(base, query, page, fetchImpl), query)
  if (first.length >= 6) return first
  const words = queryWords(query).sort((a, b) => b.length - a.length).slice(0, 2)
  if (words.length < 2 || words.join(' ') === query.toLowerCase()) return first
  const second = rankCommons(await ask(base, words.join(' '), page, fetchImpl), words.join(' '))
  const ids = new Set(first.map((p) => p.id))
  return [...first, ...second.filter((p) => !ids.has(p.id))].slice(0, 9)
}
