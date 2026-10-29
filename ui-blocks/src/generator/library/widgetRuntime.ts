// The little programs of the widgets (countdown, order on WhatsApp, copy the UPI id, booking dates). Plain DOM code: the same text runs in the app,
// in the React project and, turned into plain JavaScript (scripts/gen-runtime.mjs), in the standalone and static exports.

// the boxes that already have their listeners (kept here, not in the page: an exported page must be wired again when it opens)
const wiredBoxes = new WeakSet<Element>()
const wPad = (n: number) => String(n).padStart(2, '0')

export function initWidgets(root: ParentNode = document): () => void {
  const timers: number[] = []
  const stops: (() => void)[] = []

  // a countdown to a date: days, hours, minutes, seconds; "Offer ended" when it is over
  root.querySelectorAll<HTMLElement>('[data-countdown]').forEach((el) => {
    const end = Date.parse(el.dataset.countdown ?? '')
    if (!end) return
    const tick = () => {
      const left = end - Date.now()
      if (left <= 0) {
        el.textContent = 'Offer ended'
        return
      }
      const s = Math.floor(left / 1000)
      el.textContent = `${Math.floor(s / 86400)}d ${wPad(Math.floor((s % 86400) / 3600))}h ${wPad(Math.floor((s % 3600) / 60))}m ${wPad(s % 60)}s`
    }
    tick()
    timers.push(window.setInterval(tick, 1000))
  })

  // a booking form cannot ask for a day that is gone
  const today = new Date()
  const iso = `${today.getFullYear()}-${wPad(today.getMonth() + 1)}-${wPad(today.getDate())}`
  root.querySelectorAll<HTMLInputElement>('input[type="date"][data-future]').forEach((input) => (input.min = iso))

  // the order list: quantities, the total, and the message that goes to WhatsApp (or the mail program)
  root.querySelectorAll<HTMLElement>('[data-order]').forEach((box) => {
    if (wiredBoxes.has(box)) return
    wiredBoxes.add(box)
    const rows = [...box.querySelectorAll<HTMLElement>('[data-item]')]
    const total = box.querySelector<HTMLElement>('[data-total]')
    const note = box.querySelector<HTMLElement>('[data-order-note]')
    const symbol = box.dataset.symbol ?? ''
    const qty = (row: HTMLElement) => Number(row.querySelector<HTMLElement>('[data-qty]')?.textContent ?? 0)
    const refresh = () => {
      const sum = rows.reduce((a, row) => a + qty(row) * Number(row.dataset.price ?? 0), 0)
      if (total) total.textContent = sum ? `${symbol}${sum.toLocaleString('en-IN')}` : '-'
    }
    const onClick = (event: Event) => {
      const target = event.target as HTMLElement
      const step = target.closest<HTMLElement>('[data-step]')
      if (step && box.contains(step)) {
        const row = step.closest<HTMLElement>('[data-item]')
        const q = row?.querySelector<HTMLElement>('[data-qty]')
        if (row && q) q.textContent = String(Math.max(0, Math.min(99, qty(row) + Number(step.dataset.step))))
        refresh()
        return
      }
      if (!target.closest('[data-send]')) return
      const chosen = rows.filter((row) => qty(row) > 0)
      if (!chosen.length) {
        if (note) note.textContent = 'Choose at least one item first.'
        return
      }
      const lines = chosen.map((row) => `${qty(row)} x ${row.dataset.name}${Number(row.dataset.price) ? ` (${symbol}${Number(row.dataset.price) * qty(row)})` : ''}`)
      const text = `New order for ${box.dataset.brand ?? 'the shop'}\n${lines.join('\n')}${total?.textContent && total.textContent !== '-' ? `\nTotal: ${total.textContent}` : ''}`
      if (box.dataset.wa) window.open(`https://wa.me/${box.dataset.wa}?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
      else if (box.dataset.email) window.location.href = `mailto:${box.dataset.email}?subject=${encodeURIComponent(`Order for ${box.dataset.brand ?? ''}`)}&body=${encodeURIComponent(text)}`
      else if (note) note.textContent = 'There is no WhatsApp number or email to send this to yet.'
    }
    box.addEventListener('click', onClick)
    stops.push(() => box.removeEventListener('click', onClick))
    refresh()
  })

  // copy the UPI id
  const onCopy = (event: Event) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>('[data-copy]')
    if (!button) return
    const text = button.dataset.copy ?? ''
    void navigator.clipboard?.writeText(text).then(() => {
      const old = button.textContent
      button.textContent = 'Copied'
      window.setTimeout(() => (button.textContent = old), 1500)
    })
  }
  const host = root as unknown as HTMLElement
  if (host.addEventListener) {
    host.addEventListener('click', onCopy)
    stops.push(() => host.removeEventListener('click', onCopy))
  }
  return () => {
    timers.forEach((t) => window.clearInterval(t))
    stops.forEach((s) => s())
  }
}
