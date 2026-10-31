// The demo app of a site: register, log in, a dashboard and the pages of the business with example data. Plain DOM code with no backend: people, sessions and rows live in this browser (localStorage).
// The same text runs in the preview and, turned into plain JavaScript (scripts/gen-runtime.mjs), in the exports. It is a demo: it keeps nobody out, and the pages say so.

export type AppColumn = { key: string; label: string; type: 'text' | 'number' | 'money' | 'date' | 'status'; options?: string[] }
export type AppKpi = { label: string; note: string; calc: { table: string; kind: 'count' | 'status' | 'sum' | 'fixed'; column?: string; value?: string } }
export type AppTable = { id: string; label: string; title: string; singular: string; icon: string; columns: AppColumn[]; rows: Record<string, string>[] }
export type AppConfig = {
  brand: string
  slug: string
  /** the symbol of the money of the page ("₹", "$") */
  currency: string
  kpis: AppKpi[]
  /** the charts of the first page: `table` is a page, `kind` how it is drawn (by status, rows per month, a sum per month) */
  charts: { title: string; table: string; kind: 'status' | 'month' | 'sumMonth'; column?: string; sumColumn?: string }[]
  /** the Insights page (a summary of every page) is there unless it was taken out */
  insights: boolean
  tables: AppTable[]
}

const ICONS: Record<string, string> = {
  home: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  users: 'M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0zM4 21a8 8 0 0 1 16 0',
  calendar: 'M4 7h16v13H4zM4 11h16M8 3v4M16 3v4',
  money: 'M3 7h18v10H3zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  box: 'M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8',
  chat: 'M4 5h16v11H9l-5 4z',
  chart: 'M4 20V10M10 20V4M16 20v-8M22 20H2',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  cog: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19 12l2-1-2-4-2 1-2-1-1-2h-4l-1 2-2 1-2-1-2 4 2 1v2l-2 1 2 4 2-1 2 1 1 2h4l1-2 2-1 2 1 2-4-2-1z',
}
const icon = (name: string) => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONS[name] ?? ICONS.list}"/></svg>`

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)
const NEEDS_SESSION = /^#\/app/

const CSS = `
.ap{position:fixed;inset:0;z-index:99999;overflow:auto;font-family:inherit;font-size:15px;line-height:1.45;background:var(--ap-bg,#fff);color:var(--ap-fg,#111)}
.ap *{box-sizing:border-box}
.ap[hidden]{display:none}
.ap a{color:inherit}
.ap button,.ap input,.ap select{font:inherit}
.ap-card{background:color-mix(in srgb,currentColor 5%,transparent);border:1px solid color-mix(in srgb,currentColor 14%,transparent);border-radius:14px}
.ap-auth{min-height:100%;display:grid;place-items:center;padding:24px}
.ap-auth .ap-card{width:min(420px,100%);padding:28px}
.ap h1,.ap h2,.ap h3{margin:0;line-height:1.2}
.ap-field{display:grid;gap:6px;margin:14px 0}
.ap-field span{font-size:13px;opacity:.75}
.ap-in{width:100%;padding:10px 12px;border-radius:10px;border:1px solid color-mix(in srgb,currentColor 25%,transparent);background:transparent;color:inherit}
.ap-in:focus{outline:2px solid var(--g-accent,#4f46e5);outline-offset:1px}
.ap-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 16px;border-radius:10px;border:1px solid transparent;background:var(--g-accent,#4f46e5);color:var(--g-on-accent,#fff);font-weight:600;cursor:pointer}
.ap-btn.ghost{background:transparent;color:inherit;border-color:color-mix(in srgb,currentColor 25%,transparent)}
.ap-btn.sm{padding:6px 10px;font-size:13px}
.ap-btn.full{width:100%}
.ap-err{color:#dc2626;font-size:13px;min-height:18px}
.ap-note{font-size:12px;opacity:.65;margin-top:14px}
.ap-link{background:none;border:0;padding:0;color:var(--g-accent,#4f46e5);cursor:pointer;text-decoration:underline}
.ap-shell{display:grid;grid-template-columns:240px 1fr;min-height:100%}
.ap-side{padding:18px 12px;border-right:1px solid color-mix(in srgb,currentColor 14%,transparent);position:sticky;top:0;height:100vh;overflow:auto}
.ap-brand{font-weight:700;font-size:17px;padding:6px 10px 16px}
.ap-nav a{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:9px;text-decoration:none;margin-bottom:2px;opacity:.85}
.ap-nav a:hover{background:color-mix(in srgb,currentColor 8%,transparent)}
.ap-nav a.on{background:var(--g-accent,#4f46e5);color:var(--g-on-accent,#fff);opacity:1}
.ap-main{min-width:0}
.ap-top{display:flex;align-items:center;gap:12px;padding:12px 24px;border-bottom:1px solid color-mix(in srgb,currentColor 14%,transparent);position:sticky;top:0;background:var(--ap-bg,#fff);z-index:2}
.ap-top .sp{flex:1}
.ap-burger{display:none}
.ap-body{padding:24px;display:grid;gap:20px}
.ap-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px}
.ap-kpi{padding:16px}
.ap-kpi b{display:block;font-size:26px;margin:4px 0}
.ap-kpi small{opacity:.65}
.ap-panel{padding:18px}
.ap-tools{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px}
.ap-tools .ap-in{max-width:280px}
.ap-wrap{overflow:auto}
.ap table{width:100%;border-collapse:collapse;min-width:560px}
.ap th,.ap td{text-align:left;padding:10px 12px;border-bottom:1px solid color-mix(in srgb,currentColor 12%,transparent);white-space:nowrap}
.ap th{font-size:12px;text-transform:uppercase;letter-spacing:.05em;opacity:.7;cursor:pointer;user-select:none}
.ap-badge{display:inline-block;padding:2px 10px;border-radius:99px;font-size:12px;font-weight:600;background:color-mix(in srgb,var(--g-accent,#4f46e5) 18%,transparent)}
.ap-badge.b1{background:rgba(22,163,74,.18);color:#15803d}.ap-badge.b2{background:rgba(217,119,6,.2);color:#b45309}.ap-badge.b3{background:rgba(220,38,38,.18);color:#b91c1c}
.ap-empty{padding:28px;text-align:center;opacity:.65}
.ap-modal{position:fixed;inset:0;background:rgba(0,0,0,.45);display:grid;place-items:center;z-index:3;padding:16px}
.ap-modal .ap-card{width:min(460px,100%);padding:22px;background:var(--ap-bg,#fff);max-height:90vh;overflow:auto}
.ap-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:16px}
.ap-demo{font-size:12px;padding:6px 24px;background:color-mix(in srgb,var(--g-accent,#4f46e5) 14%,transparent);text-align:center}
.ap-bars{display:flex;align-items:flex-end;gap:10px;height:170px;padding-top:8px}
.ap-bars div{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;font-size:11px;gap:4px}
.ap-bars i{display:block;width:100%;border-radius:6px 6px 0 0;background:var(--g-accent,#4f46e5);min-height:3px}
.ap-two{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:20px}.ap-two>*,.ap-body>*,.ap-kpis>*{min-width:0}.ap-body{min-width:0}
@media(max-width:860px){.ap-shell{grid-template-columns:1fr}.ap-side{position:fixed;left:0;top:0;width:250px;z-index:4;background:var(--ap-bg,#fff);transform:translateX(-100%);transition:transform .2s}.ap-shell.open .ap-side{transform:none}.ap-burger{display:inline-flex}.ap-two{grid-template-columns:1fr}.ap-body{padding:16px}}
`

