// Wrapper used by pages built from the stored components: it re-colours them with CSS variables
// (no change to the components) and fills their placeholder text with the generated content.
import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { sectionTokens } from '../edit/sectionColors'
import type { WebsiteContent } from '../finalPrompt'
import type { MotionPlan } from '../motionBrain'
import { initMotion } from '../motionRuntime'
import { defaultMode, presetPalette, type ColorMode, type Palette, type ThemeKey } from '../themes'
import { fillContent } from './fillContent'
import { libraryThemeStyle } from './libraryTheme'
import { sectionIds } from './sectionIds'
import type { Role } from './libraryRoles'

const linkLabels: [string, string][] = [
  ['home', 'Home'],
  ['about', 'About'],
  ['features', 'Features'],
  ['gallery', 'Gallery'],
  ['pricing', 'Pricing'],
  ['team', 'Team'],
  ['blog', 'Blog'],
  ['contact', 'Contact'],
]

/** the page palette: a part with a colour of its own (`paint`) works out its text and accent from it */
const PaletteContext = createContext<Palette | undefined>(undefined)

/** Makes the roomy parts of a stored component taller or shorter. The page is drawn off screen (no layout to measure), so the Tailwind padding classes
 * (py-24, pt-16 ...) of every box up to three levels deep are read and scaled; a padding of 1.5rem or more counts as roomy. */
function useHeightFactor(ref: React.RefObject<HTMLDivElement | null>, factor: number | undefined) {
  useLayoutEffect(() => {
    const root = ref.current
    if (!root || !factor || factor === 1) return
    const changed: { el: HTMLElement; top: string; bottom: string }[] = []
    const biggest = (classes: string[], axes: string[]) => Math.max(0, ...classes.map((c) => c.match(new RegExp(`^(?:[a-z0-9]+:)*(?:${axes.join('|')})-(\\d+)$`))).map((m) => (m ? Number(m[1]) : 0)))
    const walk = (el: HTMLElement, depth: number) => {
      const classes = (el.getAttribute('class') ?? '').split(/\s+/)
      const top = biggest(classes, ['py', 'pt'])
      const bottom = biggest(classes, ['py', 'pb'])
      if (top >= 6 || bottom >= 6) {
        changed.push({ el, top: el.style.paddingTop, bottom: el.style.paddingBottom })
        if (top >= 6) el.style.paddingTop = `${(top * 0.25 * factor).toFixed(2)}rem`
        if (bottom >= 6) el.style.paddingBottom = `${(bottom * 0.25 * factor).toFixed(2)}rem`
      }
      if (depth < 3) for (const child of el.children) if (child instanceof HTMLElement) walk(child, depth + 1)
    }
    for (const child of root.children) if (child instanceof HTMLElement) walk(child, 1)
    return () => changed.forEach(({ el, top, bottom }) => { el.style.paddingTop = top; el.style.paddingBottom = bottom })
  }, [ref, factor])
}

export function Section({ role, paint, fit, band, children }: { role: Role; /** a soft band of the main colour behind this part (every other part), so the page has colour */ band?: boolean; /** background colour of this part only */ paint?: string; /** size and alignment of this part */ fit?: { buttons?: 'left' | 'center' | 'right'; minHeight?: number; heightFactor?: number; maxWidth?: number; align?: 'left' | 'center' | 'right' }; children: ReactNode }) {
  const palette = useContext(PaletteContext)
  const box = useRef<HTMLDivElement>(null)
  useHeightFactor(box, fit?.heightFactor)
  // the rows of buttons (a flex row that starts with a link or a button) move to the side that was asked for
  const buttonCss = fit?.buttons ? `[data-role="${role}"] .flex:has(> a):has(> a), [data-role="${role}"] .flex:has(> button) { justify-content: ${{ left: 'flex-start', center: 'center', right: 'flex-end' }[fit.buttons]} !important; }` : undefined
  const bandStyle = role === 'hero' ? { backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, var(--g-glow), transparent 70%)' } : band ? { background: 'var(--g-band)' } : undefined
  const fitStyle = fit ? { ...(fit.minHeight ? { minHeight: fit.minHeight } : {}), ...(fit.maxWidth ? { maxWidth: fit.maxWidth, marginInline: 'auto' } : {}), ...(fit.align ? { textAlign: fit.align } : {}) } : undefined
  if (paint && palette) {
    const t = sectionTokens(paint, palette)
    const own = { bg: t['--g-bg'], surface: t['--g-surface'], border: t['--g-border'], text: t['--g-text'], muted: t['--g-muted'], accent: t['--g-accent'], alt: t['--g-accent'] }
    const { style, dark } = libraryThemeStyle({ name: 'part', light: own, dark: own }, 'light')
    return (
      <div ref={box} id={sectionIds[role]} data-role={role} style={{ ...style, ...fitStyle }} className={dark || own.text === '#f9fafb' ? 'dark' : undefined}>
        {buttonCss && <style>{buttonCss}</style>}
        {children}
      </div>
    )
  }
  return (
    <div ref={box} id={sectionIds[role]} data-role={role} style={bandStyle || fitStyle ? { ...bandStyle, ...fitStyle } : undefined}>
      {buttonCss && <style>{buttonCss}</style>}
      {children}
    </div>
  )
}

export function ThemeScope({
  theme,
  accent = 0,
  palette,
  content,
  motion,
  children,
}: {
  theme: ThemeKey
  /** index of a preset palette; ignored when `palette` is given */
  accent?: number
  /** a palette made by the colour brain */
  palette?: Palette
  content: WebsiteContent
  /** how the page moves; leave out for no animation */
  motion?: MotionPlan
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<ColorMode>(() => defaultMode(theme))
  const pagePalette = palette ?? presetPalette(theme, accent)
  const { style, dark } = libraryThemeStyle(pagePalette, mode, theme)

  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    const present = new Set([...root.querySelectorAll('[data-role]')].map((el) => el.id).filter(Boolean))
    const links = linkLabels.filter(([id]) => present.has(id)).map(([id, label]) => ({ href: `#${id}`, label }))
    root.querySelectorAll<HTMLElement>('[data-role]').forEach((el) => {
      // React StrictMode runs effects twice in development; fill each section only once
      if (el.dataset.filled) return
      el.dataset.filled = '1'
      fillContent(el, el.dataset.role as Role, content, links)
    })
    // Preline wires up collapse / dropdown behaviour of the navigation blocks
    import('preline').then(({ HSStaticMethods }) => HSStaticMethods.autoInit()).catch(() => {})

    // reveal on scroll, card hover, count-up ... (the runtime tags the components' cards itself)
    return motion ? initMotion(root, motion) : undefined
  }, [content, motion])

  return (
    <div ref={ref} data-gen-theme={theme} className={`overflow-x-clip ${dark ? 'dark' : ''}`} style={style}>
      <PaletteContext.Provider value={pagePalette}>{children}</PaletteContext.Provider>
      {/* light / dark switch: sticks to the bottom-right corner of the screen on every device */}
      <div className="pointer-events-none sticky bottom-4 z-50 flex h-0 justify-end px-4">
        <button
          type="button"
          aria-label="Toggle dark mode"
          onClick={() => setMode((current) => (current === 'dark' ? 'light' : 'dark'))}
          className="pointer-events-auto flex size-11 -translate-y-full items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg ring-1 ring-black/10 transition hover:scale-105"
        >
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {dark ? (
              <>
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </>
            ) : (
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            )}
          </svg>
        </button>
      </div>
    </div>
  )
}
