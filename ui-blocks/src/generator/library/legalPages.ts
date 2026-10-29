// The pages every business site is expected to have: a privacy policy, terms of use and a "not found" page, written from what the site really does (a contact form that
// goes to e-mail or WhatsApp, analytics only when the person added it). They are a starting text, not legal advice, and say so.
import type { WebsiteContent } from '../finalPrompt'
import type { PaletteMode } from '../themes'
import { analyticsHead } from './widgets'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const real = (v: string | undefined) => (v && !/example\.|your-?domain|yourbusiness|sample street|^\+?1?\s*\(?555/i.test(v) ? v : '')

const shell = (title: string, body: string, content: WebsiteContent, p: PaletteMode, home: string) => `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)} - ${esc(content.brandName)}</title>
<meta name="robots" content="${title === 'Page not found' ? 'noindex' : 'index,follow'}" />
<style>body{margin:0;background:${p.bg};color:${p.text};font:16px/1.65 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}main{max-width:44rem;margin:0 auto;padding:3rem 1.25rem 4rem}h1{font-size:2rem;line-height:1.2;margin:0 0 1rem}h2{font-size:1.2rem;margin:2rem 0 .4rem}a{color:${p.accent}}p,li{margin:.4rem 0}.note{border:1px solid ${p.border};background:${p.surface};border-radius:.75rem;padding:.8rem 1rem;font-size:.9rem;color:${p.muted}}header a{font-weight:700;text-decoration:none}</style>
</head>
<body><main><header><a href="${esc(home)}">&larr; ${esc(content.brandName)}</a></header><h1>${esc(title)}</h1>${body}</main></body>
</html>
`

const contactLines = (c: WebsiteContent) =>
  [real(c.contact.email) && `E-mail: <a href="mailto:${esc(c.contact.email)}">${esc(c.contact.email)}</a>`, real(c.contact.phone) && `Phone: ${esc(c.contact.phone)}`, real(c.contact.address) && `Address: ${esc(c.contact.address)}`].filter(Boolean).join('<br>') || 'Use the contact details on the home page.'

const today = () => new Date().toISOString().slice(0, 10)

export function privacyPage(content: WebsiteContent, p: PaletteMode, home = './'): string {
  const analytics = !!analyticsHead(content)
  const hasEmail = !!real(content.contact.email)
  const hasWa = !!(content.contact.whatsapp || content.contact.phone)
  return shell('Privacy policy', `<p class="note">Starting text for ${esc(content.brandName)}. It describes how this website works today. Have it checked by a lawyer if you collect more than a contact message.</p>
<p>Last updated: ${today()}</p>
<h2>What we collect</h2>
<p>Only what you type into a form on this website (for example your name, phone number, e-mail address, the day and time you ask for, and your message). Nothing is collected until you send a form.</p>
<h2>Where it goes</h2>
<p>${hasEmail ? 'A form opens your e-mail program with the message written, and you send it to us yourself.' : 'A form passes your message on to us.'}${hasWa ? ' Some forms open WhatsApp with the message written; you press send yourself.' : ''} The website itself does not store your details on a server of its own.</p>
<h2>Cookies and tracking</h2>
<p>${analytics ? 'This website uses Google Analytics to count visits (pages viewed, the country, the device). Google may set cookies for this. You can block them in your browser settings.' : 'This website does not use advertising or tracking cookies.'} Your choice of light or dark mode is kept in your browser (local storage) so the page opens the way you left it.</p>
<h2>Other websites</h2>
<p>Maps, videos and links on this website belong to other services (for example Google Maps or YouTube). They have their own privacy rules.</p>
<h2>Your choices</h2>
<p>Ask us to delete a message you sent, or to correct it, using the contact details below.</p>
<h2>Contact</h2>
<p>${contactLines(content)}</p>`, content, p, home)
}

export function termsPage(content: WebsiteContent, p: PaletteMode, home = './'): string {
  return shell('Terms of use', `<p class="note">Starting text for ${esc(content.brandName)}. Have it checked by a lawyer before you rely on it.</p>
<p>Last updated: ${today()}</p>
<h2>Using this website</h2>
<p>This website gives information about ${esc(content.brandName)} and its services. Use it for lawful purposes only.</p>
<h2>Information</h2>
<p>We try to keep the information correct, but prices, timings and availability can change. Please confirm with us before you rely on them.</p>
<h2>Bookings and orders</h2>
<p>A booking request or an order sent through this website is a request, not a confirmed booking, until ${esc(content.brandName)} confirms it with you.</p>
<h2>Links to other websites</h2>
<p>We are not responsible for the content or the privacy practices of websites we link to.</p>
<h2>Limit of responsibility</h2>
<p>As far as the law allows, ${esc(content.brandName)} is not responsible for losses that come from using this website.</p>
<h2>Contact</h2>
<p>${contactLines(content)}</p>`, content, p, home)
}

export const notFoundPage = (content: WebsiteContent, p: PaletteMode): string =>
  shell('Page not found', `<p>The page you asked for is not here. <a href="./">Go to the home page of ${esc(content.brandName)}</a>.</p>`, content, p, './')

/** the small row of links at the end of the exported page */
export const legalLinks = (p: PaletteMode): string =>
  `<p data-legal data-page="*" style="text-align:center;font-size:.8rem;padding:1rem 1rem 2rem;margin:0;color:${p.muted}"><a href="privacy.html" style="color:inherit">Privacy policy</a> &middot; <a href="terms.html" style="color:inherit">Terms of use</a></p>`
