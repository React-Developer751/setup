/** On a multi-page site a link to a part ("#contact") is a link to the page that has it ("#/contact"). */
export function rewritePageLinks(root: Element) {
  const pageOfId = new Map<string, string>()
  const pages = new Set<string>()
  root.querySelectorAll<HTMLElement>('[data-page]').forEach((el) => {
    pages.add(el.dataset.page ?? '')
    if (el.id) pageOfId.set(el.id, el.dataset.page ?? '')
  })
  root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    const href = a.getAttribute('href') ?? ''
    if (href === '#' || href.startsWith('#/')) return
    const page = pageOfId.get(href.slice(1))
    a.setAttribute('href', page && page !== '*' ? `#${page}` : pages.has('/contact') && href !== '#home' ? '#/contact' : '#/')
  })
}

