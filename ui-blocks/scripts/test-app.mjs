// The demo app of a site (log in, register, a dashboard with example data, no backend): the pages and rows of each kind of business, the command in the chat, the export.   node scripts/test-app.mjs
import { loadGeneratorModule } from './lib/load-generator.mjs'

globalThis.document = { styleSheets: [] }
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} }
const { generateLibraryPage } = await loadGeneratorModule('library/generateLibraryPage.ts')
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
  ok(cfg.kpis.length === 4 && cfg.chart.values.length === cfg.chart.labels.length, `${prompt.slice(0, 30)}: four numbers and a chart`)
  ok(JSON.stringify(cfg) === JSON.stringify(appConfigFor(lib.content, { themeKey: lib.themeKey, niche: typeof lib.niche === 'string' ? lib.niche : lib.niche?.id, prompt })), `${prompt.slice(0, 30)}: the same data every time`)
  ok(!/\bundefined\b|\[object/.test(JSON.stringify(cfg)), `${prompt.slice(0, 30)}: no undefined in the data`)
}
const inf = page(CASES[5][0])
const cfgInf = appConfigFor(inf.content, { themeKey: inf.themeKey, prompt: CASES[5][0] })
ok(cfgInf.kpis[0].value === '250K+', 'creator: the audience number is the first figure')
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
