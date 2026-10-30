// Draws a hero tree (heroTree.ts) with React, and prints it as the text of a component file. One tree, two outputs, so the code a person sees is exactly what is drawn.
import { createElement, type ComponentType, type ReactNode } from 'react'
import { heroTree, type Node } from './heroTree'
import { specOfId, type HeroSpec } from './heroSpec'

const hashOf = (id: string) => [...id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7).toString(36)
/** the scoped class of a hero (one hero per page, but two on one screen - the gallery of the review page - must not share rules) */
export const classOf = (id: string) => `gh${hashOf(id)}`

function toReact(node: Node | string, key?: number): ReactNode {
  if (typeof node === 'string') return node
  const props: Record<string, unknown> = { key }
  for (const [k, v] of Object.entries(node.props)) {
    if (k === 'className' && v === '') continue
    props[k] = v
  }
  return createElement(node.tag, props, ...node.children.map((c, i) => toReact(c, i)))
}

const cache = new Map<string, ComponentType>()

/** the component of a generated hero id (the same function each time, so React keeps it between draws); undefined for an id that is not one */
export function generatedHero(id: string): ComponentType | undefined {
  const hit = cache.get(id)
  if (hit) return hit
  const spec = specOfId(id)
  if (!spec) return undefined
  const tree = heroTree(spec, classOf(id))
  const Component: ComponentType = () => toReact(tree) as never
  Component.displayName = `Generated${id.replace(/\W/g, '')}`
  cache.set(id, Component)
  return Component
}

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')

function toTsx(node: Node | string, depth: number): string {
  const pad = '  '.repeat(depth)
  if (typeof node === 'string') return `${pad}${node.replace(/[{}<>]/g, (c) => `{'${c}'}`)}`
  if (node.tag === 'style') return `${pad}<style>{\`${esc(String(node.children[0]))}\`}</style>`
  const attrs = Object.entries(node.props)
    .filter(([k, v]) => !(k === 'className' && v === ''))
    .map(([k, v]) => (typeof v === 'object' ? `${k}={${JSON.stringify(v)}}` : typeof v === 'number' ? `${k}={${v}}` : `${k}="${String(v).replace(/"/g, '&quot;')}"`))
  const open = `${pad}<${node.tag}${attrs.length ? ` ${attrs.join(' ')}` : ''}`
  if (!node.children.length) return `${open} />`
  if (node.children.length === 1 && typeof node.children[0] === 'string') return `${open}>${toTsx(node.children[0], 0).trim()}</${node.tag}>`
  return `${open}>\n${node.children.map((c) => toTsx(c, depth + 1)).join('\n')}\n${pad}</${node.tag}>`
}

/** the text of the component file of a generated hero (what the Code tab shows and the project export holds) */
export function generatedHeroSource(id: string): string | undefined {
  const spec = specOfId(id)
  if (!spec) return undefined
  const name = `Hero${hashOf(id)}`
  return `// A first screen made by the design generator from this description: ${JSON.stringify(spec)}\n// The look is the <style> below (the page's colour variables, no other class): change it freely.\nexport default function ${name}() {\n  return (\n${toTsx(heroTree(spec, classOf(id)), 2)}\n  )\n}\n`
}

export const specOfHeroId = (id: string): HeroSpec | undefined => specOfId(id)
export const isGeneratedId = (id: string) => id.startsWith('gen/')
