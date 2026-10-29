// Motion runtime: makes a generated page move. No animation library, just the browser.
//
// The templates mark elements with plain data attributes:
//   data-reveal="up|down|left|right|scale|fade"  fade / slide in when scrolled into view
//   data-delay="1..8"                            stagger step (times the plan's stagger)
//   data-count                                   number that counts up
//   data-draw                                    line that draws itself
//   data-split                                   headline that appears word by word
//   data-carousel / data-slide / data-dot        rotating testimonials
// Pages built from the stored components get the same attributes added automatically (`autoTag`).
//
// Safety rules
//   * Nothing is hidden until this runs (the CSS only hides under [data-motion="on"]), so with JavaScript off,
//     or before the page has mounted, all content is visible.
//   * prefers-reduced-motion switches everything off.
//   * It returns a cleanup function, so it is safe in React StrictMode (effects run twice in development).
import type { MotionPlan } from './motionBrain'

const prefersReducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** The element (or the window) that scrolls the page. In the preview it is the preview box. */
function scrollParent(el: HTMLElement): HTMLElement | Window {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const overflow = getComputedStyle(node).overflowY
    if ((overflow === 'auto' || overflow === 'scroll') && node.scrollHeight > node.clientHeight) return node
  }
  return window
}

const scrollTop = (sp: HTMLElement | Window) => (sp instanceof Window ? window.scrollY : sp.scrollTop)
const scrollRange = (sp: HTMLElement | Window) =>
  sp instanceof Window ? document.documentElement.scrollHeight - window.innerHeight : sp.scrollHeight - sp.clientHeight

// ───────────── count-up ─────────────
// Only plain numbers count: "99.9%", "2M+", "<50ms", "1,200". "24/7" or "Lifetime" are left alone.
const COUNTABLE = /^([<>~+]?)\s*(\d[\d,]*(?:\.\d+)?)\s*(%|[kKmM]\+?|\+|x|ms|s)?$/

function parseCount(text: string) {
  const match = COUNTABLE.exec(text.trim())
  if (!match) return null
  const [, prefix, number, suffix = ''] = match
  const decimals = number.includes('.') ? number.split('.')[1].length : 0
  return { prefix, suffix, target: parseFloat(number.replace(/,/g, '')), decimals, grouped: number.includes(',') }
}

const formatCount = (c: NonNullable<ReturnType<typeof parseCount>>, value: number) => {
  const text = value.toLocaleString('en-US', { minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals, useGrouping: c.grouped })
  return `${c.prefix}${text}${c.suffix}`
}

// ───────────── pages built from the stored components ─────────────
const signature = (el: Element) => `${el.tagName}|${el.getAttribute('class') ?? ''}`

/** a part of a page arrives in the ways of its business (plan.mix), one way for a whole part, another for the next one */
const TEXT_KINDS = new Set(['up', 'down', 'left', 'right', 'scale', 'fade', 'blur'])

