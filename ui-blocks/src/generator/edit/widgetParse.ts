// "add a booking form", "map of my shop", "upi id ravi@okhdfc", "sale ends in 3 days", "video link https://youtu.be/...": the working parts (library/widgets.ts), in English,
// Hinglish or a mix. And the honest answers for what a static site cannot do (a login, a chatbot, a card payment, a database).
import { cleanWidget, WIDGET_LABEL, type Widget, type WidgetKind } from '../library/widgets'
import type { EditOp } from './edits'

export type WidgetResult = { ops: EditOp[]; notes: string[]; /** the message without the parts that were about widgets */ rest: string }

const W = (re: string) => new RegExp(`(?<![\\p{L}\\p{N}])(?:${re})(?![\\p{L}\\p{N}])`, 'iu')
const ADD = W('add|create|make|put|insert|show|want|need|chahiye|chaiye|lagao|lagana|laga\\s+do|jodo|jodna|daalo|dalo|rakho|banao|bana\\s+do|with|aur|include|enable|set\\s*up')
const REMOVE = W('remove|delete|hide|hatao|hata\\s+do|nikalo|nikal\\s+do|band\\s+karo|without|no|disable|off')

type Kind = { kind: WidgetKind; words: RegExp; /** words that alone (no verb) are enough: a value was given */ direct?: RegExp }
const KINDS: Kind[] = [
  { kind: 'booking', words: W('bookings?|appointments?|reservations?|book\\s+(?:a\\s+)?(?:table|slot|visit|now)|table\\s+booking|slot\\s+booking|booking\\s+form') },
  { kind: 'map', words: W('maps?|google\\s+maps?|location\\s+map|naksha|find\\s+us'), direct: /\bmap\s+(?:address|location)\b/i },
  { kind: 'whatsapp', words: W('whats\\s?app\\s+(?:chat\\s+)?(?:button|chat|icon|widget|floating)|chat\\s+button|floating\\s+(?:chat|whats\\s?app)'), direct: /whats\s?app\s+(?:button|chat)/i },
  { kind: 'pay', words: W('upi|phonepe|gpay|google\\s+pay|paytm|pay(?:ment)?\\s+(?:button|link|option)|pay\\s+now|online\\s+payments?'), direct: /\bupi(?:\s+id)?\s+[\w.-]{2,}@[a-z]/i },
  { kind: 'countdown', words: W('count\\s*down|timer|(?:sale|offer|deal)\\s+(?:ends?|timer)|sale\\s+countdown'), direct: /count\s*down\s+\d|(?:sale|offer|deal)\s+ends?\s+(?:in|on)?\s*\d/i },
  { kind: 'newsletter', words: W('newsletters?|subscribe|subscription\\s+form|e-?mail\\s+sign\\s*up|mailing\\s+list|mailchimp') },
  { kind: 'video', words: W('videos?|youtube|vimeo|reels?|promo\\s+video'), direct: /\bvideo\s+(?:link|url)\b|https?:\/\/\S*(?:youtu|vimeo)\S*/i },
  { kind: 'order', words: W('cart|add\\s+to\\s+cart|order\\s+(?:form|list|online|page|on\\s+whats\\s?app)|online\\s+order(?:ing)?|order\\s+now|product\\s+catalog(?:ue)?\\s+with\\s+cart|shopping\\s+cart') },
  { kind: 'announce', words: W('announcements?|announcement\\s+bar|top\\s+bar|notice\\s+bar|offer\\s+bar|banner\\s+bar'), direct: /announcement(?:\s+bar)?\s*(?::|saying|that\s+says)\s*\S|announcement\s+(?!bar\b)\S+\s+\S+/i },
  { kind: 'analytics', words: W('analytics|ga4|google\\s+tag|gtm|tracking\\s+code|visitor\\s+tracking'), direct: /\b(?:G|GTM)-[A-Z0-9]{5,12}\b/ },
]

// things a static site cannot do: said plainly, with what can be done instead
const CANNOT: { when: RegExp; note: string }[] = [
  { when: W('log\\s?in|sign\\s?in|sign\\s?up\\s+page|register\\s+page|user\\s+accounts?|member\\s+area|dashboard'), note: 'A static website cannot have accounts or a login: that needs a server and a database. I can add a booking form, an order list on WhatsApp or a newsletter signup, which work without one.' },
  { when: W('chat\\s?bot|ai\\s+chat|live\\s+chat'), note: 'I cannot add a chatbot (it needs a service behind it). A WhatsApp chat button gives visitors a real conversation: say "add a WhatsApp button".' },
  { when: W('razorpay|stripe|payu|cashfree|credit\\s+card|debit\\s+card|card\\s+payments?|payment\\s+gateway|checkout'), note: 'A card payment needs a payment gateway account and a server, which this site does not have. I can add a UPI pay button (no gateway) or an order list that sends the order on WhatsApp: say "add a UPI button" or "add an order list".' },
  { when: W('data\\s?base|admin\\s+panel|cms|backend|back\\s+end|api\\s+key'), note: 'The site is static (plain HTML, CSS and JavaScript), so it has no database, admin panel or backend. Forms send messages to your e-mail or WhatsApp.' },
  { when: W('connect\\s+(?:my\\s+)?domain|custom\\s+domain|domain\\s+name|point\\s+(?:my\\s+)?domain'), note: 'Your own domain is connected at the host where you publish the site (Netlify, Vercel, GitHub Pages or your hosting): after "Publish" you get the files and the steps in the README.' },
  { when: W('make\\s+it\\s+faster|speed\\s+up|load\\s+faster|page\\s+speed|slow'), note: 'The page is static and its pictures load lazily. For more speed: fewer pictures (hide the gallery), "no animations", and host it on a CDN host. Say "no animations" to switch the motion off.' },
]

