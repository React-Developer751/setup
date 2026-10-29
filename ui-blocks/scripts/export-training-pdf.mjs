// Turns training-prompts/ into two PDFs (content AI, image AI) with Chrome, so they can be handed over as documents.
//   node scripts/export-training-prompts.mjs && node scripts/export-training-pdf.mjs
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'training-prompts')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')
const rows = (p) => read(p).split('\n').filter(Boolean).map((l) => JSON.parse(l))
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const CSS = `body{font:11px/1.45 -apple-system,Helvetica,Arial,sans-serif;color:#1c1917;margin:0}h1{font-size:22px;margin:0 0 6px}h2{font-size:14px;margin:18px 0 4px;padding-top:8px;border-top:1px solid #d6d3d1}
h3{font-size:12px;margin:8px 0 2px}pre{white-space:pre-wrap;word-wrap:break-word;background:#f5f5f4;padding:8px;border-radius:6px;font:10px/1.4 Menlo,monospace;margin:4px 0}
.m{color:#78716c}li{margin:1px 0}ul{margin:2px 0 2px 16px;padding:0}@page{margin:14mm}.b{page-break-before:always}`
const html = (title, body) => `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>${CSS}</style></head><body>${body}</body></html>`

// ───────── content AI
const system = read('content-ai/system-prompt.md')
const content = rows('content-ai/prompts.jsonl')
const niches = content.filter((r) => !r.id.startsWith('theme:'))
const themes = content.filter((r) => r.id.startsWith('theme:'))
const block = (r) => `<h2>${esc(r.label)} <span class="m">(${esc(r.id)} · ${esc(r.theme)})</span></h2><h3>What people will type</h3><ul>${r.user_requests.map((u) => `<li>${esc(u)}</li>`).join('')}</ul><h3>Prompt</h3><pre>${esc(r.prompt)}</pre>`
write('Content-AI-training.pdf', 'Content AI training prompts', `<h1>Content AI: training prompts</h1><p class="m">${niches.length} business prompts + ${themes.length} business-type prompts. Give the system prompt first, then each prompt below. For Hinglish or Hindi variants: ask the same prompt with the request written in Hinglish ("mujhe ... ki website banakar do") or in Hindi, and ask for Hindi (Devanagari) text fields.</p>
<h2>1. System prompt (give this first)</h2><pre>${esc(system)}</pre>
<div class="b"></div><h2>2. Business prompts (${niches.length})</h2>${niches.map(block).join('')}
<div class="b"></div><h2>3. Business-type prompts (${themes.length}, for businesses with no pack of their own)</h2>${themes.map(block).join('')}`)

// ───────── image AI
const isystem = read('image-ai/system-prompt.md')
const STYLE = "friendly flat illustration, clean vector shapes, soft shading, one clear subject, rich but harmonious colours, no text, no letters, no logo, no watermark, no real brand, no real person's face"
const subject = (p) => p.replace(`. ${STYLE}.`, ' |').split(' | ')[0]
const inames = rows('image-ai/prompts.jsonl')
const ithemes = rows('image-ai/themes.jsonl')
const styles = rows('image-ai/design-styles.jsonl')
const iblock = (r) => `<h2>${esc(r.label)} <span class="m">(${esc(r.id)})</span></h2><p class="m">Palette: ${r.palettes.map((p) => `${esc(p.name)} (accent ${p.accent}, background ${p.background})`).join(' · ')}</p>
<ul>${r.slots.map((s) => `<li><b>${esc(s.slot)}</b> <span class="m">${s.size}</span>: ${esc(subject(s.prompt))}</li>`).join('')}</ul>`
write('Image-AI-training.pdf', 'Image AI training prompts', `<h1>Image AI: training prompts</h1><p class="m">${inames.length} businesses, ${inames.reduce((a, r) => a + r.slots.length, 0)} pictures. Every picture prompt below is the subject only: add the STYLE LINE (section 2) and the palette of its business to it, e.g. "&lt;subject&gt;, for a &lt;business&gt; website. &lt;STYLE LINE&gt;. Palette: accent #xxxxxx on #xxxxxx."</p>
<h2>1. System prompt (give this first)</h2><pre>${esc(isystem)}</pre>
<h2>2. STYLE LINE (add to every picture prompt)</h2><pre>${esc(STYLE)}</pre>
<h2>3. Design styles (combine with any picture to change its look)</h2><ul>${styles.map((s) => `<li><b>${esc(s.label)}</b> (${esc(s.id)}): ${esc(s.art_direction.replace(/ Use together[\s\S]*$/, ''))}</li>`).join('')}</ul>
<div class="b"></div><h2>4. Business pictures (${inames.length})</h2>${inames.map(iblock).join('')}
<div class="b"></div><h2>5. Business-type pictures (${ithemes.length}, for businesses with no pack of their own)</h2>${ithemes.map((r) => `<h2>${esc(r.label)}</h2><ul>${r.slots.map((s) => `<li><b>${esc(s.slot)}</b> <span class="m">${s.size}</span>: ${esc(subject(s.prompt))}</li>`).join('')}</ul>`).join('')}`)

function write(file, title, body) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-'))
  const page = path.join(tmp, 'doc.html')
  fs.writeFileSync(page, html(title, body))
  execFileSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${path.join(root, file)}`, `file://${page}`], { stdio: 'ignore' })
  console.log(file, `${(fs.statSync(path.join(root, file)).size / 1024).toFixed(0)} KB`)
}