/** Adds reveal / hover attributes to a page made of the stored components, without touching their code. Returns an undo. */
function autoTag(root: HTMLElement, plan: MotionPlan): () => void {
  const tagged: Element[] = []
  const lifted: Element[] = []
  const classes: [Element, string][] = []
  const mix: readonly string[] = plan.mix?.length ? plan.mix : ['up']
  const textMix = mix.filter((k) => TEXT_KINDS.has(k))
  const textKinds: readonly string[] = textMix.length ? textMix : ['up']
  const pictureKind = mix.includes('mask') ? 'mask' : mix.includes('scale') ? 'scale' : 'fade'
  const hoverable = !!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches

  const mark = (el: Element | null | undefined, kind: string, delay = 0) => {
    // (a part that holds another arriving part is left alone: two arrivals inside each other, or a clipped picture holder over text, would hide the text)
    if (!el || el.hasAttribute('data-reveal') || el.closest('[data-reveal]') || el.querySelector('[data-reveal]')) return
    el.setAttribute('data-reveal', kind)
    if (delay) el.setAttribute('data-delay', String(Math.min(delay, 8)))
    tagged.push(el)
  }
  const addClass = (el: Element, name: string) => {
    el.classList.add(name)
    classes.push([el, name])
  }

  let sectionIndex = 0
  root.querySelectorAll<HTMLElement>('[data-role]').forEach((section) => {
    const role = section.dataset.role
    if (role === 'nav' || role === 'footer') return
    // every part has its own arrival: the first one that the mix gives, then the next, so the page does not move one way from top to bottom
    const kind = role === 'hero' ? 'up' : textKinds[sectionIndex++ % textKinds.length]
    mark(section.querySelector('h1, h2'), kind)
    mark(section.querySelector('p'), kind === 'blur' ? 'fade' : 'up', 1)

    const seen = new Set<Element>()
    section.querySelectorAll('div, ul, ol').forEach((container) => {
      if (container.closest('[data-reveal]') || [...seen].some((s) => s.contains(container))) return
      const kids = [...container.children]
      if (kids.length < 2 || kids.length > 12) return
      const first = signature(kids[0])
      const cards = kids.every((k) => signature(k) === first && k.getBoundingClientRect().height > 80 && k.getBoundingClientRect().width > 120)
      if (!cards) return
      seen.add(container)
      kids.forEach((card, i) => {
        // a row of cards comes from both sides when the recipe has left and right, else every card in the arrival of the part
        const side = kind === 'left' || kind === 'right' ? (i % 2 === 0 ? 'left' : 'right') : kind
        mark(card, side, (i % 4) + 1)
        if (plan.features.tilt && hoverable) addClass(card, 'm-tilt')
        else if (plan.features.hover) {
          card.classList.add('m-lift')
          lifted.push(card)
        }
        if (plan.features.spotlight && hoverable) addClass(card, 'm-spot')
        if (plan.features.wiggle && hoverable) addClass(card, 'm-wiggle')
      })
    })

    // pictures of the part (not the first screen: that one drifts or moves with the page): they arrive in the way of the business and zoom when touched
    if (role !== 'hero') {
      section.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
        const box = img.getBoundingClientRect()
        if (box.width < 140 || box.height < 90) return
        const holder = img.parentElement
        if (!holder || holder === section) return
        // only a holder that is the picture alone arrives with the picture's wipe; a holder with words in it (a card, a contact block) keeps the words as they are
        if (!/\S/.test(holder.textContent ?? '')) mark(holder, pictureKind)
        if (plan.features.imageZoom && hoverable) addClass(holder, 'm-zoom')
      })
    }
  })

  return () => {
    tagged.forEach((el) => {
      el.removeAttribute('data-reveal')
      el.removeAttribute('data-delay')
      el.classList.remove('is-in')
    })
    lifted.forEach((el) => el.classList.remove('m-lift'))
    classes.forEach(([el, name]) => el.classList.remove(name))
  }
}

/**
 * The effects that follow the pointer or the scroll (kept apart from the arrivals): the first picture drifts or moves slower than the page,
 * cards tilt, a light follows the pointer, the main buttons lean. All of them wait for a real pointer (no touch screens) and for a page that has stopped.
 */
