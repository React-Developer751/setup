// The working parts (booking, map, WhatsApp, UPI, countdown, newsletter, video, order, announce, analytics): reading the chat, checking values, drawing, and the honest answers.
import { loadGeneratorModule } from './lib/load-generator.mjs'
globalThis.document = { styleSheets: [] }
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} }
const { parseEdit } = await loadGeneratorModule('edit/understand.ts')
const { cleanOp, editsFrom, describeOp } = await loadGeneratorModule('edit/edits.ts')
const { cleanWidget, videoEmbed, renderWidgets, widgetNeeds, analyticsHead, chatNumber } = await loadGeneratorModule('library/widgets.ts')
let pass = 0
const fail = []
const ok = (c, m) => (c ? pass++ : fail.push(m))
const ops = (t) => parseEdit(t, 'single').ops ?? []
const kinds = (t) => ops(t).filter((o) => o.op === 'widget').map((o) => o.widget.kind)
const note = (t) => (parseEdit(t, 'single').notes ?? []).join(' ')

// reading the chat
for (const [text, want] of [
  ['add a booking form', ['booking']], ['mujhe appointment booking chahiye', ['booking']], ['add a map of my shop', ['map']], ['whatsapp chat button 9876543210', ['whatsapp']],
  ['upi id ravi@okhdfcbank', ['pay']], ['add an online payment button', ['pay']], ['sale ends in 3 days', ['countdown']], ['add a countdown timer for the sale', ['countdown']],
  ['add a newsletter signup', ['newsletter']], ['video link https://youtu.be/dQw4w9WgXcQ', ['video']], ['add a cart', ['order']], ['analytics id G-ABC123XYZ9', ['analytics']],
  ['add a booking form and a map', ['booking', 'map']], ['announcement "Free delivery above 999"', ['announce']],
]) ok(JSON.stringify(kinds(text)) === JSON.stringify(want), `"${text}" -> ${JSON.stringify(kinds(text))}`)
ok(ops('remove the booking form').some((o) => o.op === 'removeWidget' && o.kind === 'booking'), 'removing a widget')
ok(ops('booking form hatao aur FAQ bhi').some((o) => o.op === 'remove' && o.section === 'faq'), 'the verb of the first part belongs to the bare name after it')
ok(kinds('change the heading of the gallery section').length === 0 && kinds('make the cards rounded').length === 0, 'ordinary requests are not widgets')
const long = { ops: ops('add a booking form, whatsapp chat button 9876543210, upi id glow@okhdfcbank, sale ends in 3 days, map address 12 MG Road, Pune, and an order list') }
ok(long.ops.filter((o) => o.op === 'widget').length === 6 && long.ops.find((o) => o.op === 'widget' && o.widget.kind === 'map').widget.value === '12 MG Road, Pune', 'a long list: six widgets, the address keeps its comma')
ok(long.ops.some((o) => o.op === 'contact' && o.field === 'whatsapp'), 'a WhatsApp number given with the button is also the contact number')
ok(/UPI id/i.test(note('add an online payment button')) && /address/i.test(note('add a map of my shop')), 'a widget that needs a value asks for it')
for (const [text, re] of [['add a login page', /accounts|login/i], ['add a chatbot', /WhatsApp/], ['connect my domain', /Publish|host/i], ['add razorpay checkout', /gateway/i], ['add a database', /static/i]]) ok(re.test(note(text)), `honest answer for "${text}": ${note(text).slice(0, 50)}`)
ok(ops('add a booking form and make the hero bigger').some((o) => o.op === 'size'), 'a widget and a normal change in one message')

