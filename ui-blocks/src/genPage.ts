// A page with a navigation and one generated part, for the review page (GenReview) and the check (GenQa). The part is shown even when the page would not have that role (a one-page site has no pricing).
import { generateLibraryPage, type LibrarySection } from './generator/library/generateLibraryPage'

export function partPage(prompt: string, variation: number, role: string, id: string) {
  const lib = generateLibraryPage(prompt, variation, 'better', true, 'auto', undefined, false)
  const nav = lib.sections.filter((s) => s.role === 'nav')
  const own = lib.sections.find((s) => (s.role as string) === role)
  const part: LibrarySection = { ...(own ?? { role: role as LibrarySection['role'], page: '*' }), role: role as LibrarySection['role'], componentId: id, page: '*' }
  return { ...lib, sections: [...nav.map((s) => ({ ...s, page: '*' })), part] }
}