/** the parts of a message, cut at "and", "aur", ";" and at a comma that starts another request ("12 MG Road, Pune" keeps its comma) */
const clauses = (text: string) => {
  const parts = text.split(/\s*(?:;|\band\b|\baur\b|\bphir\b|\bplus\b|\balso\b)\s*/i).flatMap((chunk) => chunk.split(/\s*,\s*/).reduce<string[]>((out, piece) => {
    const starts = ADD.test(piece.split(/\s+/).slice(0, 2).join(' ')) || REMOVE.test(piece.split(/\s+/).slice(0, 2).join(' ')) || KINDS.some((k) => k.words.test(piece.split(/\s+/).slice(0, 3).join(' ')) || k.direct?.test(piece))
    if (out.length && !starts) out[out.length - 1] += `, ${piece}`
    else out.push(piece)
    return out
  }, []))
  return parts.map((c) => c.trim()).filter(Boolean)
}

const in_days = (n: number, unit: string) => {
  const ms = /hour|ghant/i.test(unit) ? n * 3600e3 : n * 86400e3
  return new Date(Date.now() + ms).toISOString()
}
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
/** "3 days", "in 48 hours", "15 november", "2026-11-15": the end of a sale */
function endOf(text: string): string | undefined {
  const rel = text.match(/(\d{1,3})\s*(days?|din|hours?|ghante|ghanta)\b/i)
  if (rel) return in_days(Number(rel[1]), rel[2])
  const iso = text.match(/\b(20\d\d)-(\d\d)-(\d\d)\b/)
  if (iso) return new Date(`${iso[0]}T23:59:00`).toISOString()
  const dm = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/i) ?? text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?\b/i)
  if (dm) {
    const [day, mon] = /^\d/.test(dm[1]) ? [Number(dm[1]), dm[2]] : [Number(dm[2]), dm[1]]
    const now = new Date()
    let at = new Date(now.getFullYear(), MONTHS.indexOf(mon.toLowerCase().slice(0, 3)), day, 23, 59)
    if (at.getTime() < now.getTime()) at = new Date(at.getFullYear() + 1, at.getMonth(), at.getDate(), 23, 59)
    return at.toISOString()
  }
  return undefined
}

const ADDRESS_STOP = /^(?:my|our|the|a|an|shop|store|business|website|site|page|here|there|it|this|that|ka|ki|ke|meri|mera|mere|apni|apna|dukaan|dukan|location)(?:\s+(?:my|our|shop|store|dukaan|dukan|website|location))*$/i
function addressOf(clause: string): string | undefined {
  const after = clause.match(/\b(?:address|location|of|for|at|pata|ka|ki)\s*(?:is|:|=)?\s*(.{6,})$/i)?.[1]?.replace(/[.!]+$/, '').trim()
  const trimmed = after?.replace(/[\s,.;!]+$/, '')
  return trimmed && !ADDRESS_STOP.test(trimmed) && /[a-z]{3}/i.test(trimmed) && /\d|\b(?:road|rd|street|st|nagar|marg|lane|market|chowk|colony|sector|plaza|mall|city|pune|delhi|mumbai|jaipur|bangalore|bengaluru|kolkata|chennai|hyderabad|ahmedabad|lucknow)\b/i.test(trimmed) ? trimmed : undefined
}

