// Runs in the dev server's page: the generator page as a person uses it (type a prompt, build, chat) and what it does about the login and the dashboard.
// window.__ui(spec) -> { prompt, problems }.  spec: { prompt, link: bool (the site has "Log in" after the build), offer: bool (the chat offers "Add login and dashboard"), pages: 'single'|'multi', chat: [[text, linkAfter]] }
window.__ui = async (spec) => {
  const rep = { prompt: spec.prompt, problems: [], notes: {} }
  const bad = (m) => rep.problems.push(m)
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  try {
    Object.keys(localStorage).filter((k) => k.startsWith('ap:')).forEach((k) => localStorage.removeItem(k))
    const box = () => [...document.querySelectorAll('textarea')].find((t) => /Ask for a change/.test(t.placeholder))
    const frameDoc = () => { const f = [...document.querySelectorAll('iframe')].find((x) => x.contentDocument?.body?.innerText?.length > 200); return f?.contentDocument }
    const typeInto = (el, text) => { const set = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set; set.call(el, text); el.dispatchEvent(new Event('input', { bubbles: true })) }
    // back to the first screen
    const home = [...document.querySelectorAll('button')].find((b) => /^New site$/.test(b.textContent.trim()))
    if (home) { home.click(); await sleep(600) }
    const first = [...document.querySelectorAll('textarea')].find((t) => !/Ask for a change/.test(t.placeholder))
    if (!first) throw new Error('the first screen has no prompt box')
    typeInto(first, spec.prompt)
    await sleep(200)
    ;[...document.querySelectorAll('button')].find((b) => /Build my website/.test(b.textContent))?.click()
    // wait for the site: the chat box is there and the frame has text
    let ok = false
    for (let i = 0; i < 150; i += 1) {
      await sleep(1000)
      if (box() && frameDoc() && !/Building your website/.test(document.body.innerText)) { ok = true; break }
    }
    if (!ok) throw new Error('the site was not built in 150 seconds')
    await sleep(2500)
    let d = frameDoc()
    const hasLink = () => !!frameDoc()?.querySelector('a[data-ap-link]')
    if (hasLink() !== spec.link) bad(`after the build the site ${hasLink() ? 'has' : 'has no'} Log in, wanted ${spec.link ? 'it' : 'none'}`)
    const offered = /Add login and dashboard/.test(document.body.innerText)
    if (offered !== spec.offer) bad(`the chat ${offered ? 'offers' : 'does not offer'} the login and dashboard, wanted ${spec.offer ? 'an offer' : 'no offer'}`)
    if (spec.link && !/You asked for a login and a dashboard/.test(document.body.innerText)) bad('the chat does not say that the login and the dashboard are there because of the prompt')
    const pageAttr = new Set([...d.querySelectorAll('[data-role]')].map((s) => s.getAttribute('data-page')).filter(Boolean)).size
    rep.notes.pages = pageAttr > 1 ? 'multi' : 'single'
    if (spec.pages && rep.notes.pages !== spec.pages) bad(`the site has ${rep.notes.pages} page(s), wanted ${spec.pages}`)
    if (/login|dashboard/i.test([...d.querySelectorAll('h3,h4')].map((h) => h.textContent).join(' ')) && spec.link) bad('login/dashboard appear as a heading of the site')
    // the offer button, then the chat
    if (spec.offer && spec.clickOffer) {
      ;[...document.querySelectorAll('button')].find((b) => /Add login and dashboard/.test(b.textContent))?.click()
      await sleep(2500)
      if (!hasLink()) bad('the offer was taken but the site has no Log in')
    }
    for (const [text, linkAfter] of spec.chat ?? []) {
      typeInto(box(), text)
      await sleep(150)
      box().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }))
      await sleep(150)
      const send = [...document.querySelectorAll('button')].find((b) => /Send/i.test(b.getAttribute('aria-label') || ''))
      if (box()?.value) send?.click()
      await sleep(3000)
      if (hasLink() !== linkAfter) bad(`after "${text}" the site ${hasLink() ? 'has' : 'has no'} Log in, wanted ${linkAfter ? 'it' : 'none'}`)
    }
  } catch (err) {
    bad('crashed: ' + err.message)
  }
  return rep
}
window.__uiReady = true