function livePieces(root: HTMLElement, plan: MotionPlan, sp: HTMLElement | Window, add: (fn: () => void) => void) {
  const f = plan.features
  const fine = !!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches

  // the first picture of the first screen: a slow zoom, and/or moving a little slower than the page
  const hero = root.querySelector<HTMLElement>('[data-role="hero"]')
  const picture = hero ? [...hero.querySelectorAll<HTMLImageElement>('img')].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0] : undefined
  if (picture && (f.kenburns || f.parallax) && picture.getBoundingClientRect().width > 220) {
    const holder = picture.parentElement
    const held = holder && getComputedStyle(holder).overflow
    if (holder && held === 'visible') {
      holder.style.overflow = 'hidden'
      add(() => (holder.style.overflow = ''))
    }
    if (f.kenburns) {
      picture.classList.add('m-kenburns')
      add(() => picture.classList.remove('m-kenburns'))
    }
    if (f.parallax) {
      let frame = 0
      const move = () => {
        frame = 0
        const box = picture.getBoundingClientRect()
        const view = sp instanceof Window ? window.innerHeight : sp.clientHeight
        const centre = box.top + box.height / 2 - (sp instanceof Window ? 0 : sp.getBoundingClientRect().top)
        const shift = Math.max(-28, Math.min(28, (centre - view / 2) * -0.06))
        picture.style.setProperty('--m-py', `${shift.toFixed(1)}px`)
      }
      const onScroll = () => {
        if (!frame) frame = requestAnimationFrame(move)
      }
      picture.classList.add('m-parallax')
      sp.addEventListener('scroll', onScroll, { passive: true })
      move()
      add(() => {
        sp.removeEventListener('scroll', onScroll)
        cancelAnimationFrame(frame)
        picture.classList.remove('m-parallax')
        picture.style.removeProperty('--m-py')
      })
    }
  }

  if (!fine) return

  // cards: tilt towards the pointer, and a light that follows it
  const onMove = (event: PointerEvent) => {
    const card = (event.target as Element | null)?.closest<HTMLElement>('.m-tilt, .m-spot')
    if (!card) return
    const box = card.getBoundingClientRect()
    const x = (event.clientX - box.left) / box.width
    const y = (event.clientY - box.top) / box.height
    if (card.classList.contains('m-tilt')) card.style.transform = `perspective(900px) rotateX(${((0.5 - y) * 7).toFixed(2)}deg) rotateY(${((x - 0.5) * 9).toFixed(2)}deg) translateZ(0)`
    card.style.setProperty('--sx', `${(x * 100).toFixed(1)}%`)
    card.style.setProperty('--sy', `${(y * 100).toFixed(1)}%`)
  }
  const onLeave = (event: PointerEvent) => {
    const card = (event.target as Element | null)?.closest<HTMLElement>('.m-tilt')
    if (card) card.style.transform = ''
  }
  if (f.tilt || f.spotlight) {
    root.addEventListener('pointermove', onMove, { passive: true })
    root.addEventListener('pointerout', onLeave, { passive: true })
    add(() => {
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerout', onLeave)
      root.querySelectorAll<HTMLElement>('.m-tilt').forEach((el) => (el.style.transform = ''))
    })
  }

  // the main buttons of the first screen and of the closing call lean a few pixels towards the pointer
  if (f.magnetic) {
    const buttons = [...root.querySelectorAll<HTMLElement>('[data-role="hero"] a, [data-role="hero"] button, [data-role="cta"] a, [data-role="cta"] button')].filter((b) => b.getBoundingClientRect().width > 80 && !b.closest('nav'))
    const pull = (event: PointerEvent) => {
      for (const button of buttons) {
        const box = button.getBoundingClientRect()
        const dx = event.clientX - (box.left + box.width / 2)
        const dy = event.clientY - (box.top + box.height / 2)
        const near = Math.hypot(dx, dy) < Math.max(box.width, 110)
        button.style.translate = near ? `${(dx * 0.12).toFixed(1)}px ${(dy * 0.18).toFixed(1)}px` : ''
      }
    }
    root.addEventListener('pointermove', pull, { passive: true })
    add(() => {
      root.removeEventListener('pointermove', pull)
      buttons.forEach((b) => (b.style.translate = ''))
    })
  }
}