// checking values
ok(!cleanWidget({ kind: 'pay', value: 'not an id' }).value && cleanWidget({ kind: 'pay', value: 'Ravi@OkHdfc' }).value === 'ravi@okhdfc', 'UPI ids are checked')
ok(!cleanWidget({ kind: 'analytics', value: '<script>' }).value && cleanWidget({ kind: 'analytics', value: 'g-abc123xyz9' }).value === 'G-ABC123XYZ9', 'analytics ids are checked')
ok(videoEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ')?.src.includes('youtube-nocookie.com/embed/dQw4w9WgXcQ'), 'YouTube links become embeds')
ok(!videoEmbed('http://youtu.be/dQw4w9WgXcQ') && !videoEmbed('https://evil.example/x') && !videoEmbed('javascript:alert(1)'), 'only https YouTube, Vimeo or a video file go in a frame')
ok(!cleanWidget({ kind: 'nothing' }) && !cleanOp({ op: 'widget', widget: { kind: 'x' } }), 'an unknown kind is dropped')
ok(editsFrom([{ op: 'widget', widget: { kind: 'booking' } }, { op: 'widget', widget: { kind: 'booking' } }, { op: 'widget', widget: { kind: 'map' } }]).widgets.length === 2, 'a kind is there once')
ok(editsFrom([{ op: 'widget', widget: { kind: 'booking' } }, { op: 'removeWidget', kind: 'booking' }]).widgets.length === 0, 'undo of the add = removeWidget')
ok(/booking form/.test(describeOp({ op: 'widget', widget: { kind: 'booking' } })), 'the chat says what was added')

// drawing
const content = (widgets, contact = {}) => ({ brandName: 'Glow "Salon" <b>', features: { items: [{ title: 'Haircut' }, { title: 'Facial' }] }, pricing: { plans: [{ name: 'Basic', price: '₹500', period: '', perks: [] }, { name: 'Pro', price: '₹900', period: '', perks: [] }] }, contact: { address: '123 Sample Street, X', email: 'hello@yourdomain.com', phone: '', ...contact }, widgets })
const r = renderWidgets(content([{ kind: 'booking' }, { kind: 'order' }, { kind: 'announce', text: 'Free <script>x</script> delivery' }, { kind: 'whatsapp', value: '9876543210' }, { kind: 'pay', value: 'glow@okhdfc' }]))
ok(r.sections.includes('data-lead') && r.sections.includes('data-order') && r.floating.includes('wa.me/919876543210') && r.top.includes('Free'), 'the parts are drawn')
ok(!/<script>x/.test(r.top) && !r.sections.includes('<b>') , 'texts are escaped')
ok(r.sections.includes('data-price="500"') && r.sections.includes('data-symbol="₹"'), 'the order list reads the prices of the page')
ok(r.sections.includes('upi://pay?pa=glow%40okhdfc'), 'the UPI link is built')
ok(renderWidgets(content([{ kind: 'map' }])).sections === '' && widgetNeeds({ kind: 'map' }, content([])) !== '', 'a map without an address is not drawn (a made-up address is not shown on a map)')
ok(renderWidgets(content([{ kind: 'map' }], { address: '12 MG Road, Pune' })).sections.includes('12%20MG%20Road'), 'the map uses the address of the business')
ok(renderWidgets(content([{ kind: 'whatsapp' }], { phone: '9876543210' })).floating.includes('919876543210'), 'the chat button falls back to the phone number')
ok(chatNumber(undefined, content([], { whatsapp: '+91 98765 43210' })) === '919876543210', 'numbers are normalised')
ok(renderWidgets(content([{ kind: 'pay' }])).sections === '' && renderWidgets(content([{ kind: 'video' }])).sections === '' && renderWidgets(content([{ kind: 'countdown' }])).top === '', 'a widget that misses its value is not drawn')
ok(analyticsHead(content([{ kind: 'analytics', value: 'G-ABC123XYZ9' }])).includes('gtag/js?id=G-ABC123XYZ9') && analyticsHead(content([])) === '', 'analytics goes into the head only when there is an id')

console.log(`${pass} passed, ${fail.length} failed`)
for (const f of fail.slice(0, 15)) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)
