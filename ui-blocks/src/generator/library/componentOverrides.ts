// A component file that a person changed in the Code tab: it is compiled in the browser (sucrase: no server, no network) and used in the preview and
// in the exports instead of the stored one. The components are plain functions that return markup, so their only import is React itself.
import * as React from 'react'
import * as jsxRuntime from 'react/jsx-runtime'
import type { ComponentType } from 'react'

const overrides = new Map<string, ComponentType>()

/** the changed components, by id ("contact/Contact6"); an empty map puts every stored component back */
export function setComponentOverrides(next: Map<string, ComponentType>) {
  overrides.clear()
  next.forEach((component, id) => overrides.set(id, component))
}

export const componentOverride = (id: string): ComponentType | undefined => overrides.get(id)

const MODULES: Record<string, unknown> = { react: React, 'react/jsx-runtime': jsxRuntime, 'react/jsx-dev-runtime': jsxRuntime }

/** the id of a component from the path of its file ("app/src/components/contact/Contact6.tsx" -> "contact/Contact6") */
export const componentIdOfPath = (path: string) => /(?:^|\/)src\/components\/([^/]+\/[^/]+)\.tsx$/.exec(path)?.[1]

/** a message a person can read for an error of the browser or the compiler */
const readable = (error: unknown) => (error instanceof Error ? error.message : String(error)).replace(/\s+/g, ' ').slice(0, 240)

/**
 * Compiles the text of a component file and loads it as a module made from a blob: the page keeps its strict content security policy (no `eval`,
 * no `new Function`), which only allows scripts of the page itself and of blobs. A file with a mistake (or one that cannot be drawn on its own) is not
 * used: the stored component stays in the preview and the message says why. The compiler is loaded when the first file is changed, not before.
 */
export async function compileComponent(source: string): Promise<{ component?: ComponentType; error?: string }> {
  const { compileSource, requiredModules } = await import('./componentCompile')
  const compiled = compileSource(source)
  if ('error' in compiled) return { error: compiled.error }
  const unknown = requiredModules(compiled.code).find((name) => !(name in MODULES))
  if (unknown) return { error: `The file imports "${unknown}", and only react can be imported in the preview.` }
  ;(globalThis as { __siteStudioModules?: Record<string, unknown> }).__siteStudioModules = MODULES
  const text = `const module = { exports: {} };\nconst exports = module.exports;\nconst require = (name) => globalThis.__siteStudioModules[name];\n${compiled.code}\nexport default module.exports.default;\n`
  const url = URL.createObjectURL(new Blob([text], { type: 'text/javascript' }))
  let component: unknown
  try {
    component = ((await import(/* @vite-ignore */ url)) as { default?: unknown }).default
  } catch (error) {
    return { error: `The file could not run: ${readable(error)}` }
  } finally {
    URL.revokeObjectURL(url)
  }
  if (typeof component !== 'function') return { error: 'The file must export a component with `export default function ...`.' }
  // drawn once on its own, as text (react-dom/server: no root, no flushSync, so it is safe at any moment): a component that throws while it is drawn
  // would take the whole preview with it
  try {
    const { renderToStaticMarkup } = await import('react-dom/server')
    renderToStaticMarkup(React.createElement(component as ComponentType))
  } catch (error) {
    return { error: `The component fails when it is drawn: ${readable(error)}` }
  }
  return { component: component as ComponentType }
}
