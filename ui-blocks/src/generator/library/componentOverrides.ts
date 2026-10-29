// A component file that a person changed in the Code tab: it is compiled in the browser (sucrase: no server, no network) and used in the preview and
// in the exports instead of the stored one. The components are plain functions that return markup, so their only import is React itself.
import * as React from 'react'
import * as jsxRuntime from 'react/jsx-runtime'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { transform } from 'sucrase'
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

/** a message a person can read for an error of the compiler ("Unexpected token (12:5)") */
const readable = (error: unknown) => (error instanceof Error ? error.message : String(error)).replace(/\s+/g, ' ').slice(0, 240)

/**
 * Compiles the text of a component file. A file with a mistake (or one that cannot be drawn on its own) is not used: the stored component stays in
 * the preview and the message says why.
 */
export function compileComponent(source: string): { component?: ComponentType; error?: string } {
  let code: string
  try {
    code = transform(source, { transforms: ['typescript', 'jsx', 'imports'], jsxRuntime: 'automatic', production: true }).code
  } catch (error) {
    return { error: `The file has a mistake: ${readable(error)}` }
  }
  let component: unknown
  try {
    const module = { exports: {} as { default?: unknown } }
    const require = (name: string) => {
      if (name in MODULES) return MODULES[name]
      throw new Error(`the file imports "${name}", and only react can be imported in the preview`)
    }
    new Function('require', 'exports', 'module', code)(require, module.exports, module)
    component = module.exports.default
  } catch (error) {
    return { error: `The file could not run: ${readable(error)}` }
  }
  if (typeof component !== 'function') return { error: 'The file must export a component with `export default function ...`.' }
  // drawn once on its own: a component that throws while it is drawn would take the whole preview with it
  const host = document.createElement('div')
  const root = createRoot(host)
  try {
    flushSync(() => root.render(React.createElement(component as ComponentType)))
  } catch (error) {
    return { error: `The component fails when it is drawn: ${readable(error)}` }
  } finally {
    root.unmount()
  }
  return { component: component as ComponentType }
}
