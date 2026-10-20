// Prompt -> a complete multi-page static site: shared design decisions, a sitemap, data for every page,
// the HTML of each page (live preview) and the React project (Code tab). No backend, no AI, no API.
import { compileSiteFiles, compileSiteHtml, type SiteFile, type SiteSpec } from './compileSite'
import type { Tier } from './designBrain'
import { hash, planWebsite, seededRandom } from './generateWebsite'
import type { MotionSetting } from './motionBrain'
import { applyContentEdits, orderLayout } from './edit/applyEdits'
import { fitsFrom, reorderPages } from './edit/fit'
import { paintsFrom } from './edit/sectionColors'
import { panelColors } from './moods'
import { TARGETS, type NavPage, type SiteEdits, type Target } from './edit/edits'
import { writeSiteData } from './siteData'
import { planSite } from './siteBrain'

export function generateSite(
  userPrompt: string,
  variation = 0,
  tierOverride?: Tier,
  creative = true,
  motionSetting: MotionSetting = 'auto',
  /** changes the person asked for (see edit/edits.ts) */
  edits?: SiteEdits,
) {
  const plan = planWebsite(userPrompt, variation, tierOverride, creative, motionSetting, { fullContent: true, edits })

  // the site brain has its own seeded stream, so adding pages never shuffles the choices of the plan
  const rand = seededRandom(hash(`${plan.prompt.toLowerCase()}|site|${variation}`))
  const written = writeSiteData(plan.themeKey, plan.brand, plan.content.subject, plan.prompt, plan.content, rand, plan.niche)
  const { locale } = written
  // the data of the extra pages is written after the plan, so the person's texts and contact details are applied again
  const content = applyContentEdits(written.content, edits, written.locale.currency)
  const planned = planSite(plan.themeKey, plan.tier, content, plan.choice, rand, content.posts ?? [], edits)
  // the order of the sections on every page, the order and the names of the pages in the menu
  const sitePlan = {
    ...planned,
    pages: reorderPages(
      planned.pages.map((page) => ({ ...page, label: edits?.navLabels[page.id as NavPage] ?? page.label, sections: orderLayout(page.sections, edits) })),
      edits?.pageMoves ?? [],
    ),
  }

  const spec: SiteSpec = {
    brand: plan.brand,
    theme: plan.theme,
    content,
    tokens: plan.tokens,
    initialMode: plan.initialMode,
    tier: plan.tier,
    motion: plan.motion,
    pages: sitePlan.pages,
    posts: content.posts ?? [],
    navId: plan.choice.nav,
    headerStyle: sitePlan.headerStyle,
    visuals: plan.visuals,
    // a multi-page site paints its parts in the canonical order of the sections (every page shows some of them)
    paints: paintsFrom(edits, plan.palette, plan.mood ? panelColors(plan.mood, ['hero', 'stats', 'features', 'about', 'steps', 'gallery', 'pricing', 'team', 'testimonials', 'blog', 'faq', 'cta', 'contact', 'footer'], plan.palette, plan.initialMode, (id) => id as Target) : undefined),
    fits: fitsFrom(edits, TARGETS),
  }

  const pagesHtml: Record<string, string> = Object.fromEntries(sitePlan.pages.map((page) => [page.path, compileSiteHtml(spec, page)]))
  const files: SiteFile[] = compileSiteFiles(spec)

  return {
    themeKey: plan.themeKey,
    niche: plan.niche?.id,
    paletteIndex: plan.paletteIndex,
    brain: plan.brain,
    tier: plan.tier,
    motion: plan.motion,
    palette: plan.palette,
    copy: plan.copy,
    brainsForced: plan.brainsForced,
    colorReasons: plan.colorReasons,
    content,
    locale,
    pages: sitePlan.pages,
    pagesHtml,
    files,
    spec,
  }
}
