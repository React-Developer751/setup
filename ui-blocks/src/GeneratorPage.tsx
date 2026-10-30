import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ComponentType } from 'react'
import ExportPanel from './ExportPanel'
import DeviceFrame from './preview/DeviceFrame'
import { DEVICES, type Device } from './preview/devices'
import { usePreviewDocument } from './preview/usePreviewDocument'
import { buildLibraryProject, buildLibraryStandalone, libraryWithDetails, libraryProjectName } from './generator/exportLibrary'
import { applyDetails, buildProject, buildStandalone, projectName, sourceFromPage, sourceFromSite, type ExportDetails } from './generator/exportSite'
import ImportPanel from './ImportPanel'
import UnderstandingPanel from './UnderstandingPanel'
import { getLearningVersion, subscribeLearning } from './generator/ml/learned'
import { setSmart, smartStatus, smartVersion, smartWanted, subscribeSmart, understand } from './generator/ml/smart'
import { getPoolVersion, poolSummary, subscribePool } from './generator/dataPool'
import BusinessForm from './BusinessForm'
import PhotosPanel from './PhotosPanel'
import { scenePlan } from './generator/imageAi'
import ProjectsPanel from './ProjectsPanel'
import { saveRemote, deleteRemote } from './generator/projectSync'
import { userId } from './generator/userId'
import { deleteProject, forgetSession, lastSession, listProjects, rememberSession, saveProject, type Project, type Snapshot } from './generator/projects'
import EditChat, { ServerSetting, type ChatMessage } from './EditChat'
import { answerFor, clarify, type Choice, type Expect } from './generator/edit/clarify'
import { guessIntent } from './generator/edit/intent'
import { describeOp, editsFrom, type EditOp, type MoodChoice } from './generator/edit/edits'
import { imageEngineUp, sendFeedback, serverHealth } from './generator/edit/serverEdit'
import { BuildingScreen } from './BuildingScreen'
import { ToolsDrawer } from './ToolsDrawer'
import { CodeView } from './CodeView'
import type { FileEdit } from './codeEdits'
import { codeWithoutContent, opsFromEditedCode } from './generator/edit/codeSync'
import { correctionStore } from './generator/memory/correctionMemory'
import { lessonNote, lessonsFrom, openPromptMemory, similarPrompts, type PromptEdit, type PromptRow } from './generator/memory/promptMemory'
import { compileComponent, componentIdOfPath, setComponentOverrides } from './generator/library/componentOverrides'
import { Landing } from './Landing'
import { askCorePage, coreCraftUp, decideCore, type CoreSlot } from './generator/edit/corecraft'
import CoreCraftPanel from './CoreCraftPanel'
import { makePictures, redrawScene, type UsedScene } from './generator/edit/imageAiClient'
import { rateScene, syncRatings } from './generator/edit/imageRatings'
import { analyseFeedback } from './generator/memory/sentiment'
import { ALL_SLOTS, alternativeFor, eventsFor, groupOf, slotsOfFeedback, slotTexts, SLOT_NAME, treatAsOpinion } from './generator/memory/copyLearning'
import { loadPhraseScores, recordPhrases, sessionId } from './generator/memory/phraseStore'
import { PHRASE_SLOTS, type PhraseSlot } from './generator/memory/phraseScores'
import { doubtQuestion, isDoubtful, logRow, normaliseCommand, openEditLog, undoStats } from './generator/memory/editHistory'
import RatePictures from './RatePictures'
import DesignHistory from './DesignHistory'
import JsonEditor from './JsonEditor'
import { blueprintOf } from './generator/edit/blueprint'
import { MOODS } from './generator/moods'
import { analyse, uniqueAccent, type Insights } from './generator/memory/designMemory'
import { hslToRgb, hexToRgb, rgbToHsl } from './generator/art/color'
import { planDesign } from './generator/memory/designPlanner'
import { newId, openStore, type DesignRecord, type DesignStore } from './generator/memory/designStore'
import { businessKey } from './generator/edit/imageRatings'
import { artPictures } from './generator/edit/artPictures'
import { CREATIVITY_LEVELS, loadCreativity, saveCreativity, setCreativity, temperature, type CreativityLevel } from './generator/creativity'
import { parseEdit } from './generator/edit/understand'
import { widgetOps } from './generator/edit/widgetParse'
import { recogniseBusiness } from './generator/edit/packClient'
import { loadHeroTaste } from './generator/gen/heroPick'
import { generateSite } from './generator/generateSite'
import { generateWebsite } from './generator/generateWebsite'
import { generateLibraryPage } from './generator/library/generateLibraryPage'
import { autoPages, pagesWanted } from './generator/edit/pagesIntent'
import { scoreThemes } from './generator/themeClassifier'
import type { Tier } from './generator/designBrain'
import type { MotionSetting } from './generator/motionBrain'

const EXAMPLES = [
  'Create a page for an organic green tea cafe named Leafy Premium',
  'Landing page for a protein shake brand and heavy lifting gym called Iron Pulse',
  'A cute online toy shop for kids named Giggle Box',
  'Premium leather wallet boutique called Maison Noir',
  'SaaS dashboard startup called CloudPilot',
  'Law firm called Lexa & Partners',
  'Family dental clinic called Bright Smile',
  'Italian pizza restaurant called Forno',
  'Online coding academy called CodeNest',
  'Wedding photography studio called Lumen',
  'Car wash and repair garage called Shine Auto',
]

