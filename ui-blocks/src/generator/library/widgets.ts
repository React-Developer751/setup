// Widgets: the working parts a business site needs that the stored components do not have (booking form, map, WhatsApp button, UPI pay button, sale countdown,
// newsletter, video, order list, announcement bar, analytics). They are plain data on the content (`content.widgets`), so they live in the edit history, the
// code tab and every export; this file draws them as HTML. They need no server: forms use the same e-mail / WhatsApp path as the other forms of the page.
import type { WebsiteContent } from '../finalPrompt'

export const WIDGET_KINDS = ['booking', 'map', 'whatsapp', 'pay', 'countdown', 'newsletter', 'video', 'order', 'announce', 'analytics', 'call'] as const
export type WidgetKind = (typeof WIDGET_KINDS)[number]
/** `value` is the one thing the widget needs (an address, a UPI id, a link, a date, a number, an id); `text` is its words */
export type Widget = { kind: WidgetKind; value?: string; text?: string }

export const WIDGET_LABEL: Record<WidgetKind, string> = {
  booking: 'booking form', map: 'map', whatsapp: 'WhatsApp chat button', pay: 'UPI pay button', countdown: 'sale countdown', newsletter: 'newsletter signup', video: 'video', order: 'order list', announce: 'announcement bar', analytics: 'Google Analytics', call: 'call button',
}