// ── figures that follow the data: they are worked out from the rows every time, so a row added, changed, deleted or imported changes them at once
export type Data = Record<string, Record<string, string>[]>
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const toNumber = (v: unknown) => parseFloat(String(v ?? '').replace(/[^\d.-]/g, '')) || 0
const moneyText = (n: number, cur: string) => `${cur}${Math.round(n).toLocaleString(cur === '₹' ? 'en-IN' : 'en-US')}`

/** the number a figure stands for: rows counted, rows with a status counted, or a money column added up */
export function calcKpi(kpi: AppKpi, data: Data, cur: string): string {
  const rows = data[kpi.calc.table] ?? []
  if (kpi.calc.kind === 'fixed') return kpi.calc.value ?? ''
  if (kpi.calc.kind === 'sum') return moneyText(rows.reduce((t, r) => t + toNumber(r[kpi.calc.column ?? '']), 0), cur)
  if (kpi.calc.kind === 'status') return String(rows.filter((r) => r[kpi.calc.column ?? ''] === kpi.calc.value).length)
  return String(rows.length)
}

/** the rows of a table grouped by a status column, the statuses of the column first, in their order */
export function byStatus(table: AppTable, rows: Record<string, string>[]): { label: string; n: number }[] {
  const col = table.columns.find((c) => c.type === 'status')
  if (!col) return []
  const counts = new Map<string, number>((col.options ?? []).map((o) => [o, 0]))
  rows.forEach((r) => {
    const v = r[col.key]
    if (v) counts.set(v, (counts.get(v) ?? 0) + 1)
  })
  return [...counts].map(([label, n]) => ({ label, n }))
}

/** the months up to this one (six unless said): rows counted by the month of a date column, or a money column added up by month */
export function byMonth(rows: Record<string, string>[], dateKey: string, sumKey: string | undefined, now: Date, count = 6): { label: string; value: number }[] {
  const months = Array.from({ length: count }, (_, i) => new Date(now.getFullYear(), now.getMonth() - (count - 1) + i, 1))
  return months.map((m) => ({
    label: count > 12 ? `${MON[m.getMonth()]} ${String(m.getFullYear()).slice(2)}` : MON[m.getMonth()],
    value: rows.filter((r) => /^\d{4}-\d{2}/.test(r[dateKey] ?? '') && r[dateKey].slice(0, 7) === `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`).reduce((t, r) => t + (sumKey ? toNumber(r[sumKey]) : 1), 0),
  }))
}

/** where the months of a chart end: this month, or a later one when rows are dated ahead (appointments, due dates), at most three months on */
export function windowEnd(rows: Record<string, string>[], dateKey: string, now: Date): Date {
  const limit = new Date(now.getFullYear(), now.getMonth() + 3, 28)
  let end = now
  rows.forEach((r) => {
    const v = r[dateKey]
    if (/^\d{4}-\d{2}-\d{2}$/.test(v ?? '')) {
      const d = new Date(`${v}T12:00:00`)
      if (d > end && d <= limit) end = d
    }
  })
  return end
}

/**
 * A backup of this site, or of another one built for the same kind of business: the pages that have the same name are filled (the columns they share), the others are left alone.
 * `matched` is empty when nothing fits, then nothing is restored.
 */
export function matchBackup(tables: AppTable[], saved: { app?: string; tables?: Data }, slug: string): { matched: { id: string; rows: Record<string, string>[] }[]; foreign: boolean } {
  const data = saved && typeof saved === 'object' && saved.tables && typeof saved.tables === 'object' ? saved.tables : {}
  const matched = tables.flatMap((t) => {
    const rows = (data as Data)[t.id]
    return Array.isArray(rows) && rows.every((r) => r && typeof r === 'object') ? [{ id: t.id, rows }] : []
  })
  return { matched, foreign: !!saved?.app && saved.app !== slug }
}

