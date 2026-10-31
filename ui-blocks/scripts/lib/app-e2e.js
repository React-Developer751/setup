// Runs in the page of the dev server (headless Chrome, see scripts/qa-app.mjs): builds a site from a prompt, opens its export in a frame and walks through it the way a visitor does.
// window.__e2e(spec) -> { prompt, problems: [...], notes: {...} }.  spec: { prompt, app: 'on' | 'off' | 'later' | 'removed', pages: 'single' | 'multi' | undefined, via: 'standalone' | 'static', width }
;(async () => {
  const t = Date.now()
  const g = await import(`/src/generator/library/generateLibraryPage.ts?t=${t}`)
  const e = await import(`/src/generator/edit/edits.ts?t=${t}`)
  const ex = await import(`/src/generator/exportLibrary.tsx?t=${t}`)
  const ai = await import(`/src/generator/app/appIntent.ts?t=${t}`)
  const pi = await import(`/src/generator/edit/pagesIntent.ts?t=${t}`)
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const clearApp = () => Object.keys(localStorage).filter((k) => k.startsWith('ap:')).forEach((k) => localStorage.removeItem(k))

  window.__e2e = async (spec) => {
    const rep = { prompt: spec.prompt, problems: [], notes: {} }
    const bad = (m) => rep.problems.push(m)
    let fr
    try {
      // 1. the prompt, as the generator page reads it: the words about the app are cut out, the pages are chosen
      const clean = ai.stripAppRequest(spec.prompt)
      const asked = ai.appIntent(spec.prompt)
      const probe = g.generateLibraryPage(clean, 7, undefined, true, 'auto', undefined, false)
      const choice = pi.autoPages(clean, probe.themeKey)
      rep.notes.pages = choice.mode
      if (spec.pages && choice.mode !== spec.pages) bad(`pages: wanted ${spec.pages}, the generator chose ${choice.mode} (${choice.reason})`)
      const ops = spec.app === 'on' ? [{ op: 'app', on: true }] : spec.app === 'later' ? [{ op: 'app', on: true }] : spec.app === 'removed' ? [{ op: 'app', on: true }, { op: 'app', on: false }] : []
      if (spec.app === 'on' && asked !== 'on') bad(`the prompt was meant to ask for the app but appIntent says ${asked}`)
      if ((spec.app === 'off' || spec.app === 'later') && asked === 'on') bad(`the prompt was not meant to ask for the app but appIntent says ${asked}`)
      const lib = g.generateLibraryPage(clean, 7, undefined, true, 'auto', ops.length ? e.editsFrom(ops) : undefined, choice.mode === 'multi')
      const wantApp = spec.app === 'on' || spec.app === 'later'
      if (!!lib.content.app !== wantApp) bad(`content.app is ${!!lib.content.app}, wanted ${wantApp}`)
      // (when the prompt asks for the app, its words are cut out of the business; "dashboard software" is a product and may be on the page)
      if (asked === 'on' && (/login|dashboard/i.test(JSON.stringify(lib.content.features.items)) || /login|dashboard/i.test(lib.content.brandName))) bad('the words login/dashboard are on the page as a service or a name')

      // 2. the export, in a frame
      let html
      if (spec.via === 'static') {
        const files = ex.buildLibraryStaticFiles(lib)
        const text = (f) => (typeof f.content === 'string' ? f.content : new TextDecoder().decode(f.content))
        const idx = files.find((f) => /\/index\.html$/.test(f.path))
        const js = files.find((f) => /assets\/site\.js$/.test(f.path))
        html = text(idx).replace(/<script[^>]*src="assets\/site\.js"[^>]*><\/script>/, () => `<script>${text(js).replace(/<\/script/g, '<\\/script')}</script>`)
      } else html = ex.buildLibraryStandalone(lib)
      html = html.replace('<head>', '<head><script>window.__errs=[];window.addEventListener("error",function(e){__errs.push(e.message)});window.addEventListener("unhandledrejection",function(e){__errs.push(String(e.reason))})</script>')
      clearApp()
      fr = document.createElement('iframe')
      fr.style.cssText = `position:fixed;left:0;top:0;width:${spec.width ?? 1100}px;height:760px;opacity:0;pointer-events:none`
      fr.srcdoc = html
      document.body.appendChild(fr)
      await new Promise((r) => (fr.onload = r))
      await sleep(1200)
      const d = fr.contentDocument
      const w = fr.contentWindow
      w.confirm = () => true

      // 3. the pages of the site itself
      const sections = [...d.querySelectorAll('[data-role]')]
      const pagesSeen = new Set(sections.map((s) => s.getAttribute('data-page')).filter(Boolean))
      rep.notes.pageAttrs = [...pagesSeen].length
      if (choice.mode === 'multi' && pagesSeen.size < 2) bad(`a site with pages has ${pagesSeen.size} page(s) in the export`)
      if (choice.mode === 'single' && pagesSeen.size > 1) bad(`one page was meant but the export has ${pagesSeen.size} pages`)
      const hrefs = [...d.querySelectorAll('nav a')].map((a) => a.getAttribute('href') || '')
      if (choice.mode === 'single' && hrefs.some((h) => /^#\/(?!login|register|app)/.test(h))) bad('one page, but the menu links to other pages: ' + hrefs.filter((h) => /^#\/(?!login)/.test(h)).slice(0, 3).join(' '))
      if (choice.mode === 'multi' && !hrefs.some((h) => /^#\/(?!login|register|app)/.test(h))) bad('several pages, but the menu has no link to a page')
      if (d.documentElement.scrollWidth > w.innerWidth + 4) bad(`the site scrolls sideways (${d.documentElement.scrollWidth} > ${w.innerWidth})`)

      // 4. no app: nothing of it is there
      const link = d.querySelector('a[data-ap-link]')
      if (!wantApp) {
        if (link) bad('the site has a Log in link although the app was not asked for')
        if (d.querySelector('.ap')) bad('the site has the app although it was not asked for')
        if (/Log in|Create your account/.test(d.body.innerText)) bad('words of the app on a site without it')
        if (!d.querySelector('.ap') && fr) { fr.remove(); clearApp(); return rep }
      } else {
        if (!link) bad('no Log in link in the menu')
        const before = w.location.hash
        w.location.hash = '#/app'
        await sleep(300)
        if (w.location.hash !== '#/login') bad('the dashboard opened without a login (' + w.location.hash + ')')
        w.location.hash = before || '#/'

        // 5. register, then every page of the dashboard
        w.location.hash = '#/register'
        await sleep(350)
        const set = (n, v) => { const el = d.querySelector(`.ap [name="${n}"]`); if (!el) throw new Error('the register form is missing'); el.value = v }
        // a wrong password is refused first
        set('name', 'Test Owner'); set('email', 't@example.com'); set('password', 'abc'); set('again', 'abc')
        d.querySelector('.ap form').dispatchEvent(new w.Event('submit', { cancelable: true, bubbles: true }))
        await sleep(300)
        if (w.location.hash === '#/app') bad('a 3-letter password was accepted')
        set('password', 'secret12'); set('again', 'secret12')
        d.querySelector('.ap form').dispatchEvent(new w.Event('submit', { cancelable: true, bubbles: true }))
        await sleep(600)
        if (w.location.hash !== '#/app') bad('register did not open the dashboard: ' + w.location.hash)
        const nav = [...d.querySelectorAll('.ap-nav a')].map((a) => [a.getAttribute('href'), a.textContent])
        rep.notes.dashboard = nav.map((n) => n[1]).join(', ')
        const text = () => d.querySelector('.ap')?.innerText || ''
        const check = (where) => {
          if (/\bundefined\b|\bNaN\b|\[object/.test(text())) bad(`${where}: undefined/NaN on screen`)
          const body = d.querySelector('.ap-body')
          if (body && body.scrollWidth > body.clientWidth + 4) bad(`${where}: sideways overflow (${body.scrollWidth} > ${body.clientWidth})`)
        }
        check('overview')
        const kp = [...d.querySelectorAll('.ap-kpi b')].map((b) => b.textContent)
        if (kp.length !== 4 || kp.some((v) => !v || v === '—')) bad('overview figures: ' + kp.join('|'))
        const bars = [...d.querySelectorAll('.ap-bars')].map((b) => [...b.children].filter((c) => c.children[0].textContent !== '0').length)
        if (!bars.length || bars.some((n) => n < 3)) bad('the month chart is nearly empty: ' + bars.join(','))
        for (const [href, label] of nav) {
          w.location.hash = href
          await sleep(180)
          check(label)
          if (/#\/app$|insights|settings/.test(href)) continue
          const rows0 = d.querySelectorAll('.ap tbody tr').length
          if (rows0 < 3) bad(`${label}: fewer than 3 rows`)
          const addb = d.querySelector('.ap [data-add]')
          if (!addb) { bad(`${label}: no add button`); continue }
          addb.click(); await sleep(100)
          const m = d.querySelector('.ap-modal')
          if (!m) { bad(`${label}: the add form did not open`); continue }
          // an empty form is refused, a filled one is kept
          m.querySelector('form').dispatchEvent(new w.Event('submit', { cancelable: true, bubbles: true }))
          await sleep(80)
          if (!d.querySelector('.ap-modal .ap-err')) bad(`${label}: an empty form was not refused`)
          ;[...m.querySelectorAll('input,select')].forEach((el, i) => { if (el.tagName === 'SELECT') return; el.value = el.type === 'date' ? '2026-03-12' : /email/.test(el.name) ? 'x@example.com' : i === 0 ? 'E2E Row' : '42' })
          m.querySelector('form').dispatchEvent(new w.Event('submit', { cancelable: true, bubbles: true }))
          await sleep(120)
          const err = d.querySelector('.ap-modal .ap-err')?.textContent
          if (err) { bad(`${label}: the form refused sample values: ${err}`); d.querySelector('.ap-modal [data-cancel]')?.click(); continue }
          if (d.querySelectorAll('.ap tbody tr').length !== rows0 + 1) bad(`${label}: the row was not added`)
          const q = d.querySelector('.ap [data-q]'); q.value = 'E2E Row'; q.dispatchEvent(new w.Event('input', { bubbles: true })); await sleep(80)
          if (d.querySelectorAll('.ap tbody tr').length < 1) bad(`${label}: the search found nothing`)
          w.location.hash = href; await sleep(120)
          d.querySelector('.ap th[data-sort]')?.click(); await sleep(80)
          d.querySelector('.ap [data-del]')?.click(); await sleep(120)
          let cap = null
          const oc = w.URL.createObjectURL
          w.URL.createObjectURL = (b) => { cap = b; return oc.call(w.URL, b) }
          w.HTMLAnchorElement.prototype.click = function () {}
          d.querySelector('.ap [data-export]')?.click(); await sleep(120)
          const csv = cap ? await cap.text() : ''
          if (!csv.includes('\r\n')) bad(`${label}: the CSV export is empty`)
          const input = d.querySelector('.ap [data-file]')
          const dt = new w.DataTransfer(); dt.items.add(new w.File([csv], 'x.csv', { type: 'text/csv' })); input.files = dt.files
          input.dispatchEvent(new w.Event('change', { bubbles: true })); await sleep(300)
          const note = d.querySelector('.ap .ap-note')?.textContent || ''
          if (!/Added|Replaced|already/.test(note)) bad(`${label}: the import said: ${note.slice(0, 80)}`)
          w.location.hash = href; await sleep(80)
        }
        w.location.hash = '#/app/insights'; await sleep(220)
        check('insights')
        if (d.querySelectorAll('.ap-body h3').length < 2) bad('insights has fewer than 2 cards')
        const sel = d.querySelector('.ap [data-range]')
        if (sel) { sel.value = '12'; sel.dispatchEvent(new w.Event('change', { bubbles: true })); await sleep(150); check('insights, 12 months') }
        w.location.hash = '#/app/settings'; await sleep(180); check('settings')
        // a backup of the data, and the way back to the site
        let cap2 = null
        const oc2 = w.URL.createObjectURL
        w.URL.createObjectURL = (b) => { cap2 = b; return oc2.call(w.URL, b) }
        w.HTMLAnchorElement.prototype.click = function () {}
        d.querySelector('.ap [data-backup]')?.click(); await sleep(120)
        try { if (!JSON.parse(await cap2.text()).tables) bad('the backup has no tables') } catch { bad('the backup is not JSON') }
        d.querySelector('.ap [data-logout]')?.click(); await sleep(250)
        if (w.location.hash !== '#/login') bad('logout did not go to the login page')
        // log in again with the account made, and with a wrong password
        const set2 = (n, v) => { d.querySelector(`.ap [name="${n}"]`).value = v }
        set2('email', 't@example.com'); set2('password', 'wrongpass')
        d.querySelector('.ap form').dispatchEvent(new w.Event('submit', { cancelable: true, bubbles: true })); await sleep(400)
        if (w.location.hash === '#/app') bad('a wrong password logged in')
        set2('password', 'secret12')
        d.querySelector('.ap form').dispatchEvent(new w.Event('submit', { cancelable: true, bubbles: true })); await sleep(500)
        if (w.location.hash !== '#/app') bad('the right password did not log in')
        w.location.hash = '#/'; await sleep(250)
        if (d.querySelector('.ap') && !d.querySelector('.ap').hidden) bad('the app still covers the site after going back to it')
        // the data and the session stay when the page is opened again (they are kept in the browser)
        const firstPage = nav.find(([h]) => !/#\/app$|insights|settings/.test(h))
        if (firstPage) {
          w.location.hash = firstPage[0]; await sleep(200)
          d.querySelector('.ap [data-add]').click(); await sleep(100)
          const mm = d.querySelector('.ap-modal')
          ;[...mm.querySelectorAll('input,select')].forEach((el, i) => { if (el.tagName === 'SELECT') return; el.value = el.type === 'date' ? '2026-03-12' : /email/.test(el.name) ? 'x@example.com' : i === 0 ? 'Persist Row' : '9' })
          mm.querySelector('form').dispatchEvent(new w.Event('submit', { cancelable: true, bubbles: true })); await sleep(150)
          fr.srcdoc = html
          await new Promise((r) => (fr.onload = r))
          await sleep(1200)
          const d2 = fr.contentDocument, w2 = fr.contentWindow
          w2.location.hash = firstPage[0]; await sleep(400)
          if (w2.location.hash === '#/login') bad('after opening the page again the session was lost')
          else if (!/Persist Row/.test(d2.querySelector('.ap')?.innerText || '')) bad('after opening the page again the added row was gone')
        }
      }
      const errs = w.__errs || []
      if (errs.length) bad('script errors: ' + errs.slice(0, 2).join(' | '))
    } catch (err) {
      bad('crashed: ' + err.message)
    }
    try { fr?.remove() } catch { /* gone */ }
    clearApp()
    return rep
  }
  window.__e2eReady = true
})()
