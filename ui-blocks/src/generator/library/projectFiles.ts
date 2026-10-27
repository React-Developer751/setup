// The files a project made from the stored components needs besides the page and the components: the runtime around them (ThemeScope, the text filling,
// the colours, the pictures) and every file of the generator that these import. The files are found by following the imports, so the list
// cannot drift from the code. Used by the export (in the browser, files read by Vite) and by scripts/test-project.mjs (files read from disk).
export type ReadSource = (path: string) => Promise<string | undefined>

const EXTENSIONS = ['', '.ts', '.tsx', '.json', '/index.ts', '/index.tsx']
const dirOf = (path: string) => path.slice(0, path.lastIndexOf('/'))

/** "generator/library/../colorBrain" -> "generator/colorBrain" */
function normalise(path: string): string {
  const out: string[] = []
  for (const part of path.split('/')) {
    if (part === '..') out.pop()
    else if (part && part !== '.') out.push(part)
  }
  return out.join('/')
}

/** the imports that are used when the page runs (a type-only import is erased by the build, so it does not pull files in) */
export function runtimeImports(source: string): string[] {
  const found: string[] = []
  for (const match of source.matchAll(/^(?:import|export)(?!\s+type\b)[^;]*?from\s*['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/gm)) found.push(match[1] ?? match[2])
  return found
}

/** every file (path under src/, text) that `entries` need, and the packages they import */
export async function closureOf(entries: string[], read: ReadSource): Promise<{ files: Map<string, string>; packages: Set<string> }> {
  const files = new Map<string, string>()
  const packages = new Set<string>()
  const queue = [...entries]
  while (queue.length) {
    const path = queue.pop()!
    if (files.has(path)) continue
    const text = await read(path)
    if (text === undefined) continue
    files.set(path, text)
    if (path.endsWith('.json')) continue
    for (const spec of runtimeImports(text)) {
      if (!spec.startsWith('.')) {
        packages.add(spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0])
        continue
      }
      // `?raw` files are read as text by Vite: they are not a part of a project
      if (spec.includes('?')) continue
      for (const extension of EXTENSIONS) {
        const candidate = normalise(`${dirOf(path)}/${spec}${extension}`)
        if (files.has(candidate) || (await read(candidate)) !== undefined) {
          queue.push(candidate)
          break
        }
      }
    }
  }
  return { files, packages }
}