function GeneratorPage() {
  const [submitted, setSubmitted] = useState(EXAMPLES[0])
  const [variation, setVariation] = useState(0)
  // counts every "Generate website" / "Another variation" click, so the pictures are drawn again for the same prompt too
  const [runs, setRuns] = useState(0)
  const autoMade = useRef(false)
  const pagesNote = useRef('')
  // the design memory: the designs of this kind of business, the round the person is in, and the design on the page
  const [designs, setDesigns] = useState<DesignRecord[]>([])
  const [designStore, setDesignStore] = useState<DesignStore>()
  const [designBusy, setDesignBusy] = useState(false)
  const designGroup = useRef(newId())
  /** the row of the prompt memory for the page that is on the screen: it grows with every edit */
  const promptRow = useRef<PromptRow | undefined>(undefined)
  const [currentDesign, setCurrentDesign] = useState<string>()
  // the scenes of the pictures on the page (for the thumbs) and what the person said about each
  const [drawn, setDrawn] = useState<UsedScene[]>([])
  const [rated, setRated] = useState<Record<number, 'up' | 'down'>>({})
  const [rateBusy, setRateBusy] = useState(-1)
  const [level, setLevel] = useState<'auto' | Tier>('auto')
  const [creative, setCreative] = useState(true)
  const [motionSetting, setMotionSetting] = useState<MotionSetting>('auto')
  // how adventurous the generators are (colours, headlines, picture scenes); every generator reads it
  const [creativityLevel, setCreativityLevel] = useState<CreativityLevel>(loadCreativity)
  setCreativity(creativityLevel)
  const [engine, setEngine] = useState<'templates' | 'library'>('library')
  const [view, setView] = useState<'preview' | 'code' | 'json'>('preview')
  // one page or several: decided from the prompt and the kind of business (Auto), unless the person sets it in the tools
  const [pagesMode, setPagesMode] = useState<'auto' | 'single' | 'multi'>('auto')
  const [pages, setPages] = useState<'multi' | 'single'>('single')
  const [tools, setTools] = useState({ open: false, tab: 'design' })
  const [route, setRoute] = useState('/')
  // the preview starts as a phone
  const [device, setDevice] = useState<Device>('mobile')
  const [details, setDetails] = useState<ExportDetails>({})
  // changes asked for in the chat: a site is the prompt + this list (see generator/edit/edits.ts)
  const [history, setHistory] = useState<{ text: string; ops: EditOp[]; logId?: string }[]>([])
  const [undone, setUndone] = useState<{ text: string; ops: EditOp[]; logId?: string }[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatBusy, setChatBusy] = useState(false)
  const [useServer, setUseServer] = useState(false)
  const [serverReady, setServerReady] = useState(false)
  const [coreCraftReady, setCoreCraftReady] = useState(false)
  // Core-Craft AI writes the page itself where this project's own text packs cannot (Hindi prompts, businesses without a pack that name their services)
  const [coreAuto, setCoreAuto] = useState(() => {
    try {
      return localStorage.getItem('ui-blocks:core-auto') !== 'off'
    } catch {
      return true
    }
  })
  const [coreNote, setCoreNote] = useState('')
  const coreRun = useRef(0)
  const [projects, setProjects] = useState<Project[]>(() => listProjects())
  const [projectNote, setProjectNote] = useState('')
  // the last session of this browser: offered at the start; it is only overwritten after the person has chosen
  const [resume, setResume] = useState<Project | undefined>(() => lastSession())
  // the first screen (a big prompt box) comes before the workspace; sending a prompt opens the workspace
  const [started, setStarted] = useState(false)
  // the build screen while a new site is made: which step the generator has reached, and when it began (it stays long enough to be read)
  const [build, setBuild] = useState({ on: false, stage: 0, prompt: '', since: 0 })
  const bumpBuild = (stage: number) => setBuild((b) => (b.on && b.stage < stage ? { ...b, stage } : b))
  const closeBuild = () => {
    setBuild((b) => (b.on ? { ...b, stage: 4 } : b))
    // (not before 2.5 s: a site that is ready at once would flash the screen)
    window.setTimeout(() => setBuild((b) => (b.on ? { ...b, on: false } : b)), Math.max(700, 2500 - (Date.now() - buildStart.current)))
  }
  const buildStart = useRef(0)
  const messageId = useRef(0)
  // a question of the chat that waits for a typed value (a name, a business type ...)
  const pending = useRef<Expect | undefined>(undefined)
  const edits = useMemo(() => editsFrom(history.flatMap((h) => h.ops)), [history])

  // the data pool can change (an import): generate again then
  // ... or what the models know changes (a correction, the smart model finishing a prompt)
  const poolVersion =
    useSyncExternalStore(subscribePool, getPoolVersion) + useSyncExternalStore(subscribeLearning, getLearningVersion) + useSyncExternalStore(subscribeSmart, smartVersion)
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- the creativity level is read inside the generators (creativity.ts)
  const site = useMemo(() => generateWebsite(submitted, variation, level === 'auto' ? undefined : level, creative, motionSetting, edits), [submitted, variation, level, creative, motionSetting, edits, creativityLevel])
  const scores = useMemo(() => scoreThemes(submitted), [submitted])
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- the pool and the creativity level are read inside the generators
  const library = useMemo(() => generateLibraryPage(submitted, variation, level === 'auto' ? undefined : level, creative, motionSetting, edits, (edits.pagesMode ?? pages) === 'multi'), [submitted, variation, level, creative, motionSetting, edits, poolVersion, creativityLevel, pages])
  // one page or a site with pages: both can be made from the stored components (engine 'library') or from the built-in templates
  // the person's word in the chat ("multiple pages", "one page again") wins over the choice made when the site was generated
  const isMulti = (edits.pagesMode ?? pages) === 'multi'
  useEffect(() => setRoute('/'), [isMulti])
  // what the person liked among the generated first screens (/?gen=1) shapes the next ones
  useEffect(() => {
    void loadHeroTaste()
  }, [])
  const shownEngine = engine
  // a multi-page site of the built-in templates has its own pages and posts; the components' site keeps its pages in `library.pages`
  const tplMulti = isMulti && shownEngine === 'templates'
  const multi = useMemo(
    () => generateSite(submitted, variation, level === 'auto' ? undefined : level, creative, motionSetting, edits),
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- the pool is read inside the generators
    [submitted, variation, level, creative, motionSetting, edits, poolVersion, creativityLevel],
  )
  const active = tplMulti ? multi : shownEngine === 'library' ? library : site
  // the site as a JSON document (the page version of the site)
  const blueprint = useMemo(() => blueprintOf(site, edits), [site, edits])
  const { themeKey, tier, motion, brain, brainsForced, palette, colorReasons, niche } = active
  const brandName = active.content.brandName
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- the pool is read inside the generators
  const pool = useMemo(() => poolSummary(), [poolVersion])

  const files = tplMulti
    ? multi.files
    : [{ path: 'GeneratedLandingPage.tsx', code: shownEngine === 'library' ? library.code : site.code }]

  // the Code tab shows the whole project (folders and files) the way it is exported, built when the tab is opened
  const [projectFiles, setProjectFiles] = useState<{ path: string; content: string | Uint8Array }[]>([])
  const [projectBusy, setProjectBusy] = useState(false)
  // what the person changed in the Code tab (by file) and what the last save did to the site
  const [codeEdits, setCodeEdits] = useState<Record<string, FileEdit>>({})
  const [codeNote, setCodeNote] = useState('')
  // the component files the person saved are compiled and used by the preview; 'ok' or the reason they cannot be
  const [codeStatus, setCodeStatus] = useState<Record<string, string>>({})
  const [overrideVersion, setOverrideVersion] = useState(0)

  // The site as one HTML document (the same as the "One .html file" export): the preview frame and the Preview button show it.
  // Frames and new tabs have their own viewport, so mobile / tablet / desktop layouts really are the ones a visitor would see.
  const buildDocument = () =>
    shownEngine === 'library'
      ? buildLibraryStandalone(libraryWithDetails(library, details))
      : buildStandalone(applyDetails(tplMulti ? sourceFromSite(multi) : sourceFromPage(site), details))
  const previewHtml = usePreviewDocument(buildDocument, [shownEngine, isMulti, multi, site, library, details, poolVersion, overrideVersion])

  useEffect(() => {
    if (view !== 'code') return
    let stale = false
    setProjectBusy(true)
    const build = async () => {
      try {
        const entries =
          shownEngine === 'library'
            ? await buildLibraryProject(libraryWithDetails(library, details))
            : buildProject(applyDetails(tplMulti ? sourceFromSite(multi) : sourceFromPage(site), details))
        if (!stale) setProjectFiles(entries)
      } catch {
        // the project could not be built: the single file of the page is shown instead
        if (!stale) setProjectFiles(files.map((f) => ({ path: f.path, content: f.code })))
      } finally {
        if (!stale) setProjectBusy(false)
      }
    }
    void build()
    return () => {
      stale = true
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- `files` follows the same inputs as the rest
  }, [view, shownEngine, tplMulti, multi, site, library, details])

  const openPreview = () => {
    // building again keeps the tab independent of the frame (its own colour choice, its own page)
    const html = buildDocument()
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
    window.open(url, '_blank')
    // the tab needs the address while it loads; it is released later
    window.setTimeout(() => URL.revokeObjectURL(url), 10 * 60 * 1000)
  }
  const onRoute = useCallback((next: string) => setRoute(next), [])

  // the person switched "smart understanding" on in an earlier visit: start it again
  useLayoutEffect(() => {
    if (smartWanted()) void setSmart(true, submitted)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hslOfHex = (hex: string) => rgbToHsl(hexToRgb(hex))
  const hslToHex = (h: number, s: number, l: number) => `#${hslToRgb(h, s, l).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
  // ───────────── the design memory ─────────────
  const DESIGN_COLOUR = 'A colour that was not used yet'
  // ───────────── what the person says about the texts (the content AI's phrase scores) ─────────────
  const textSite = tplMulti ? multi : site
  const phraseCtx = () => ({ session: sessionId(), group: groupOf(site), content: textSite.content })
  const learn = (slots: readonly PhraseSlot[], delta: 1 | -1 | 0, reason: Parameters<typeof eventsFor>[3], extra: Parameters<typeof eventsFor>[4] = {}) => void recordPhrases(eventsFor(phraseCtx(), slots, delta, reason, extra))
  const turnedDown = useRef<string[]>([])
  const exported = useRef(false)
  // a window closed without any download: logged as a fact about the design (it changes no score)
  const leaving = useRef<() => void>(() => undefined)
  leaving.current = () => {
    if (exported.current || !history.length) return
    try {
      navigator.sendBeacon('/api/phrase-events', new Blob([JSON.stringify({ events: eventsFor(phraseCtx(), ['heroTitle'], 0, 'abandoned') })], { type: 'application/json' }))
    } catch {
      // the log is optional
    }
    exported.current = true
  }
  useEffect(() => {
    const onHide = () => leaving.current()
    window.addEventListener('pagehide', onHide)
    return () => window.removeEventListener('pagehide', onHide)
  }, [])
  const insightsOf = (rows: DesignRecord[], prompt: string): Insights => analyse(rows, businessKey(prompt))
  const refreshDesigns = async (prompt: string) => {
    const store = designStore ?? (await openStore())
    if (!designStore) setDesignStore(store)
    setDesigns(await store.list(businessKey(prompt)).catch(() => []))
  }
  /** a new design from what the memory knows: its colour is new, its style leans to what was kept; it is kept in the memory at once */
  const newDesign = async (prompt: string) => {
    const store = designStore ?? (await openStore())
    if (!designStore) setDesignStore(store)
    // the earlier prompts that resemble this one teach it: the colour they ended with, the parts that were taken out
    const earlier = await (await openPromptMemory()).list().catch(() => [] as PromptRow[])
    const near = similarPrompts(prompt, earlier.filter((r) => r.id !== designGroup.current))
    const plan = await planDesign(prompt, store, { group: designGroup.current, creativity: creativityLevel, temperature: temperature(), phrases: await loadPhraseScores(), corrections: [...correctionStore.list(), ...lessonsFrom(near, businessKey(prompt))] })
    const note = lessonNote(near)
    if (note) plan.reasons.push(note)
    promptRow.current = { id: designGroup.current, at: new Date().toISOString(), prompt: prompt.slice(0, 600), key: businessKey(prompt), theme: plan.record.theme, niche: plan.record.niche, concept: plan.record.concept ?? '', hero: plan.record.heroTitle, pages: pages === 'multi' ? 'multi' : 'single', edits: promptRow.current?.id === designGroup.current ? promptRow.current.edits : [], ratings: promptRow.current?.id === designGroup.current ? promptRow.current.ratings : undefined, rejected: promptRow.current?.id === designGroup.current ? promptRow.current.rejected : undefined }
    void openPromptMemory().then((memory) => memory.save(promptRow.current!)).catch(() => undefined)
    await store.add(plan.record).catch(() => undefined)
    setCurrentDesign(plan.record.id)
    setDesigns(await store.list(businessKey(prompt)).catch(() => []))
    return plan
  }
  const anotherDesign = async () => {
    setDesignBusy(true)
    // asking for another design is a (small) thumb down for the texts of this one
    learn(['heroTitle'], -1, 'regenerate')
    const plan = await newDesign(submitted)
    say({ role: 'ai', text: plan.reasons.slice(-2).join(' '), site: true })
    setVariation(plan.variation)
    // the earlier colour change of a design is replaced, the edits of the person stay
    setHistory((list) => [...list.filter((h) => h.text !== DESIGN_COLOUR), ...(plan.ops.length ? [{ text: DESIGN_COLOUR, ops: plan.ops }] : [])])
    setUndone([])
    setRuns((n) => n + 1)
    setView('preview')
    setDesignBusy(false)
  }
  const markDesign = async (id: string, verdict: 'good' | 'bad', best: boolean) => {
    const store = designStore ?? (await openStore())
    await store.setVerdict(id, verdict, best).catch(() => undefined)
    // a design kept as right: its texts are liked; turned down: its headline most of all
    const record = designs.find((d) => d.id === id)
    if (record?.copy) {
      const at = new Date().toISOString()
      const group = record.niche || record.theme
      void recordPhrases(PHRASE_SLOTS.flatMap((slot) => (record.copy?.[slot] ? [{ at, session: sessionId(), group, slot, phrase: record.copy[slot], delta: verdict === 'good' ? (1 as const) : (-1 as const), reason: slot === 'heroTitle' || verdict === 'good' ? ('rating' as const) : ('regenerate' as const) }] : [])))
    }
    await refreshDesigns(submitted)
    say({ role: 'ai', text: verdict === 'good' ? 'Kept as the right design. The others of this round are turned down; the next design learns from it and gets a colour that is new.' : 'Noted: this design is turned down. The next design stays away from its colours.' })
  }

  /** Core-Craft AI, when it runs: for a Hindi prompt, or a business without a text pack that names its services, its page replaces the texts */
  const applyCoreContent = async (text: string, variationNo: number, run: number) => {
    if (!coreAuto || !(await coreCraftUp())) return
    setCoreCraftReady(true)
    const page = await askCorePage(text)
    if (run !== coreRun.current) return
    if (!page) return setCoreNote('Core-Craft AI did not write a page for this prompt; the built-in AI wrote it.')
    const preview = generateWebsite(text, variationNo, level === 'auto' ? undefined : level, creative, motionSetting)
    const decision = decideCore(page, { niche: preview.niche, heroTitle: preview.content.hero.title, subject: preview.content.subject, theme: preview.themeKey, prompt: text, brand: preview.content.brandName, prices: !!preview.content.pricing.fromPrompt })
    setCoreNote(`${decision.use ? 'Core-Craft AI' : 'Built-in AI'} wrote this page: ${decision.reason}.`)
    if (decision.review.length) say({ role: 'ai', text: `Core-Craft AI says to check: ${decision.review.slice(0, 3).join(' ')}` })
    if (!decision.use || !decision.blocks) {
      // reviews with a made-up name ("Sample Customer") are not shown either
      if (preview.content.testimonials.length && preview.content.testimonials.every((t) => /sample/i.test(t.author))) applyOps('Reviews with made-up names removed', [{ op: 'remove', section: 'testimonials' }, { op: 'remove', section: 'team' }], 'rules', 'The sample reviews and the made-up team were left out: add your own real ones in the chat.')
      return
    }
    const ops: EditOp[] = [{ op: 'core', data: decision.blocks }, ...(decision.rename ? [{ op: 'rename' as const, name: decision.rename }] : []), ...(decision.hide ?? [])]
    applyOps('Texts from Core-Craft AI', ops, 'rules', `Core-Craft AI wrote the texts of this page about what you said (${decision.reason}). Say "undo" to go back to the built-in texts.`)
  }

  const choosePagesMode = (mode: 'auto' | 'single' | 'multi') => {
    // the setting in Tools is the newest word: what was said in the chat about pages is dropped
    setHistory((list) => list.map((h) => ({ ...h, ops: h.ops.filter((o) => o.op !== 'pages') })).filter((h) => h.ops.length || h.text === DESIGN_COLOUR))
    setPagesMode(mode)
    const next = mode === 'auto' ? autoPages(submitted, themeKey).mode : mode
    setPages(next)
    setRoute('/')
  }
  const generate = async (text: string) => {
    if (!text.trim()) return
    // a new site: the files the person changed belonged to the old one
    setCodeEdits({})
    setCodeNote('')
    setTools((t) => ({ ...t, open: false }))
    buildStart.current = Date.now()
    setBuild({ on: true, stage: 0, prompt: text.trim(), since: buildStart.current })
    // on a phone the preview is under the prompt: the build screen is brought into view
    if (window.innerWidth < 1024) requestAnimationFrame(() => document.getElementById('preview-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    // (whatever happens, the screen is gone after a minute)
    window.setTimeout(() => setBuild((b) => (b.on && b.since === buildStart.current ? { ...b, on: false } : b)), 60_000)
    // with "smart understanding" on, the model reads the prompt first (the generators are synchronous)
    await understand(text)
    // the Content AI reads typos, Hinglish and short words that the keywords of the niche packs miss; its answer is used only when it is sure (packClient.ts)
    const recognised = await recogniseBusiness(text.trim())
    bumpBuild(1)
    // "a single page" / "landing page" in the prompt is an order: it wins over what was set before
    const theme = generateWebsite(text, 0, undefined, creative, 'off').themeKey
    const said = pagesWanted(text)
    const choice = pagesMode === 'auto' || said ? autoPages(text, theme) : { mode: pagesMode, reason: 'you set it in the tools' }
    setPages(choice.mode)
    pagesNote.current = `${choice.mode === 'multi' ? 'I made a site with several pages' : 'I made one landing page'}: ${choice.reason}. You can change it in Tools, Design, Pages.`
    setSubmitted(text)
    setHistory([])
    setUndone([])
    // the colours are thought out first: a new idea that does not look like the last sites
    designGroup.current = newId()
    turnedDown.current = []
    exported.current = false
    // the design memory (the server's database or the browser's) can fail: the site is then made without it, not left half made
    const plan: Awaited<ReturnType<typeof newDesign>> = await newDesign(text).catch(() => ({ reasons: ['Made without the design memory (it could not be read).'], ops: [], variation: 1 + Math.floor(Math.random() * 9000) }) as unknown as Awaited<ReturnType<typeof newDesign>>)
    bumpBuild(2)
    messageId.current += 1
    setMessages([{ id: messageId.current, role: 'ai', text: pagesNote.current }, ...(recognised ? [{ id: messageId.current + 1, role: 'ai' as const, text: `Core-Craft AI recognised the business: ${recognised.label} (${recognised.why}). The texts and pictures are made for it.` }] : []), { id: messageId.current + (recognised ? 2 : 1), role: 'ai', text: plan.reasons.slice(-2).join(' '), site: true }])
    messageId.current += recognised ? 2 : 1
    // "a gym with a booking form and a map": the working parts the prompt asks for are there from the start (only those that need no more from the person)
    const asked = (widgetOps(text)?.ops ?? []).filter((o) => o.op === 'widget' && (!!o.widget.value || ['booking', 'order', 'newsletter'].includes(o.widget.kind)))
    setHistory([...(plan.ops.length ? [{ text: DESIGN_COLOUR, ops: plan.ops }] : []), ...(asked.length ? [{ text: 'From your prompt', ops: asked }] : [])])
    if (asked.length) say({ role: 'ai', text: 'You asked for these in the prompt, so they are on the page already.', ops: asked })
    setVariation(plan.variation)
    setRuns((n) => n + 1)
    coreRun.current += 1
    setCoreNote('')
    void applyCoreContent(text, plan.variation, coreRun.current).finally(() => bumpBuild(3))
    autoMade.current = false
    setDrawn([])
    setRated({})
    setRoute('/')
    setView('preview')
  }

  // ───────────── projects ─────────────
  const snapshot = (): Snapshot => ({ v: 1, prompt: submitted, variation, level, creative, motion: motionSetting, engine, pages: isMulti ? 'multi' : 'single', history, details })

  useEffect(() => {
    if (resume) return
    const timer = window.setTimeout(() => rememberSession({ v: 1, prompt: submitted, variation, level, creative, motion: motionSetting, engine, pages: isMulti ? 'multi' : 'single', history, details }), 800)
    return () => window.clearTimeout(timer)
  }, [resume, submitted, variation, level, creative, motionSetting, engine, isMulti, history, details])

  // once the person has started something new, the offer to continue the old work goes away and the new work is remembered
  useEffect(() => {
    if (resume && (history.length > 0 || submitted !== EXAMPLES[0])) setResume(undefined)
  }, [resume, history, submitted])

  const restore = async (project: Project) => {
    setCodeEdits({})
    setCodeNote('')
    await understand(project.prompt)
    await recogniseBusiness(project.prompt)
    setSubmitted(project.prompt)
    setVariation(project.variation)
    setLevel(project.level)
    setCreative(project.creative)
    setMotionSetting(project.motion)
    setEngine(project.engine)
    setPages(project.pages)
    setDetails(project.details)
    setHistory(project.history)
    setUndone([])
    pending.current = undefined
    messageId.current += 1
    setMessages([{ id: messageId.current, role: 'ai', text: `Opened "${project.name}".` }])
    setRoute('/')
    setView('preview')
    setResume(undefined)
  }

  // ───────────── the chat ─────────────
  const say = (message: Omit<ChatMessage, 'id'>) => {
    messageId.current += 1
    const id = messageId.current
    setMessages((list) => [...list, { ...message, id }])
  }

  useEffect(() => {
    if (!useServer) return
    let alive = true
    void serverHealth().then((ok) => alive && setServerReady(ok))
    void syncRatings(true)
    return () => {
      alive = false
    }
  }, [useServer])

  // chat commands (typed or chosen) go to the edit history database; pictures and the first colour do not
  const chatting = useRef(false)
  // Core-Craft AI (optional, npm run corecraft): its panel shows only when it runs
  useEffect(() => {
    let alive = true
    void coreCraftUp().then((ok) => alive && setCoreCraftReady(ok))
    return () => {
      alive = false
    }
  }, [])

  /** what the person corrected (a colour they chose, a part they took out or put in): remembered, and the next idea for this kind of business starts from it */
  const recordCorrections = (ops: EditOp[], text = '') => {
    const concept = [...history].reverse().flatMap((h) => h.ops).find((o) => o.op === 'concept')
    const base = { at: new Date().toISOString(), key: businessKey(submitted), theme: themeKey, conceptId: concept?.op === 'concept' ? concept.data.id : undefined }
    for (const op of ops) {
      if (op.op === 'accent') correctionStore.add({ ...base, kind: 'accent', from: concept?.op === 'concept' ? concept.data.light.accent : undefined, to: op.hex })
      else if (op.op === 'remove' || op.op === 'add') correctionStore.add({ ...base, kind: op.op, section: op.section })
      else if (op.op === 'mood') correctionStore.add({ ...base, kind: 'mood', to: op.mood })
      else if (op.op === 'mode') correctionStore.add({ ...base, kind: 'mode', to: op.mode })
    }
    // the same edits go to the prompt memory, with the words the person used: later prompts that resemble this one learn from them
    const row = promptRow.current
    if (row) {
      const mapped = ops.flatMap((op): PromptEdit['ops'] =>
        op.op === 'accent' ? [{ k: 'accent', v: op.hex }] : op.op === 'remove' || op.op === 'add' ? [{ k: op.op, v: op.section }] : op.op === 'mood' ? [{ k: 'mood', v: op.mood }] : op.op === 'mode' ? [{ k: 'mode', v: op.mode }] : op.op === 'text' ? [{ k: 'text', v: `${op.field}: ${op.text.slice(0, 100)}` }] : [],
      )
      if (mapped.length) {
        promptRow.current = { ...row, edits: [...row.edits, { at: new Date().toISOString(), text: text.slice(0, 300), ops: mapped }].slice(-60) }
        void openPromptMemory().then((memory) => memory.save(promptRow.current!)).catch(() => undefined)
      }
    }
  }
  /** the thumbs of the chat: like = this is right (kept, remembered); not like = this is not right, so the AI turns it down and thinks again */
  const rateAnswer = async (id: number, up: boolean) => {
    const m = messages.find((x) => x.id === id)
    if (!m || m.rating === (up ? 'up' : 'down')) return
    setMessages((list) => list.map((x) => (x.id === id ? { ...x, rating: up ? 'up' : 'down' } : x)))
    const row = promptRow.current
    if (row) {
      const rating = { at: new Date().toISOString(), text: m.text.slice(0, 200), up }
      promptRow.current = { ...row, ratings: [...(row.ratings ?? []), rating].slice(-40), verdict: m.site ? (up ? 'up' : 'down') : row.verdict, rejected: m.site && !up && row.concept ? [...new Set([...(row.rejected ?? []), row.concept])] : row.rejected }
      if (m.site && row.concept) correctionStore.add({ at: rating.at, key: row.key, theme: row.theme, kind: up ? 'like' : 'dislike', conceptId: row.concept })
      void openPromptMemory().then((memory) => memory.save(promptRow.current!)).catch(() => undefined)
    }
    if (m.site) {
      if (currentDesign) await markDesign(currentDesign, up ? 'good' : 'bad', up)
      if (!up) {
        say({ role: 'ai', text: 'Understood: this one is not right. I will think of something different (another idea, colours and layout) and make it again.' })
        await anotherDesign()
      }
      return
    }
    // an edit: liked = it stays (and the wording that gave it is trusted); not liked = it is taken back and the next reading is asked for
    if (up) return say({ role: 'ai', text: 'Good, I will remember that this was what you meant.' })
    const last = [...history].reverse().find((h) => h.ops.length)
    if (last && m.ops && last.ops.length === m.ops.length) {
      undo()
      say({ role: 'ai', text: 'Taken back. Tell me what you wanted instead, in other words if you like, and I will read it differently.' })
    } else say({ role: 'ai', text: 'Noted: that change was not right. Tell me what to change instead (or use Undo for that step).' })
  }
  const applyOps = (text: string, ops: EditOp[], via: 'rules' | 'server', reply?: string, person = false) => {
    if (person || chatting.current) recordCorrections(ops, text)
    let logId: string | undefined
    // a text the person writes over is a text they did not want
    if (chatting.current) for (const o of ops) if (o.op === 'text' && (PHRASE_SLOTS as readonly string[]).includes(o.field)) learn([o.field as PhraseSlot], -1, 'replaced')
    if (chatting.current) {
      const row = logRow(text, businessKey(submitted), tplMulti ? 'multi' : 'single', ops.map(describeOp), via)
      logId = row.id
      void openEditLog().then((store) => store.add(row)).catch(() => undefined)
    }
    setHistory((list) => [...list, { text, ops, logId }])
    setUndone([])
    setView('preview')
    say({ role: 'ai', text: reply || (ops.length === 1 ? 'Done.' : `Done: ${ops.length} changes.`), ops, via })
    if (useServer && serverReady) sendFeedback({ text, ops, accepted: true, source: via === 'server' ? 'server' : 'rules' })
  }

  // A new site draws its own pictures by itself when the image engine is running (once per site and variation; "Remove the photos" is respected)
  const drawnFor = useRef('')
  const hasPhotosRef = useRef(false)
  hasPhotosRef.current = history.some((h) => h.ops.some((o) => o.op === 'photos'))
  const autoDraw = useRef<() => Promise<boolean>>(async () => true)
  autoDraw.current = async () => {
    const key = `${submitted}|${variation}|${runs}`
    // (already done for this site: nothing to wait for)
    if (drawnFor.current === key) return false
    drawnFor.current = key
    // pictures the person added themselves stay; pictures drawn earlier by this page are drawn again for a new variation
    if (hasPhotosRef.current && !autoMade.current) return true
    if (!(await imageEngineUp())) {
      // no image engine: the maths makes the pictures, so that the site is never left with empty boxes
      const made = artPictures({ prompt: submitted, accent: palette.light.accent, alt: palette.light.alt, temperature: temperature(), round: runs })
      autoMade.current = true
      applyOps('Abstract art made with maths', made.ops, 'rules', 'The picture maker is not available right now, so I made the pictures with maths (noise, fractals and your colours). Press "Real photos" in Tools to try the scene pictures again later.')
      return true
    }
    bumpBuild(3)
    say({ role: 'ai', text: 'Drawing pictures for your site with the image AI ...' })
    const answer = await makePictures(scenePlan(themeKey, niche, variation), () => undefined, { accent: palette.light.accent, bg: palette.light.bg, prompt: submitted })
    if (drawnFor.current !== key || (hasPhotosRef.current && !autoMade.current)) return true
    autoMade.current = true
    if (answer.used) {
      setDrawn(answer.used)
      setRated({})
    }
    if (answer.ops) applyOps('Pictures from the image AI', answer.ops, 'rules', `Pictures added${answer.report && (answer.report.redrawn || answer.report.otherScene || answer.report.directed) ? ` (checked: ${answer.report.directed} scenes changed to show your business, ${answer.report.redrawn} drawn again because they looked empty)` : ' (all checked)'}${answer.report?.notes.find((n) => /new mixes/.test(n)) ? ` ${answer.report.notes.find((n) => /new mixes/.test(n))}.` : ''} You can draw other ones or use your own in "Real photos".`)
      return true
  }
  useEffect(() => {
    // the landing screen has no site yet: nothing is drawn (the image engine must not spend its time on the example behind it)
    // (and while a new site is being made, nothing is drawn before its design is chosen: pictures for the old text, or for a design that is replaced a moment later, would only keep the engine busy)
    if (!started || (build.on && (build.prompt.trim() !== submitted.trim() || build.stage < 2))) return
    void autoDraw.current().then((ran) => ran && closeBuild())
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- closeBuild only touches refs and state setters
  }, [submitted, variation, runs, started, build.on, build.prompt, build.stage])

  // a thumb on a picture: remembered for this kind of business; a thumb down draws another scene in its place right away
  const ratePicture = async (index: number, verdict: 'up' | 'down') => {
    const scene = drawn[index]
    if (!scene) return
    rateScene(submitted, scene, verdict === 'up')
    setRated((r) => ({ ...r, [index]: verdict }))
    if (verdict === 'up') {
      say({ role: 'ai', text: `Noted: for this kind of business I will use "${scene.prompt}" first next time.` })
      return
    }
    setRateBusy(index)
    say({ role: 'ai', text: `Noted: "${scene.prompt}" will not be used for this business again. Drawing another scene ...` })
    const fresh = await redrawScene(scene, { accent: palette.light.accent, prompt: submitted })
    setRateBusy(-1)
    if (!fresh) {
      say({ role: 'ai', text: 'The picture maker did not answer. Please try again in a moment.' })
      return
    }
    const gallery = [...(edits.photos?.gallery ?? [])]
    const op: EditOp = index === 0 ? { op: 'photos', hero: fresh.picture } : index === 1 ? { op: 'photos', about: fresh.picture } : { op: 'photos', gallery: Object.assign(gallery, { [index - 2]: fresh.picture }) }
    setDrawn((list) => list.map((item, i) => (i === index ? fresh.scene : item)))
    setRated((r) => {
      const { [index]: _gone, ...rest } = r
      return rest
    })
    applyOps(`Another picture (${fresh.scene.prompt})`, [op], 'rules', `Drew "${fresh.scene.prompt}" instead. Thumb it too if you like it.`)
  }

  const undo = () => {
    const last = history[history.length - 1]
    if (!last) return say({ role: 'ai', text: 'There is nothing to undo.' })
    setHistory(history.slice(0, -1))
    setUndone((list) => [...list, last])
    if (last.logId) {
      const id = last.logId
      void openEditLog().then((store) => store.markUndone(id)).catch(() => undefined)
    }
    say({ role: 'ai', text: `Undone: ${last.ops.map(describeOp).join('; ')}` })
    if (useServer && serverReady) sendFeedback({ text: last.text, ops: last.ops, accepted: false, source: 'rules' })
  }
  const redo = () => {
    const next = undone[undone.length - 1]
    if (!next) return say({ role: 'ai', text: 'There is nothing to redo.' })
    setUndone(undone.slice(0, -1))
    setHistory((list) => [...list, next])
    say({ role: 'ai', text: `Applied again: ${next.ops.map(describeOp).join('; ')}` })
  }
  const reset = () => {
    if (!history.length) return say({ role: 'ai', text: 'There are no changes to remove.' })
    setUndone((list) => [...list, ...[...history].reverse()])
    setHistory([])
    say({ role: 'ai', text: 'All changes are removed: this is the website as it was generated.' })
  }

  const choose = (choice: Choice) => {
    pending.current = undefined
    say({ role: 'user', text: choice.label })
    if (choice.action === 'newSite') {
      const last = [...messages].reverse().find((m) => m.role === 'user')
      if (last) {
        void generate(last.text)
      }
      return
    }
    if (choice.action === 'dismiss' || !choice.ops) {
      say({ role: 'ai', text: 'Okay. Tell me what to change.' })
      return
    }
    chatting.current = true
    // "Do it anyway" counts for the command that was doubted, so a later undo is held against that command
    const original = choice.label === 'Do it anyway' ? [...messages].reverse().find((m) => m.role === 'user')?.text : undefined
    applyOps(original ?? choice.label, choice.ops, 'rules')
    chatting.current = false
  }

  const answerOpinion = async (text: string, feedback: ReturnType<typeof analyseFeedback>) => {
    const good = feedback.label === 'POSITIVE'
    const slots = good && feedback.target === 'overall' ? ALL_SLOTS : slotsOfFeedback(feedback)
    const ctx = phraseCtx()
    const group = ctx.group
    const names = slots.map((slot) => `"${slotTexts(ctx.content)[slot]}"`).join(', ')
    if (slots.length) await recordPhrases(eventsFor(ctx, slots, good ? 1 : -1, 'opinion', { text, sentiment: feedback.label }))
    if (good) {
      say({ role: 'ai', text: slots.length ? `Thanks, noted: ${names} will be used more often for this kind of business.` : 'Thanks, noted. Tell me if you want to change anything.' })
      return
    }
    const part = feedback.target
    if (part === 'colour') {
      const used = [...designs.map((d) => d.hue), hslOfHex(palette.light.accent).h, ...history.flatMap((h) => h.ops.filter((o) => o.op === 'accent').map((o) => hslOfHex((o as { hex: string }).hex).h))]
      const hex = uniqueAccent(`#${[0, 0, 0].map(() => Math.floor(Math.random() * 200 + 30).toString(16).padStart(2, '0')).join('')}`, used, hslToHex, hslOfHex)
      applyOps('Another colour', [{ op: 'accent', hex }], 'rules', 'Noted, you did not like the colour. I picked a colour that this kind of business has not had yet. Say "undo" to go back.')
      return
    }
    if (part === 'image') {
      say({ role: 'ai', text: 'Noted. Use the thumb down on the picture you do not like (under "Rate the pictures"): another scene is drawn at once and the turned-down scene is not used again.' })
      return
    }
    if (part === 'layout' || (part === 'overall' && !feedback.wantsChange)) {
      say({ role: 'ai', text: `Noted${slots.length ? `: ${names} will be used less` : ''}. What should change: the heading, the colours, the pictures or the whole design? You can also press "Another design".` })
      return
    }
    const slot = slots[0]
    const scores = await loadPhraseScores(true)
    turnedDown.current = [...turnedDown.current, ctx.content && slotTexts(ctx.content)[slot]]
    const alt = alternativeFor(submitted, slot, { current: slotTexts(ctx.content)[slot], brand: ctx.content.brandName, group, scores, avoid: turnedDown.current })
    if (!alt) {
      say({ role: 'ai', text: `Noted: ${names} will be used less. I have no other ${SLOT_NAME[slot]} for this business yet. Type the one you want, for example: ${SLOT_NAME[slot] === 'button text' ? 'button text Book now' : 'heading "Your new heading"'}.` })
      return
    }
    applyOps(`Another ${SLOT_NAME[slot]}`, [alt.op], 'rules', `Noted: ${names} will be used less for this kind of business. New ${SLOT_NAME[slot]}: "${alt.text}". Say "undo" to get the old one back, or "another ${SLOT_NAME[slot]}" for a different one.`)
  }

  const sendChat = async (text: string) => {
    say({ role: 'user', text })
    setChatBusy(true)
    chatting.current = true
    try {
      // what the last change was about, so "make it bigger" / "isko hata do" know what "it" is
      const lastOp = [...history].reverse().flatMap((h) => [...h.ops].reverse()).find((o) => ('section' in o && !!o.section) || ('target' in o && !!o.target && o.target !== 'page'))
      const lastTarget = lastOp && 'section' in lastOp ? lastOp.section : lastOp && 'target' in lastOp ? lastOp.target : undefined
      const parsed = parseEdit(text, tplMulti ? 'multi' : 'single', { target: typeof lastTarget === 'string' ? lastTarget : undefined, pages: isMulti, library: shownEngine === 'library' })
      // an opinion ("heading boring hai", "this is not good") is answered and learned from; the edit parser would turn it into a command
      const feedback = pending.current ? undefined : analyseFeedback(text)
      if (feedback && parsed.kind !== 'newSite' && treatAsOpinion(feedback, text, parsed.kind === 'ops' ? parsed.ops : undefined)) {
        await answerOpinion(text, feedback)
        return
      }
      if (parsed.kind === 'control') {
        if (parsed.control === 'undo') undo()
        else if (parsed.control === 'redo') redo()
        else reset()
        return
      }
      if (parsed.kind === 'newSite') {
        say({ role: 'ai', text: 'That sounds like a new website, so I am making one from it (your earlier changes belong to the old one).' })
        await generate(text)
        return
      }
      if (parsed.kind === 'ops' && parsed.ops.length) {
        // "a new colour": the random colour is moved to a hue this kind of business has not had yet (the design memory knows them)
        const fresh = parsed.notes.some((n) => /fresh colour/i.test(n))
        const used = [...designs.map((d) => d.hue), hslOfHex(palette.light.accent).h, ...history.flatMap((h) => h.ops.filter((o) => o.op === 'accent').map((o) => hslOfHex((o as { hex: string }).hex).h))]
        const ops = fresh ? parsed.ops.map((o) => (o.op === 'accent' ? { ...o, hex: uniqueAccent(o.hex, used, hslToHex, hslOfHex) } : o)) : parsed.ops
        // a command that was undone again and again: ask before doing it once more
        {
          const rows = await (await openEditLog()).list().catch(() => [])
          const stats = undoStats(rows, text)
          if (isDoubtful(stats)) {
            const norm = normaliseCommand(text)
            const earlier = rows.filter((r) => r.norm === norm && r.undone).map((r) => r.ops)
            say({ role: 'ai', text: doubtQuestion(stats, ops.map(describeOp), earlier), choices: [{ label: 'Do it anyway', ops }, { label: 'I will say it differently', action: 'dismiss' }], via: 'guess' })
            return
          }
        }
        applyOps(text, ops, 'rules', parsed.notes.length ? `Done. ${parsed.notes.join(' ')}` : undefined)
        return
      }
      if (parsed.kind === 'ops') {
        say({ role: 'ai', text: parsed.notes.join(' ') })
        return
      }
      const context = tplMulti ? 'multi' : 'single'
      // a question was waiting for a value: this message may be the answer
      if (pending.current) {
        const answer = answerFor(pending.current, text, context)
        if (answer.ops.length) {
          pending.current = undefined
          applyOps(text, answer.ops, 'rules')
          return
        }
        say({ role: 'ai', text: answer.reply ?? parsed.reason })
        return
      }
      // no rule matched: what kind of request is it? then ask for the missing detail
      const guess = await guessIntent(text, smartStatus().status === 'ready')
      if ((guess.intent === 'undo' || guess.intent === 'redo' || guess.intent === 'reset') && guess.probability >= 0.55) {
        if (guess.intent === 'undo') undo()
        else if (guess.intent === 'redo') redo()
        else reset()
        return
      }
      const question = guess.probability >= 0.3 ? clarify(guess.intent, context) : undefined
      if (question) {
        pending.current = question.expect
        say({ role: 'ai', text: question.question, choices: question.choices, via: 'guess' })
        return
      }
      say({ role: 'ai', text: parsed.reason })
    } finally {
      chatting.current = false
      setChatBusy(false)
    }
  }

  // the component files the person saved are compiled; the preview and the exports use them in place of the stored ones
  useEffect(() => {
    let stale = false
    const work = async () => {
      const used = new Map<string, ComponentType>()
      const status: Record<string, string> = {}
      for (const [path, edit] of Object.entries(codeEdits)) {
        const id = componentIdOfPath(path)
        if (!id) continue
        const result = await compileComponent(edit.content)
        if (result.component) {
          used.set(id, result.component)
          status[path] = 'ok'
        } else status[path] = result.error ?? 'The file could not be used.'
      }
      if (stale) return
      setComponentOverrides(used)
      setCodeStatus(status)
      setOverrideVersion((v) => v + 1)
    }
    void work()
    return () => {
      stale = true
    }
  }, [codeEdits])

  // ── the Code tab: a file the person saves is kept as they wrote it; the words of the page file also change the site ──
  const mainFile = projectFiles.find((f) => /(^|\/)src\/(GeneratedLandingPage|App)\.tsx$/.test(f.path) && typeof f.content === 'string' && f.content.includes('const content = '))?.path
  const saveFile = (path: string, content: string, base: string) => {
    setCodeEdits((cur) => ({ ...cur, [path]: { content, base } }))
    if (path !== mainFile || tplMulti) return setCodeNote('')
    const sync = opsFromEditedCode(content, active.content)
    if (sync.problem) return setCodeNote(sync.problem)
    if (!sync.ops.length) return setCodeNote(sync.unsupported.length ? `Saved. These parts are not shown in the preview, but they are in your file and in the download: ${sync.unsupported.join(', ')}.` : 'Saved. The words of the page did not change.')
    applyOps('Edited the page in the Code tab', sync.ops, 'rules', `Took your changes from the code: ${sync.applied.join(', ')}. Say "undo" to go back.`)
    setView('code')
    setCodeNote(`The site was updated from your code: ${sync.applied.join(', ')}.${sync.unsupported.length ? ` Not shown in the preview (kept in your file and in the download): ${sync.unsupported.join(', ')}.` : ''}`)
    // the page file is made again from the words (the site now has yours); when nothing else in the file was changed, no second version is needed
    if (codeWithoutContent(content) === codeWithoutContent(base)) setCodeEdits((cur) => Object.fromEntries(Object.entries(cur).filter(([key]) => key !== path)))
  }
  const resetFile = (path: string) => setCodeEdits((cur) => Object.fromEntries(Object.entries(cur).filter(([key]) => key !== path)))
  const keepFile = (path: string, base: string) => setCodeEdits((cur) => (cur[path] ? { ...cur, [path]: { ...cur[path], base } } : cur))

  const pageTabs: { path: string; label: string }[] = tplMulti ? multi.pages.filter((p) => !p.slug) : isMulti && shownEngine === 'library' ? (library.pages ?? []) : []
  const onPost = tplMulti && !!multi.pages.find((p) => p.path === route)?.slug

  if (!started)
    return (
      <Landing
        onSubmit={(text) => {
          setStarted(true)
          void generate(text)
        }}
        canContinue={resume ? `${resume.name || resume.prompt.slice(0, 40)}` : undefined}
        onContinue={resume ? () => { setStarted(true); void restore(resume) } : undefined}
      />
    )

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      {/* ───────────── left: the prompt and everything that steers it ───────────── */}
      <aside className="flex h-[72vh] w-full shrink-0 flex-col border-b border-black/5 bg-white/55 backdrop-blur-md lg:h-full lg:w-[400px] lg:border-b-0 lg:border-r">
        <div className="border-b border-black/5 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-[15px] font-bold tracking-tight text-stone-900">{brandName}</h1>
              <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-stone-500" title={submitted}>
                {submitted}
              </p>
            </div>
            <button type="button" onClick={() => setStarted(false)} className="lv-btn lv-btn-ghost shrink-0 px-3 py-1 text-xs" title="Describe another business">
              New site
            </button>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] font-medium text-stone-600">
            <span className="rounded-full bg-black/5 px-2.5 py-0.5">{isMulti ? 'Several pages' : 'One page'}</span>
            <span className="rounded-full bg-black/5 px-2.5 py-0.5">{themeKey.replace(/_/g, ' ')}</span>
            <span className="rounded-full bg-black/5 px-2.5 py-0.5 capitalize">{creativityLevel}</span>
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <EditChat
            messages={messages}
            busy={chatBusy}
            canUndo={history.length > 0}
            canRedo={undone.length > 0}
            changes={history.length}
            onSend={(t) => void sendChat(t)}
            onChoose={choose}
            onColor={(hex, label, alt) => {
              say({ role: 'user', text: label })
              applyOps(label, [{ op: 'accent', hex }, ...(alt ? [{ op: 'alt' as const, hex: alt }] : [])], 'rules', alt ? 'Took the main colour and a second colour from the picture.' : 'Took the main colour from the picture.', true)
            }}
            onUndo={undo}
            onRedo={redo}
            onReset={reset}
            onRate={(id, up) => void rateAnswer(id, up)}
          />
        </div>
      </aside>

      {/* ───────────── right: preview or code ───────────── */}
      <section id="preview-section" className="relative flex min-h-[75vh] min-w-0 flex-1 flex-col lg:h-full lg:min-h-0">
        <BuildingScreen key={build.since} prompt={build.prompt} stage={build.stage} open={build.on} />
        <ToolsDrawer
          open={tools.open}
          tab={tools.tab}
          onTab={(tab) => setTools((t) => ({ ...t, tab }))}
          onClose={() => setTools((t) => ({ ...t, open: false }))}
          panes={[
            { id: 'design', label: 'Design', content: <>
          <section className="space-y-3 lv-card p-3">
            <h2 className="text-sm font-semibold text-gray-900">Settings</h2>
            <Setting label="Pages" note={pagesMode === 'auto' ? `chosen for you: ${isMulti ? 'several pages' : 'one page'}` : undefined}>
              <Segmented
                value={pagesMode}
                options={[['auto', 'Auto'], ['single', 'One page'], ['multi', 'Several pages']]}
                onChange={(mode) => choosePagesMode(mode)}
              />
            </Setting>
            <Setting label="Engine">
              <Segmented
                value={shownEngine}
                options={[['library', 'My components'], ['templates', 'Built-in templates']]}
                onChange={(e) => {
                  setEngine(e)
                }}
              />
            </Setting>
            <Setting label="Design level">
              <Segmented value={level} options={[['auto', 'Auto'], ['normal', 'Normal'], ['better', 'Better'], ['premium', 'Premium']]} onChange={setLevel} />
            </Setting>
            <Setting label="Mood">
              <select
                aria-label="Design mood"
                value={edits.mood ?? 'auto'}
                onChange={(e) => {
                  const mood = e.target.value as MoodChoice
                  say({ role: 'user', text: `Design mood: ${mood}` })
                  recordCorrections([{ op: 'mood', mood }])
                  applyOps(`Design mood: ${mood}`, [{ op: 'mood', mood }], 'rules', mood === 'none' ? 'Back to the look of the business type.' : mood === 'auto' ? 'The mood is chosen by the generator.' : `The ${MOODS.find((m) => m.id === mood)?.label ?? mood} look: its colours, typeface, shapes and the colour of each panel.`)
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm"
              >
                <option value="auto">Auto (chosen for you)</option>
                <option value="none">None (business look)</option>
                {MOODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Setting>
            <Setting label="Creativity" note={creativityLevel === 'safe' ? 'the stored layouts as they are' : creativityLevel === 'balanced' ? 'parts chosen together by taste learned from your components' : 'daring mixes, kept only when they hang together'}>
              <Segmented
                value={creativityLevel}
                options={CREATIVITY_LEVELS}
                onChange={(next) => {
                  saveCreativity(next)
                  setCreativityLevel(next)
                }}
              />
            </Setting>
            <Setting label="Motion">
              <Segmented value={motionSetting} options={[['auto', 'Auto'], ['off', 'Off'], ['subtle', 'Subtle'], ['rich', 'Rich']]} onChange={setMotionSetting} />
            </Setting>
            <Setting label="Creative brain" note={brainsForced ? 'always on for this business type' : undefined}>
              <Segmented value={creative ? 'on' : 'off'} options={[['on', 'On'], ['off', 'Off']]} onChange={(v) => setCreative(v === 'on')} />
            </Setting>
          </section>
          <ServerSetting serverReady={serverReady} useServer={useServer} onUseServer={setUseServer} />
        </> },
            { id: 'content', label: 'Business', content: <>
          <BusinessForm
            onApply={(ops) => {
              say({ role: 'user', text: 'My business details' })
              applyOps('My business details', ops, 'rules', 'Added your business details.')
            }}
          />
          <PhotosPanel
            defaultQuery={active.content.subject || brandName}
            hasPhotos={!!edits.photos}
            planFor={(offset) => scenePlan(themeKey, niche, variation + offset)}
            accent={palette.light.accent}
            alt={palette.light.alt}
            prompt={submitted}
            onApply={(ops, label, used) => {
              autoMade.current = false
              setDrawn(used ?? [])
              setRated({})
              say({ role: 'user', text: label })
              applyOps(label, ops, 'rules', 'Put the photos on your site.')
            }}
            onClear={() => {
              setDrawn([])
              setRated({})
              say({ role: 'user', text: 'Remove the photos' })
              applyOps('Remove the photos', [{ op: 'clearPhotos' }], 'rules', 'The drawn pictures are back.')
            }}
          />
          {coreCraftReady && (
            <CoreCraftPanel
              prompt={submitted}
              auto={coreAuto}
              note={coreNote}
              onAuto={(on) => {
                setCoreAuto(on)
                try {
                  localStorage.setItem('ui-blocks:core-auto', on ? 'on' : 'off')
                } catch {
                  // the switch is remembered when it can be
                }
              }}
              gate={() => ({ theme: themeKey, subject: textSite.content.subject, prompt: submitted, current: { heroTitle: textSite.content.hero.title, heroSubtitle: textSite.content.hero.subtitle, heroButton: textSite.content.hero.button }, avoid: turnedDown.current })}
              onUse={(slot: CoreSlot, text: string) => applyOps(`Core-Craft AI: ${slot}`, [{ op: 'text', field: slot, text }], 'rules', `Used a line from Core-Craft AI: "${text}". Say "undo" to get the old one back.`)}
            />
          )}
          <section className="space-y-2 lv-card p-3 text-xs text-gray-500">
            <h2 className="text-sm font-semibold text-gray-900">Your data</h2>
            <p title="Blog posts, team, reviews, FAQ and gallery captions that you keep in src/data/dataPool.json">
              Pool: <b className="text-gray-700">{pool.text}</b> ({pool.mode}) · <code>src/data/dataPool.json</code>
              {pool.problems.length > 0 && <span className="text-amber-700"> · {pool.problems.length} left out: {pool.problems.slice(0, 2).join('; ')}</span>}
            </p>
            <ImportPanel />
          </section>
        </> },
            { id: 'project', label: 'Project', content: <>
          {resume && (
            <div role="status" className="space-y-2 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-900">
              <p>
                Continue your last work? <b>{resume.prompt.slice(0, 70)}{resume.prompt.length > 70 ? '...' : ''}</b>
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => void restore(resume)} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700">
                  Continue
                </button>
                <button
                  type="button"
                  onClick={() => {
                    forgetSession()
                    setResume(undefined)
                  }}
                  className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-sm font-medium text-indigo-800 hover:bg-indigo-100"
                >
                  Start fresh
                </button>
              </div>
            </div>
          )}
          <ProjectsPanel
            projects={projects}
            message={projectNote}
            onSave={(name) => {
              const result = saveProject(name || brandName, snapshot())
              setProjects(listProjects())
              // the copy on the server (a version of it: the last 30 stay)
              const kept = listProjects().find((p) => p.name.toLowerCase() === (name || brandName).trim().slice(0, 60).toLowerCase())
              if (result.ok && kept) void saveRemote(kept.name, kept)
              setProjectNote(result.ok ? (result.trimmed ? 'Saved. The pictures were too big to keep in the browser: use "Download file" to keep them.' : `Saved in this browser and on the server (every save is a version). ${firstSave() ? `Keep this recovery code: ${userId()}. If this browser is ever cleared, it brings your projects back (Tools, Project, "Use my projects on another computer").` : ''}`) : (result.error ?? 'Could not save.'))
            }}
            onLoad={(project) => void restore(project)}
            onDelete={(id) => {
              const gone = projects.find((p) => p.id === id)
              if (gone) void deleteRemote(gone.name)
              deleteProject(id)
              setProjects(listProjects())
            }}
            onImport={(project) => void restore(project)}
            onExportCurrent={(name) => ({ ...snapshot(), id: 'file', name: name.trim() || brandName, savedAt: new Date().toISOString() })}
            onMessage={setProjectNote}
          />
          <section className="space-y-2 lv-card p-3">
            <h2 className="text-sm font-semibold text-gray-900">Export</h2>
            <ExportPanel fileEdits={codeEdits} engine={shownEngine} isMulti={isMulti} multi={multi} site={site} library={library} details={details} onDetails={setDetails} onExport={() => { exported.current = true; learn(ALL_SLOTS, 1, 'export') }} />
          </section>
        </> },
            { id: 'insights', label: 'Insights', content: <>
          <UnderstandingPanel prompt={submitted} site={{ theme: themeKey, tier, variation, layout: `${isMulti ? 'multi' : 'single'}/${shownEngine}` }} onSmartReady={() => undefined} />
          <DesignHistory
            designs={designs}
            currentId={currentDesign}
            insights={insightsOf(designs, submitted)}
            where={designStore?.kind ?? 'browser'}
            busy={designBusy}
            onVerdict={(id, verdict, best) => void markDesign(id, verdict, best)}
            onNew={() => void anotherDesign()}
          />
          <RatePictures
            items={drawn.map((scene, i) => {
              const photos = edits.photos
              const thumb = i === 0 ? photos?.hero : i === 1 ? photos?.about : photos?.gallery?.[i - 2]
              return { label: i === 0 ? 'first screen' : i === 1 ? 'about' : `gallery ${i - 1}`, thumb: thumb ?? '', state: rated[i], busy: rateBusy === i, key: scene.prompt }
            }).filter((item) => item.thumb)}
            onRate={(i, verdict) => void ratePicture(i, verdict)}
          />
          <details className="lv-card text-xs text-gray-600">
            <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-gray-700 [&::-webkit-details-marker]:hidden">About this site ▾</summary>
            <div className="space-y-2 px-3 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 font-semibold text-indigo-700">{themeKey}</span>
                {niche && (
                  <span className="rounded-full bg-sky-100 px-2.5 py-0.5 font-semibold text-sky-800" title="The text of this page comes from a hand-written pack for this kind of business">
                    niche: {niche.replace(/_/g, ' ')}
                  </span>
                )}
                <span className={`rounded-full px-2.5 py-0.5 font-semibold capitalize ${tier === 'premium' ? 'bg-amber-100 text-amber-800' : tier === 'normal' ? 'bg-gray-200 text-gray-700' : 'bg-emerald-100 text-emerald-800'}`}>
                  {tier} {level === 'auto' ? '(auto)' : '(chosen)'}
                </span>
                <span>
                  brand <b className="text-gray-900">{brandName}</b>
                </span>
              </div>
              <p className="text-gray-400">
                {isMulti
                  ? `${pageTabs.length} pages · ${pageTabs.map((p) => p.label).join(' · ')}`
                  : shownEngine === 'library'
                    ? library.sections.map((x) => x.componentId.split('/')[1]).join(' · ')
                    : `${site.layoutIds.length} sections · palette ${site.paletteIndex + 1}`}{' '}
                · variation {variation + 1}
              </p>
              <p>
                Why {brain.tier}? {brain.reasons.join(' · ')} → score {brain.score}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {(['light', 'dark'] as const).map((m) => (
                  <span key={m} className="flex overflow-hidden rounded border border-gray-300" title={`${m} mode`}>
                    {[palette[m].bg, palette[m].surface, palette[m].text, palette[m].accent, palette[m].alt].map((c, i) => (
                      <span key={i} className="size-4" style={{ background: c }} />
                    ))}
                  </span>
                ))}
                <b className="text-gray-700">{palette.name}</b>
              </div>
              {colorReasons.length > 0 && <p>{colorReasons.join(' · ')}</p>}
              <p>
                Motion <b className="text-gray-700">{motion.level}</b>
                {motion.level !== 'off' && <> · {motion.style} · {motion.duration}ms · {Object.entries(motion.features).filter(([, on]) => on).map(([name]) => name).join(', ')}</>}
              </p>
              <p className="text-gray-400">scores: {Object.entries(scores).map(([k, v]) => `${k}=${v}`).join(' · ')}</p>
            </div>
          </details>
          <details className="group lv-card">
            <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-gray-700 [&::-webkit-details-marker]:hidden">Try an example ▾</summary>
            <div className="flex flex-wrap gap-2 px-3 pb-3">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => {
                    void generate(example)
                  }}
                  className="lv-chip text-left"
                >
                  {example}
                </button>
              ))}
            </div>
          </details>
        </> },
          ]}
        />
        <header className="lv-bar flex flex-wrap items-center gap-2 px-3 py-2">
          <div role="tablist" aria-label="What to show" className="lv-pill-tabs">
            {(['preview', 'code', 'json'] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className="capitalize"
              >
                {v}
              </button>
            ))}
          </div>

          <div className="flex flex-1 justify-center">
            {view === 'preview' && (
              <div role="group" aria-label="Screen size" className="lv-pill-tabs">
                {(Object.keys(DEVICES) as Device[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDevice(d)}
                    aria-pressed={device === d}
                    aria-label={`${DEVICES[d].label} (${DEVICES[d].width}px)`}
                    title={`${DEVICES[d].label} · ${DEVICES[d].width}px`}
                    className="flex items-center"
                  >
                    <DeviceIcon device={d} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => void anotherDesign()} disabled={designBusy} className="lv-btn lv-btn-ghost px-3 py-1.5 text-[13px] disabled:opacity-50" title="A different design for the same business">
              Another design
            </button>
            <button type="button" onClick={() => setTools({ open: true, tab: 'design' })} className="lv-btn lv-btn-ghost px-3 py-1.5 text-[13px]" title="Settings, business details, projects, what the generator understood">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
                <circle cx="16" cy="6" r="2" />
                <circle cx="10" cy="12" r="2" />
                <circle cx="18" cy="18" r="2" />
              </svg>
              Tools
            </button>
            <button type="button" onClick={() => setTools({ open: true, tab: 'project' })} className="lv-btn lv-btn-primary px-3.5 py-1.5 text-[13px]" title="Download the site, or save the project">
              Export
            </button>
            <button type="button" onClick={openPreview} className="lv-btn lv-btn-dark size-8" title="Open the site full size in a new tab" aria-label="Open the site in a new tab">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 17 17 7M8 7h9v9" />
              </svg>
            </button>
          </div>
        </header>

        {view === 'preview' && isMulti && pageTabs.length > 0 && (
          <nav className="lv-bar flex items-center gap-1.5 overflow-x-auto whitespace-nowrap px-3 py-2 text-sm" aria-label="Pages of the site">
            {pageTabs.map((p) => (
              <button
                key={p.path}
                type="button"
                onClick={() => setRoute(p.path)}
                className={`rounded-full px-3.5 py-1 font-medium transition-colors ${route === p.path ? 'bg-stone-900 text-white' : 'bg-black/5 text-stone-700 hover:bg-black/10'}`}
              >
                {p.label}
              </button>
            ))}
            {onPost && <span className="rounded-md bg-indigo-600 px-3 py-1 font-medium text-white">Blog post</span>}
          </nav>
        )}

        {view === 'preview' ? (
          <div className="lv-canvas min-h-0 flex-1">
            <DeviceFrame device={device} html={previewHtml} title={brandName} route={route} onRoute={onRoute} />
          </div>
        ) : view === 'json' ? (
          <JsonEditor
            blueprint={blueprint}
            onApply={(ops) => {
              say({ role: 'user', text: 'Changed the JSON of the site' })
              applyOps('Changed the JSON of the site', ops, 'rules', ops.length === 1 ? 'Done: one change.' : `Done: ${ops.length} changes.`)
            }}
          />
        ) : (
          <CodeView status={codeStatus} files={projectFiles} edits={codeEdits} mainFile={mainFile} note={codeNote} onSave={saveFile} onReset={resetFile} onKeep={keepFile} loading={projectBusy} projectName={shownEngine === 'library' ? libraryProjectName(library) : projectName(tplMulti ? sourceFromSite(multi) : sourceFromPage(site))} />
        )}
      </section>
    </div>
  )
}

// ───────────── small pieces ─────────────
function Segmented<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (next: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          aria-pressed={value === key}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${value === key ? 'bg-stone-900 text-white shadow-sm' : 'bg-black/5 text-stone-700 hover:bg-black/10'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function Setting({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-2 text-xs">
        <span className="font-medium text-gray-600">{label}</span>
        {note && <span className="text-gray-400">({note})</span>}
      </div>
      {children}
    </div>
  )
}


function DeviceIcon({ device }: { device: Device }) {
  const common = { viewBox: '0 0 24 24', className: 'size-5', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  if (device === 'mobile')
    return (
      <svg {...common}>
        <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
        <path d="M11 18.5h2" />
      </svg>
    )
  if (device === 'tablet')
    return (
      <svg {...common}>
        <rect x="4" y="3" width="16" height="18" rx="2.5" />
        <path d="M11 18h2" />
      </svg>
    )
  return (
    <svg {...common}>
      <rect x="2.5" y="4" width="19" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  )
}

/** true the first time something is saved in this browser: the recovery code is shown then (once) */
function firstSave(): boolean {
  try {
    if (localStorage.getItem('ui-blocks:code-shown')) return false
    localStorage.setItem('ui-blocks:code-shown', '1')
    return true
  } catch {
    return false
  }
}

export default GeneratorPage
