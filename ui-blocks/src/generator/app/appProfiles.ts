// What the dashboard of each kind of business shows: its pages, its columns and its example rows. Nothing is stored anywhere: the rows are example data written here from the business of the site
// (its services, its prices, its name), the same every time, and the person changes them in the demo app. See appRuntime.ts.
import type { WebsiteContent } from '../finalPrompt'
import type { AppConfig, AppTable } from './appRuntime'

export type AppKind = 'clinic' | 'gym' | 'shop' | 'food' | 'salon' | 'learning' | 'software' | 'office' | 'creator' | 'property' | 'events' | 'travel' | 'general'

const NAMES = ['Aarav Mehta', 'Diya Sharma', 'Vihaan Rao', 'Ananya Iyer', 'Kabir Singh', 'Isha Verma', 'Rohan Gupta', 'Meera Nair', 'Arjun Patel', 'Sara Khan', 'Ishaan Joshi', 'Tara Menon', 'Neil Fernandes', 'Priya Das', 'Yash Kulkarni', 'Riya Bose', 'Dev Malhotra', 'Kiara Shah']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

/** which kind of dashboard fits the business (by niche, by type of site and by what the business says it is) */
export function appKindOf(o: { themeKey: string; niche?: string; subject?: string; voice?: string; bespoke?: boolean; prompt?: string }): AppKind {
  const s = `${o.niche ?? ''} ${o.subject ?? ''} ${o.prompt ?? ''}`.toLowerCase()
  const RULES: [AppKind, RegExp][] = [
    ['creator', /\b(?:influencer|youtuber|podcast|streamer|blogger|vlogger|followers|subscribers)\b/],
    ['office', /\b(?:office|coworking|desk booking|visitor management|facility)\b/],
    ['gym', /\b(?:gym|fitness|yoga|crossfit|martial|zumba|pilates)\b/],
    ['learning', /\b(?:school|academy|coaching|classes|tuition|institute|course|training|tutor|learn)\b/],
    ['software', /\b(?:software|saas|app|platform|crm|erp)\b/],
    ['clinic', /\b(?:clinic|dental|dentist|doctor|hospital|physio|therap|dietitian|nutrition|pharmacy|medical)\b/],
    ['salon', /\b(?:salon|spa|beauty|makeup|barber|parlour|parlor|massage)\b/],
    ['food', /\b(?:restaurant|cafe|café|bakery|kitchen|catering|bar|diner|food|sweets|pizza|tiffin)\b/],
    ['property', /\b(?:real estate|property|builder|broker|apartments?|rental|pg|hostel)\b/],
    ['events', /\b(?:wedding|event|decor|dj|planner|photograph|videograph)\b/],
    ['travel', /\b(?:travel|tour|trip|hotel|resort|stay|homestay)\b/],
    ['shop', /\b(?:shop|store|boutique|kirana|grocery|retail|fashion|jewel|furniture|electronics|mart|thrift)\b/],
  ]
  if (o.voice === 'me') return 'creator'
  const byWords = RULES.find(([, re]) => re.test(s))
  if (byWords) return byWords[0]
  const BY_THEME: Record<string, AppKind> = { modern_tech: 'software', healthcare: 'clinic', bold_fitness: 'gym', beauty_wellness: 'salon', food_dining: 'food', education: 'learning', real_estate: 'property', events_wedding: 'events', travel_tourism: 'travel', fashion_retail: 'shop' }
  return BY_THEME[o.themeKey] ?? 'general'
}