/** a date as a year-month-day, from "12/03/2026", "12-3-26", "12 Mar 2026", "March 12, 2026" or already "2026-03-12"; what cannot be read is left as it is */
export function normalizeDate(v: string): string {
  const s = v.trim()
  if (!s || /^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const pad = (n: number | string) => String(n).padStart(2, '0')
  const year = (y: string) => (y.length === 2 ? `20${y}` : y)
  let m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/)
  if (m) return Number(m[2]) > 12 ? `${year(m[3])}-${pad(m[1])}-${pad(m[2])}` : `${year(m[3])}-${pad(m[2])}-${pad(m[1])}`
  m = s.match(/^(\d{4})[/.](\d{1,2})[/.](\d{1,2})$/)
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`
  m = s.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})$/) ?? s.match(/^([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})$/)
  if (m) {
    const named = /^\d/.test(m[1]) ? m[2] : m[1]
    const day = /^\d/.test(m[1]) ? m[1] : m[2]
    const at = MON.findIndex((x) => named.toLowerCase().startsWith(x.toLowerCase()))
    if (at >= 0) return `${m[3]}-${pad(at + 1)}-${pad(day)}`
  }
  return s
}

/** money as the page writes it: "1200", "Rs. 1,200", "₹1200/-", "1.5k" all become "₹1,200"; text that is not a sum is left as it is */
export function normalizeMoney(v: string, cur: string): string {
  const s = v.trim()
  if (!s) return s
  const m = s.match(/^(?:rs\.?|inr|₹|\$|£|€|usd)?\s*(-?[\d,]*\.?\d+)\s*([kKlL]|lakh|lac)?\s*(?:\/-|only)?$/i)
  if (!m) return s
  let n = parseFloat(m[1].replace(/,/g, ''))
  if (m[2]) n *= /^k$/i.test(m[2]) ? 1000 : 100000
  return Number.isFinite(n) ? moneyText(n, cur) : s
}

/** what is wrong with a row, in words; '' when it is fine */
export function checkRow(table: AppTable, row: Record<string, string>): string {
  const first = table.columns[0]
  if (first && !String(row[first.key] ?? '').trim()) return `${first.label} is needed.`
  for (const c of table.columns) {
    const v = String(row[c.key] ?? '').trim()
    if (!v) continue
    if (c.type === 'number' && !/^-?\d+(?:\.\d+)?$/.test(v)) return `${c.label} must be a number.`
    if (c.type === 'money' && !/\d/.test(v)) return `${c.label} must be an amount.`
    if (c.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${c.label} must be a date (for example 2026-03-12).`
    if (c.key === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return `${c.label} must be an e-mail address.`
  }
  return ''
}

/** a row as the table keeps it: dates and sums written the one way */
export function tidyRow(table: AppTable, row: Record<string, string>, cur: string): Record<string, string> {
  return Object.fromEntries(table.columns.map((c) => {
    const v = String(row[c.key] ?? '').trim()
    return [c.key, c.type === 'date' ? normalizeDate(v) : c.type === 'money' ? normalizeMoney(v, cur) : v]
  }))
}

/** the rows of a file that are not in the table already (the same in every column): those are skipped, and so are the repeats inside the file */
export function freshRows(table: AppTable, have: Record<string, string>[], incoming: Record<string, string>[]): { fresh: Record<string, string>[]; skipped: number } {
  const key = (r: Record<string, string>) => table.columns.map((c) => String(r[c.key] ?? '').trim().toLowerCase()).join('\u0001')
  const seen = new Set(have.map(key))
  const fresh: Record<string, string>[] = []
  incoming.forEach((r) => {
    const k = key(r)
    if (!seen.has(k)) {
      seen.add(k)
      fresh.push(r)
    }
  })
  return { fresh, skipped: incoming.length - fresh.length }
}

/** the rows of a CSV text ("a,b" or "a;b", quotes, doubled quotes, line breaks inside quotes) */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, '')
  const first = clean.split(/\r?\n/, 1)[0] ?? ''
  const sep = (first.match(/;/g) ?? []).length > (first.match(/,/g) ?? []).length ? ';' : first.includes('\t') ? '\t' : ','
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i]
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') {
        cell += '"'
        i += 1
      } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === sep) {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i += 1
      row.push(cell)
      cell = ''
      if (row.some((x) => x.trim())) rows.push(row)
      row = []
    } else cell += ch
  }
  row.push(cell)
  if (row.some((x) => x.trim())) rows.push(row)
  return rows
}

