// What the dashboard of each kind of business shows: its pages, its columns and its example rows. Nothing is stored anywhere: the rows are example data written here from the business of the site
// (its services, its prices, its name), the same every time, and the person changes them in the demo app. See appRuntime.ts.
import type { WebsiteContent } from '../finalPrompt'
import { modeOf } from '../bespoke'
import type { AppConfig, AppKpi, AppTable } from './appRuntime'

export type AppKind = 'ngo' | 'legal' | 'construction' | 'auto' | 'homeservices' | 'logistics' | 'pets' | 'finance' | 'consult' | 'farm' | 'clinic' | 'gym' | 'shop' | 'food' | 'salon' | 'learning' | 'software' | 'office' | 'creator' | 'property' | 'events' | 'travel' | 'general'

const NAMES = ['Aarav Mehta', 'Diya Sharma', 'Vihaan Rao', 'Ananya Iyer', 'Kabir Singh', 'Isha Verma', 'Rohan Gupta', 'Meera Nair', 'Arjun Patel', 'Sara Khan', 'Ishaan Joshi', 'Tara Menon', 'Neil Fernandes', 'Priya Das', 'Yash Kulkarni', 'Riya Bose', 'Dev Malhotra', 'Kiara Shah']

/** which kind of dashboard fits the business (by niche, by type of site and by what the business says it is) */
export function appKindOf(o: { themeKey: string; niche?: string; subject?: string; voice?: string; bespoke?: boolean; prompt?: string }): AppKind {
  const s = `${o.niche ?? ''} ${o.subject ?? ''} ${o.prompt ?? ''}`.toLowerCase().replace(/_/g, ' ')
  const RULES: [AppKind, RegExp][] = [
    ['creator', /\b(?:influencer|youtuber|podcast|streamer|blogger|vlogger|followers|subscribers)\b/],
    ['general', /\b(?:escape rooms?|board games?|arcade|bowling alley|trampoline|amusement|laser tag|go ?kart\w*|paintball|vr zone|gaming (?:zone|lounge|cafe)|museum|aquarium|theme park|water park)\b/],
    ['gym', /\b(?:gym|fitness|yoga|crossfit|martial|zumba|pilates)\b/],
    ['learning', /\b(?:school|academy|coaching|classes|tuition|institute|course|training|tutor|learn)\b/],
    ['ngo', /\b(?:ngo|charity|foundation|donat\w*|volunteers?|nonprofit|non-profit|trust|shelter|rescue|welfare|orphanage|ashram|relief|cause)\b/],
    ['legal', /\b(?:law|lawyer|advocate|attorney|legal|solicitor|notary|litigation)\b/],
    ['construction', /\b(?:construction|contractor|civil|architect\w*|interior|renovation|plumb\w*|electrician|carpent\w*|roofing)\b/],
    ['auto', /\b(?:car|cars|bike|garage|automobile|mechanic|vehicle|tyre|tire|car wash)\b/],
    ['logistics', /\b(?:movers|packers|courier|logistics|transport|delivery service|freight|shipping company|cargo)\b/],
    ['pets', /\b(?:pet|pets|dog|dogs|cat|cats|vet|veterinary|grooming)\b/],
    ['finance', /\b(?:insurance|loan|finance|accounting|chartered|ca firm|tax|investment|mutual fund|wealth|gst)\b/],
    ['office', /\b(?:office|coworking|desk booking|visitor management|facility)\b/],
    ['software', /\b(?:software|saas|app|platform|crm|erp)\b/],
    ['clinic', /\b(?:clinic|dental|dentist|doctor|hospital|physio|therap|dietitian|nutrition|pharmacy|medical|ayurved\w*|homeopath\w*|diagnostic|lab|eye|skin|ortho\w*|dermat\w*|pathology)\b/],
    ['salon', /\b(?:salon|spa|beauty|makeup|barber|parlour|parlor|massage|tattoo|nail|mehndi|mehendi|waxing|hair)\b/],
    ['food', /\b(?:restaurant|cafe|café|bakery|kitchen|catering|bar|diner|food|sweets|pizza|tiffin|dhaba|canteen|juice|ice cream|momos|biryani|chai|tapri)\b/],
    ['property', /\b(?:real estate|property|builder|broker|apartments?|rental|pg|hostel|plots?|flats?|villa|coliving)\b/],
    ['shop', /\b(?:printing|printers?|print shop|press|stationery|flex|banner printing)\b/],
    ['events', /\b(?:wedding|event|decor|dj|planner|photograph|videograph)\b/],
    ['travel', /\b(?:travel|tour|trip|hotel|resort|stay|homestay|hostel stay|guest ?house|safari|trek\w*|camp\w*)\b/],
    ['consult', /\b(?:astrolog\w*|tarot|vastu|consultant|consultancy|counsell?ing|coach|therapist|numerolog\w*)\b/],
    ['farm', /\b(?:farm|farmer|dairy|agri\w*|nursery|plants?|seeds?|honey|beekeeping)\b/],
    ['homeservices', /\b(?:cleaning|pest|repair|ac service|appliance|laundry|maid|housekeeping|handyman|home services?|pest control|locksmith)\b/],
    ['shop', /\b(?:shop|store|boutique|kirana|grocery|retail|fashion|jewel|furniture|electronics|mart|thrift|mobile|gift|stationery|toys|books?|pharmacy store|optical|footwear|garments?|saree|kurti|cloth\w*)\b/],
  ]
  if (o.voice === 'me') return 'creator'
  // the words of the subject and of the niche count most, the other words (the cards of the page) less: "home cleaning" with a "kitchen cleaning" card is not a restaurant
  const strong = `${o.niche ?? ''} ${o.subject ?? ''}`.toLowerCase().replace(/_/g, ' ')
  const scored = RULES.map(([kind, re], order) => ({ kind, order, score: (re.test(strong) ? 3 : 0) + (re.test(s) ? 1 : 0) })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score || a.order - b.order)
  if (scored.length) return scored[0].kind
  const BY_THEME: Record<string, AppKind> = { nonprofit: 'ngo', professional_services: 'consult', automotive: 'auto', home_services: 'homeservices', pets_animals: 'pets', organic_nature: 'farm', modern_tech: 'software', healthcare: 'clinic', bold_fitness: 'gym', beauty_wellness: 'salon', food_dining: 'food', education: 'learning', real_estate: 'property', events_wedding: 'events', travel_tourism: 'travel', fashion_retail: 'shop' }
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

/** the four figures of the overview: [label, note, page, kind, column, value] (rows counted, rows with a status counted, or a money column added up) */
type Spec = [string, string, string, 'count' | 'status' | 'sum', string?, string?]
const SPECS: Record<string, Spec[]> = {
  clinic: [['Appointments', 'all booked', 'appointments', 'count'], ['Waiting', 'in the queue', 'appointments', 'status', 'status', 'Waiting'], ['Patients', 'on record', 'patients', 'count'], ['Billed', 'in total', 'billing', 'sum', 'amount']],
  gym: [['Members', 'on record', 'members', 'count'], ['Active', 'members', 'members', 'status', 'status', 'Active'], ['Expiring', 'to call', 'members', 'status', 'status', 'Expiring'], ['Collected', 'in total', 'payments', 'sum', 'amount']],
  salon: [['Bookings', 'in total', 'bookings', 'count'], ['Booked', 'coming up', 'bookings', 'status', 'status', 'Booked'], ['Clients', 'on record', 'clients', 'count'], ['Services', 'on the menu', 'services', 'count']],
  food: [['Orders', 'in total', 'orders', 'count'], ['New orders', 'to prepare', 'orders', 'status', 'status', 'New'], ['Sales', 'in total', 'orders', 'sum', 'total'], ['Menu items', 'listed', 'menu', 'count']],
  shop: [['Orders', 'in total', 'orders', 'count'], ['New orders', 'to pack', 'orders', 'status', 'status', 'New'], ['Sales', 'in total', 'orders', 'sum', 'total'], ['Products', 'listed', 'products', 'count']],
  learning: [['Students', 'enrolled', 'students', 'count'], ['Fees due', 'to collect', 'students', 'status', 'fees', 'Due'], ['Batches', 'running', 'batches', 'count'], ['Collected', 'in fees', 'fees', 'sum', 'amount']],
  software: [['Projects', 'in total', 'projects', 'count'], ['In progress', 'right now', 'projects', 'status', 'status', 'In progress'], ['Blocked', 'need attention', 'projects', 'status', 'status', 'Blocked'], ['Team members', 'in the workspace', 'team', 'count']],
  office: [['Desks free', 'to book', 'desks', 'status', 'assigned', 'Free'], ['Rooms booked', 'today', 'rooms', 'status', 'status', 'Booked'], ['Visitors expected', 'today', 'visitors', 'status', 'status', 'Expected'], ['Open requests', 'to resolve', 'requests', 'status', 'status', 'Open']],
  creator: [['Collaborations', 'in total', 'collaborations', 'count'], ['Enquiries', 'to answer', 'collaborations', 'status', 'status', 'Enquiry'], ['Fees', 'in total', 'collaborations', 'sum', 'fee'], ['Scheduled posts', 'coming up', 'content', 'status', 'status', 'Scheduled']],
  property: [['Listings', 'on the books', 'listings', 'count'], ['Available', 'to show', 'listings', 'status', 'status', 'Available'], ['New leads', 'to call', 'leads', 'status', 'status', 'New'], ['Visits booked', 'coming up', 'visits', 'status', 'status', 'Booked']],
  events: [['Events', 'on the calendar', 'events', 'count'], ['Confirmed', 'booked', 'events', 'status', 'status', 'Confirmed'], ['Pipeline', 'in budgets', 'events', 'sum', 'budget'], ['Enquiries', 'to answer', 'events', 'status', 'status', 'Enquiry']],
  travel: [['Bookings', 'in total', 'bookings', 'count'], ['Enquiries', 'to answer', 'bookings', 'status', 'status', 'Enquiry'], ['Confirmed', 'locked in', 'bookings', 'status', 'status', 'Confirmed'], ['Packages', 'offered', 'packages', 'count']],
  ngo: [['Raised', 'received', 'donations', 'sum', 'amount'], ['Donors', 'on record', 'donors', 'count'], ['Volunteers', 'registered', 'volunteers', 'count'], ['Campaigns', 'on the books', 'campaigns', 'count']],
  legal: [['Open cases', 'right now', 'cases', 'status', 'status', 'Open'], ['Hearings', 'scheduled', 'hearings', 'status', 'status', 'Scheduled'], ['Clients', 'on record', 'clients', 'count'], ['Pending fees', 'to collect', 'invoices', 'status', 'status', 'Pending']],
  construction: [['Running', 'on site', 'projects', 'status', 'status', 'In progress'], ['Quotes', 'in all', 'quotes', 'count'], ['Visits booked', 'coming up', 'visits', 'status', 'status', 'Booked'], ['Order book', 'all projects', 'projects', 'sum', 'budget']],
  auto: [['In workshop', 'now', 'jobs', 'status', 'status', 'In workshop'], ['Ready', 'to deliver', 'jobs', 'status', 'status', 'Ready'], ['Billed', 'estimates', 'jobs', 'sum', 'amount'], ['Bookings', 'upcoming', 'bookings', 'status', 'status', 'Booked']],
  homeservices: [['New jobs', 'to assign', 'jobs', 'status', 'status', 'New'], ['Done', 'jobs', 'jobs', 'status', 'status', 'Done'], ['Technicians', 'on the team', 'technicians', 'count'], ['Customers', 'on record', 'customers', 'count']],
  logistics: [['In transit', 'now', 'shipments', 'status', 'status', 'In transit'], ['Delivered', 'shipments', 'shipments', 'status', 'status', 'Delivered'], ['Billed', 'in total', 'shipments', 'sum', 'amount'], ['Drivers', 'on the team', 'drivers', 'count']],
  pets: [['Appointments', 'in total', 'appointments', 'count'], ['Booked', 'coming up', 'appointments', 'status', 'status', 'Booked'], ['Owners', 'on record', 'owners', 'count'], ['Adoptable', 'waiting for a home', 'animals', 'status', 'status', 'Adoptable']],
  finance: [['Clients', 'on record', 'clients', 'count'], ['Active policies', 'in force', 'products', 'status', 'status', 'Active'], ['Due soon', 'to renew', 'products', 'status', 'status', 'Due soon'], ['Premium', 'in total', 'products', 'sum', 'amount']],
  consult: [['Consultations', 'in total', 'sessions', 'count'], ['Booked', 'coming up', 'sessions', 'status', 'status', 'Booked'], ['Clients', 'on record', 'clients', 'count'], ['Received', 'in payments', 'payments', 'sum', 'amount']],
  farm: [['Orders', 'in total', 'orders', 'count'], ['To pack', 'waiting', 'orders', 'status', 'status', 'New'], ['Sales', 'in total', 'orders', 'sum', 'total'], ['Products', 'listed', 'produce', 'count']],
  'general:shop': [['Orders', 'in total', 'orders', 'count'], ['New orders', 'to pack', 'orders', 'status', 'status', 'New'], ['Sales', 'in total', 'orders', 'sum', 'total'], ['Items', 'listed', 'catalogue', 'count']],
  'general:experience': [['Bookings', 'in total', 'bookings', 'count'], ['Booked', 'coming up', 'bookings', 'status', 'status', 'Booked'], ['Cancelled', 'this month', 'bookings', 'status', 'status', 'Cancelled'], ['Experiences', 'offered', 'catalogue', 'count']],
  'general:class': [['Students', 'enrolled', 'enrolments', 'count'], ['Fees due', 'to collect', 'enrolments', 'status', 'fees', 'Due'], ['Classes', 'offered', 'catalogue', 'count'], ['Students', 'on record', 'students', 'count']],
  'general:creative': [['Projects', 'on the board', 'projects', 'count'], ['In progress', 'now', 'projects', 'status', 'status', 'In progress'], ['Pipeline', 'in budgets', 'projects', 'sum', 'budget'], ['Delivered', 'so far', 'projects', 'status', 'status', 'Delivered']],
  'general:community': [['Members', 'in the community', 'members', 'count'], ['Active', 'members', 'members', 'status', 'status', 'Active'], ['Invited', 'to join', 'members', 'status', 'status', 'Invited'], ['Events', 'on the calendar', 'events', 'count']],
  'general:service': [['Requests', 'in total', 'requests', 'count'], ['New', 'to answer', 'requests', 'status', 'status', 'New'], ['Done', 'so far', 'requests', 'status', 'status', 'Done'], ['Customers', 'on record', 'customers', 'count']],
}

export function appConfigFor(content: WebsiteContent, o: { themeKey: string; niche?: string; prompt?: string }): AppConfig {
  const brand = content.brandName
  const r = seeded(`${brand}|${o.niche ?? ''}|${content.subject}`)
  // what the business says about itself, from the page (the prompt is not there in an export: the preview and the exports must give the same dashboard)
  const said = [content.subject, content.hero.title, content.hero.subtitle, content.features.items.map((f) => f.title).join(' ')].join(' ')
  const kind = appKindOf({ themeKey: o.themeKey, niche: o.niche, subject: content.subject, voice: content.voice, prompt: said })
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
      
  switch (kind) {
    case 'clinic': {
      const appts = toRows(12, () => ({ patient: g.name(), treatment: g.pick(g.serviceList), date: g.date(6, 12), status: g.pick(status(['Booked', 'Completed', 'Waiting', 'Cancelled'])) }), g)
      const bills = toRows(10, () => ({ patient: g.name(), item: g.pick(g.serviceList), amount: g.money(500, 15000), status: g.pick(['Paid', 'Pending', 'Partly paid']) }), g)
      tables = [
        table('appointments', 'Appointments', 'appointment', 'calendar', [col('patient', 'Patient'), col('treatment', 'Treatment'), col('date', 'Date', 'date'), col('status', 'Status', 'status', ['Booked', 'Completed', 'Waiting', 'Cancelled'])], appts),
        table('patients', 'Patients', 'patient', 'users', [col('name', 'Name'), col('phone', 'Phone'), col('email', 'Email'), col('joined', 'First visit', 'date')], customers()),
        table('billing', 'Billing', 'bill', 'money', [col('patient', 'Patient'), col('item', 'For'), col('amount', 'Amount', 'money'), col('status', 'Status', 'status', ['Paid', 'Pending', 'Partly paid'])], bills),
      ]
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
      break
    }
    case 'salon': {
      const appts = toRows(12, () => ({ client: g.name(), service: g.pick(g.serviceList), date: g.date(5, 10), time: g.pick(['10:00 AM', '12:30 PM', '3:00 PM', '5:30 PM']), status: g.pick(['Booked', 'Done', 'Booked', 'Cancelled']) }), g)
      tables = [
        table('bookings', 'Bookings', 'booking', 'calendar', [col('client', 'Client'), col('service', 'Service'), col('date', 'Date', 'date'), col('time', 'Time'), col('status', 'Status', 'status', ['Booked', 'Done', 'Cancelled'])], appts),
        table('clients', 'Clients', 'client', 'users', [col('name', 'Name'), col('phone', 'Phone'), col('email', 'Email'), col('joined', 'Since', 'date')], customers()),
        table('services', 'Services', 'service', 'list', [col('service', 'Service'), col('price', 'Price', 'money'), col('minutes', 'Minutes', 'number')], g.serviceList.map((s) => ({ service: s, price: g.money(300, 4000), minutes: String(g.pick([30, 45, 60, 90])) }))),
      ]
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
      break
    }
    case 'property': {
      const listings = toRows(10, () => ({ listing: `${g.pick(['2BHK', '3BHK', '1BHK', 'Studio', 'Villa', 'Office'])} · ${g.pick(['Sector 4', 'Park Road', 'Lake View', 'Old Town', 'Hill Side'])}`, price: g.money(2500000, 18000000, 100000), status: g.pick(['Available', 'Available', 'Under offer', 'Sold']) }), g)
      tables = [
        table('listings', 'Listings', 'listing', 'box', [col('listing', 'Property'), col('price', 'Price', 'money'), col('status', 'Status', 'status', ['Available', 'Under offer', 'Sold'])], listings),
        table('leads', 'Leads', 'lead', 'users', [col('name', 'Name'), col('phone', 'Phone'), col('interest', 'Interested in'), col('status', 'Stage', 'status', ['New', 'Contacted', 'Visit booked', 'Closed'])], toRows(10, () => ({ name: g.name(), phone: `+91 9${g.int(100000000, 999999999)}`, interest: g.pick(['2BHK', '3BHK', 'Villa', 'Plot', 'Office']), status: g.pick(['New', 'Contacted', 'Visit booked', 'Closed']) }), g)),
        table('visits', 'Site visits', 'visit', 'calendar', [col('name', 'Visitor'), col('listing', 'Property'), col('date', 'Date', 'date'), col('status', 'Status', 'status', ['Booked', 'Done', 'Cancelled'])], toRows(8, () => ({ name: g.name(), listing: g.pick(listings).listing, date: g.date(4, 12), status: g.pick(['Booked', 'Done', 'Cancelled']) }), g)),
      ]
      break
    }
    case 'events': {
      const events = toRows(8, () => ({ event: g.pick(['Wedding', 'Sangeet', 'Birthday', 'Corporate dinner', 'Engagement', 'Reception']), client: g.name(), date: g.date(15, 70), budget: g.money(50000, 900000, 5000), status: g.pick(['Enquiry', 'Planning', 'Confirmed', 'Done']) }), g)
      tables = [
        table('events', 'Events', 'event', 'calendar', [col('event', 'Event'), col('client', 'Client'), col('date', 'Date', 'date'), col('budget', 'Budget', 'money'), col('status', 'Status', 'status', ['Enquiry', 'Planning', 'Confirmed', 'Done'])], events),
        table('clients', 'Clients', 'client', 'users', [col('name', 'Name'), col('phone', 'Phone'), col('email', 'Email'), col('joined', 'Since', 'date')], customers(10)),
        table('vendors', 'Vendors', 'vendor', 'box', [col('vendor', 'Vendor'), col('work', 'Work'), col('phone', 'Phone'), col('status', 'Status', 'status', ['Booked', 'Pending'])], g.serviceList.map((s) => ({ vendor: g.name(), work: s, phone: `+91 9${g.int(100000000, 999999999)}`, status: g.pick(['Booked', 'Pending']) }))),
      ]
      break
    }
    case 'travel': {
      const trips = toRows(9, () => ({ guest: g.name(), trip: g.pick(g.serviceList), date: g.date(10, 60), guests: String(g.int(1, 6)), status: g.pick(['Enquiry', 'Confirmed', 'Paid', 'Completed']) }), g)
      tables = [
        table('bookings', 'Bookings', 'booking', 'calendar', [col('guest', 'Guest'), col('trip', 'Trip / stay'), col('date', 'Date', 'date'), col('guests', 'People', 'number'), col('status', 'Status', 'status', ['Enquiry', 'Confirmed', 'Paid', 'Completed'])], trips),
        table('guests', 'Guests', 'guest', 'users', [col('name', 'Name'), col('phone', 'Phone'), col('email', 'Email'), col('joined', 'Since', 'date')], customers(10)),
        table('packages', 'Packages', 'package', 'list', [col('package', 'Package'), col('price', 'Price', 'money'), col('days', 'Days', 'number')], g.serviceList.map((s) => ({ package: s, price: g.money(4000, 60000, 500), days: String(g.int(1, 8)) }))),
      ]
      break
    }
    case 'ngo': {
      const donations = toRows(12, () => ({ donor: g.name(), campaign: g.pick(g.serviceList), amount: g.money(200, 25000, 100), date: g.date(40), status: g.pick(['Received', 'Received', 'Pledged']) }), g)
      tables = [
        table('donations', 'Donations', 'donation', 'money', [col('donor', 'Donor'), col('campaign', 'Campaign'), col('amount', 'Amount', 'money'), col('date', 'Date', 'date'), col('status', 'Status', 'status', ['Received', 'Pledged'])], donations),
        table('donors', 'Donors', 'donor', 'users', [col('name', 'Name'), col('phone', 'Phone'), col('email', 'Email'), col('joined', 'First gift', 'date')], customers()),
        table('volunteers', 'Volunteers', 'volunteer', 'users', [col('name', 'Name'), col('area', 'Area'), col('hours', 'Hours this month', 'number'), col('status', 'Status', 'status', ['Active', 'Invited', 'On break'])], toRows(10, () => ({ name: g.name(), area: g.pick(['Field work', 'Events', 'Fundraising', 'Admin', 'Care']), hours: String(g.int(2, 30)), status: g.pick(['Active', 'Active', 'Invited', 'On break']) }), g)),
        table('campaigns', 'Campaigns', 'campaign', 'calendar', [col('campaign', 'Campaign'), col('goal', 'Goal', 'money'), col('raised', 'Raised', 'money'), col('status', 'Status', 'status', ['Planned', 'Running', 'Done'])], g.serviceList.slice(0, 5).map((c) => ({ campaign: c, goal: g.money(50000, 500000, 5000), raised: g.money(5000, 200000, 500), status: g.pick(['Planned', 'Running', 'Running', 'Done']) }))),
      ]
      break
    }
    case 'legal': {
      const cases = toRows(10, (i) => ({ case: `${g.pick(['Property', 'Family', 'Civil', 'Consumer', 'Corporate', 'Criminal'])} matter ${i + 1}`, client: g.name(), court: g.pick(['District court', 'High court', 'Consumer forum', 'Tribunal']), status: g.pick(['Open', 'Open', 'Hearing set', 'Closed']) }), g)
      tables = [
        table('cases', 'Cases', 'case', 'list', [col('case', 'Case'), col('client', 'Client'), col('court', 'Court'), col('status', 'Status', 'status', ['Open', 'Hearing set', 'Closed'])], cases),
        table('clients', 'Clients', 'client', 'users', [col('name', 'Name'), col('phone', 'Phone'), col('email', 'Email'), col('joined', 'Since', 'date')], customers(10)),
        table('hearings', 'Hearings', 'hearing', 'calendar', [col('case', 'Case'), col('date', 'Date', 'date'), col('court', 'Court'), col('status', 'Status', 'status', ['Scheduled', 'Done', 'Adjourned'])], toRows(8, () => ({ case: g.pick(cases).case, date: g.date(5, 30), court: g.pick(['District court', 'High court', 'Tribunal']), status: g.pick(['Scheduled', 'Scheduled', 'Done', 'Adjourned']) }), g)),
        table('invoices', 'Invoices', 'invoice', 'money', [col('client', 'Client'), col('for', 'For'), col('amount', 'Amount', 'money'), col('status', 'Status', 'status', ['Paid', 'Pending', 'Overdue'])], toRows(8, () => ({ client: g.name(), for: g.pick(g.serviceList), amount: g.money(2000, 90000, 500), status: g.pick(['Paid', 'Pending', 'Overdue']) }), g)),
      ]
      break
    }
    case 'construction': {
      const projects = toRows(8, () => ({ project: `${g.pick(['Villa', 'Office fit-out', 'Kitchen', 'Apartment', 'Showroom', 'Terrace'])} · ${g.pick(['Sector 4', 'Park Road', 'Lake View', 'Old Town'])}`, client: g.name(), budget: g.money(80000, 4000000, 10000), status: g.pick(['Quote sent', 'In progress', 'In progress', 'Handed over']) }), g)
      tables = [
        table('projects', 'Projects', 'project', 'box', [col('project', 'Project'), col('client', 'Client'), col('budget', 'Budget', 'money'), col('status', 'Status', 'status', ['Quote sent', 'In progress', 'Handed over'])], projects),
        table('quotes', 'Quotes', 'quote', 'money', [col('client', 'Client'), col('work', 'Work'), col('amount', 'Amount', 'money'), col('status', 'Status', 'status', ['Draft', 'Sent', 'Accepted'])], toRows(8, () => ({ client: g.name(), work: g.pick(g.serviceList), amount: g.money(20000, 900000, 1000), status: g.pick(['Draft', 'Sent', 'Accepted']) }), g)),
        table('visits', 'Site visits', 'visit', 'calendar', [col('client', 'Client'), col('place', 'Place'), col('date', 'Date', 'date'), col('status', 'Status', 'status', ['Booked', 'Done', 'Cancelled'])], toRows(8, () => ({ client: g.name(), place: g.pick(['Sector 4', 'Park Road', 'Lake View', 'Old Town']), date: g.date(4, 14), status: g.pick(['Booked', 'Done', 'Cancelled']) }), g)),
        table('crew', 'Crew', 'worker', 'users', [col('name', 'Name'), col('trade', 'Trade'), col('site', 'Site'), col('status', 'Status', 'status', ['On site', 'Free', 'Leave'])], toRows(8, () => ({ name: g.name(), trade: g.pick(g.serviceList), site: g.pick(projects).project, status: g.pick(['On site', 'On site', 'Free', 'Leave']) }), g)),
      ]
      break
    }
    case 'auto': {
      const jobs = toRows(12, (i) => ({ job: `JC-${500 + i}`, vehicle: g.pick(['Swift', 'City', 'Creta', 'Activa', 'Splendor', 'Baleno', 'i20', 'Bullet']), service: g.pick(g.serviceList), amount: g.money(400, 18000, 50), status: g.pick(['Booked', 'In workshop', 'Ready', 'Delivered']) }), g)
      tables = [
        table('jobs', 'Job cards', 'job card', 'list', [col('job', 'Job'), col('vehicle', 'Vehicle'), col('service', 'Service'), col('amount', 'Estimate', 'money'), col('status', 'Status', 'status', ['Booked', 'In workshop', 'Ready', 'Delivered'])], jobs),
        table('customers', 'Customers', 'customer', 'users', [col('name', 'Name'), col('phone', 'Phone'), col('email', 'Email'), col('joined', 'Since', 'date')], customers()),
        table('bookings', 'Bookings', 'booking', 'calendar', [col('customer', 'Customer'), col('service', 'Service'), col('date', 'Date', 'date'), col('status', 'Status', 'status', ['Booked', 'Done', 'Cancelled'])], toRows(8, () => ({ customer: g.name(), service: g.pick(g.serviceList), date: g.date(3, 12), status: g.pick(['Booked', 'Done', 'Cancelled']) }), g)),
        table('invoices', 'Invoices', 'invoice', 'money', [col('customer', 'Customer'), col('amount', 'Amount', 'money'), col('date', 'Date', 'date'), col('status', 'Status', 'status', ['Paid', 'Pending'])], toRows(8, () => ({ customer: g.name(), amount: g.money(400, 18000, 50), date: g.date(30), status: g.pick(['Paid', 'Paid', 'Pending']) }), g)),
      ]
      break
    }
    case 'homeservices': {
      const jobs = toRows(12, (i) => ({ job: `#${700 + i}`, customer: g.name(), service: g.pick(g.serviceList), date: g.date(5, 8), status: g.pick(['New', 'Assigned', 'Done', 'Done']) }), g)
      tables = [
        table('jobs', 'Jobs', 'job', 'list', [col('job', 'Job'), col('customer', 'Customer'), col('service', 'Service'), col('date', 'Date', 'date'), col('status', 'Status', 'status', ['New', 'Assigned', 'Done'])], jobs),
        table('technicians', 'Technicians', 'technician', 'users', [col('name', 'Name'), col('skill', 'Skill'), col('phone', 'Phone'), col('status', 'Status', 'status', ['Free', 'On a job', 'Leave'])], toRows(8, () => ({ name: g.name(), skill: g.pick(g.serviceList), phone: `+91 9${g.int(100000000, 999999999)}`, status: g.pick(['Free', 'On a job', 'On a job', 'Leave']) }), g)),
        table('customers', 'Customers', 'customer', 'users', [col('name', 'Name'), col('phone', 'Phone'), col('email', 'Email'), col('joined', 'Since', 'date')], customers()),
      ]
      break
    }
    case 'logistics': {
      const ships = toRows(12, (i) => ({ id: `SH-${3000 + i}`, customer: g.name(), route: `${g.pick(['Pune', 'Delhi', 'Jaipur', 'Surat', 'Lucknow'])} → ${g.pick(['Mumbai', 'Bengaluru', 'Hyderabad', 'Kolkata', 'Indore'])}`, amount: g.money(800, 45000, 100), status: g.pick(['Booked', 'In transit', 'In transit', 'Delivered']) }), g)
      tables = [
        table('shipments', 'Shipments', 'shipment', 'box', [col('id', 'ID'), col('customer', 'Customer'), col('route', 'Route'), col('amount', 'Amount', 'money'), col('status', 'Status', 'status', ['Booked', 'In transit', 'Delivered'])], ships),
        table('drivers', 'Drivers', 'driver', 'users', [col('name', 'Name'), col('vehicle', 'Vehicle'), col('phone', 'Phone'), col('status', 'Status', 'status', ['Available', 'On trip', 'Off duty'])], toRows(8, () => ({ name: g.name(), vehicle: g.pick(['Tata Ace', 'Eicher 14ft', 'Bolero Pickup', 'Container 20ft']), phone: `+91 9${g.int(100000000, 999999999)}`, status: g.pick(['Available', 'On trip', 'On trip', 'Off duty']) }), g)),
        table('customers', 'Customers', 'customer', 'users', [col('name', 'Name'), col('phone', 'Phone'), col('email', 'Email'), col('joined', 'Since', 'date')], customers()),
      ]
      break
    }
    case 'pets': {
      const appts = toRows(10, () => ({ owner: g.name(), pet: `${g.pick(['Bruno', 'Milo', 'Luna', 'Coco', 'Simba', 'Max'])} (${g.pick(['Dog', 'Cat', 'Rabbit'])})`, service: g.pick(g.serviceList), date: g.date(4, 10), status: g.pick(['Booked', 'Done', 'Booked', 'Cancelled']) }), g)
      tables = [
        table('appointments', 'Appointments', 'appointment', 'calendar', [col('owner', 'Owner'), col('pet', 'Pet'), col('service', 'Service'), col('date', 'Date', 'date'), col('status', 'Status', 'status', ['Booked', 'Done', 'Cancelled'])], appts),
        table('owners', 'Owners', 'owner', 'users', [col('name', 'Name'), col('phone', 'Phone'), col('email', 'Email'), col('joined', 'Since', 'date')], customers()),
        table('animals', 'Animals', 'animal', 'list', [col('name', 'Name'), col('kind', 'Kind'), col('age', 'Age (years)', 'number'), col('status', 'Status', 'status', ['In care', 'Adoptable', 'Adopted'])], toRows(8, () => ({ name: g.pick(['Bruno', 'Milo', 'Luna', 'Coco', 'Simba', 'Max', 'Tiger']), kind: g.pick(['Dog', 'Cat', 'Puppy', 'Kitten']), age: String(g.int(1, 9)), status: g.pick(['In care', 'Adoptable', 'Adoptable', 'Adopted']) }), g)),
      ]
      break
    }
    case 'finance': {
      const clients = customers(12)
      const policies = toRows(10, (i) => ({ ref: `POL-${900 + i}`, client: g.name(), product: g.pick(g.serviceList), amount: g.money(2000, 90000, 500), renewal: g.date(0, 300), status: g.pick(['Active', 'Active', 'Due soon', 'Lapsed']) }), g)
      tables = [
        table('clients', 'Clients', 'client', 'users', [col('name', 'Name'), col('phone', 'Phone'), col('email', 'Email'), col('joined', 'Since', 'date')], clients),
        table('products', 'Policies and plans', 'policy', 'list', [col('ref', 'Ref'), col('client', 'Client'), col('product', 'Product'), col('amount', 'Amount', 'money'), col('renewal', 'Renewal', 'date'), col('status', 'Status', 'status', ['Active', 'Due soon', 'Lapsed'])], policies),
        table('reminders', 'Reminders', 'reminder', 'calendar', [col('client', 'Client'), col('about', 'About'), col('date', 'Date', 'date'), col('status', 'Status', 'status', ['To do', 'Done'])], toRows(8, () => ({ client: g.name(), about: g.pick(['Renewal call', 'Document pending', 'KYC update', 'Annual review']), date: g.date(2, 20), status: g.pick(['To do', 'Done']) }), g)),
        table('payments', 'Payments', 'payment', 'money', [col('client', 'Client'), col('amount', 'Amount', 'money'), col('date', 'Date', 'date'), col('status', 'Status', 'status', ['Received', 'Pending'])], toRows(8, () => ({ client: g.name(), amount: g.money(1000, 60000, 500), date: g.date(30), status: g.pick(['Received', 'Received', 'Pending']) }), g)),
      ]
      break
    }
    case 'consult': {
      const sessions = toRows(12, () => ({ client: g.name(), topic: g.pick(g.serviceList), date: g.date(5, 14), mode: g.pick(['In person', 'Video call', 'Phone']), status: g.pick(['Booked', 'Done', 'Booked', 'Cancelled']) }), g)
      tables = [
        table('sessions', 'Consultations', 'consultation', 'calendar', [col('client', 'Client'), col('topic', 'Topic'), col('date', 'Date', 'date'), col('mode', 'Mode'), col('status', 'Status', 'status', ['Booked', 'Done', 'Cancelled'])], sessions),
        table('clients', 'Clients', 'client', 'users', [col('name', 'Name'), col('phone', 'Phone'), col('email', 'Email'), col('joined', 'Since', 'date')], customers()),
        table('payments', 'Payments', 'payment', 'money', [col('client', 'Client'), col('amount', 'Amount', 'money'), col('date', 'Date', 'date'), col('status', 'Status', 'status', ['Paid', 'Pending'])], toRows(9, () => ({ client: g.name(), amount: g.money(500, 12000, 100), date: g.date(30), status: g.pick(['Paid', 'Paid', 'Pending']) }), g)),
      ]
      break
    }
    case 'farm': {
      const produce = g.serviceList.map((s) => ({ product: s, price: g.money(30, 900, 10), stock: String(g.int(0, 120)), status: g.pick(['In season', 'In season', 'Low', 'Out of season']) }))
      const orders = toRows(10, (i) => ({ order: `#${400 + i}`, customer: g.name(), product: g.pick(g.serviceList), total: g.money(150, 6000, 10), status: g.pick(['New', 'Packed', 'Delivered', 'Delivered']) }), g)
      tables = [
        table('orders', 'Orders', 'order', 'box', [col('order', 'Order'), col('customer', 'Customer'), col('product', 'Product'), col('total', 'Total', 'money'), col('status', 'Status', 'status', ['New', 'Packed', 'Delivered'])], orders),
        table('produce', 'Produce', 'product', 'list', [col('product', 'Product'), col('price', 'Price', 'money'), col('stock', 'In stock', 'number'), col('status', 'Season', 'status', ['In season', 'Low', 'Out of season'])], produce),
        table('customers', 'Customers', 'customer', 'users', [col('name', 'Name'), col('phone', 'Phone'), col('email', 'Email'), col('joined', 'Since', 'date')], customers()),
      ]
      break
    }
    default: {
      // a business nobody wrote a dashboard for: its own services are the catalogue, and the other pages follow what kind of business it is (orders, bookings, enrolments, projects ...)
      const mode = modeOf(content.subject || '', said)
      const items = g.serviceList.map((x) => ({ item: x, price: g.money(200, 9000, 50), status: g.pick(['Active', 'Active', 'Draft']) }))
      const catalogue = (label: string, singular: string) => table('catalogue', label, singular, 'list', [col('item', singular.charAt(0).toUpperCase() + singular.slice(1)), col('price', 'Price', 'money'), col('status', 'Status', 'status', ['Active', 'Draft'])], items)
      const people = (label: string, singular: string) => table(slug(label), label, singular, 'users', [col('name', 'Name'), col('phone', 'Phone'), col('email', 'Email'), col('joined', 'Since', 'date')], customers())
      const messages = table('messages', 'Messages', 'message', 'chat', [col('from', 'From'), col('subject', 'Subject'), col('date', 'Date', 'date'), col('status', 'Status', 'status', ['New', 'Replied'])], toRows(8, () => ({ from: g.name(), subject: g.pick(['Question about a service', 'Quote request', 'Feedback', 'Appointment', 'Price list please']), date: g.date(12), status: g.pick(['New', 'Replied']) }), g))
      if (mode === 'shop') {
        const orders = toRows(12, (i) => ({ order: `#${1200 + i}`, customer: g.name(), item: g.pick(g.serviceList), total: g.money(200, 9000, 50), status: g.pick(['New', 'Packed', 'Delivered', 'Delivered']) }), g)
        tables = [table('orders', 'Orders', 'order', 'box', [col('order', 'Order'), col('customer', 'Customer'), col('item', 'Item'), col('total', 'Total', 'money'), col('status', 'Status', 'status', ['New', 'Packed', 'Delivered'])], orders), catalogue('Catalogue', 'item'), people('Customers', 'customer')]
      } else if (mode === 'experience') {
        const bookings = toRows(12, () => ({ guest: g.name(), experience: g.pick(g.serviceList), date: g.date(4, 20), people: String(g.int(1, 8)), status: g.pick(['Booked', 'Booked', 'Done', 'Cancelled']) }), g)
        tables = [table('bookings', 'Bookings', 'booking', 'calendar', [col('guest', 'Guest'), col('experience', 'What'), col('date', 'Date', 'date'), col('people', 'People', 'number'), col('status', 'Status', 'status', ['Booked', 'Done', 'Cancelled'])], bookings), catalogue('Experiences', 'experience'), people('Guests', 'guest')]
      } else if (mode === 'class') {
        const enrol = toRows(12, () => ({ student: g.name(), class: g.pick(g.serviceList), batch: g.pick(['Morning', 'Evening', 'Weekend']), fees: g.pick(['Paid', 'Paid', 'Due']) }), g)
        tables = [table('enrolments', 'Enrolments', 'enrolment', 'users', [col('student', 'Student'), col('class', 'Class'), col('batch', 'Batch'), col('fees', 'Fees', 'status', ['Paid', 'Due'])], enrol), catalogue('Classes', 'class'), people('Students', 'student')]
      } else if (mode === 'creative') {
        const projects = toRows(10, () => ({ client: g.name(), project: g.pick(g.serviceList), due: g.date(5, 30), budget: g.money(3000, 120000, 500), status: g.pick(['Brief', 'In progress', 'In progress', 'Delivered']) }), g)
        tables = [table('projects', 'Projects', 'project', 'list', [col('client', 'Client'), col('project', 'Project'), col('due', 'Due', 'date'), col('budget', 'Budget', 'money'), col('status', 'Status', 'status', ['Brief', 'In progress', 'Delivered'])], projects), catalogue('Services', 'service'), people('Clients', 'client'), messages]
      } else if (mode === 'community') {
        const members = toRows(12, () => ({ name: g.name(), joined: g.date(300), role: g.pick(['Member', 'Member', 'Volunteer', 'Organiser']), status: g.pick(['Active', 'Active', 'Invited']) }), g)
        tables = [table('members', 'Members', 'member', 'users', [col('name', 'Name'), col('joined', 'Joined', 'date'), col('role', 'Role'), col('status', 'Status', 'status', ['Active', 'Invited'])], members), table('events', 'Events', 'event', 'calendar', [col('event', 'Event'), col('date', 'Date', 'date'), col('seats', 'Seats', 'number'), col('status', 'Status', 'status', ['Planned', 'Open', 'Done'])], g.serviceList.slice(0, 6).map((x) => ({ event: x, date: g.date(5, 40), seats: String(g.int(20, 200)), status: g.pick(['Planned', 'Open', 'Done']) }))), messages]
      } else {
        const reqs = toRows(10, () => ({ customer: g.name(), request: g.pick(g.serviceList), date: g.date(14, 7), status: g.pick(['New', 'In progress', 'Done', 'In progress']) }), g)
        tables = [table('requests', 'Requests', 'request', 'list', [col('customer', 'Customer'), col('request', 'Request'), col('date', 'Date', 'date'), col('status', 'Status', 'status', ['New', 'In progress', 'Done'])], reqs), catalogue('Services', 'service'), people('Customers', 'customer'), messages]
      }
    }
  }
  // what the person changed in the pages of the dashboard
  const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, '').replace(/s$/, '')
  const same = (t: AppTable, name: string) => norm(t.label) === norm(name) || norm(t.id) === norm(name) || norm(t.singular) === norm(name)
  const title = (x: string) => x.replace(/\b\p{L}/gu, (c) => c.toUpperCase())
  for (const edit of content.appPages ?? []) {
    if (edit.action === 'remove') {
      if (tables.length > 1) tables = tables.filter((t) => !same(t, edit.page))
    } else if (edit.action === 'rename' && edit.to) {
      tables = tables.map((t) => (same(t, edit.page) ? { ...t, label: title(edit.to as string), title: title(edit.to as string) } : t))
    } else if (edit.action === 'column' && edit.to) {
      // "Age::number": the kind of column said on purpose; else the name says it (Status, Due date, Amount, Age ...)
      const [rawName, said] = edit.to.split('::')
      const name = title(rawName.trim())
      const key = slug(name).replace(/-/g, '_')
      const guess = (): 'text' | 'number' | 'money' | 'date' | 'status' => /\b(?:status|stage|state|priority|progress)\b/i.test(name) ? 'status' : /\b(?:date|due|joined|since|deadline|day|time|renewal|birthday)\b/i.test(name) ? 'date' : /\b(?:amount|price|fee|fees|total|salary|cost|budget|paid|balance|rate|charges?|rent|payment|earnings?|revenue|income|tax|discount)\b/i.test(name) ? 'money' : /\b(?:age|count|qty|quantity|seats|number|no|score|marks|rooms|days|hours|years|stock)\b/i.test(name) ? 'number' : 'text'
      const type = (['text', 'number', 'money', 'date', 'status'] as const).find((x) => x === (said ?? '').trim()) ?? guess()
      const options = /priority/i.test(name) ? ['Low', 'Medium', 'High'] : ['New', 'In progress', 'Done']
      const sample = () => (type === 'status' ? g.pick(options) : type === 'date' ? g.date(30, 10) : type === 'money' ? g.money(500, 20000, 100) : type === 'number' ? String(g.int(1, 60)) : '')
      tables = tables.map((t) => (same(t, edit.page) && !t.columns.some((c) => c.key === key) ? { ...t, columns: [...t.columns, col(key, name, type, type === 'status' ? options : undefined)], rows: t.rows.map((r) => ({ ...r, [key]: sample() })) } : t))
    } else if (edit.action === 'add' && !tables.some((t) => same(t, edit.page))) {
      const label = title(edit.page)
      tables = [...tables, table(slug(edit.page), label, label.replace(/s$/i, '').toLowerCase(), 'list', [col('name', 'Name'), col('details', 'Details'), col('date', 'Date', 'date'), col('status', 'Status', 'status', ['New', 'In progress', 'Done'])], toRows(5, () => ({ name: g.name(), details: g.pick(g.serviceList), date: g.date(14, 7), status: g.pick(['New', 'In progress', 'Done']) }), g))]
    }
  }
  // the dates of every page are spread over the last half year and the coming three weeks, so the charts by month have something to show from the first day
  tables = tables.map((t) => {
    const dc = t.columns.find((c) => c.type === 'date')
    if (!dc || t.rows.length < 2) return t
    const rows = t.rows.map((x) => ({ ...x }))
    rows.forEach((row, i) => {
      // (the first rows are the newest: that is what "Latest" on the overview shows)
      const days = Math.round((i / (rows.length - 1)) * 185 - 20 + (r() * 6 - 3))
      row[dc.key] = iso(new Date(today.getTime() - days * 86400000))
    })
    return { ...t, rows }
  })

  // the figures follow the data: each one says which page it counts and how (see calcKpi in appRuntime.ts)
  const key = kind === 'general' ? `general:${modeOf(content.subject || '', said)}` : kind
  const usable = (spec: Spec) => {
    const t = tables.find((x) => x.id === spec[2])
    return !!t && (spec[3] === 'count' || (!!spec[4] && t.columns.some((c) => c.key === spec[4])))
  }
  let kpis: AppKpi[] = (SPECS[key] ?? []).filter(usable).map(([label, note, table, kindOf, column, value]) => ({ label, note, calc: { table, kind: kindOf, ...(column ? { column } : {}), ...(value ? { value } : {}) } }))
  if (kind === 'creator') {
    const fans = content.stats.find((s) => /follow|subscri|listen|fans/i.test(s.label))
    if (fans) kpis = [{ label: fans.label, note: 'as you wrote it', calc: { table: tables[0]?.id ?? '', kind: 'fixed', value: fans.value } }, ...kpis.slice(1)]
  }
  // a business whose pages were changed in the chat (a page taken out, a new one): the figures that point to a missing page are replaced by the first pages' own
  const spare = (): AppKpi[] => {
    const out: AppKpi[] = []
    tables.forEach((t) => {
      out.push({ label: t.label, note: 'in total', calc: { table: t.id, kind: 'count' } })
      const st = t.columns.find((c) => c.type === 'status')
      if (st?.options?.[0]) out.push({ label: `${t.label}: ${st.options[0].toLowerCase()}`, note: 'right now', calc: { table: t.id, kind: 'status', column: st.key, value: st.options[0] } })
      const money = t.columns.find((c) => c.type === 'money')
      if (money) out.push({ label: `${money.label} (${t.label.toLowerCase()})`, note: 'in total', calc: { table: t.id, kind: 'sum', column: money.key } })
    })
    return out
  }
  kpis = kpis.filter((k) => tables.some((t) => t.id === k.calc.table || k.calc.kind === 'fixed'))
  for (const extra of spare()) {
    if (kpis.length >= 4) break
    if (!kpis.some((k) => k.calc.table === extra.calc.table && k.calc.kind === extra.calc.kind && k.calc.column === extra.calc.column && k.calc.value === extra.calc.value)) kpis.push(extra)
  }
  const head = tables[0]
  const dateCol = head?.columns.find((c) => c.type === 'date')
  const moneyCol = head?.columns.find((c) => c.type === 'money')
  const charts: AppConfig['charts'] = head
    ? [
        ...(head.columns.some((c) => c.type === 'status') ? [{ title: `${head.label} by status`, table: head.id, kind: 'status' as const }] : []),
        ...(dateCol ? [moneyCol ? { title: `${moneyCol.label} per month`, table: head.id, kind: 'sumMonth' as const, column: dateCol.key, sumColumn: moneyCol.key } : { title: `${head.label} per month`, table: head.id, kind: 'month' as const, column: dateCol.key }] : []),
      ]
    : []
  return { brand, slug: slug(brand), currency: cur, kpis, charts, insights: !(content.appPages ?? []).some((e) => e.action === 'remove' && ['insight', 'report'].includes(norm(e.page)) && !tables.some((t) => norm(t.label) === norm(e.page))), tables }
}
