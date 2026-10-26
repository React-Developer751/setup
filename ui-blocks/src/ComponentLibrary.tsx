import { useEffect, useMemo, useState } from 'react'
import { generateWebsite } from './generator/generateWebsite'
import { Section, ThemeScope } from './generator/library/ThemeScope'
import type { Role } from './generator/library/libraryRoles'

// the part of a page each group of components plays, for the preview "in the style of a site" (the others stay as they are)
const ROLE_OF_GROUP: Record<string, Role> = {
  hero: 'hero', jumbotron: 'hero', features: 'features', card: 'features', blog: 'blog', contact: 'contact', forms: 'contact', content: 'about', cta: 'cta', banner: 'cta', footer: 'footer',
  gallery: 'gallery', portfolio: 'gallery', header: 'nav', navbar: 'nav', pricing: 'pricing', tables: 'pricing', statics: 'stats', step: 'steps', stepper: 'steps', team: 'team', teams: 'team', testimonial: 'testimonial',
}

type Block = { name: string; load: () => Promise<{ default: React.ComponentType }> }

// Only the names are known at start; the components of a category are loaded when the category is opened (there are more than five hundred).
const modules = import.meta.glob<{ default: React.ComponentType }>('./components/*/*.tsx')

const sortByNumber = (a: Block, b: Block) => Number(a.name.match(/\d+$/)?.[0]) - Number(b.name.match(/\d+$/)?.[0])

function ComponentLibrary() {
  const groups = useMemo(() => {
    const result: Record<string, Block[]> = {}
    for (const [path, load] of Object.entries(modules)) {
      const [, category, file] = path.match(/\.\/components\/([^/]+)\/([^/]+)\.tsx$/)!
      ;(result[category] ??= []).push({ name: file, load })
    }
    Object.values(result).forEach((list) => list.sort(sortByNumber))
    return result
  }, [])

  const categories = Object.keys(groups)
  const total = Object.values(groups).reduce((sum, list) => sum + list.length, 0)
  const [active, setActive] = useState(categories.includes('hero') ? 'hero' : categories[0])
  const [themed, setThemed] = useState(false)
  const [prompt, setPrompt] = useState('Create a website for a dental clinic called Smile Care in Pune')
  const site = useMemo(() => generateWebsite(prompt, 3), [prompt])
  const [loaded, setLoaded] = useState<{ category: string; items: { name: string; Component: React.ComponentType }[] }>()

  useEffect(() => {
    let alive = true
    void Promise.all(groups[active].map(async ({ name, load }) => ({ name, Component: (await load()).default }))).then((items) => {
      if (!alive) return
      setLoaded({ category: active, items })
      // Preline wires up collapse / dropdown behaviour for the header blocks.
      import('preline').then(({ HSStaticMethods }) => HSStaticMethods.autoInit()).catch(() => undefined)
    })
    return () => {
      alive = false
    }
  }, [active, groups])

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-[60] border-b border-gray-200 bg-white p-3">
        <p className="mb-2 text-xs text-gray-500">
          {total} components in {categories.length} groups
        </p>
        <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-gray-600">
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={themed} onChange={(e) => setThemed(e.target.checked)} />
            Show in the style of a site (colours, text and pictures of the generator)
          </label>
          {themed && <input value={prompt} onChange={(e) => setPrompt(e.target.value)} className="min-w-64 flex-1 rounded border border-gray-300 px-2 py-1" aria-label="Prompt of the preview site" />}
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActive(category)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize ${active === category ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {category} ({groups[category].length})
            </button>
          ))}
        </div>
      </div>

      {loaded?.category !== active ? (
        <p className="p-6 text-sm text-gray-500">Loading {active} ...</p>
      ) : (
        (() => {
          const role = ROLE_OF_GROUP[active]
          const blocks = loaded.items.map(({ name, Component }) => (
            <section key={name} className="border-b-4 border-dashed border-gray-300">
              <p className="bg-gray-50 px-4 py-1 text-xs font-semibold text-gray-500">{name}</p>
              {themed && role ? (
                <Section role={role}>
                  <Component />
                </Section>
              ) : (
                <Component />
              )}
            </section>
          ))
          return themed && role ? (
            <ThemeScope key={`${active}|${prompt}`} theme={site.themeKey} palette={site.palette} content={site.content}>
              {blocks}
            </ThemeScope>
          ) : (
            blocks
          )
        })()
      )}
    </div>
  )
}

export default ComponentLibrary