/** the rows of a table as CSV text (the first line holds the names of the columns) */
export function toCsv(columns: AppColumn[], rows: Record<string, string>[]): string {
  const q = (v: string) => (/[",;\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  return [columns.map((c) => q(c.label)).join(','), ...rows.map((r) => columns.map((c) => q(String(r[c.key] ?? ''))).join(','))].join('\r\n')
}

/** CSV rows into rows of a table: a first line that names the columns maps them by name, else the columns are taken in order */
export function csvToRows(table: AppTable, data: string[][]): { rows: Record<string, string>[]; mapped: number } {
  if (!data.length) return { rows: [], mapped: 0 }
  const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, '')
  const head = data[0].map(norm)
  const at = table.columns.map((c) => head.findIndex((h) => h && (h === norm(c.label) || h === norm(c.key))))
  const named = at.some((i) => i >= 0)
  const body = named ? data.slice(1) : data
  const order = named ? at : table.columns.map((_, i) => (i < data[0].length ? i : -1))
  const rows = body.slice(0, 500).map((cells) => Object.fromEntries(table.columns.map((c, n) => [c.key, order[n] >= 0 ? String(cells[order[n]] ?? '').trim() : ''])))
  return { rows: rows.filter((r) => Object.values(r).some(Boolean)), mapped: order.filter((i) => i >= 0).length }
}

export function initApp(cfg: AppConfig): void {
  if (typeof document === 'undefined' || document.querySelector('.ap')) return
  const K = (name: string) => `ap:${cfg.slug}:${name}`
  const read = <T,>(key: string, fallback: T): T => {
    try {
      const v = localStorage.getItem(key)
      return v ? (JSON.parse(v) as T) : fallback
    } catch {
      return fallback
    }
  }
  const write = (key: string, value: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* private mode: the demo keeps working for this visit only */
    }
  }
  type User = { name: string; email: string; hash: string }
  const users = () => read<User[]>(K('users'), [])
  const session = () => read<{ email: string } | null>(K('session'), null)
  const rowsOf = (t: AppTable) => read<Record<string, string>[]>(K(`t:${t.id}`), t.rows)
  const hash = async (text: string) => {
    try {
      const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${cfg.slug}|${text}`))
      return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')
    } catch {
      return btoa(unescape(encodeURIComponent(`${cfg.slug}|${text}`)))
    }
  }

  const host = document.querySelector<HTMLElement>('[data-gen-theme]') ?? document.body
  const root = document.createElement('div')
  root.className = 'ap'
  root.hidden = true
  const style = document.createElement('style')
  style.textContent = CSS
  root.appendChild(style)
  const view = document.createElement('div')
  view.style.minHeight = '100%'
  root.appendChild(view)
  host.appendChild(root)

  // the colours of the page: the app takes the page's own background and ink, so it is dark where the page is dark
  const paint = () => {
    const cs = getComputedStyle(host)
    const bg = cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' ? cs.backgroundColor : getComputedStyle(document.body).backgroundColor || '#fff'
    root.style.setProperty('--ap-bg', bg)
    root.style.setProperty('--ap-fg', cs.color || '#111')
  }

  // a way in from the site: the menu bar gets "Log in" (or "Dashboard" when someone is in)
  const linkIn = () => {
    const nav = document.querySelector<HTMLElement>('header nav, nav')
    if (!nav) return
    let a = nav.querySelector<HTMLAnchorElement>('a[data-ap-link]')
    if (!a) {
      a = document.createElement('a')
      a.setAttribute('data-ap-link', '')
      a.style.cssText = 'margin-left:14px;font-weight:600;text-decoration:none'
      nav.appendChild(a)
    }
    a.href = session() ? '#/app' : '#/login'
    a.textContent = session() ? 'Dashboard' : 'Log in'
  }

  const go = (hashValue: string) => {
    location.hash = hashValue
  }
  const page = () => (location.hash || '#/').replace(/\/+$/, '') || '#/'
  let sort: { key: string; dir: 1 | -1 } | null = null
  let query = ''
  let flash = ''
  let statusFilter = ''
  let notice = ''
  let pageNo = 0
  let range = 6
  const PER_PAGE = 25

  const authView = (kind: 'login' | 'register' | 'forgot') => {
    const title = kind === 'login' ? 'Welcome back' : kind === 'register' ? 'Create your account' : 'Reset your password'
    view.innerHTML = `<div class="ap-auth"><div class="ap-card"><h1 style="font-size:24px">${esc(title)}</h1><p style="opacity:.7;margin:6px 0 0">${esc(cfg.brand)}</p>
      <form novalidate>${kind === 'register' ? '<label class="ap-field"><span>Your name</span><input class="ap-in" name="name" autocomplete="name" /></label>' : ''}
      <label class="ap-field"><span>Email</span><input class="ap-in" name="email" type="email" autocomplete="email" /></label>
      ${kind === 'forgot' ? '' : '<label class="ap-field"><span>Password</span><input class="ap-in" name="password" type="password" autocomplete="' + (kind === 'login' ? 'current-password' : 'new-password') + '" /></label>'}
      ${kind === 'register' ? '<label class="ap-field"><span>Repeat the password</span><input class="ap-in" name="again" type="password" autocomplete="new-password" /></label>' : ''}
      <div class="ap-err" role="alert">${esc(flash)}</div>
      <button class="ap-btn full" type="submit">${kind === 'login' ? 'Log in' : kind === 'register' ? 'Create account' : 'Send reset link'}</button></form>
      <p class="ap-note">${kind === 'login' ? 'No account? <a href="#/register">Create one</a> · <a href="#/forgot">Forgot password?</a>' : kind === 'register' ? 'Already have an account? <a href="#/login">Log in</a>' : '<a href="#/login">Back to log in</a>'}</p>
      <p class="ap-note">Demo: accounts and data stay in this browser only. <a href="#/">Back to the site</a></p></div></div>`
    flash = ''
    const form = view.querySelector('form') as HTMLFormElement
    form.addEventListener('submit', async (event) => {
      event.preventDefault()
      const f = new FormData(form)
      const email = String(f.get('email') ?? '').trim().toLowerCase()
      const password = String(f.get('password') ?? '')
      const fail = (text: string) => {
        const box = view.querySelector('.ap-err')
        if (box) box.textContent = text
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail('Write a valid email, like you@example.com.')
      if (kind === 'forgot') {
        flash = ''
        view.querySelector('.ap-card')!.insertAdjacentHTML('beforeend', '<p class="ap-note" style="opacity:1">This is a demo: no e-mail is sent. Create a new account, or use "Reset demo data" in Settings after logging in.</p>')
        return
      }
      if (password.length < 6) return fail('The password needs at least 6 characters.')
      const list = users()
      if (kind === 'register') {
        const name = String(f.get('name') ?? '').trim()
        if (name.length < 2) return fail('Write your name.')
        if (password !== String(f.get('again') ?? '')) return fail('The two passwords are not the same.')
        if (list.some((u) => u.email === email)) return fail('There is an account with this email: log in instead.')
        write(K('users'), [...list, { name, email, hash: await hash(password) }])
      } else {
        const user = list.find((u) => u.email === email)
        if (!user) return fail('No account with this email. Create one first.')
        if (user.hash !== (await hash(password))) return fail('The password is not right.')
      }
      write(K('session'), { email })
      linkIn()
      go('#/app')
    })
  }

  const badgeClass = (col: AppColumn, value: string) => {
    const i = (col.options ?? []).indexOf(value)
    return i <= 0 ? '' : i === 1 ? 'b1' : i === 2 ? 'b2' : 'b3'
  }
  const cell = (col: AppColumn, value: string) => (col.type === 'status' ? `<span class="ap-badge ${badgeClass(col, value)}">${esc(value)}</span>` : esc(value))

  const undoKey = (t: AppTable) => K(`undo:${t.id}`)
  const canUndo = (t: AppTable) => !!read<unknown>(undoKey(t), null)
  const pager = (total: number) => {
    const pages = Math.max(1, Math.ceil(total / PER_PAGE))
    if (pageNo >= pages) pageNo = pages - 1
    return total > PER_PAGE ? `<div class="ap-tools" style="margin:12px 0 0;align-items:center"><button class="ap-btn ghost sm" data-prev ${pageNo === 0 ? 'disabled' : ''}>Previous</button><span style="font-size:13px;opacity:.75">Page ${pageNo + 1} of ${pages} · ${total} rows</span><button class="ap-btn ghost sm" data-next ${pageNo >= pages - 1 ? 'disabled' : ''}>Next</button></div>` : ''
  }
  const tableView = (t: AppTable) => {
    let rows = rowsOf(t).map((r, i) => ({ r, i }))
    const q = query.trim().toLowerCase()
    const statusCol = t.columns.find((c) => c.type === 'status')
    if (q) rows = rows.filter(({ r }) => Object.values(r).some((v) => String(v).toLowerCase().includes(q)))
    if (statusCol && statusFilter) rows = rows.filter(({ r }) => r[statusCol.key] === statusFilter)
    if (sort) {
      const { key, dir } = sort
      const col = t.columns.find((c) => c.key === key)
      const num = col && (col.type === 'number' || col.type === 'money')
      rows = [...rows].sort((a, b) => (num ? (parseFloat(String(a.r[key]).replace(/[^\d.-]/g, '')) || 0) - (parseFloat(String(b.r[key]).replace(/[^\d.-]/g, '')) || 0) : String(a.r[key] ?? '').localeCompare(String(b.r[key] ?? ''))) * dir)
    }
    if (pageNo >= Math.max(1, Math.ceil(rows.length / PER_PAGE))) pageNo = Math.max(0, Math.ceil(rows.length / PER_PAGE) - 1)
    const filter = statusCol ? `<select class="ap-in" data-filter aria-label="Filter by ${esc(statusCol.label)}" style="max-width:170px"><option value="">All ${esc(statusCol.label.toLowerCase())}</option>${(statusCol.options ?? []).map((o) => `<option ${o === statusFilter ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>` : ''
    return `<div class="ap-card ap-panel"><div class="ap-tools"><input class="ap-in" data-q placeholder="Search ${esc(t.label.toLowerCase())}" value="${esc(query)}" aria-label="Search" />${filter}<button class="ap-btn" data-add>+ Add ${esc(t.singular)}</button><button class="ap-btn ghost" data-import>Import CSV</button><button class="ap-btn ghost" data-export>Export CSV</button><input type="file" accept=".csv,text/csv,text/plain" data-file hidden /></div>${notice ? `<p class="ap-note" style="margin:0 0 10px;opacity:1">${esc(notice)}${canUndo(t) ? ' <button class="ap-link" data-undo>Undo</button>' : ''}</p>` : ''}
      <div class="ap-wrap">${rows.length ? `<table><thead><tr>${t.columns.map((c) => `<th data-sort="${esc(c.key)}">${esc(c.label)}${sort?.key === c.key ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''}</th>`).join('')}<th></th></tr></thead><tbody>${rows
        .slice(pageNo * PER_PAGE, pageNo * PER_PAGE + PER_PAGE)
        .map(({ r, i }) => `<tr>${t.columns.map((c) => `<td>${cell(c, r[c.key] ?? '')}</td>`).join('')}<td style="text-align:right"><button class="ap-btn ghost sm" data-edit="${i}">Edit</button> <button class="ap-btn ghost sm" data-del="${i}">Delete</button></td></tr>`)
        .join('')}</tbody></table>` : `<div class="ap-empty">${q || statusFilter ? 'Nothing matches that.' : `No ${esc(t.label.toLowerCase())} yet.`} Use “Add ${esc(t.singular)}” or “Import CSV”.</div>`}</div>${pager(rows.length)}</div>`
  }

  const allData = (): Data => Object.fromEntries(cfg.tables.map((t) => [t.id, rowsOf(t)]))
  const bars = (items: { label: string; value: number }[], horizontal = false) => {
    const max = Math.max(1, ...items.map((x) => x.value))
    return horizontal
      ? `<div style="display:grid;gap:8px">${items.map((x) => `<div style="display:grid;grid-template-columns:110px 1fr 36px;gap:10px;align-items:center;font-size:13px"><span>${esc(x.label)}</span><span style="background:color-mix(in srgb,currentColor 10%,transparent);border-radius:99px;height:10px;overflow:hidden"><i style="display:block;height:100%;width:${Math.round((x.value / max) * 100)}%;background:var(--g-accent,#4f46e5)"></i></span><b>${x.value}</b></div>`).join('')}</div>`
      : `<div class="ap-bars">${items.map((x) => `<div title="${esc(x.label)}: ${x.value}"><span>${x.value >= 10000 ? Math.round(x.value / 1000) + 'k' : x.value}</span><i style="height:${Math.round((x.value / max) * 120)}px"></i><span>${esc(x.label)}</span></div>`).join('')}</div>`
  }
  const chartOf = (c: AppConfig['charts'][number], data: Data) => {
    const t = cfg.tables.find((x) => x.id === c.table)
    if (!t) return ''
    const rows = data[t.id] ?? []
    if (c.kind === 'status') {
      const items = byStatus(t, rows).map((x) => ({ label: x.label, value: x.n }))
      return items.length ? `<div class="ap-card ap-panel"><h3 style="font-size:16px;margin-bottom:12px">${esc(c.title)}</h3>${bars(items, true)}</div>` : ''
    }
    const dateKey = c.column ?? t.columns.find((x) => x.type === 'date')?.key
    if (!dateKey) return ''
    const items = byMonth(rows, dateKey, c.kind === 'sumMonth' ? c.sumColumn : undefined, windowEnd(rows, dateKey, new Date()), range)
    return `<div class="ap-card ap-panel"><h3 style="font-size:16px">${esc(c.title)}</h3>${bars(items)}</div>`
  }
  const rangePicker = () => `<div class="ap-tools" style="margin:0"><label style="display:flex;gap:8px;align-items:center;font-size:13px">Months shown<select class="ap-in" data-range style="width:auto">${[3, 6, 12].map((n) => `<option value="${n}" ${n === range ? 'selected' : ''}>Last ${n}</option>`).join('')}</select></label></div>`
  const overview = () => {
    const data = allData()
    const first = cfg.tables[0]
    const recent = first ? data[first.id].slice(0, 5) : []
    return `${rangePicker()}<div class="ap-kpis">${cfg.kpis.map((k) => `<div class="ap-card ap-kpi"><small>${esc(k.label)}</small><b>${esc(calcKpi(k, data, cfg.currency))}</b><small>${esc(k.note)}</small></div>`).join('')}</div>
      <div class="ap-two">${cfg.charts.map((c) => chartOf(c, data)).join('')}</div>
      ${first ? `<div class="ap-card ap-panel"><h3 style="font-size:16px;margin-bottom:10px">Latest ${esc(first.label.toLowerCase())}</h3><div class="ap-wrap"><table><tbody>${recent.map((r) => `<tr>${first.columns.slice(0, 4).map((c) => `<td>${cell(c, r[c.key] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p style="margin:12px 0 0"><a href="#/app/${esc(first.id)}">See all ${esc(first.label.toLowerCase())}</a></p></div>` : ''}`
  }

  // a small chart of a page by month (rows, or the first money column added up), when the page has a date column
  const monthMini = (t: AppTable, rows: Record<string, string>[]) => {
    const dateCol = t.columns.find((c) => c.type === 'date')
    if (!dateCol) return ''
    const money = t.columns.find((c) => c.type === 'money')
    const items = byMonth(rows, dateCol.key, money?.key, windowEnd(rows, dateCol.key, new Date()), range)
    return items.some((x) => x.value) ? `<p style="margin:16px 0 4px;font-size:12px;opacity:.7;text-transform:uppercase;letter-spacing:.05em">${esc(money ? money.label : 'Rows')} per month</p>${bars(items)}` : ''
  }

  // a summary of every page: how many rows, the rows by status, what the money columns add up to and the biggest rows
  const insights = () => {
    const data = allData()
    return `${rangePicker()}<div style="display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(320px,1fr))">${cfg.tables
      .map((t) => {
        const rows = data[t.id]
        const status = byStatus(t, rows).map((x) => ({ label: x.label, value: x.n }))
        const sums = t.columns.filter((c) => c.type === 'money').map((c) => `<p style="margin:6px 0 0;font-size:14px">${esc(c.label)} in total: <b>${esc(moneyText(rows.reduce((n, r) => n + toNumber(r[c.key]), 0), cfg.currency))}</b></p>`).join('')
        const money = t.columns.find((c) => c.type === 'money')
        const top = money ? [...rows].sort((a, b) => toNumber(b[money.key]) - toNumber(a[money.key])).slice(0, 3) : []
        return `<div class="ap-card ap-panel"><h3 style="font-size:16px">${esc(t.label)}</h3><p style="margin:4px 0 12px;opacity:.7;font-size:13px">${rows.length} row${rows.length === 1 ? '' : 's'}</p>${status.length ? bars(status, true) : ''}${monthMini(t, rows)}${sums}${top.length ? `<p style="margin:14px 0 6px;font-size:12px;opacity:.7;text-transform:uppercase;letter-spacing:.05em">Biggest ${esc(money!.label.toLowerCase())}</p>${top.map((r) => `<div style="display:flex;justify-content:space-between;gap:12px;font-size:14px"><span>${esc(r[t.columns[0].key])}</span><b>${esc(r[money!.key])}</b></div>`).join('')}` : ''}<p style="margin:14px 0 0"><a href="#/app/${esc(t.id)}">Open ${esc(t.label.toLowerCase())}</a></p></div>`
      })
      .join('')}</div>`
  }

  const settings = (user: User | undefined) =>
    `<div class="ap-card ap-panel" style="max-width:560px"><h3 style="font-size:16px">Your account</h3>
      <p style="margin:10px 0 2px">${esc(user?.name ?? '')}</p><p style="margin:0;opacity:.7">${esc(user?.email ?? session()?.email ?? '')}</p>
      <p class="ap-note">This is a demo: the account and all the rows are saved only in this browser.</p>
      ${notice ? `<p class="ap-note" style="opacity:1">${esc(notice)}</p>` : ''}
      <div class="ap-actions" style="justify-content:flex-start;flex-wrap:wrap"><button class="ap-btn ghost" data-backup>Download all data (JSON)</button><button class="ap-btn ghost" data-restore>Restore from a file</button><input type="file" accept=".json,application/json" data-restorefile hidden /><button class="ap-btn ghost" data-reset>Reset demo data</button><button class="ap-btn" data-logout>Log out</button></div></div>`

  const appView = () => {
    const email = session()?.email
    const user = users().find((u) => u.email === email)
    const route = page().replace(/^#\/app\/?/, '') || 'overview'
    const table = cfg.tables.find((t) => t.id === route)
    const heading = route === 'overview' ? 'Overview' : route === 'settings' ? 'Settings' : route === 'insights' && cfg.insights ? 'Insights' : (table?.title ?? 'Overview')
    const link = (id: string, label: string, ic: string) => `<a href="#/app${id === 'overview' ? '' : `/${id}`}" class="${route === id ? 'on' : ''}">${icon(ic)}<span>${esc(label)}</span></a>`
    const body = route === 'settings' ? settings(user) : route === 'insights' && cfg.insights ? insights() : table ? tableView(table) : overview()
    view.innerHTML = `<div class="ap-shell" data-shell><aside class="ap-side"><div class="ap-brand">${esc(cfg.brand)}</div><nav class="ap-nav">${link('overview', 'Overview', 'home')}${cfg.tables.map((t) => link(t.id, t.label, t.icon)).join('')}${cfg.insights ? link('insights', 'Insights', 'chart') : ''}${link('settings', 'Settings', 'cog')}</nav></aside>
      <div class="ap-main"><div class="ap-demo">Demo mode: example data, saved only in this browser</div><div class="ap-top"><button class="ap-btn ghost sm ap-burger" data-burger aria-label="Menu">☰</button><h2 style="font-size:20px">${esc(heading)}</h2><span class="sp"></span><span style="opacity:.75;font-size:14px">${esc(user?.name || email || '')}</span><a class="ap-btn ghost sm" href="#/" style="text-decoration:none">View site</a><button class="ap-btn sm" data-logout>Log out</button></div>
      <div class="ap-body">${body}</div></div></div>`
  }

  const modal = (t: AppTable, index: number | null) => {
    const row = index === null ? {} : (rowsOf(t)[index] ?? {})
    const box = document.createElement('div')
    box.className = 'ap-modal'
    box.innerHTML = `<div class="ap-card" role="dialog" aria-label="${index === null ? 'Add' : 'Edit'} ${esc(t.singular)}"><h3 style="font-size:18px">${index === null ? 'Add' : 'Edit'} ${esc(t.singular)}</h3><form novalidate>${t.columns
      .map((c) => {
        const v = row[c.key] ?? ''
        const input = c.type === 'status' ? `<select class="ap-in" name="${esc(c.key)}">${(c.options ?? []).map((o) => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>` : `<input class="ap-in" name="${esc(c.key)}" type="${c.type === 'date' ? 'date' : 'text'}" value="${esc(v)}" ${c.type === 'number' || c.type === 'money' ? 'inputmode="decimal"' : ''} />`
        return `<label class="ap-field"><span>${esc(c.label)}</span>${input}</label>`
      })
      .join('')}<div class="ap-actions"><button type="button" class="ap-btn ghost" data-cancel>Cancel</button><button class="ap-btn" type="submit">Save</button></div></form></div>`
    root.appendChild(box)
    const close = () => box.remove()
    box.querySelector('[data-cancel]')!.addEventListener('click', close)
    box.addEventListener('mousedown', (e) => e.target === box && close())
    box.querySelector('form')!.addEventListener('submit', (event) => {
      event.preventDefault()
      const f = new FormData(event.target as HTMLFormElement)
      const raw: Record<string, string> = {}
      t.columns.forEach((c) => (raw[c.key] = String(f.get(c.key) ?? '').trim()))
      const next = tidyRow(t, raw, cfg.currency)
      const problem = checkRow(t, next)
      if (problem) {
        let box2 = box.querySelector('.ap-err')
        if (!box2) {
          box2 = document.createElement('div')
          box2.className = 'ap-err'
          box2.setAttribute('role', 'alert')
          box.querySelector('.ap-actions')?.before(box2)
        }
        box2.textContent = problem
        return
      }
      const rows = [...rowsOf(t)]
      if (index === null) rows.unshift(next)
      else rows[index] = next
      write(K(`t:${t.id}`), rows)
      close()
      render()
    })
    ;(box.querySelector('input,select') as HTMLElement | null)?.focus()
  }

  const render = () => {
    paint()
    const p = page()
    const known = /^#\/(login|register|forgot|app)/.test(p)
    root.hidden = !known
    document.documentElement.style.overflow = known ? 'hidden' : ''
    if (!known) return linkIn()
    if (NEEDS_SESSION.test(p) && !session()) return go('#/login')
    if ((p === '#/login' || p === '#/register') && session()) return go('#/app')
    if (p === '#/login') authView('login')
    else if (p === '#/register') authView('register')
    else if (p === '#/forgot') authView('forgot')
    else appView()
    root.scrollTop = 0
    linkIn()
  }

  root.addEventListener('click', (event) => {
    const el = event.target as HTMLElement
    const t = cfg.tables.find((x) => x.id === page().replace(/^#\/app\/?/, ''))
    if (el.closest('[data-logout]')) {
      write(K('session'), null)
      go('#/login')
    } else if (el.closest('[data-burger]')) root.querySelector('[data-shell]')?.classList.toggle('open')
    else if (el.closest('.ap-nav a')) root.querySelector('[data-shell]')?.classList.remove('open')
    else if (el.closest('[data-reset]')) {
      cfg.tables.forEach((x) => write(K(`t:${x.id}`), x.rows))
      render()
    } else if (t && el.closest('[data-import]')) root.querySelector<HTMLInputElement>('[data-file]')?.click()
    else if (t && el.closest('[data-export]')) {
      const blob = new Blob([toCsv(t.columns, rowsOf(t))], { type: 'text/csv;charset=utf-8' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${cfg.slug}-${t.id}.csv`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 2000)
    } else if (t && el.closest('[data-undo]')) {
      const before = read<Record<string, string>[] | null>(undoKey(t), null)
      if (before) {
        write(K(`t:${t.id}`), before)
        try {
          localStorage.removeItem(undoKey(t))
        } catch {
          /* nothing to remove */
        }
        notice = 'The last import is undone.'
        pageNo = 0
        render()
      }
    } else if (el.closest('[data-prev]')) {
      pageNo = Math.max(0, pageNo - 1)
      render()
    } else if (el.closest('[data-next]')) {
      pageNo += 1
      render()
    } else if (el.closest('[data-backup]')) {
      const blob = new Blob([JSON.stringify({ app: cfg.slug, saved: new Date().toISOString(), tables: allData() }, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${cfg.slug}-data.json`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 2000)
    } else if (el.closest('[data-restore]')) root.querySelector<HTMLInputElement>('[data-restorefile]')?.click()
    else if (t && el.closest('[data-add]')) modal(t, null)
    else if (t && el.closest('[data-edit]')) modal(t, Number(el.closest<HTMLElement>('[data-edit]')!.dataset.edit))
    else if (t && el.closest('[data-del]')) {
      const i = Number(el.closest<HTMLElement>('[data-del]')!.dataset.del)
      if (window.confirm('Delete this row?')) {
        write(K(`t:${t.id}`), rowsOf(t).filter((_, n) => n !== i))
        render()
      }
    } else if (el.closest('[data-sort]')) {
      const key = el.closest<HTMLElement>('[data-sort]')!.dataset.sort as string
      sort = sort?.key === key ? { key, dir: sort.dir === 1 ? -1 : 1 } : { key, dir: 1 }
      render()
    }
  })
  root.addEventListener('input', (event) => {
    const el = event.target as HTMLInputElement
    if (el.matches('[data-q]')) {
      query = el.value
      pageNo = 0
      const at = el.selectionStart
      render()
      const again = root.querySelector<HTMLInputElement>('[data-q]')
      again?.focus()
      if (again && at !== null) again.setSelectionRange(at, at)
    }
  })
  root.addEventListener('change', (event) => {
    const el = event.target as HTMLInputElement
    const t = cfg.tables.find((x) => x.id === page().replace(/^#\/app\/?/, ''))
    if (el.matches('[data-range]')) {
      range = Number(el.value) || 6
      render()
    } else if (el.matches('[data-filter]')) {
      statusFilter = el.value
      pageNo = 0
      render()
    } else if (el.matches('[data-restorefile]') && el.files?.[0]) {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const saved = JSON.parse(String(reader.result ?? '')) as { app?: string; tables?: Data }
          const { matched, foreign } = matchBackup(cfg.tables, saved, cfg.slug)
          if (!matched.length) throw new Error('nothing fits')
          matched.forEach(({ id, rows }) => {
            const x = cfg.tables.find((tt) => tt.id === id) as AppTable
            write(K(`t:${id}`), rows.map((r) => tidyRow(x, r as Record<string, string>, cfg.currency)))
          })
          const names = matched.map((m) => (cfg.tables.find((tt) => tt.id === m.id) as AppTable).label).join(', ')
          notice = foreign ? `This backup is from another site (${String(saved.app)}). Restored the pages that fit: ${names}. The columns they share were kept.` : `Restored ${matched.length} page${matched.length === 1 ? '' : 's'} from the file: ${names}.`
        } catch {
          notice = 'That file is not a backup this site can use: none of its pages match.'
        }
        render()
      }
      reader.readAsText(el.files[0])
    } else if (t && el.matches('[data-file]') && el.files?.[0]) {
      const file = el.files[0]
      const reader = new FileReader()
      reader.onload = () => {
        const { rows: raw, mapped } = csvToRows(t, parseCsv(String(reader.result ?? '')))
        if (!raw.length) notice = 'No rows were found in that file. The first line should name the columns: ' + t.columns.map((c) => c.label).join(', ') + '.'
        else {
          const have = rowsOf(t)
          // dates and sums are written the one way; a row that is wrong (no name, a date that is no date) is left out and counted
          const tidy = raw.map((r) => tidyRow(t, r, cfg.currency))
          const good = tidy.filter((r) => !checkRow(t, r))
          const bad = tidy.length - good.length
          // rows are already there: replace them or put the new ones in front; a row that is in the table already is not added twice
          const replace = have.length > 0 && window.confirm(`Replace the ${have.length} rows that are there with the ${good.length} from the file?\n\nOK = replace them\nCancel = add the new rows in front of them`)
          const { fresh, skipped } = replace ? { fresh: freshRows(t, [], good).fresh, skipped: good.length - freshRows(t, [], good).fresh.length } : freshRows(t, have, good)
          write(undoKey(t), have)
          write(K(`t:${t.id}`), replace ? fresh : [...fresh, ...have])
          notice = `${replace ? 'Replaced the rows with' : 'Added'} ${fresh.length} row${fresh.length === 1 ? '' : 's'} from ${file.name} (${mapped} of ${t.columns.length} columns matched)${skipped ? `; ${skipped} already there or repeated, left out` : ''}${bad ? `; ${bad} with a problem (a missing ${t.columns[0].label.toLowerCase()} or a wrong date or number), left out` : ''}.`
        }
        pageNo = 0
        render()
      }
      reader.readAsText(file)
    }
  })
  window.addEventListener('hashchange', () => {
    query = ''
    statusFilter = ''
    notice = ''
    pageNo = 0
    render()
  })
  linkIn()
  render()
}
