// The demo app of a site (log in, register, a dashboard with example data, no backend): the pages and rows of each kind of business, the command in the chat, the export.   node scripts/test-app.mjs
import { loadGeneratorModule } from './lib/load-generator.mjs'

globalThis.document = { styleSheets: [] }
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} }
const { generateLibraryPage } = await loadGeneratorModule('library/generateLibraryPage.ts')
const { parseCsv, toCsv, csvToRows, calcKpi, byStatus, byMonth, matchBackup, windowEnd, normalizeDate, normalizeMoney, checkRow, tidyRow, freshRows } = await loadGeneratorModule('app/appRuntime.ts')
const { appConfigFor, appKindOf } = await loadGeneratorModule('app/appProfiles.ts')
const { parseEdit } = await loadGeneratorModule('edit/understand.ts')
const { editsFrom } = await loadGeneratorModule('edit/edits.ts')
let passed = 0
let failed = 0
const ok = (cond, label) => { if (cond) passed += 1; else { failed += 1; console.log(` - ${label}`) } }
const page = (p, edits) => generateLibraryPage(p, 7, undefined, true, 'auto', edits, true)

const CASES = [
  ['Dr. Mehta dental clinic in Surat, braces, implants', 'clinic', ['Appointments', 'Patients', 'Billing']],
  ['Gym in Pune with personal training, plans: basic 999 rupees, premium 1999 rupees', 'gym', ['Members', 'Classes', 'Payments']],
  ['Bakery in Jaipur, eggless cakes, pastries, home delivery', 'food', ['Orders', 'Menu', 'Customers']],
  ['Kurti boutique online, free shipping above 999', 'shop', ['Orders', 'Products', 'Customers']],
  ['Office management software website: desk booking, meeting rooms, visitor management, facility requests for companies', 'office', ['Desks', 'Meeting rooms', 'Visitors', 'Facility requests']],
  ['Website for an influencer: fashion and lifestyle creator with 250k followers on Instagram, brand collaborations, reels', 'creator', ['Collaborations', 'Content calendar', 'Messages']],
  ['Student note-taking app for college students, flashcards, study timer', 'software', ['Projects', 'Team', 'Billing']],
  ['Cricket coaching academy in Hyderabad for kids, batting, bowling', 'learning', ['Students', 'Batches', 'Fees']],
  ['Art gallery in Jaipur selling paintings, sculptures, hosting exhibitions', 'general', ['Orders', 'Catalogue', 'Customers']],
  ['Board game cafe in Bengaluru', 'general', ['Bookings', 'Experiences', 'Guests']],
  ['Driving school in Nagpur, car and bike lessons, license help', 'learning', ['Students', 'Batches', 'Fees']],
  ['Wedding card printing shop in Surat', 'shop', ['Orders', 'Products', 'Customers']],
  ['Laundry and dry cleaning service centre in Pune', 'homeservices', ['Jobs', 'Technicians', 'Customers']],
  ['NGO for stray dogs in Bangalore, adopt, donate, volunteer', 'ngo', ['Donations', 'Donors', 'Volunteers', 'Campaigns']],
  ['Law firm in Delhi, property disputes, family law, consumer cases', 'legal', ['Cases', 'Clients', 'Hearings', 'Invoices']],
  ['Construction company in Jaipur, villas, renovation, civil work', 'construction', ['Projects', 'Quotes', 'Site visits', 'Crew']],
  ['Car garage in Pune, servicing, denting painting, car wash', 'auto', ['Job cards', 'Customers', 'Bookings', 'Invoices']],
  ['Home cleaning and pest control services in Noida', 'homeservices', ['Jobs', 'Technicians', 'Customers']],
  ['Packers and movers in Hyderabad, house shifting, office shifting', 'logistics', ['Shipments', 'Drivers', 'Customers']],
  ['Pet clinic and grooming in Mumbai, vaccination, dog grooming', 'pets', ['Appointments', 'Owners', 'Animals']],
  ['Insurance advisor in Indore, health insurance, term plans, mutual funds', 'finance', ['Clients', 'Policies and plans', 'Reminders', 'Payments']],
  ['Astrologer in Varanasi, kundli, vastu, tarot readings', 'consult', ['Consultations', 'Clients', 'Payments']],
  ['Organic farm selling vegetables and honey, home delivery', 'farm', ['Orders', 'Produce', 'Customers']],
]
for (const [prompt, kind, labels] of CASES) {
  const lib = page(prompt)
  const cfg = appConfigFor(lib.content, { themeKey: lib.themeKey, niche: typeof lib.niche === 'string' ? lib.niche : lib.niche?.id, prompt })
  const got = appKindOf({ themeKey: lib.themeKey, niche: typeof lib.niche === 'string' ? lib.niche : lib.niche?.id, subject: lib.content.subject, voice: lib.content.voice, prompt })
  ok(got === kind || (kind === 'learning' && got === 'learning'), `${prompt.slice(0, 30)}: the kind is ${kind} (got ${got})`)
  ok(labels.every((l) => cfg.tables.some((t) => t.label === l)), `${prompt.slice(0, 30)}: pages ${labels.join(', ')} (got ${cfg.tables.map((t) => t.label).join(', ')})`)
  ok(cfg.tables.every((t) => t.rows.length >= 3 && t.rows.every((r) => t.columns.every((c) => c.key in r))), `${prompt.slice(0, 30)}: every row has every column`)
  ok(cfg.tables.every((t) => t.columns.filter((c) => c.type === 'status').every((c) => t.rows.every((r) => !r[c.key] || c.options.includes(r[c.key])))), `${prompt.slice(0, 30)}: statuses are from their list`)
  ok(cfg.kpis.length === 4 && cfg.kpis.every((k) => k.calc.kind === 'fixed' || (cfg.tables.some((t) => t.id === k.calc.table) && (k.calc.kind === 'count' || cfg.tables.find((t) => t.id === k.calc.table).columns.some((c) => c.key === k.calc.column)))), `${prompt.slice(0, 30)}: four figures, each counting a page that is there`)
  ok(cfg.charts.length >= 1 && cfg.charts.every((c) => cfg.tables.some((t) => t.id === c.table)), `${prompt.slice(0, 30)}: charts of pages that are there`)
  const data = Object.fromEntries(cfg.tables.map((t) => [t.id, t.rows]))
  ok(cfg.kpis.every((k) => /^[^\s]*\d/.test(calcKpi(k, data, cfg.currency)) || k.calc.kind === 'fixed'), `${prompt.slice(0, 30)}: every figure is a number`)
  ok(JSON.stringify(cfg) === JSON.stringify(appConfigFor(lib.content, { themeKey: lib.themeKey, niche: typeof lib.niche === 'string' ? lib.niche : lib.niche?.id, prompt })), `${prompt.slice(0, 30)}: the same data every time`)
  ok(!/\bundefined\b|\[object/.test(JSON.stringify(cfg)), `${prompt.slice(0, 30)}: no undefined in the data`)
}
const inf = page(CASES[5][0])
const cfgInf = appConfigFor(inf.content, { themeKey: inf.themeKey, prompt: CASES[5][0] })
ok(calcKpi(cfgInf.kpis[0], {}, '₹') === '250K+', 'creator: the audience number is the first figure')
const gym = page(CASES[1][0])
ok(appConfigFor(gym.content, { themeKey: gym.themeKey, prompt: CASES[1][0] }).tables[0].rows.some((r) => /basic|premium/i.test(r.plan)), 'gym: the plans of the prompt are the plans of the members')

// the chat
for (const text of ['login aur dashboard add karo', 'add a login page and dashboard', 'register page chahiye', 'sign up add karo', 'member area chahiye']) {
  const r = parseEdit(text, 'single')
  ok(r.kind === 'ops' && r.ops.some((o) => o.op === 'app' && o.on === true), `"${text}" adds the app`)
}
for (const text of ['dashboard hatao', 'remove the login page']) {
  const r = parseEdit(text, 'single')
  ok(r.kind === 'ops' && r.ops.some((o) => o.op === 'app' && o.on === false), `"${text}" removes the app`)
}
ok(!parseEdit('login button ka color blue karo', 'single').ops?.some((o) => o.op === 'app'), 'a colour of a login button is not the app')
const withApp = page('Dr. Mehta dental clinic in Surat, braces, implants', editsFrom([{ op: 'app', on: true }]))
ok(withApp.content.app === true && !page('Dr. Mehta dental clinic in Surat, braces, implants').content.app, 'the app is on only when it was asked for')

// CSV in and out
{
  const rows = parseCsv('Name,Phone,Notes\r\n"Sharma, A",98765,"said ""hi"""\nRao,1,x\n')
  ok(rows.length === 3 && rows[1][0] === 'Sharma, A' && rows[1][2] === 'said "hi"', 'CSV: quotes, commas inside quotes and doubled quotes')
  ok(parseCsv('a;b;c\n1;2;3').length === 2 && parseCsv('a;b;c\n1;2;3')[1][2] === '3', 'CSV: a semicolon file (Excel) is read')
  ok(parseCsv('﻿a,b\n\n1,2\n').length === 2, 'CSV: a BOM and empty lines are ignored')
  const lib = page('Dr. Mehta dental clinic in Surat, braces, implants')
  const cfg = appConfigFor(lib.content, { themeKey: lib.themeKey })
  const t = cfg.tables.find((x) => x.label === 'Patients')
  const named = csvToRows(t, parseCsv('phone,name,Unknown\n111,Zoya,x\n222,Yash,y'))
  ok(named.rows.length === 2 && named.rows[0].name === 'Zoya' && named.rows[0].phone === '111' && named.mapped === 2, 'CSV: columns are matched by their names, in any order, and unknown ones are left out')
  const plain = csvToRows(t, parseCsv('Zoya,111,z@example.com\nYash,222,y@example.com'))
  ok(plain.rows.length === 2 && plain.rows[0].name === 'Zoya' && plain.rows[1].email === 'y@example.com', 'CSV: without a header line the columns are taken in order')
  ok(csvToRows(t, parseCsv('')).rows.length === 0, 'CSV: an empty file adds nothing')
  const back = csvToRows(t, parseCsv(toCsv(t.columns, t.rows)))
  ok(back.rows.length === t.rows.length && back.rows.every((r, i) => t.columns.every((c) => r[c.key] === t.rows[i][c.key])), 'CSV: what is exported can be imported again, unchanged')
}

// figures that follow the data, and a row that is kept tidy
{
  const lib = page('Dr. Mehta dental clinic in Surat, braces, implants')
  const cfg = appConfigFor(lib.content, { themeKey: lib.themeKey })
  const rows = (id) => cfg.tables.find((t) => t.id === id).rows
  const data = Object.fromEntries(cfg.tables.map((t) => [t.id, t.rows]))
  const patients = cfg.kpis.find((k) => k.calc.table === 'patients')
  ok(calcKpi(patients, data, '₹') === String(rows('patients').length), 'a figure counts the rows of its page')
  ok(calcKpi(patients, { ...data, patients: [...data.patients, { name: 'New' }] }, '₹') === String(rows('patients').length + 1), 'a row added changes the figure at once')
  ok(calcKpi(patients, { ...data, patients: [] }, '₹') === '0', 'no rows: zero')
  const billed = cfg.kpis.find((k) => k.calc.kind === 'sum')
  ok(/^₹[\d,]+$/.test(calcKpi(billed, data, '₹')), 'a sum is written as money')
  ok(calcKpi(billed, { billing: [{ amount: '₹1,200' }, { amount: '800' }] }, '₹') === '₹2,000', 'a sum adds amounts written in different ways')
  const waiting = cfg.kpis.find((k) => k.calc.kind === 'status')
  ok(calcKpi(waiting, { appointments: [{ status: 'Waiting' }, { status: 'Booked' }, { status: 'Waiting' }] }, '₹') === '2', 'a status figure counts the rows with that status')
  const t = cfg.tables.find((x) => x.id === 'appointments')
  const split = byStatus(t, [{ status: 'Booked' }, { status: 'Booked' }, { status: 'Completed' }])
  ok(split.find((x) => x.label === 'Booked').n === 2 && split.find((x) => x.label === 'Waiting').n === 0, 'rows by status: the statuses of the column are all there, with zero where there are none')
  const m = byMonth([{ d: '2026-03-05' }, { d: '2026-03-20' }, { d: '2026-02-01' }, { d: '2025-01-01' }], 'd', undefined, new Date(2026, 2, 15))
  ok(m.length === 6 && m[5].label === 'Mar' && m[5].value === 2 && m[4].value === 1 && m[0].label === 'Oct', 'rows per month: the six months up to this one')
  ok(byMonth([{ d: '2026-03-05', a: '₹500' }, { d: '2026-03-06', a: '700' }], 'd', 'a', new Date(2026, 2, 15))[5].value === 1200, 'a money column added up per month')
  ok(normalizeDate('12/03/2026') === '2026-03-12' && normalizeDate('25-12-26') === '2026-12-25' && normalizeDate('3 Mar 2026') === '2026-03-03' && normalizeDate('March 3, 2026') === '2026-03-03' && normalizeDate('2026/3/4') === '2026-03-04', 'dates written in the usual ways become year-month-day')
  ok(normalizeDate('2026-03-12') === '2026-03-12' && normalizeDate('soon') === 'soon' && normalizeDate('') === '', 'a date that is fine, text and nothing are left as they are')
  ok(normalizeMoney('1200', '₹') === '₹1,200' && normalizeMoney('Rs. 1,200', '₹') === '₹1,200' && normalizeMoney('₹1200/-', '₹') === '₹1,200' && normalizeMoney('1.5k', '₹') === '₹1,500' && normalizeMoney('2 lakh', '₹') === '₹200,000'.replace('200,000', '2,00,000'), 'sums written in the usual ways become one form')
  ok(normalizeMoney('ask us', '₹') === 'ask us', 'text that is not a sum is left alone')
  ok(checkRow(t, { patient: '', treatment: 'x', date: '2026-01-01', status: 'Booked' }) !== '' && checkRow(t, { patient: 'A', treatment: 'x', date: '12 March', status: 'Booked' }).includes('date') && checkRow(t, { patient: 'A', treatment: 'x', date: '2026-01-01', status: 'Booked' }) === '', 'a row needs its first column and a real date')
  const gym = page('Gym in Pune with personal training, plans: basic 999 rupees')
  const gcfg = appConfigFor(gym.content, { themeKey: gym.themeKey })
  const cls = gcfg.tables.find((x) => x.id === 'classes')
  ok(checkRow(cls, { class: 'Yoga', day: 'Mon', time: '6 AM', seats: 'many' }).includes('number'), 'a number column refuses words')
  const people = cfg.tables.find((x) => x.id === 'patients')
  ok(checkRow(people, { name: 'A', phone: '1', email: 'not-an-email', joined: '2026-01-01' }).includes('e-mail'), 'an email column refuses what is no address')
  ok(tidyRow(cfg.tables.find((x) => x.id === 'billing'), { patient: ' A ', item: 'x', amount: 'Rs 900', status: 'Paid' }, '₹').amount === '₹900', 'a row is tidied before it is kept')
  const have = [{ name: 'Zoya', phone: '1', email: 'z@example.com', joined: '2026-01-01' }]
  const r = freshRows(people, have, [{ name: 'zoya', phone: '1', email: 'z@example.com', joined: '2026-01-01' }, { name: 'Yash', phone: '2', email: 'y@example.com', joined: '2026-01-02' }, { name: 'Yash', phone: '2', email: 'y@example.com', joined: '2026-01-02' }])
  ok(r.fresh.length === 1 && r.skipped === 2 && r.fresh[0].name === 'Yash', 'rows already there (or repeated in the file) are left out, whatever the case')
  ok(appConfigFor(page('Dr. Mehta dental clinic in Surat, braces, implants', editsFrom([{ op: 'app', on: true }, { op: 'appPage', action: 'remove', page: 'Insights' }])).content, { themeKey: 'healthcare' }).insights === false && cfg.insights === true, 'the Insights page is there unless it was taken out')
  const noBilling = appConfigFor(page('Dr. Mehta dental clinic in Surat, braces, implants', editsFrom([{ op: 'app', on: true }, { op: 'appPage', action: 'remove', page: 'Billing' }])).content, { themeKey: 'healthcare' })
  ok(noBilling.kpis.length === 4 && noBilling.kpis.every((k) => k.calc.kind === 'fixed' || noBilling.tables.some((x) => x.id === k.calc.table)), 'a page taken out of the dashboard does not leave a figure that counts it')
}

// the months of the chart are not empty from the first day, and a backup of another site is used where it fits
{
  let thin = 0
  for (const [prompt] of CASES) {
    const lib = page(prompt)
    const cfg = appConfigFor(lib.content, { themeKey: lib.themeKey, niche: typeof lib.niche === 'string' ? lib.niche : lib.niche?.id, prompt })
    const head = cfg.tables[0]
    const dateCol = head.columns.find((c) => c.type === 'date')
    if (!dateCol) continue
    const months = byMonth(head.rows, dateCol.key, undefined, windowEnd(head.rows, dateCol.key, new Date()))
    if (months.filter((m) => m.value > 0).length < 4) { thin += 1; console.log(` - ${prompt.slice(0, 30)}: only ${months.filter((m) => m.value > 0).length} of 6 months have rows (${head.label})`) }
  }
  ok(thin === 0, 'the month chart of the first page has rows in at least four of six months, from the first day')
  const lib = page('Gym in Pune with personal training, plans: basic 999 rupees')
  const gcfg = appConfigFor(lib.content, { themeKey: lib.themeKey })
  const all = gcfg.tables.flatMap((t) => t.rows.filter((r) => Object.values(r).some((v) => /^\d{4}-\d\d-\d\d$/.test(v))))
  ok(all.every((r) => Object.values(r).filter((v) => /^\d{4}-\d\d-\d\d$/.test(v)).every((d) => d >= '2025-01-01')), 'the dates of the example rows are real dates')
  ok(byMonth([], 'd', undefined, new Date(2026, 2, 1), 3).length === 3 && byMonth([], 'd', undefined, new Date(2026, 2, 1), 12).length === 12 && byMonth([], 'd', undefined, new Date(2026, 2, 1), 12)[0].label === 'Apr', 'the chart can show 3, 6 or 12 months')
  ok(windowEnd([{ d: '2026-03-10' }], 'd', new Date(2026, 2, 1)).getMonth() === 2 && windowEnd([{ d: '2026-05-10' }], 'd', new Date(2026, 2, 1)).getMonth() === 4 && windowEnd([{ d: '2027-05-10' }], 'd', new Date(2026, 2, 1)).getMonth() === 2, 'the months end where the dates end, at most three months ahead')
  const own = matchBackup(gcfg.tables, { app: gcfg.slug, tables: { members: [{ name: 'A' }], classes: [] } }, gcfg.slug)
  ok(own.matched.length === 2 && !own.foreign, 'a backup of this site: its pages are matched')
  const other = matchBackup(gcfg.tables, { app: 'another-gym', tables: { members: [{ name: 'B' }], orders: [{ x: 1 }] } }, gcfg.slug)
  ok(other.matched.length === 1 && other.matched[0].id === 'members' && other.foreign, 'a backup of another site: the pages with the same name are used, the others are not')
  ok(matchBackup(gcfg.tables, { app: 'x', tables: { orders: [{ x: 1 }] } }, gcfg.slug).matched.length === 0 && matchBackup(gcfg.tables, {}, gcfg.slug).matched.length === 0 && matchBackup(gcfg.tables, { tables: { members: 'text' } }, gcfg.slug).matched.length === 0, 'a backup with no page that fits, or a broken one, restores nothing')
}

// the kind of a new column: said, or read from its name
{
  const typeOf = (text, label = 'Members') => { const r = parseEdit(text, 'single'); const lib = page('Gym in Pune with personal training, plans: basic 999 rupees, premium 1999 rupees', editsFrom([{ op: 'app', on: true }, ...(r.kind === 'ops' ? r.ops : [])])); const t = appConfigFor(lib.content, { themeKey: lib.themeKey }).tables.find((x) => x.label === label); return t }
  const st = typeOf('Classes me Status column jodo', 'Classes')?.columns.find((c) => c.label === 'Status' && c.options?.includes('Done'))
  ok(!!st, 'a column named Status is a status column')
  ok(typeOf('Members me Due date column jodo')?.columns.find((c) => c.label === 'Due Date')?.type === 'date', 'a column named Due date is a date column')
  ok(typeOf('Members me Amount column jodo')?.columns.find((c) => c.label === 'Amount')?.type === 'money', 'a column named Amount is a money column')
  ok(typeOf('Members me Age column jodo')?.columns.find((c) => c.label === 'Age')?.type === 'number', 'a column named Age is a number column')
  ok(typeOf('Members me Joined column jodo, type date')?.columns.find((c) => c.label === 'Joined')?.type === 'date', 'the type said on purpose is used')
  ok(typeOf('Members me Rent column jodo')?.columns.find((c) => c.label === 'Rent')?.type === 'money', 'a column named Rent is a money column')
  const withRows = typeOf('Members me Amount column jodo')
  ok(withRows?.rows.every((r) => /\d/.test(r.amount ?? '')), 'the rows of a new money column have amounts')
}

// the pages of the dashboard, changed from the chat
const dash = (text) => {
  const r = parseEdit(text, 'single')
  const lib = page('Dr. Mehta dental clinic in Surat, braces, implants', editsFrom([{ op: 'app', on: true }, ...(r.kind === 'ops' ? r.ops : [])]))
  return { r, cfg: appConfigFor(lib.content, { themeKey: lib.themeKey, niche: typeof lib.niche === 'string' ? lib.niche : lib.niche?.id }) }
}
{
  const a = dash('dashboard se Billing hatao')
  ok(!a.cfg.tables.some((t) => t.label === 'Billing') && a.cfg.tables.length === 2, 'dashboard: "Billing" is taken out of the sidebar')
  const b = dash('dashboard me Reports page add karo')
  ok(b.cfg.tables.some((t) => t.label === 'Reports' && t.rows.length >= 3 && t.rows.every((r) => t.columns.every((c) => c.key in r))), 'dashboard: a new "Reports" page with example rows')
  const c = dash('dashboard me Patients ko Clients naam do')
  ok(c.cfg.tables.some((t) => t.label === 'Clients') && !c.cfg.tables.some((t) => t.label === 'Patients'), 'dashboard: "Patients" is renamed "Clients"')
  const d = dash('Patients table me Age column jodo')
  ok(d.cfg.tables.find((t) => t.label === 'Patients')?.columns.some((x) => x.label === 'Age'), 'dashboard: a column "Age" is added to Patients')
  const e = dash('add column Age to the Patients page')
  ok(e.cfg.tables.find((t) => t.label === 'Patients')?.columns.some((x) => x.label === 'Age'), 'dashboard: "add column Age to the Patients page"')
  ok(dash('dashboard hatao').cfg.tables.length >= 1 && !page('Dr. Mehta dental clinic in Surat, braces, implants', editsFrom([{ op: 'app', on: true }, { op: 'app', on: false }])).content.app, 'removing the dashboard turns the app off')
}

console.log(`app: ${passed} checks passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
