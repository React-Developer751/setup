import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { type FileEdit, withEdits } from './codeEdits'
import { createZip, type ZipEntry } from './generator/zip'

// The Code tab: the files of the project in a folder tree on the left, the open file on the right with its own Copy and Download buttons at the top
// (and one button to download the whole project as a .zip). Nothing here calls out: the files are the ones the generator builds.

type Entry = { path: string; content: string | Uint8Array }
type Node = { name: string; path: string; folder: boolean; children: Node[] }

const isText = (e: Entry): e is { path: string; content: string } => typeof e.content === 'string'
const baseName = (path: string) => path.split('/').pop() ?? path
const extOf = (path: string) => (baseName(path).includes('.') ? baseName(path).split('.').pop()!.toLowerCase() : '')
const bytesOf = (e: Entry) => (isText(e) ? new TextEncoder().encode(e.content).length : e.content.length)
const sizeLabel = (n: number) => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`)

const MIME: Record<string, string> = { json: 'application/json', css: 'text/css', html: 'text/html', svg: 'image/svg+xml', md: 'text/markdown', txt: 'text/plain', xml: 'application/xml' }

function saveFile(name: string, data: string | Uint8Array<ArrayBuffer>, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function buildTree(entries: Entry[]): Node[] {
  const root: Node = { name: '', path: '', folder: true, children: [] }
  for (const entry of entries) {
    const parts = entry.path.split('/').filter(Boolean)
    let at = root
    parts.forEach((part, i) => {
      const path = parts.slice(0, i + 1).join('/')
      const last = i === parts.length - 1
      let next = at.children.find((c) => c.name === part && c.folder === !last)
      if (!next) {
        next = { name: part, path, folder: !last, children: [] }
        at.children.push(next)
      }
      at = next
    })
  }
  const order = (nodes: Node[]) => {
    nodes.sort((a, b) => (a.folder === b.folder ? a.name.localeCompare(b.name, undefined, { numeric: true }) : a.folder ? -1 : 1))
    nodes.forEach((n) => order(n.children))
  }
  order(root.children)
  return root.children
}

// ───────────── syntax colours (a small tokenizer: no library) ─────────────
type Token = { text: string; cls?: string }
const KEYWORDS = /^(?:import|export|from|default|const|let|var|function|return|if|else|for|while|switch|case|break|continue|new|class|extends|type|interface|as|async|await|try|catch|finally|throw|typeof|in|of|true|false|null|undefined|void|this|static|enum|readonly|satisfies)$/
const TS_RE = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\[\s\S])*`)|(\b\d[\d_.]*(?:e[+-]?\d+)?\b|#[0-9a-fA-F]{3,8}\b)|(<\/?[A-Za-z][\w.]*|\/?>)|([A-Za-z_$][\w$]*)(?=\s*\()|([A-Za-z_$][\w$]*)/g
const CSS_RE = /(\/\*[\s\S]*?\*\/)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*")|(#[0-9a-fA-F]{3,8}\b|\b\d[\d.]*(?:px|rem|em|%|vh|vw|ms|s|deg)?\b)|(--?[A-Za-z][\w-]*)(?=\s*:)|(@[\w-]+)|([.#][A-Za-z_-][\w-]*)/g
const HTML_RE = /(<!--[\s\S]*?-->)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(<\/?[A-Za-z][\w:-]*|\/?>)|([A-Za-z_:][\w:.-]*)(?==)/g
const JSON_RE = /("(?:[^"\\\n]|\\.)*")(\s*:)?|(-?\b\d[\d.eE+-]*\b)|\b(true|false|null)\b/g

function tokenize(code: string, lang: string): Token[] {
  const out: Token[] = []
  const push = (text: string, cls?: string) => text && out.push({ text, cls })
  let last = 0
  const run = (re: RegExp, map: (m: RegExpExecArray) => [string, string | undefined]) => {
    re.lastIndex = 0
    for (let m = re.exec(code); m; m = re.exec(code)) {
      push(code.slice(last, m.index))
      const [text, cls] = map(m)
      push(text, cls)
      last = m.index + m[0].length
    }
  }
  if (lang === 'json') {
    run(JSON_RE, (m) => (m[1] ? [m[0], m[2] ? 'k' : 's'] : m[3] ? [m[0], 'n'] : [m[0], 'w']))
  } else if (lang === 'css') {
    run(CSS_RE, (m) => [m[0], m[1] ? 'c' : m[2] ? 's' : m[3] ? 'n' : m[4] ? 'a' : m[5] ? 'w' : 't'])
  } else if (lang === 'html' || lang === 'svg' || lang === 'xml') {
    run(HTML_RE, (m) => [m[0], m[1] ? 'c' : m[2] ? 's' : m[3] ? 't' : 'a'])
  } else if (['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs'].includes(lang)) {
    run(TS_RE, (m) => [m[0], m[1] ? 'c' : m[2] ? 's' : m[3] ? 'n' : m[4] ? 't' : m[5] ? 'f' : KEYWORDS.test(m[6]) ? 'w' : /^[A-Z]/.test(m[6]) ? 'y' : undefined])
  } else {
    return [{ text: code }]
  }
  push(code.slice(last))
  return out
}

