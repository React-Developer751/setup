// Audits a folder of converted components (src/components or a scratch copy): does each one compile and render, what does it need
// (images, a script, theme tokens) and which kind of page part it is. Usage: node scripts/audit-components.mjs <components dir> [--json out.json]
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const dir = path.resolve(process.argv[2] ?? 'src/components')
const jsonOut = process.argv.includes('--json') ? process.argv[process.argv.indexOf('--json') + 1] : undefined
const tmp = fs.mkdtempSync(path.join(path.resolve('node_modules/.cache'), 'audit-'))
fs.mkdirSync(tmp, { recursive: true })

const FAMILIES = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
const rows = []
for (const folder of fs.readdirSync(dir).sort()) {
  const full = path.join(dir, folder)
  if (!fs.statSync(full).isDirectory()) continue
  for (const file of fs.readdirSync(full).filter((f) => f.endsWith('.tsx')).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))) {
    const source = fs.readFileSync(path.join(full, file), 'utf8')
    const id = `${folder}/${file.replace(/\.tsx$/, '')}`
    const row = { id, folder, ok: false, error: '' }
    try {
      const out = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX }, reportDiagnostics: true })
      if (out.diagnostics?.length) throw new Error(ts.flattenDiagnosticMessageText(out.diagnostics[0].messageText, '\n'))
      const target = path.join(tmp, `${folder}__${file.replace(/\.tsx$/, '')}.mjs`)
      fs.writeFileSync(target, out.outputText.replace(/from "react\/jsx-runtime"/g, `from "${pathToFileURL(path.resolve('node_modules/react/jsx-runtime.js')).href}"`))
      const mod = await import(pathToFileURL(target).href)
      const html = renderToStaticMarkup(createElement(mod.default))
      row.ok = true
      row.html = html
    } catch (e) {
      row.error = String(e.message ?? e).split('\n')[0].slice(0, 160)
    }
    const html = row.html ?? ''
    const cls = [...source.matchAll(/className="([^"]*)"/g)].map((m) => m[1]).join(' ')
    row.bytes = source.length
    row.headings = (html.match(/<h[1-6]\b/g) ?? []).length
    row.images = (html.match(/<img\b/g) ?? []).length
    row.localAssets = [...source.matchAll(/(?:src|url\()=?\\?["']?([^"')\s]*(?:\.\.\/|\/assets\/)[^"')\s]*)/g)].map((m) => m[1]).slice(0, 3)
    row.remoteImages = (source.match(/https?:\/\/[^"')\s]+\.(?:png|jpe?g|webp|svg|gif)|https?:\/\/(?:images\.unsplash|source\.unsplash|picsum|via\.placeholder|placehold)[^"')\s]*/g) ?? []).length
    row.forms = (html.match(/<(?:input|textarea|select|form)\b/g) ?? []).length
    row.buttons = (html.match(/<button\b/g) ?? []).length
    row.links = (html.match(/<a\b/g) ?? []).length
    row.svgs = (html.match(/<svg\b/g) ?? []).length
    row.dark = /\bdark:/.test(cls)
    row.tokens = /\b(?:bg|text|border)-(?:layer|inverse|primary|background|foreground|muted-foreground|navbar|card|surface|line)\b|\b(?:bg|text|border)-(?:layer|primary)[-/]/.test(cls)
    row.families = [...new Set([...cls.matchAll(new RegExp(`\\b(?:bg|text|border|ring|from|to|via|fill|stroke|divide|outline|shadow|placeholder)-(${FAMILIES})-\\d`, 'g'))].map((m) => m[1]))]
    row.fixed = /\bfixed\b/.test(cls)
    row.words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter((w) => /[A-Za-z]{2}/.test(w)).length
    delete row.html
    rows.push(row)
  }
}
fs.rmSync(tmp, { recursive: true, force: true })
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(rows))
const by = {}
for (const r of rows) (by[r.folder] ??= []).push(r)
console.log('%s %s %s %s %s %s %s', 'folder'.padEnd(18), 'n'.padStart(3), 'ok'.padStart(3), 'img'.padStart(4), 'local'.padStart(5), 'dark'.padStart(4), 'tokens  families')
for (const [f, list] of Object.entries(by)) {
  const fam = {}
  for (const r of list) for (const x of r.families) fam[x] = (fam[x] ?? 0) + 1
  console.log('%s %s %s %s %s %s %s  %s', f.padEnd(18), String(list.length).padStart(3), String(list.filter((r) => r.ok).length).padStart(3), String(list.filter((r) => r.images).length).padStart(4), String(list.filter((r) => r.localAssets.length).length).padStart(5), String(list.filter((r) => r.dark).length).padStart(4), String(list.filter((r) => r.tokens).length).padStart(6), Object.entries(fam).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k}:${v}`).join(' '))
}
const bad = rows.filter((r) => !r.ok)
console.log(`\n${rows.length} components, ${rows.length - bad.length} render, ${bad.length} fail`)
for (const r of bad.slice(0, 40)) console.log(' ✗', r.id, '-', r.error)