function widgetFor(kind: WidgetKind, clause: string, whole: string): { widget: Widget; note?: string } | undefined {
  switch (kind) {
    case 'pay': {
      const id = clause.match(/\b([a-z0-9._-]{2,40}@[a-z][a-z0-9]{1,20})\b(?!\.)/i)?.[1] ?? whole.match(/\b([a-z0-9._-]{2,40}@[a-z][a-z0-9]{1,20})\b(?!\.[a-z])/i)?.[1]
      const widget = cleanWidget({ kind, value: id })
      return widget && { widget, ...(widget.value ? {} : { note: 'Add your UPI id and the pay button shows: say "upi id name@bank". (It opens the UPI apps of the visitor; it is not a card payment.)' }) }
    }
    case 'countdown': {
      const end = endOf(clause)
      const label = clause.match(/["“']([^"”']{3,60})["”']/)?.[1]
      const widget = cleanWidget({ kind, value: end, text: label })
      return widget && { widget, ...(widget.value ? {} : { note: 'When does the sale end? Say "countdown 3 days" or "sale ends 15 november".' }) }
    }
    case 'video': {
      const link = clause.match(/https?:\/\/\S+/)?.[0] ?? whole.match(/https?:\/\/\S+/)?.[0]
      const widget = cleanWidget({ kind, value: link })
      return widget && { widget, ...(widget.value ? {} : { note: 'Send me the link of the video (YouTube or Vimeo): "video link https://youtu.be/...".' }) }
    }
    case 'analytics': {
      const id = (clause.match(/\b((?:G|GTM)-[A-Z0-9]{5,12})\b/i) ?? whole.match(/\b((?:G|GTM)-[A-Z0-9]{5,12})\b/i))?.[1]
      const widget = cleanWidget({ kind, value: id })
      return widget && { widget, ...(widget.value ? {} : { note: 'I need your Google Analytics measurement id (it looks like G-ABC123XYZ): "analytics id G-...". It is added to the exported site, not to this preview.' }) }
    }
    case 'map': {
      const address = addressOf(clause)
      const widget = cleanWidget({ kind, value: address })
      return widget && { widget, ...(address ? {} : { note: 'The map uses the address of your business: say "address 12 MG Road, Pune" if you have not set it yet.' }) }
    }
    case 'whatsapp': {
      const number = clause.match(/(?:\+?\d[\d\s-]{8,16}\d)/)?.[0]
      const widget = cleanWidget({ kind, value: number })
      return widget && { widget, ...(number ? {} : { note: 'The chat button uses your WhatsApp number (or your phone number): say "whatsapp 9876543210" if you have not set one yet.' }) }
    }
    case 'announce': {
      // (the quotes of the message are already taken off: what follows the name of the bar is its text)
      const text = clause.replace(/^.*?(?:announcements?(?:\s+bar)?|top\s+bar|notice\s+bar|offer\s+bar|banner\s+bar)\s*(?:saying|with|that\s+says|:)?\s*/i, '').replace(/^["'“”]|["'“”]$/g, '').trim()
      const widget = cleanWidget({ kind, text })
      return widget ? { widget } : { widget: { kind }, note: 'What should the bar say? Type: announcement "Free delivery above 999".' }
    }
    case 'order':
      return { widget: { kind }, note: 'This is an order list: visitors choose items and quantities and the order goes to your WhatsApp (or e-mail). It is not an online payment cart: say "add a UPI button" for payments.' }
    case 'newsletter':
      return { widget: { kind }, ...(/mailchimp/i.test(clause) ? { note: 'The signup sends the address to your e-mail (the same way as the contact form). It is not connected to Mailchimp: for that, set a form service address as data-endpoint on the form.' } : {}) }
    default:
      return { widget: { kind } }
  }
}

/** the widgets a message asks for or removes, and the honest answers; undefined when the message has nothing to do with them */
export function widgetOps(text: string): WidgetResult | undefined {
  const ops: EditOp[] = []
  const notes: string[] = []
  const rest: string[] = []
  let used = false
  let verb = ''
  for (const clause of clauses(text)) {
    const wanted = KINDS.filter((k) => k.words.test(clause) || k.direct?.test(clause))
    const cannot = CANNOT.find((c) => c.when.test(clause))
    // a word like "video" or "map" inside a longer request about something else ("change the video section heading") is not an order for a widget
    const asks = (k: Kind) => ADD.test(clause) || k.direct?.test(clause) || /^\s*(?:a|an|the)?\s*\w+(?:\s+\w+){0,3}\s*$/.test(clause)
    const removes = REMOVE.test(clause) && !/\b(?:without\s+animation|no\s+animation)\b/i.test(clause)
    if (cannot && !wanted.length) {
      notes.push(cannot.note)
      used = true
      continue
    }
    if (!wanted.length) {
      // "booking form hatao aur FAQ bhi": the verb of the first part belongs to the bare name after it
      rest.push(verb && !ADD.test(clause) && !REMOVE.test(clause) && clause.split(/\s+/).length <= 3 ? `${verb} ${clause}` : clause)
      continue
    }
    for (const k of wanted) {
      if (removes && !k.direct?.test(clause)) {
        verb = 'remove'
        ops.push({ op: 'removeWidget', kind: k.kind })
        used = true
        continue
      }
      if (!asks(k)) continue
      const made = widgetFor(k.kind, clause, text)
      if (!made) continue
      ops.push({ op: 'widget', widget: made.widget })
      if (made.note) notes.push(made.note)
      else if (k.kind === 'whatsapp') {
        const number = made.widget.value
        if (number) ops.push({ op: 'contact', field: 'whatsapp', value: number })
      }
      used = true
    }
    if (cannot) notes.push(cannot.note)
  }
  if (!used) return undefined
  return { ops, notes, rest: rest.join(', ') }
}

export const widgetLabel = (kind: WidgetKind) => WIDGET_LABEL[kind]