// ───────────── the engine ─────────────
export function initMotion(root: HTMLElement, plan: MotionPlan): () => void {
  if (plan.level === 'off' || prefersReducedMotion()) {
    root.dataset.motion = 'off'
    return () => {}
  }

  const cleanups: (() => void)[] = []
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms)
    cleanups.push(() => window.clearTimeout(id))
  }

  root.dataset.motion = 'on'
  // what scrolls: the window on a real page, the preview box in the generator
  const sp = scrollParent(root)
  const observerRoot = sp instanceof Window ? null : sp
  root.style.setProperty('--m-dur', `${plan.duration}ms`)
  root.style.setProperty('--m-ease', plan.easing)
  root.style.setProperty('--m-dist', `${plan.distance}px`)
  root.style.setProperty('--m-stagger', `${plan.stagger}ms`)

  // library pages: tag cards and headings first
  if (root.hasAttribute('data-gen-theme') && plan.features.reveal) cleanups.push(autoTag(root, plan))
  if (root.hasAttribute('data-gen-theme')) livePieces(root, plan, sp, (fn) => cleanups.push(fn))

  // ── count-up: show 0 until the number scrolls into view
  const counters = plan.features.countUp
    ? [...root.querySelectorAll<HTMLElement>('[data-count]')].flatMap((el) => {
        const final = el.textContent ?? ''
        const parsed = parseCount(final)
        if (!parsed) return []
        el.textContent = formatCount(parsed, 0)
        cleanups.push(() => (el.textContent = final))
        return [{ el, final, parsed }]
      })
    : []

  const runCounter = (item: (typeof counters)[number]) => {
    const start = performance.now()
    const duration = 1400
    let frame = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - t) ** 3
      item.el.textContent = t < 1 ? formatCount(item.parsed, item.parsed.target * eased) : item.final
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    cleanups.push(() => cancelAnimationFrame(frame))
  }

  // ── headline word by word
  if (plan.features.split) {
    root.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
      if (el.dataset.splitDone) return
      const text = (el.textContent ?? '').trim()
      el.dataset.splitDone = '1'
      el.setAttribute('aria-label', text)
      el.textContent = ''
      text.split(/\s+/).forEach((word, i, words) => {
        const span = document.createElement('span')
        span.className = 'm-word'
        span.setAttribute('aria-hidden', 'true')
        span.style.transitionDelay = `${i * 60}ms`
        span.textContent = word
        el.append(span)
        if (i < words.length - 1) el.append(' ')
      })
      cleanups.push(() => {
        el.textContent = text
        delete el.dataset.splitDone
      })
    })
  }

  // ── reveal when scrolled into view
  const targets = [...root.querySelectorAll<HTMLElement>('[data-reveal], [data-draw], [data-split]')]
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const el = entry.target as HTMLElement
        observer.unobserve(el)
        el.classList.add('is-in')
        if (el.hasAttribute('data-reveal')) {
          // once it has arrived, drop the attributes so hover transitions are not slowed by the reveal delay
          const wait = plan.duration * (el.dataset.reveal === 'mask' ? 1.5 : 1) + Number(el.dataset.delay ?? 0) * plan.stagger + 120
          later(() => {
            el.removeAttribute('data-reveal')
            el.removeAttribute('data-delay')
            el.classList.remove('is-in')
          }, wait)
        }
      }
    },
    { root: observerRoot, threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
  )
  targets.forEach((el) => observer.observe(el))
  cleanups.push(() => observer.disconnect())

  const counterObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        counterObserver.unobserve(entry.target)
        const item = counters.find((c) => c.el === entry.target)
        if (item) runCounter(item)
      }
    },
    { root: observerRoot, threshold: 0.4 },
  )
  counters.forEach((c) => counterObserver.observe(c.el))
  cleanups.push(() => counterObserver.disconnect())

  // ── scroll-driven pieces: navigation shadow and progress bar
  const nav = plan.features.navShrink ? root.querySelector<HTMLElement>('nav, header') : null
  let progress: HTMLElement | null = null
  if (plan.features.progress) {
    const track = document.createElement('div')
    track.setAttribute('aria-hidden', 'true')
    track.style.cssText = 'position:sticky;top:0;z-index:70;height:3px;pointer-events:none'
    progress = document.createElement('div')
    progress.style.cssText = 'height:100%;transform:scaleX(0);transform-origin:left;background:var(--g-accent, var(--color-indigo-500, #6366f1))'
    track.append(progress)
    root.prepend(track)
    cleanups.push(() => track.remove())
  }

  if (nav || progress) {
    const onScroll = () => {
      const top = scrollTop(sp)
      if (nav) nav.dataset.scrolled = top > 12 ? 'true' : 'false'
      if (progress) {
        const range = scrollRange(sp)
        progress.style.transform = `scaleX(${range > 0 ? Math.min(1, top / range) : 0})`
      }
    }
    sp.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    cleanups.push(() => {
      sp.removeEventListener('scroll', onScroll)
      if (nav) delete nav.dataset.scrolled
    })
  }

  // ── rotating testimonials
  if (plan.features.carousel) {
    root.querySelectorAll<HTMLElement>('[data-carousel]').forEach((carousel) => {
      const slides = [...carousel.querySelectorAll<HTMLElement>('[data-slide]')]
      const dots = [...carousel.querySelectorAll<HTMLElement>('[data-dot]')]
      if (slides.length < 2) return
      let index = 0
      const show = (next: number) => {
        index = (next + slides.length) % slides.length
        slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index))
        dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)))
      }
      let timer = window.setInterval(() => show(index + 1), 5500)
      const pause = () => window.clearInterval(timer)
      const resume = () => {
        pause()
        timer = window.setInterval(() => show(index + 1), 5500)
      }
      carousel.addEventListener('pointerenter', pause)
      carousel.addEventListener('pointerleave', resume)
      carousel.addEventListener('focusin', pause)
      carousel.addEventListener('focusout', resume)
      dots.forEach((dot, i) => dot.addEventListener('click', () => { show(i); resume() }))
      show(0)
      cleanups.push(() => {
        pause()
        carousel.removeEventListener('pointerenter', pause)
        carousel.removeEventListener('pointerleave', resume)
        carousel.removeEventListener('focusin', pause)
        carousel.removeEventListener('focusout', resume)
        slides.forEach((slide) => slide.classList.remove('is-active'))
      })
    })
  }

  return () => {
    cleanups.splice(0).reverse().forEach((fn) => fn())
    root.dataset.motion = 'off'
  }
}