const plain = (v: unknown, n: number) => String(v ?? '').replace(/\p{Cc}+/gu, ' ').replace(/[<>"`]/g, '').replace(/\s+/g, ' ').trim().slice(0, n)
const UPI = /^[a-z0-9._-]{2,40}@[a-z][a-z0-9]{1,20}$/i
const ANALYTICS = /^(?:G-[A-Z0-9]{6,12}|GTM-[A-Z0-9]{5,9})$/

/** the embed address of a YouTube / Vimeo link, or a direct video file; undefined for anything else (no other address is ever put in a frame) */
export function videoEmbed(link: string): { kind: 'frame' | 'file'; src: string } | undefined {
  try {
    const url = new URL(link)
    if (url.protocol !== 'https:') return undefined
    const host = url.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') return /^[\w-]{6,15}$/.test(url.pathname.slice(1)) ? { kind: 'frame', src: `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}` } : undefined
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = url.searchParams.get('v') ?? url.pathname.match(/^\/(?:embed|shorts)\/([\w-]{6,15})/)?.[1]
      return id && /^[\w-]{6,15}$/.test(id) ? { kind: 'frame', src: `https://www.youtube-nocookie.com/embed/${id}` } : undefined
    }
    if (host === 'vimeo.com') {
      const id = url.pathname.match(/^\/(\d{6,12})/)?.[1]
      return id ? { kind: 'frame', src: `https://player.vimeo.com/video/${id}` } : undefined
    }
    if (/\.(?:mp4|webm)$/i.test(url.pathname)) return { kind: 'file', src: url.href }
  } catch {
    // not an address
  }
  return undefined
}

/** a widget checked: only the fields of its kind, in the shape it can be drawn in; undefined when the kind or the value is not valid */
export function cleanWidget(raw: unknown): Widget | undefined {
  const o = (raw ?? {}) as Record<string, unknown>
  if (!(WIDGET_KINDS as readonly unknown[]).includes(o.kind)) return undefined
  const kind = o.kind as WidgetKind
  const value = plain(o.value, 200)
  const text = plain(o.text, 120)
  switch (kind) {
    case 'whatsapp': {
      const digits = value.replace(/\D/g, '')
      return { kind, ...(digits.length >= 10 && digits.length <= 15 ? { value: digits } : {}) }
    }
    case 'call': {
      const digits = value.replace(/[^\d+]/g, '')
      return { kind, ...(digits.replace(/\D/g, '').length >= 8 ? { value: digits } : {}) }
    }
    case 'pay':
      return { kind, ...(UPI.test(value) ? { value: value.toLowerCase() } : {}), ...(text ? { text } : {}) }
    case 'countdown':
      return { kind, ...(Number.isFinite(Date.parse(value)) ? { value: new Date(value).toISOString() } : {}), ...(text ? { text } : {}) }
    case 'video':
      return { kind, ...(videoEmbed(value) ? { value } : {}) }
    case 'analytics':
      return { kind, ...(ANALYTICS.test(value.toUpperCase()) ? { value: value.toUpperCase() } : {}) }
    case 'map':
      return { kind, ...(value.length >= 6 ? { value } : {}) }
    case 'announce':
      return text.length >= 3 ? { kind, text } : undefined
    default:
      return { kind }
  }
}

/** the widgets of a page after one more: a kind is there once, the newer one replaces the older */
export const withWidget = (list: Widget[] | undefined, widget: Widget): Widget[] => [...(list ?? []).filter((w) => w.kind !== widget.kind), widget]

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const digitsOf = (s: string | undefined) => String(s ?? '').replace(/\D/g, '')
/** the number a chat can be opened with: the widget's own, the WhatsApp number of the contact, or the phone number (10 digits starting 6-9 is an Indian mobile) */
export function chatNumber(widget: Widget | undefined, content: WebsiteContent): string {
  for (const raw of [widget?.value, content.contact.whatsapp, content.contact.phone]) {
    const d = digitsOf(raw)
    if (d.length === 10 && /^[6-9]/.test(d)) return `91${d}`
    if (d.length >= 11 && d.length <= 15) return d
  }
  return ''
}
const realAddress = (content: WebsiteContent) => (content.contact.showMap || !/sample street|123 /i.test(content.contact.address) ? content.contact.address : '')
const mapAddress = (widget: Widget, content: WebsiteContent) => widget.value ?? realAddress(content)
const emailOf = (content: WebsiteContent) => (/^[^\s@"<>]+@[^\s@"<>]+\.[^\s@"<>]+$/.test(content.contact.email) && !/example\.|your-?domain|yourbusiness/i.test(content.contact.email) ? content.contact.email : '')

/** the number a call button dials: the widget's own or the phone number of the contact */
export function callNumber(widget: Widget | undefined, content: WebsiteContent): string {
  for (const raw of [widget?.value, content.contact.phone]) {
    const d = String(raw ?? '').replace(/[^\d+]/g, '')
    if (d.replace(/\D/g, '').length >= 8) return d
  }
  return ''
}

/** what is still missing before this widget can show (the chat says it): empty when it is complete */
export function widgetNeeds(widget: Widget, content: WebsiteContent): string {
  switch (widget.kind) {
    case 'pay':
      return widget.value ? '' : 'your UPI id, for example "upi id name@bank"'
    case 'countdown':
      return widget.value ? '' : 'the end date, for example "countdown 3 days" or "sale ends 15 november"'
    case 'video':
      return widget.value ? '' : 'a YouTube or Vimeo link, for example "video link https://youtu.be/..."'
    case 'analytics':
      return widget.value ? '' : 'your measurement id, for example "analytics id G-ABC123XYZ"'
    case 'map':
      return mapAddress(widget, content) ? '' : 'the address, for example "map address 12 MG Road, Pune"'
    case 'whatsapp':
      return chatNumber(widget, content) ? '' : 'your WhatsApp number, for example "whatsapp 9876543210"'
    case 'call':
      return callNumber(widget, content) ? '' : 'your phone number, for example "phone number 9876543210"'
    default:
      return ''
  }
}

const SECTION = 'max-width:72rem;margin:0 auto;padding:4rem 1.25rem'
const CARD = 'background:var(--color-white);border:1px solid var(--color-gray-200);border-radius:1rem;padding:1.5rem'
const BUTTON = 'display:inline-block;border:0;cursor:pointer;background:var(--g-accent);color:var(--g-on-accent);padding:.75rem 1.5rem;border-radius:.75rem;font-weight:600;font-size:1rem;text-decoration:none'
const FIELD = 'width:100%;box-sizing:border-box;padding:.65rem .8rem;border:1px solid var(--color-gray-300);border-radius:.6rem;background:var(--color-white);color:inherit;font:inherit'
const LABEL = 'display:block;font-size:.85rem;font-weight:600;margin:0 0 .25rem'
const HEAD = (title: string, text?: string) => `<div style="text-align:center;margin:0 0 2rem"><h2 style="font-size:1.9rem;font-weight:700;margin:0 0 .5rem">${esc(title)}</h2>${text ? `<p style="margin:0 auto;max-width:36rem;opacity:.75">${esc(text)}</p>` : ''}</div>`
const attr = (page: string | undefined) => (page ? ` data-page="${esc(page)}"` : '')

const money = (price: string) => {
  const symbol = price.match(/[^\d\s.,/a-z]+/i)?.[0] ?? ''
  const amount = Number(price.replace(/[^\d.]/g, '')) || 0
  return { symbol, amount }
}

/** the pieces of the page that the widgets of the content draw: a bar on top, sections before the footer, a floating button */
export function renderWidgets(content: WebsiteContent, home?: { contact: string }): { top: string; sections: string; floating: string } {
  const widgets = ((content.widgets ?? []) as Widget[]).filter((w) => !widgetNeeds(w, content))
  const get = (kind: WidgetKind) => widgets.find((w) => w.kind === kind)
  const brand = content.brandName
  const page = home?.contact
  const top: string[] = []
  const sections: string[] = []
  const floating: string[] = []

  const announce = get('announce')
  if (announce) top.push(`<div data-widget="announce" data-page="*" style="background:var(--g-accent);color:var(--g-on-accent);text-align:center;padding:.5rem 1rem;font-size:.9rem;font-weight:500">${esc(announce.text ?? '')}</div>`)
  const countdown = get('countdown')
  if (countdown) top.push(`<div data-widget="countdown" data-page="*" style="background:var(--g-accent);color:var(--g-on-accent);text-align:center;padding:.55rem 1rem;font-size:.95rem;font-weight:600">${esc(countdown.text ?? 'Sale ends in')} <span data-countdown="${esc(countdown.value ?? '')}" style="font-variant-numeric:tabular-nums;margin-left:.4rem"></span></div>`)

  const map = get('map')
  if (map) {
    const address = mapAddress(map, content)
    sections.push(`<section data-widget="map"${attr(page)} id="visit" style="${SECTION}">${HEAD('Find us', address)}<div style="border:1px solid var(--color-gray-200);border-radius:1rem;overflow:hidden"><iframe title="Map: ${esc(address)}" src="https://www.google.com/maps?q=${encodeURIComponent(address)}&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" style="border:0;width:100%;height:20rem;display:block"></iframe></div><p style="text-align:center;margin:1rem 0 0"><a href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(address)}" target="_blank" rel="noopener" style="color:var(--g-accent);font-weight:600">Open in Google Maps</a></p></section>`)
  }

  const video = get('video')
  const embed = video?.value ? videoEmbed(video.value) : undefined
  if (embed) {
    sections.push(`<section data-widget="video"${attr(page === undefined ? undefined : '/')} style="${SECTION}">${HEAD('Watch')}<div style="position:relative;aspect-ratio:16/9;border-radius:1rem;overflow:hidden;border:1px solid var(--color-gray-200);background:#000">${embed.kind === 'frame' ? `<iframe title="Video" src="${esc(embed.src)}" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe>` : `<video src="${esc(embed.src)}" controls preload="metadata" style="position:absolute;inset:0;width:100%;height:100%"></video>`}</div></section>`)
  }

  if (get('booking')) {
    const services = content.features.items.slice(0, 8).map((f) => f.title)
    sections.push(`<section data-widget="booking"${attr(page)} id="book" style="${SECTION}">${HEAD('Book an appointment', 'Choose a day and a time and we will confirm it with you.')}<form data-lead data-subject="Booking request: ${esc(brand)}" style="${CARD};max-width:40rem;margin:0 auto;display:grid;gap:1rem">
<div><label style="${LABEL}" for="bk-name">Your name</label><input id="bk-name" name="name" required autocomplete="name" style="${FIELD}"></div>
<div><label style="${LABEL}" for="bk-phone">Phone</label><input id="bk-phone" name="phone" type="tel" required autocomplete="tel" style="${FIELD}"></div>
${services.length ? `<div><label style="${LABEL}" for="bk-service">Service</label><select id="bk-service" name="service" style="${FIELD}">${services.map((s) => `<option>${esc(s)}</option>`).join('')}</select></div>` : ''}
<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem"><div><label style="${LABEL}" for="bk-date">Day</label><input id="bk-date" name="date" type="date" data-future required style="${FIELD}"></div><div><label style="${LABEL}" for="bk-time">Time</label><input id="bk-time" name="time" type="time" required style="${FIELD}"></div></div>
<div><label style="${LABEL}" for="bk-note">Anything we should know (optional)</label><textarea id="bk-note" name="note" rows="3" style="${FIELD}"></textarea></div>
<button type="submit" style="${BUTTON}">Request this time</button></form></section>`)
  }

  if (get('order')) {
    const plans = content.pricing.plans.filter((p) => money(p.price).amount > 0)
    const items = (plans.length ? plans.map((p) => ({ name: p.name, ...money(p.price) })) : content.features.items.slice(0, 6).map((f) => ({ name: f.title, symbol: '', amount: 0 }))).slice(0, 8)
    const symbol = items.find((i) => i.symbol)?.symbol ?? ''
    const wa = chatNumber(undefined, content)
    sections.push(`<section data-widget="order"${attr(page === undefined ? undefined : '/')} id="order" style="${SECTION}">${HEAD('Order', wa ? 'Choose what you want and send the order on WhatsApp.' : 'Choose what you want and send the order by e-mail.')}<div data-order data-brand="${esc(brand)}" data-wa="${esc(wa)}" data-email="${esc(wa ? '' : emailOf(content))}" data-symbol="${esc(symbol)}" style="${CARD};max-width:40rem;margin:0 auto">
${items.map((i) => `<div data-item data-name="${esc(i.name)}" data-price="${i.amount}" style="display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.75rem 0;border-bottom:1px solid var(--color-gray-200)"><div><strong>${esc(i.name)}</strong>${i.amount ? `<div style="opacity:.7;font-size:.9rem">${esc(i.symbol)}${i.amount.toLocaleString('en-IN')}</div>` : ''}</div><div style="display:flex;align-items:center;gap:.6rem"><button type="button" data-step="-1" aria-label="One less ${esc(i.name)}" style="width:2rem;height:2rem;border-radius:9999px;border:1px solid var(--color-gray-300);background:transparent;color:inherit;cursor:pointer;font-size:1.1rem">-</button><span data-qty aria-live="polite" style="min-width:1.5rem;text-align:center">0</span><button type="button" data-step="1" aria-label="One more ${esc(i.name)}" style="width:2rem;height:2rem;border-radius:9999px;border:0;background:var(--g-accent);color:var(--g-on-accent);cursor:pointer;font-size:1.1rem">+</button></div></div>`).join('')}
<div style="display:flex;justify-content:space-between;align-items:center;margin:1.25rem 0 1rem"><strong>Total</strong><strong data-total>-</strong></div>
<button type="button" data-send style="${BUTTON};width:100%">${wa ? 'Send order on WhatsApp' : 'Send order by e-mail'}</button><p data-order-note role="status" style="margin:.75rem 0 0;font-size:.9rem;color:#b45309"></p></div></section>`)
  }

  const pay = get('pay')
  if (pay?.value) {
    const link = `upi://pay?pa=${encodeURIComponent(pay.value)}&pn=${encodeURIComponent(brand)}&cu=INR`
    sections.push(`<section data-widget="pay"${attr(page === undefined ? undefined : '/')} id="pay" style="${SECTION}">${HEAD('Pay by UPI', pay.text ?? 'Pay with any UPI app on your phone.')}<div style="${CARD};max-width:28rem;margin:0 auto;text-align:center"><p style="margin:0 0 .25rem;opacity:.7;font-size:.9rem">UPI id</p><p style="margin:0 0 1.25rem;font-size:1.2rem;font-weight:700;word-break:break-all">${esc(pay.value)}</p><a href="${esc(link)}" style="${BUTTON}">Pay with UPI app</a> <button type="button" data-copy="${esc(pay.value)}" style="${BUTTON.replace('background:var(--g-accent);color:var(--g-on-accent)', 'background:transparent;color:inherit;border:1px solid var(--color-gray-300)')}">Copy id</button><p style="margin:1rem 0 0;font-size:.8rem;opacity:.65">On a computer, copy the id and pay from your phone.</p></div></section>`)
  }

  if (get('newsletter')) {
    sections.push(`<section data-widget="newsletter"${attr(page === undefined ? undefined : '/')} id="news" style="${SECTION}">${HEAD('Stay in the loop', 'News and offers from ' + brand + ', now and then. No spam.')}<form data-lead data-subject="Newsletter signup: ${esc(brand)}" style="max-width:30rem;margin:0 auto;display:flex;gap:.75rem;flex-wrap:wrap"><label for="nl-mail" style="position:absolute;left:-9999px">Your e-mail</label><input id="nl-mail" name="email" type="email" required autocomplete="email" placeholder="you@example.com" style="${FIELD};flex:1 1 12rem"><button type="submit" style="${BUTTON}">Subscribe</button></form></section>`)
  }

  const chat = get('whatsapp')
  const number = chat ? chatNumber(chat, content) : ''
  if (chat && number) {
    floating.push(`<a data-widget="whatsapp" data-page="*" href="https://wa.me/${number}?text=${encodeURIComponent(`Hello ${brand}`)}" target="_blank" rel="noopener" aria-label="Chat with ${esc(brand)} on WhatsApp" style="position:fixed;left:1rem;bottom:1rem;z-index:60;display:flex;align-items:center;gap:.5rem;background:#25d366;color:#fff;padding:.7rem 1rem;border-radius:9999px;font-weight:600;font-size:.95rem;text-decoration:none;box-shadow:0 6px 18px rgba(0,0,0,.25)"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.2 14c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 .9-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.3.4-.4.4c-.1.1-.3.3-.1.6.2.3.7 1.2 1.5 1.9 1 .9 1.9 1.2 2.2 1.3.3.1.4.1.6-.1l.8-.9c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.8-.2 1.5Z"/></svg>Chat</a>`)
  }
  const call = get('call')
  const dial = call ? callNumber(call, content) : ''
  if (call && dial) {
    floating.push(`<a data-widget="call" data-page="*" href="tel:${esc(dial)}" aria-label="Call ${esc(brand)}" style="position:fixed;right:4.5rem;bottom:1rem;z-index:60;display:flex;align-items:center;gap:.5rem;background:var(--g-accent);color:var(--g-on-accent);padding:.7rem 1rem;border-radius:9999px;font-weight:600;font-size:.95rem;text-decoration:none;box-shadow:0 6px 18px rgba(0,0,0,.25)"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.6 3.6a1 1 0 0 1-.25 1l-2.25 2.2Z"/></svg>Call now</a>`)
  }
  return { top: top.join(''), sections: sections.join(''), floating: floating.join('') }
}

/** the lines for the <head> of the exported site (the preview never sends visits to Google) */
export function analyticsHead(content: WebsiteContent): string {
  const id = ((content.widgets ?? []) as Widget[]).find((w) => w.kind === 'analytics')?.value
  if (!id || !ANALYTICS.test(id)) return ''
  if (id.startsWith('GTM-')) return `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');</script>`
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${id}');</script>`
}