/** the same numbers every time for the same business */
function seeded(text: string) {
  let h = 2166136261
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'site'

type Gen = { pick: <T>(list: T[]) => T; int: (min: number, max: number) => number; name: () => string; date: (back?: number, ahead?: number) => string; money: (min: number, max: number, step?: number) => string; serviceList: string[]; currency: string }

function toRows(n: number, make: (i: number, g: Gen) => Record<string, string>, g: Gen) {
  return Array.from({ length: n }, (_, i) => make(i, g))
}

export function appConfigFor(content: WebsiteContent, o: { themeKey: string; niche?: string; prompt?: string }): AppConfig {
  const brand = content.brandName
  const r = seeded(`${brand}|${o.niche ?? ''}|${content.subject}`)
  const kind = appKindOf({ themeKey: o.themeKey, niche: o.niche, subject: content.subject, voice: content.voice, prompt: o.prompt })
  const cur = /₹/.test(JSON.stringify(content.pricing.plans)) || /\brupees?\b|₹/i.test(o.prompt ?? '') ? '₹' : /£/.test(JSON.stringify(content.pricing.plans)) ? '£' : /€/.test(JSON.stringify(content.pricing.plans)) ? '€' : /₹|india|jaipur|delhi|mumbai|pune|surat|lucknow/i.test(`${o.prompt} ${content.contact.address}`) ? '₹' : '$'
  const today = new Date()
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const g: Gen = {
    pick: (list) => list[Math.floor(r() * list.length)],
    int: (min, max) => Math.floor(min + r() * (max - min + 1)),
    name: () => NAMES[Math.floor(r() * NAMES.length)],
    date: (back = 20, ahead = 0) => iso(new Date(today.getTime() + (Math.floor(r() * (back + ahead + 1)) - back) * 86400000)),
    money: (min, max, step = 50) => `${cur}${(Math.round((min + r() * (max - min)) / step) * step).toLocaleString(cur === '₹' ? 'en-IN' : 'en-US')}`,
    serviceList: content.features.items.map((f) => f.title).filter((t) => t.length <= 32).slice(0, 8),
    currency: cur,
  }
  if (!g.serviceList.length) g.serviceList = ['Consultation', 'Standard service', 'Premium service']
  const planNames = content.pricing.fromPrompt ? content.pricing.plans.map((p) => p.name).slice(0, 4) : []
  const status = (a: string[]) => a
  const col = (key: string, label: string, type: 'text' | 'number' | 'money' | 'date' | 'status' = 'text', options?: string[]) => ({ key, label, type, ...(options ? { options } : {}) })
  const table = (id: string, label: string, singular: string, icon: string, columns: AppTable['columns'], rows: Record<string, string>[], title = label): AppTable => ({ id, label, title, singular, icon, columns, rows })
  const customers = (n = 12) => toRows(n, () => ({ name: g.name(), phone: `+91 9${g.int(100000000, 999999999)}`, email: '', joined: g.date(120) }), g).map((x) => ({ ...x, email: `${x.name.split(' ')[0].toLowerCase()}@example.com` }))

  let tables: AppTable[] = []
  let kpis: AppConfig['kpis'] = []
  let chart: AppConfig['chart'] = { title: 'Last six months', labels: MONTHS, values: MONTHS.map(() => g.int(20, 80)) }
  const kp = (label: string, value: string, note: string) => ({ label, value, note })
  const sum = (rows: Record<string, string>[], key: string) => rows.reduce((t, x) => t + (parseFloat(String(x[key]).replace(/[^\d.]/g, '')) || 0), 0)
  const fmt = (n: number) => `${cur}${Math.round(n).toLocaleString(cur === '₹' ? 'en-IN' : 'en-US')}`

  switch (kind) {
    case 'clinic': {
      const appts = toRows(12, () => ({ patient: g.name(), treatment: g.pick(g.serviceList), date: g.date(6, 12), status: g.pick(status(['Booked', 'Completed', 'Waiting', 'Cancelled'])) }), g)
      const bills = toRows(10, () => ({ patient: g.name(), item: g.pick(g.serviceList), amount: g.money(500, 15000), status: g.pick(['Paid', 'Pending', 'Partly paid']) }), g)
      tables = [
        table('appointments', 'Appointments', 'appointment', 'calendar', [col('patient', 'Patient'), col('treatment', 'Treatment'), col('date', 'Date', 'date'), col('status', 'Status', 'status', ['Booked', 'Completed', 'Waiting', 'Cancelled'])], appts),
        table('patients', 'Patients', 'patient', 'users', [col('name', 'Name'), col('phone', 'Phone'), col('email', 'Email'), col('joined', 'First visit', 'date')], customers()),
        table('billing', 'Billing', 'bill', 'money', [col('patient', 'Patient'), col('item', 'For'), col('amount', 'Amount', 'money'), col('status', 'Status', 'status', ['Paid', 'Pending', 'Partly paid'])], bills),
      ]
      kpis = [kp('Appointments', String(appts.length), 'this month'), kp('Patients', '12', 'on record'), kp('Billed', fmt(sum(bills, 'amount')), 'this month'), kp('Waiting', String(appts.filter((a) => a.status === 'Waiting').length), 'today')]
      chart = { title: 'Appointments by month', labels: MONTHS, values: MONTHS.map(() => g.int(18, 70)) }
      break
    }
    case 'gym': {
      const plans = planNames.length ? planNames : ['Monthly', 'Quarterly', 'Yearly']
      const members = toRows(12, () => ({ name: g.name(), plan: g.pick(plans), joined: g.date(200), status: g.pick(['Active', 'Active', 'Expiring', 'Expired']) }), g)
      const classes = toRows(8, () => ({ class: g.pick(g.serviceList), day: g.pick(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']), time: g.pick(['6:00 AM', '7:30 AM', '6:00 PM', '7:30 PM']), seats: String(g.int(6, 24)) }), g)
      const pays = toRows(10, () => ({ member: g.name(), plan: g.pick(plans), amount: g.money(500, 6000), date: g.date(30), status: g.pick(['Paid', 'Paid', 'Due']) }), g)
      tables = [
        table('members', 'Members', 'member', 'users', [col('name', 'Name'), col('plan', 'Plan'), col('joined', 'Joined', 'date'), col('status', 'Status', 'status', ['Active', 'Expiring', 'Expired'])], members),
        table('classes', 'Classes', 'class', 'calendar', [col('class', 'Class'), col('day', 'Day'), col('time', 'Time'), col('seats', 'Seats', 'number')], classes),
        table('payments', 'Payments', 'payment', 'money', [col('member', 'Member'), col('plan', 'Plan'), col('amount', 'Amount', 'money'), col('date', 'Date', 'date'), col('status', 'Status', 'status', ['Paid', 'Due'])], pays),
      ]
      kpis = [kp('Members', String(members.length), `${members.filter((m) => m.status === 'Active').length} active`), kp('Classes a week', String(classes.length), 'scheduled'), kp('Collected', fmt(sum(pays.filter((p) => p.status === 'Paid'), 'amount')), 'this month'), kp('Expiring soon', String(members.filter((m) => m.status === 'Expiring').length), 'to call')]
      chart = { title: 'New members by month', labels: MONTHS, values: MONTHS.map(() => g.int(6, 40)) }
      break
    }
    case 'salon': {
      const appts = toRows(12, () => ({ client: g.name(), service: g.pick(g.serviceList), date: g.date(5, 10), time: g.pick(['10:00 AM', '12:30 PM', '3:00 PM', '5:30 PM']), status: g.pick(['Booked', 'Done', 'Booked', 'Cancelled']) }), g)
      tables = [
        table('bookings', 'Bookings', 'booking', 'calendar', [col('client', 'Client'), col('service', 'Service'), col('date', 'Date', 'date'), col('time', 'Time'), col('status', 'Status', 'status', ['Booked', 'Done', 'Cancelled'])], appts),
        table('clients', 'Clients', 'client', 'users', [col('name', 'Name'), col('phone', 'Phone'), col('email', 'Email'), col('joined', 'Since', 'date')], customers()),
        table('services', 'Services', 'service', 'list', [col('service', 'Service'), col('price', 'Price', 'money'), col('minutes', 'Minutes', 'number')], g.serviceList.map((s) => ({ service: s, price: g.money(300, 4000), minutes: String(g.pick([30, 45, 60, 90])) }))),
      ]
      kpis = [kp('Bookings', String(appts.length), 'upcoming'), kp('Clients', '12', 'on record'), kp('Services', String(g.serviceList.length), 'on the menu'), kp('Cancelled', String(appts.filter((a) => a.status === 'Cancelled').length), 'this week')]
      break
    }
    case 'food': {
      const orders = toRows(12, (i) => ({ order: `#${1040 + i}`, customer: g.name(), items: g.pick(g.serviceList), total: g.money(200, 3000), status: g.pick(['New', 'Preparing', 'Delivered', 'Delivered']) }), g)
      const menu = g.serviceList.map((s) => ({ item: s, price: g.money(80, 900, 10), available: g.pick(['In stock', 'In stock', 'Sold out']) }))
      tables = [
        table('orders', 'Orders', 'order', 'box', [col('order', 'Order'), col('customer', 'Customer'), col('items', 'Items'), col('total', 'Total', 'money'), col('status', 'Status', 'status', ['New', 'Preparing', 'Delivered'])], orders),
        table('menu', 'Menu', 'item', 'list', [col('item', 'Item'), col('price', 'Price', 'money'), col('available', 'Availability', 'status', ['In stock', 'Low', 'Sold out'])], menu),
        table('customers', 'Customers', 'customer', 'users', [col('name', 'Name'), col('phone', 'Phone'), col('email', 'Email'), col('joined', 'Since', 'date')], customers()),
      ]
      kpis = [kp('Orders', String(orders.length), 'this week'), kp('Sales', fmt(sum(orders, 'total')), 'this week'), kp('Menu items', String(menu.length), 'listed'), kp('New orders', String(orders.filter((x) => x.status === 'New').length), 'to prepare')]
      chart = { title: 'Orders by month', labels: MONTHS, values: MONTHS.map(() => g.int(40, 160)) }
      break
    }
    case 'shop': {
      const orders = toRows(12, (i) => ({ order: `#${2010 + i}`, customer: g.name(), product: g.pick(g.serviceList), total: g.money(300, 8000), status: g.pick(['New', 'Packed', 'Shipped', 'Delivered']) }), g)
      const products = g.serviceList.map((s) => ({ product: s, price: g.money(200, 6000), stock: String(g.int(0, 60)) }))
      tables = [
        table('orders', 'Orders', 'order', 'box', [col('order', 'Order'), col('customer', 'Customer'), col('product', 'Product'), col('total', 'Total', 'money'), col('status', 'Status', 'status', ['New', 'Packed', 'Shipped', 'Delivered'])], orders),
        table('products', 'Products', 'product', 'list', [col('product', 'Product'), col('price', 'Price', 'money'), col('stock', 'In stock', 'number')], products),
        table('customers', 'Customers', 'customer', 'users', [col('name', 'Name'), col('phone', 'Phone'), col('email', 'Email'), col('joined', 'Since', 'date')], customers()),
      ]
      kpis = [kp('Orders', String(orders.length), 'this week'), kp('Sales', fmt(sum(orders, 'total')), 'this week'), kp('Products', String(products.length), 'listed'), kp('To ship', String(orders.filter((x) => x.status === 'New' || x.status === 'Packed').length), 'waiting')]
      chart = { title: 'Sales by month (orders)', labels: MONTHS, values: MONTHS.map(() => g.int(30, 140)) }
      break
    }
    case 'learning': {
      const students = toRows(12, () => ({ name: g.name(), course: g.pick(g.serviceList), batch: g.pick(['Morning', 'Evening', 'Weekend']), fees: g.pick(['Paid', 'Paid', 'Due']) }), g)
      const batches = toRows(5, (i) => ({ batch: ['Morning A', 'Evening A', 'Weekend', 'Morning B', 'Evening B'][i], timing: g.pick(['7:00 AM', '5:00 PM', '10:00 AM']), seats: String(g.int(15, 40)), teacher: g.name() }), g)
      tables = [
        table('students', 'Students', 'student', 'users', [col('name', 'Name'), col('course', 'Course'), col('batch', 'Batch'), col('fees', 'Fees', 'status', ['Paid', 'Due'])], students),
        table('batches', 'Batches', 'batch', 'calendar', [col('batch', 'Batch'), col('timing', 'Timing'), col('seats', 'Seats', 'number'), col('teacher', 'Teacher')], batches),
        table('fees', 'Fees', 'fee', 'money', [col('student', 'Student'), col('amount', 'Amount', 'money'), col('date', 'Date', 'date'), col('status', 'Status', 'status', ['Paid', 'Due'])], toRows(10, () => ({ student: g.name(), amount: g.money(1500, 12000, 100), date: g.date(40), status: g.pick(['Paid', 'Paid', 'Due']) }), g)),
      ]
      kpis = [kp('Students', String(students.length), 'enrolled'), kp('Batches', String(batches.length), 'running'), kp('Fees due', String(students.filter((s) => s.fees === 'Due').length), 'to collect'), kp('Courses', String(g.serviceList.length), 'offered')]
      break
    }
    case 'software': {
      const plans = planNames.length ? planNames : ['Starter', 'Team', 'Business']
      const projects = toRows(10, () => ({ project: `${g.pick(['Onboarding', 'Q3 rollout', 'Pilot', 'Migration', 'Training', 'Reporting', 'Integration'])} ${g.int(1, 9)}`, owner: g.name(), due: g.date(5, 25), status: g.pick(['In progress', 'Done', 'In progress', 'Blocked']) }), g)
      const team = toRows(8, () => ({ name: g.name(), role: g.pick(['Admin', 'Manager', 'Member', 'Viewer']), email: '', status: g.pick(['Active', 'Active', 'Invited']) }), g).map((x) => ({ ...x, email: `${x.name.split(' ')[0].toLowerCase()}@example.com` }))
      tables = [
        table('projects', 'Projects', 'project', 'list', [col('project', 'Project'), col('owner', 'Owner'), col('due', 'Due', 'date'), col('status', 'Status', 'status', ['In progress', 'Done', 'Blocked'])], projects),
        table('team', 'Team', 'member', 'users', [col('name', 'Name'), col('role', 'Role'), col('email', 'Email'), col('status', 'Status', 'status', ['Active', 'Invited'])], team),
        table('billing', 'Billing', 'invoice', 'money', [col('invoice', 'Invoice'), col('plan', 'Plan'), col('amount', 'Amount', 'money'), col('date', 'Date', 'date'), col('status', 'Status', 'status', ['Paid', 'Due'])], toRows(6, (i) => ({ invoice: `INV-${300 + i}`, plan: g.pick(plans), amount: g.money(900, 9000, 100), date: g.date(150), status: g.pick(['Paid', 'Paid', 'Due']) }), g)),
      ]
      kpis = [kp('Active projects', String(projects.filter((p) => p.status === 'In progress').length), 'right now'), kp('Team members', String(team.length), 'in the workspace'), kp('Completed', String(projects.filter((p) => p.status === 'Done').length), 'this quarter'), kp('Blocked', String(projects.filter((p) => p.status === 'Blocked').length), 'need attention')]
      chart = { title: 'Weekly activity', labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'], values: [1, 2, 3, 4, 5, 6].map(() => g.int(30, 120)) }
      break
    }
    case 'office': {
      const desks: Record<string, string>[] = toRows(12, (i): Record<string, string> => ({ desk: `D-${101 + i}`, floor: g.pick(['Floor 1', 'Floor 2', 'Floor 3']), assigned: g.pick(['Free', 'Booked', 'Booked', 'Fixed']), who: '' }), g).map((x) => ({ ...x, who: x.assigned === 'Free' ? '' : g.name() }))
      const rooms = toRows(6, (i) => ({ room: ['Atlas', 'Everest', 'Nile', 'Orion', 'Pearl', 'Summit'][i], seats: String(g.pick([4, 6, 8, 12])), slot: g.pick(['10:00 – 11:00', '11:30 – 12:30', '2:00 – 3:00', '4:00 – 5:00']), status: g.pick(['Free', 'Booked', 'Booked']) }), g)
      const visitors = toRows(10, () => ({ visitor: g.name(), host: g.name(), date: g.date(2, 4), status: g.pick(['Expected', 'Checked in', 'Left']) }), g)
      const requests = toRows(8, () => ({ request: g.pick(['AC not cooling', 'Projector issue', 'Need extra chairs', 'Pantry refill', 'Wi-Fi slow', 'Lights flickering']), by: g.name(), date: g.date(7), status: g.pick(['Open', 'In progress', 'Resolved']) }), g)
      tables = [
        table('desks', 'Desks', 'desk', 'box', [col('desk', 'Desk'), col('floor', 'Floor'), col('assigned', 'Status', 'status', ['Free', 'Booked', 'Fixed']), col('who', 'Booked by')], desks),
        table('rooms', 'Meeting rooms', 'room', 'calendar', [col('room', 'Room'), col('seats', 'Seats', 'number'), col('slot', 'Next slot'), col('status', 'Status', 'status', ['Free', 'Booked'])], rooms),
        table('visitors', 'Visitors', 'visitor', 'users', [col('visitor', 'Visitor'), col('host', 'Host'), col('date', 'Date', 'date'), col('status', 'Status', 'status', ['Expected', 'Checked in', 'Left'])], visitors),
        table('requests', 'Facility requests', 'request', 'chat', [col('request', 'Request'), col('by', 'Raised by'), col('date', 'Date', 'date'), col('status', 'Status', 'status', ['Open', 'In progress', 'Resolved'])], requests),
      ]
      kpis = [kp('Desks free', String(desks.filter((d) => d.assigned === 'Free').length), `of ${desks.length}`), kp('Rooms booked', String(rooms.filter((x) => x.status === 'Booked').length), 'today'), kp('Visitors expected', String(visitors.filter((v) => v.status === 'Expected').length), 'today'), kp('Open requests', String(requests.filter((x) => x.status !== 'Resolved').length), 'to resolve')]
      chart = { title: 'Desk use this week', labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], values: [60, 72, 80, 76, 58, 20].map((v) => v + g.int(-6, 6)) }
      break
    }
    case 'creator': {
      const collabs = toRows(9, () => ({ brand: g.pick(['Nova Foods', 'Urban Wear', 'Glow Labs', 'Trek Gear', 'Pixel Phones', 'Chai Co.', 'Bloom Skin', 'Atlas Travel']), deliverable: g.pick(g.serviceList), fee: g.money(5000, 90000, 500), status: g.pick(['Enquiry', 'Negotiating', 'Confirmed', 'Delivered']) }), g)
      const posts = toRows(10, () => ({ title: g.pick(['Behind the scenes', 'Monthly haul', 'Q&A', 'Review day', 'Day in my life', 'Collab reveal']), channel: g.pick(['Instagram', 'YouTube', 'Reels', 'Shorts']), date: g.date(10, 14), status: g.pick(['Idea', 'Scheduled', 'Published']) }), g)
      tables = [
        table('collaborations', 'Collaborations', 'collaboration', 'money', [col('brand', 'Brand'), col('deliverable', 'Deliverable'), col('fee', 'Fee', 'money'), col('status', 'Status', 'status', ['Enquiry', 'Negotiating', 'Confirmed', 'Delivered'])], collabs),
        table('content', 'Content calendar', 'post', 'calendar', [col('title', 'Title'), col('channel', 'Channel'), col('date', 'Date', 'date'), col('status', 'Status', 'status', ['Idea', 'Scheduled', 'Published'])], posts),
        table('messages', 'Messages', 'message', 'chat', [col('from', 'From'), col('subject', 'Subject'), col('date', 'Date', 'date'), col('status', 'Status', 'status', ['New', 'Replied'])], toRows(8, () => ({ from: g.name(), subject: g.pick(['Collab enquiry', 'Media kit request', 'Event invite', 'Product gifting']), date: g.date(12), status: g.pick(['New', 'Replied']) }), g)),
      ]
      const fans = (content.stats.find((s) => /follow|subscri|listen|fans/i.test(s.label)))
      kpis = [kp(fans?.label ?? 'Audience', fans?.value ?? '—', 'as you wrote it'), kp('Open enquiries', String(collabs.filter((c) => c.status === 'Enquiry' || c.status === 'Negotiating').length), 'to answer'), kp('Confirmed', fmt(sum(collabs.filter((c) => c.status === 'Confirmed' || c.status === 'Delivered'), 'fee')), 'in fees'), kp('Scheduled posts', String(posts.filter((p) => p.status === 'Scheduled').length), 'coming up')]
      chart = { title: 'Views by month (example)', labels: MONTHS, values: MONTHS.map(() => g.int(20, 100)) }
      break
    }
    case 'property': {
      const listings = toRows(10, () => ({ listing: `${g.pick(['2BHK', '3BHK', '1BHK', 'Studio', 'Villa', 'Office'])} · ${g.pick(['Sector 4', 'Park Road', 'Lake View', 'Old Town', 'Hill Side'])}`, price: g.money(2500000, 18000000, 100000), status: g.pick(['Available', 'Available', 'Under offer', 'Sold']) }), g)
      tables = [
        table('listings', 'Listings', 'listing', 'box', [col('listing', 'Property'), col('price', 'Price', 'money'), col('status', 'Status', 'status', ['Available', 'Under offer', 'Sold'])], listings),
        table('leads', 'Leads', 'lead', 'users', [col('name', 'Name'), col('phone', 'Phone'), col('interest', 'Interested in'), col('status', 'Stage', 'status', ['New', 'Contacted', 'Visit booked', 'Closed'])], toRows(10, () => ({ name: g.name(), phone: `+91 9${g.int(100000000, 999999999)}`, interest: g.pick(['2BHK', '3BHK', 'Villa', 'Plot', 'Office']), status: g.pick(['New', 'Contacted', 'Visit booked', 'Closed']) }), g)),
        table('visits', 'Site visits', 'visit', 'calendar', [col('name', 'Visitor'), col('listing', 'Property'), col('date', 'Date', 'date'), col('status', 'Status', 'status', ['Booked', 'Done', 'Cancelled'])], toRows(8, () => ({ name: g.name(), listing: g.pick(listings).listing, date: g.date(4, 12), status: g.pick(['Booked', 'Done', 'Cancelled']) }), g)),
      ]
      kpis = [kp('Listings', String(listings.length), 'on the books'), kp('Available', String(listings.filter((l) => l.status === 'Available').length), 'to show'), kp('New leads', '4', 'this week'), kp('Visits booked', '5', 'this week')]
      break
    }
    case 'events': {
      const events = toRows(8, () => ({ event: g.pick(['Wedding', 'Sangeet', 'Birthday', 'Corporate dinner', 'Engagement', 'Reception']), client: g.name(), date: g.date(15, 70), budget: g.money(50000, 900000, 5000), status: g.pick(['Enquiry', 'Planning', 'Confirmed', 'Done']) }), g)
      tables = [
        table('events', 'Events', 'event', 'calendar', [col('event', 'Event'), col('client', 'Client'), col('date', 'Date', 'date'), col('budget', 'Budget', 'money'), col('status', 'Status', 'status', ['Enquiry', 'Planning', 'Confirmed', 'Done'])], events),
        table('clients', 'Clients', 'client', 'users', [col('name', 'Name'), col('phone', 'Phone'), col('email', 'Email'), col('joined', 'Since', 'date')], customers(10)),
        table('vendors', 'Vendors', 'vendor', 'box', [col('vendor', 'Vendor'), col('work', 'Work'), col('phone', 'Phone'), col('status', 'Status', 'status', ['Booked', 'Pending'])], g.serviceList.map((s) => ({ vendor: g.name(), work: s, phone: `+91 9${g.int(100000000, 999999999)}`, status: g.pick(['Booked', 'Pending']) }))),
      ]
      kpis = [kp('Events', String(events.length), 'on the calendar'), kp('Confirmed', String(events.filter((e) => e.status === 'Confirmed').length), 'booked'), kp('Pipeline', fmt(sum(events, 'budget')), 'in budgets'), kp('Enquiries', String(events.filter((e) => e.status === 'Enquiry').length), 'to answer')]
      break
    }
    case 'travel': {
      const trips = toRows(9, () => ({ guest: g.name(), trip: g.pick(g.serviceList), date: g.date(10, 60), guests: String(g.int(1, 6)), status: g.pick(['Enquiry', 'Confirmed', 'Paid', 'Completed']) }), g)
      tables = [
        table('bookings', 'Bookings', 'booking', 'calendar', [col('guest', 'Guest'), col('trip', 'Trip / stay'), col('date', 'Date', 'date'), col('guests', 'People', 'number'), col('status', 'Status', 'status', ['Enquiry', 'Confirmed', 'Paid', 'Completed'])], trips),
        table('guests', 'Guests', 'guest', 'users', [col('name', 'Name'), col('phone', 'Phone'), col('email', 'Email'), col('joined', 'Since', 'date')], customers(10)),
        table('packages', 'Packages', 'package', 'list', [col('package', 'Package'), col('price', 'Price', 'money'), col('days', 'Days', 'number')], g.serviceList.map((s) => ({ package: s, price: g.money(4000, 60000, 500), days: String(g.int(1, 8)) }))),
      ]
      kpis = [kp('Bookings', String(trips.length), 'upcoming'), kp('Confirmed', String(trips.filter((t) => t.status !== 'Enquiry').length), 'locked in'), kp('Packages', String(g.serviceList.length), 'offered'), kp('Enquiries', String(trips.filter((t) => t.status === 'Enquiry').length), 'to answer')]
      break
    }
    default: {
      const reqs = toRows(10, () => ({ customer: g.name(), request: g.pick(g.serviceList), date: g.date(14, 7), status: g.pick(['New', 'In progress', 'Done', 'In progress']) }), g)
      tables = [
        table('requests', 'Requests', 'request', 'list', [col('customer', 'Customer'), col('request', 'Request'), col('date', 'Date', 'date'), col('status', 'Status', 'status', ['New', 'In progress', 'Done'])], reqs),
        table('customers', 'Customers', 'customer', 'users', [col('name', 'Name'), col('phone', 'Phone'), col('email', 'Email'), col('joined', 'Since', 'date')], customers()),
        table('messages', 'Messages', 'message', 'chat', [col('from', 'From'), col('subject', 'Subject'), col('date', 'Date', 'date'), col('status', 'Status', 'status', ['New', 'Replied'])], toRows(8, () => ({ from: g.name(), subject: g.pick(['Question about a service', 'Quote request', 'Feedback', 'Appointment']), date: g.date(12), status: g.pick(['New', 'Replied']) }), g)),
      ]
      kpis = [kp('Requests', String(reqs.length), 'this month'), kp('Customers', '12', 'on record'), kp('New', String(reqs.filter((x) => x.status === 'New').length), 'to answer'), kp('Done', String(reqs.filter((x) => x.status === 'Done').length), 'this month')]
    }
  }
  return { brand, slug: slug(brand), kpis, chart, tables }
}