/** the tokens cut into lines (a comment or a template string that spans lines is cut at each line break) */
function toLines(tokens: Token[]): Token[][] {
  const lines: Token[][] = [[]]
  for (const token of tokens) {
    const parts = token.text.split('\n')
    parts.forEach((part, i) => {
      if (i > 0) lines.push([])
      if (part) lines[lines.length - 1].push({ text: part, cls: token.cls })
    })
  }
  return lines
}

const COLOUR: Record<string, string> = { c: '#6b7686', s: '#9ece6a', n: '#ff9e64', t: '#f7768e', f: '#7aa2f7', w: '#bb9af7', y: '#e0af68', k: '#7dcfff', a: '#73daca' }
const FILE_COLOUR: Record<string, string> = { tsx: '#4aa8ff', ts: '#4a90e2', jsx: '#4aa8ff', js: '#e6c34a', mjs: '#e6c34a', css: '#e879b9', json: '#e6c34a', html: '#f08a4b', svg: '#f08a4b', md: '#9ca3af', xml: '#9ca3af' }

const Chevron = ({ open }: { open: boolean }) => (
  <svg viewBox="0 0 24 24" className={`size-3.5 shrink-0 text-stone-500 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 6 6 6-6 6" />
  </svg>
)
const FolderIcon = ({ open }: { open: boolean }) => (
  <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill={open ? '#e6b450' : '#c99a3c'} aria-hidden="true">
    <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H9l2 2.5h7.5A2.5 2.5 0 0 1 21 9v8.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11Z" />
  </svg>
)
const FileIcon = ({ path }: { path: string }) => (
  <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke={FILE_COLOUR[extOf(path)] ?? '#9ca3af'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
    <path d="M14 3v5h5" />
  </svg>
)

const pickFirst = (entries: Entry[]) => {
  // the project sits in a folder of its own ("smile-care/src/App.tsx"): the main file is found by the end of its path
  const wanted = ['src/App.tsx', 'src/site/Layout.tsx', 'src/GeneratedLandingPage.tsx', 'App.tsx', 'GeneratedLandingPage.tsx', 'index.html']
  for (const w of wanted) {
    const hit = entries.find((e) => e.path === w || e.path.endsWith(`/${w}`))
    if (hit) return hit.path
  }
  return entries.find((e) => isText(e))?.path ?? entries[0]?.path
}

const ENGINE = /(^|\/)src\/(generator|data)\//

export function CodeView({ files, edits, loading, projectName, mainFile, onSave, onReset, onKeep, note, status }: {
  /** the generated files */
  files: Entry[]
  /** the files the person changed */
  edits: Record<string, FileEdit>
  loading?: boolean
  projectName: string
  /** the file that holds the words of the page: saving it changes the site as well */
  mainFile?: string
  onSave: (path: string, content: string, base: string) => void
  onReset: (path: string) => void
  /** "keep my version" after the site moved on */
  onKeep: (path: string, base: string) => void
  /** what the last save did to the site */
  note?: string
  /** for a component file the person saved: 'ok' when the preview uses it, or why it cannot (a mistake in the file) */
  status?: Record<string, string>
}) {
  const [selected, setSelected] = useState<string | undefined>()
  const [open, setOpen] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState('')
  const [copied, setCopied] = useState(false)
  const [zipping, setZipping] = useState(false)
  const [engine, setEngine] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [draft, setDraft] = useState<{ path: string; text: string } | undefined>()
  const scroller = useRef<HTMLDivElement>(null)

  const shown = useMemo(() => withEdits(files, edits), [files, edits])
  const visible = useMemo(() => (engine ? shown : shown.filter((f) => !ENGINE.test(f.path))), [shown, engine])
  const hidden = shown.length - visible.length
  const tree = useMemo(() => buildTree(visible), [visible])
  // when the files change (another site, another engine) the first file is opened and the folders on its way are opened
  const key = files.map((f) => f.path).join('|')
  useEffect(() => {
    const first = pickFirst(files)
    setSelected(first)
    setDraft(undefined)
    const folders = new Set<string>()
    if (first) first.split('/').slice(0, -1).forEach((_, i, parts) => folders.add(parts.slice(0, i + 1).join('/')))
    // the top folders are open, so the shape of the project is visible at once
    tree.filter((n) => n.folder).forEach((n) => folders.add(n.path))
    setOpen(folders)
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- only a different set of files resets the tree
  }, [key])

  const current = shown.find((f) => f.path === selected)
  const original = files.find((f) => f.path === selected)
  const lang = current ? extOf(current.path) : ''
  const saved = current && isText(current) ? current.content : undefined
  const editing = draft && draft.path === selected ? draft.text : undefined
  const text = editing ?? saved
  const dirty = editing !== undefined && editing !== saved
  const changed = !!(selected && edits[selected] && original && isText(original) && edits[selected].content !== original.content)
  // the site was changed (a chat message, another colour) after the person changed this file: their version is kept, and they choose
  const moved = !!(selected && changed && original && isText(original) && edits[selected].base !== original.content)
  const editedCount = shown.filter((f, i) => f !== files[i]).length
  const deferred = useDeferredValue(text)
  const lines = useMemo((): Token[][] => {
    if (deferred === undefined) return []
    // a very large file is shown without colours: the colours would take longer than reading it
    return deferred.length > 250_000 ? deferred.split('\n').map((t): Token[] => [{ text: t }]) : toLines(tokenize(deferred, lang))
  }, [deferred, lang])
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
  }, [selected])

  const save = () => {
    if (editing === undefined || !selected || !original || !isText(original)) return
    onSave(selected, editing, original.content)
    setDraft(undefined)
  }

  const copy = async () => {
    if (text === undefined) return
    let done = false
    try {
      await navigator.clipboard.writeText(text)
      done = true
    } catch {
      // the browser did not allow the clipboard here (no permission, an embedded frame): the old way, through a hidden text box
      const box = document.createElement('textarea')
      box.value = text
      box.setAttribute('readonly', '')
      box.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0'
      document.body.appendChild(box)
      box.select()
      try {
        done = document.execCommand('copy')
      } catch {
        done = false
      }
      box.remove()
    }
    setCopied(done)
    if (done) window.setTimeout(() => setCopied(false), 1500)
  }
  const download = () => current && saveFile(baseName(current.path), text ?? (current.content as Uint8Array<ArrayBuffer>), MIME[lang] ?? 'text/plain;charset=utf-8')
  const downloadAll = () => {
    setZipping(true)
    try {
      saveFile(`${projectName}.zip`, createZip(shown as ZipEntry[]), 'application/zip')
    } finally {
      setZipping(false)
    }
  }

  const matches = filter.trim() ? shown.filter((f) => f.path.toLowerCase().includes(filter.trim().toLowerCase())) : []
  const editedPaths = new Set(shown.filter((f, i) => f !== files[i]).map((f) => f.path))
  const row = (node: Node, depth: number): React.ReactNode => {
    const isOpen = open.has(node.path)
    const edited = !node.folder && editedPaths.has(node.path)
    return (
      <div key={node.path}>
        <button
          type="button"
          onClick={() => {
            if (node.folder) setOpen((cur) => { const next = new Set(cur); if (next.has(node.path)) next.delete(node.path); else next.add(node.path); return next })
            else {
              setSelected(node.path)
              setDrawer(false)
            }
          }}
          className={`flex w-full items-center gap-1.5 rounded-md py-1 pr-2 text-left text-[13px] ${!node.folder && selected === node.path ? 'bg-white/10 text-white' : 'text-stone-300 hover:bg-white/5'}`}
          style={{ paddingLeft: 8 + depth * 14 }}
          aria-expanded={node.folder ? isOpen : undefined}
        >
          {node.folder ? <Chevron open={isOpen} /> : <span className="size-3.5 shrink-0" />}
          {node.folder ? <FolderIcon open={isOpen} /> : <FileIcon path={node.path} />}
          <span className="truncate">{node.name}</span>
          {edited && <span className="ml-auto size-2 shrink-0 rounded-full bg-amber-400" title="You changed this file" aria-label="changed" />}
        </button>
        {node.folder && isOpen && node.children.map((child) => row(child, depth + 1))}
      </div>
    )
  }

  // a long path shows its last folders and the file name (the whole path is in the tooltip)
  const parts = current?.path.split('/') ?? []
  const crumbs = parts.length > 3 ? ['…', ...parts.slice(-3)] : parts
  const lineCount = text === undefined ? 0 : text.split('\n').length
  const mono = { fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace" }
  const btn = 'lv-btn rounded-lg bg-white/10 px-3 py-1.5 text-xs text-stone-100 hover:bg-white/20 disabled:opacity-40'

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#0d0f14] text-stone-200 md:flex-row">
      {/* ── on a small screen the files sit behind one button ── */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-[#11141b] px-3 py-2 md:hidden">
        <button type="button" onClick={() => setDrawer((v) => !v)} aria-expanded={drawer} className={btn}>
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h10" />
          </svg>
          Files
        </button>
        <span className="min-w-0 flex-1 truncate text-xs text-stone-400">{current ? baseName(current.path) : ''}</span>
        <button type="button" onClick={downloadAll} disabled={!shown.length || zipping} className={`${btn} !bg-violet-500/30`}>
          Export .zip
        </button>
      </div>

      {/* ── the folders and files ── */}
      <div className={`${drawer ? 'flex' : 'hidden'} max-h-[55vh] w-full shrink-0 flex-col border-b border-white/10 bg-[#11141b] md:flex md:max-h-none md:w-[280px] md:border-b-0 md:border-r`}>
        <div className="hidden flex-col gap-2 border-b border-white/10 p-3 md:flex">
          <button type="button" onClick={downloadAll} disabled={!shown.length || zipping} className="lv-btn lv-btn-primary w-full px-3 py-2 text-[13px]" title="Download the whole project as one .zip, with the changes you made here">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14" />
            </svg>
            Export project (.zip)
          </button>
          <p className="text-[11px] leading-snug text-stone-500">
            {shown.length} files{editedCount ? ` · ${editedCount} changed by you` : ''} · every file as you see it here
          </p>
        </div>
        <div className="px-2 pt-2">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search files"
            aria-label="Search files"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-stone-200 placeholder:text-stone-500 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2" role="tree" aria-label="Files of the project">
          {loading && !shown.length && <p className="px-2 py-3 text-xs text-stone-500">Building the files ...</p>}
          {filter.trim()
            ? matches.map((f) => (
                <button key={f.path} type="button" onClick={() => { setSelected(f.path); setDrawer(false) }} className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-[13px] ${selected === f.path ? 'bg-white/10 text-white' : 'text-stone-300 hover:bg-white/5'}`} title={f.path}>
                  <FileIcon path={f.path} />
                  <span className="truncate">{f.path}</span>
                  {editedPaths.has(f.path) && <span className="ml-auto size-2 shrink-0 rounded-full bg-amber-400" aria-label="changed" />}
                </button>
              ))
            : tree.map((n) => row(n, 0))}
          {filter.trim() && !matches.length && <p className="px-2 py-3 text-xs text-stone-500">No file has that name.</p>}
        </div>
        <label className="flex cursor-pointer items-center gap-2 border-t border-white/10 px-3 py-2 text-[11px] text-stone-400" title="The engine that builds the site (the generator and its data). The project needs them to run; they are in the .zip either way.">
          <input type="checkbox" checked={engine} onChange={(e) => setEngine(e.target.checked)} className="size-3.5 rounded border-white/20 bg-white/10" />
          Show engine files{hidden ? ` (${hidden} more)` : ''}
        </label>
      </div>

      {/* ── the open file: its path, then Save / Copy / Download, then the code you can change ── */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {current ? (
          <>
            <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-[#11141b] px-4 py-2">
              <div className="flex min-w-0 basis-full flex-wrap items-center gap-1 text-[13px] md:flex-1 md:basis-0 md:flex-nowrap" aria-label={`File ${current.path}`} title={current.path}>
                {crumbs.map((part, i) => (
                  <span key={i} className={`${i === crumbs.length - 1 ? 'min-w-0 truncate font-semibold text-white' : 'shrink-0 text-stone-500'}`}>
                    {i > 0 && <span className="px-1 text-stone-600">/</span>}
                    {part}
                  </span>
                ))}
                {(changed || dirty) && <span className="ml-2 shrink-0 rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-medium text-amber-300">{dirty ? 'unsaved' : 'changed by you'}</span>}
                <span className="ml-2 hidden shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-stone-400 xl:inline">
                  {lang || 'file'} · {sizeLabel(text === undefined ? bytesOf(current) : new TextEncoder().encode(text).length)}
                  {text !== undefined ? ` · ${lineCount} lines` : ''}
                </span>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {text !== undefined && (
                  <button type="button" onClick={save} disabled={!dirty} className={`lv-btn rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40 ${dirty ? 'bg-violet-500 hover:bg-violet-400' : 'bg-white/10'}`} title="Save your change (Ctrl or Cmd + S)">
                    Save
                  </button>
                )}
                {(dirty || changed) && (
                  <button type="button" onClick={() => { setDraft(undefined); if (changed && !dirty) onReset(current.path) }} className={btn} title={dirty ? 'Throw away what you typed since the last save' : 'Go back to the file the generator made'}>
                    {dirty ? 'Discard' : 'Reset file'}
                  </button>
                )}
                <button type="button" onClick={() => void copy()} disabled={text === undefined} className={btn} aria-live="polite">
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {copied ? <path d="m5 12 5 5 9-10" /> : <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h8" /></>}
                  </svg>
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button type="button" onClick={download} className={btn}>
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14" />
                  </svg>
                  Download
                </button>
              </div>
            </div>

            {moved && (
              <div role="status" className="flex flex-wrap items-center gap-2 border-b border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs text-amber-200">
                <span className="min-w-0 flex-1">The site changed after you edited this file. Your version is the one you see and the one that is downloaded.</span>
                <button type="button" onClick={() => original && isText(original) && onKeep(current.path, original.content)} className={btn}>
                  Keep mine
                </button>
                <button type="button" onClick={() => onReset(current.path)} className={btn}>
                  Use the new file
                </button>
              </div>
            )}
            {selected && status?.[selected] && status[selected] !== 'ok' && (
              <p role="alert" className="border-b border-red-400/25 bg-red-400/10 px-4 py-2 text-xs text-red-200">
                {status[selected]} The preview keeps the generated component; your text stays in this file and in the download.
              </p>
            )}
            {selected && status?.[selected] === 'ok' && (
              <p role="status" className="border-b border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-200">
                The preview uses your version of this component. The words in it are filled from the page (change them in the page file), the markup and the classes are yours.
              </p>
            )}
            {note && selected === mainFile && (
              <p role="status" className="border-b border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-200">
                {note}
              </p>
            )}

            <div ref={scroller} className="min-h-0 flex-1 overflow-auto">
              {text === undefined ? (
                <p className="p-6 text-sm text-stone-400">This is a binary file ({sizeLabel(bytesOf(current))}). Use Download to save it.</p>
              ) : (
                <div className="flex min-w-max py-3 text-[12.5px] leading-[1.65]" style={mono}>
                  <div aria-hidden="true" className="sticky left-0 z-10 w-12 shrink-0 select-none bg-[#0d0f14] pr-3 text-right text-stone-600">
                    {Array.from({ length: lineCount }, (_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>
                  {/* the coloured code is drawn under a see-through text box: what you type is what you see, with colours */}
                  <div className="relative min-w-0 flex-1">
                    <pre aria-hidden="true" className="m-0 whitespace-pre pr-6" style={mono}>
                      {lines.map((tokens, i) => (
                        <div key={i}>
                          {tokens.length ? tokens.map((t, j) => <span key={j} style={t.cls ? { color: COLOUR[t.cls] } : undefined}>{t.text}</span>) : ' '}
                        </div>
                      ))}
                    </pre>
                    <textarea
                      value={text}
                      onChange={(e) => setDraft({ path: current.path, text: e.target.value })}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
                          e.preventDefault()
                          save()
                        }
                        // Tab writes two spaces instead of leaving the box
                        if (e.key === 'Tab' && !e.shiftKey) {
                          e.preventDefault()
                          const box = e.currentTarget
                          const at = box.selectionStart
                          const next = `${box.value.slice(0, at)}  ${box.value.slice(box.selectionEnd)}`
                          setDraft({ path: current.path, text: next })
                          requestAnimationFrame(() => box.setSelectionRange(at + 2, at + 2))
                        }
                      }}
                      spellCheck={false}
                      wrap="off"
                      aria-label={`Edit ${current.path}`}
                      className="absolute inset-0 m-0 h-full w-full resize-none overflow-hidden whitespace-pre border-0 bg-transparent p-0 pr-6 text-transparent caret-white outline-none selection:bg-violet-500/40 focus:ring-0"
                      style={mono}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="p-6 text-sm text-stone-400">{loading ? 'Building the files ...' : 'Choose a file on the left.'}</p>
        )}
      </div>
    </div>
  )
}
