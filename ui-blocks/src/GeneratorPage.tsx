import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import ExportPanel from './ExportPanel'
import DeviceFrame from './preview/DeviceFrame'
import { DEVICES, type Device } from './preview/devices'
import { usePreviewDocument } from './preview/usePreviewDocument'
import { buildLibraryStandalone, libraryWithDetails } from './generator/exportLibrary'
import { applyDetails, buildStandalone, sourceFromPage, sourceFromSite, type ExportDetails } from './generator/exportSite'
import ImportPanel from './ImportPanel'
import UnderstandingPanel from './UnderstandingPanel'
import { getLearningVersion, subscribeLearning } from './generator/ml/learned'
import { setSmart, smartStatus, smartVersion, smartWanted, subscribeSmart, understand } from './generator/ml/smart'
import { getPoolVersion, poolSummary, subscribePool } from './generator/dataPool'
import BusinessForm from './BusinessForm'
import PhotosPanel from './PhotosPanel'
import { scenePlan } from './generator/imageAi'
import ProjectsPanel from './ProjectsPanel'
import { deleteProject, forgetSession, lastSession, listProjects, rememberSession, saveProject, type Project, type Snapshot } from './generator/projects'
import EditChat, { type ChatMessage } from './EditChat'
import { answerFor, clarify, type Choice, type Expect } from './generator/edit/clarify'
import { guessIntent } from './generator/edit/intent'
import { describeOp, editsFrom, type EditOp } from './generator/edit/edits'
import { askServer, imageEngineUp, sendFeedback, serverHealth } from './generator/edit/serverEdit'
import { makePictures, redrawScene, type UsedScene } from './generator/edit/imageAiClient'
import { rateScene } from './generator/edit/imageRatings'
import RatePictures from './RatePictures'
import { planColors } from './generator/colorPlanner'
import { CREATIVITY_LEVELS, loadCreativity, saveCreativity, setCreativity, type CreativityLevel } from './generator/creativity'
import { parseEdit } from './generator/edit/understand'
import { generateSite } from './generator/generateSite'
import { generateWebsite } from './generator/generateWebsite'
import { generateLibraryPage } from './generator/library/generateLibraryPage'
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
  const [prompt, setPrompt] = useState(EXAMPLES[0])
  const [submitted, setSubmitted] = useState(EXAMPLES[0])
  const [variation, setVariation] = useState(0)
  // counts every "Generate website" / "Another variation" click, so the pictures are drawn again for the same prompt too
  const [runs, setRuns] = useState(0)
  const autoMade = useRef(false)
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
  const [view, setView] = useState<'preview' | 'code'>('preview')
  const [copied, setCopied] = useState(false)
  const [pages, setPages] = useState<'multi' | 'single'>('multi')
  const [route, setRoute] = useState('/')
  const [fileIndex, setFileIndex] = useState(0)
  // the preview starts as a phone
  const [device, setDevice] = useState<Device>('mobile')
  const [details, setDetails] = useState<ExportDetails>({})
  // changes asked for in the chat: a site is the prompt + this list (see generator/edit/edits.ts)
  const [history, setHistory] = useState<{ text: string; ops: EditOp[] }[]>([])
  const [undone, setUndone] = useState<{ text: string; ops: EditOp[] }[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatBusy, setChatBusy] = useState(false)
  const [useServer, setUseServer] = useState(false)
  const [serverReady, setServerReady] = useState(false)
  const [projects, setProjects] = useState<Project[]>(() => listProjects())
  const [projectNote, setProjectNote] = useState('')
  // the last session of this browser: offered at the start; it is only overwritten after the person has chosen
  const [resume, setResume] = useState<Project | undefined>(() => lastSession())
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
  const library = useMemo(() => generateLibraryPage(submitted, variation, level === 'auto' ? undefined : level, creative, motionSetting, edits), [submitted, variation, level, creative, motionSetting, edits, poolVersion, creativityLevel])
  // the multi-page site is made with the built-in templates (the 92-components engine is single-page for now)
  const isMulti = pages === 'multi'
  const shownEngine = isMulti ? 'templates' : engine
  const multi = useMemo(
    () => generateSite(submitted, variation, level === 'auto' ? undefined : level, creative, motionSetting, edits),
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- the pool is read inside the generators
    [submitted, variation, level, creative, motionSetting, edits, poolVersion, creativityLevel],
  )
  const active = isMulti ? multi : shownEngine === 'library' ? library : site
  const { themeKey, tier, motion, brain, brainsForced, palette, colorReasons, niche } = active
  const brandName = active.content.brandName
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- the pool is read inside the generators
  const pool = useMemo(() => poolSummary(), [poolVersion])

  const files = isMulti
    ? multi.files
    : [{ path: 'GeneratedLandingPage.tsx', code: shownEngine === 'library' ? library.code : site.code }]
  const file = files[Math.min(fileIndex, files.length - 1)]

  // The site as one HTML document (the same as the "One .html file" export): the preview frame and the Preview button show it.
  // Frames and new tabs have their own viewport, so mobile / tablet / desktop layouts really are the ones a visitor would see.
  const buildDocument = () =>
    shownEngine === 'library'
      ? buildLibraryStandalone(libraryWithDetails(library, details))
      : buildStandalone(applyDetails(isMulti ? sourceFromSite(multi) : sourceFromPage(site), details))
  const previewHtml = usePreviewDocument(buildDocument, [shownEngine, isMulti, multi, site, library, details, poolVersion])

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

  const generate = async (text: string) => {
    if (!text.trim()) return
    // with "smart understanding" on, the model reads the prompt first (the generators are synchronous)
    await understand(text)
    setSubmitted(text)
    setHistory([])
    setUndone([])
    // the colours are thought out first: a new idea that does not look like the last sites
    const idea = planColors(text)
    messageId.current += 1
    setMessages([{ id: messageId.current, role: 'ai', text: `Colour idea: ${idea.name}. ${idea.reasons[0] ?? ''}` }])
    setVariation(idea.variation)
    setRuns((n) => n + 1)
    autoMade.current = false
    setDrawn([])
    setRated({})
    setRoute('/')
    setFileIndex(0)
    setView('preview')
  }

  // ───────────── projects ─────────────
  const snapshot = (): Snapshot => ({ v: 1, prompt: submitted, variation, level, creative, motion: motionSetting, engine, pages, history, details })

  useEffect(() => {
    if (resume) return
    const timer = window.setTimeout(() => rememberSession({ v: 1, prompt: submitted, variation, level, creative, motion: motionSetting, engine, pages, history, details }), 800)
    return () => window.clearTimeout(timer)
  }, [resume, submitted, variation, level, creative, motionSetting, engine, pages, history, details])

  // once the person has started something new, the offer to continue the old work goes away and the new work is remembered
  useEffect(() => {
    if (resume && (history.length > 0 || submitted !== EXAMPLES[0])) setResume(undefined)
  }, [resume, history, submitted])

  const restore = async (project: Project) => {
    await understand(project.prompt)
    setPrompt(project.prompt)
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
    setFileIndex(0)
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
    return () => {
      alive = false
    }
  }, [useServer])

  const applyOps = (text: string, ops: EditOp[], via: 'rules' | 'server', reply?: string) => {
    setHistory((list) => [...list, { text, ops }])
    setUndone([])
    setView('preview')
    say({ role: 'ai', text: reply || (ops.length === 1 ? 'Done.' : `Done: ${ops.length} changes.`), ops, via })
    if (useServer && serverReady) sendFeedback({ text, ops, accepted: true, source: via === 'server' ? 'server' : 'rules' })
  }

  // A new site draws its own pictures by itself when the image engine is running (once per site and variation; "Remove the photos" is respected)
  const drawnFor = useRef('')
  const hasPhotosRef = useRef(false)
  hasPhotosRef.current = history.some((h) => h.ops.some((o) => o.op === 'photos'))
  const autoDraw = useRef<() => Promise<void>>(async () => undefined)
  autoDraw.current = async () => {
    const key = `${submitted}|${variation}|${runs}`
    if (drawnFor.current === key) return
    drawnFor.current = key
    // pictures the person added themselves stay; pictures drawn earlier by this page are drawn again for a new variation
    if (!(await imageEngineUp()) || (hasPhotosRef.current && !autoMade.current)) return
    say({ role: 'ai', text: 'Drawing pictures for your site with the image AI ...' })
    const answer = await makePictures(scenePlan(themeKey, niche, variation), () => undefined, { accent: palette.light.accent, prompt: submitted })
    if (drawnFor.current !== key || (hasPhotosRef.current && !autoMade.current)) return
    autoMade.current = true
    if (answer.used) {
      setDrawn(answer.used)
      setRated({})
    }
    if (answer.ops) applyOps('Pictures from the image AI', answer.ops, 'rules', `Pictures added${answer.report && (answer.report.redrawn || answer.report.otherScene || answer.report.directed) ? ` (checked: ${answer.report.directed} scenes changed to show your business, ${answer.report.redrawn} drawn again because they looked empty)` : ' (all checked)'}${answer.report?.notes.find((n) => /new mixes/.test(n)) ? ` ${answer.report.notes.find((n) => /new mixes/.test(n))}.` : ''} You can draw other ones or use your own in "Real photos".`)
  }
  useEffect(() => {
    void autoDraw.current()
  }, [submitted, variation, runs])

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
      say({ role: 'ai', text: 'The image engine did not answer. Start it with npm run images.' })
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
        setPrompt(last.text)
        void generate(last.text)
      }
      return
    }
    if (choice.action === 'dismiss' || !choice.ops) {
      say({ role: 'ai', text: 'Okay. Tell me what to change.' })
      return
    }
    applyOps(choice.label, choice.ops, 'rules')
  }

  const sendChat = async (text: string) => {
    say({ role: 'user', text })
    setChatBusy(true)
    try {
      const parsed = parseEdit(text, isMulti ? 'multi' : 'single')
      if (parsed.kind === 'control') {
        if (parsed.control === 'undo') undo()
        else if (parsed.control === 'redo') redo()
        else reset()
        return
      }
      if (parsed.kind === 'newSite') {
        say({ role: 'ai', text: 'That sounds like a new website, so I am making one from it (your earlier changes belong to the old one).' })
        setPrompt(text)
        await generate(text)
        return
      }
      if (parsed.kind === 'ops' && parsed.ops.length) {
        applyOps(text, parsed.ops, 'rules', parsed.notes.length ? `Done. ${parsed.notes.join(' ')}` : undefined)
        return
      }
      if (parsed.kind === 'ops') {
        say({ role: 'ai', text: parsed.notes.join(' ') })
        return
      }
      const context = isMulti ? 'multi' : 'single'
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
      // the rules did not understand: the AI server may
      if (useServer && serverReady) {
        const answer = await askServer(text, {
          brand: active.content.brandName,
          context,
          sections: [...edits.hidden.map((k) => `-${k}`), ...edits.added.map((k) => `+${k}`)],
          pages: isMulti ? multi.pages.map((p) => p.path) : [],
        })
        if (answer?.control) {
          if (answer.control === 'undo') undo()
          else if (answer.control === 'redo') redo()
          else reset()
          return
        }
        if (answer?.newSite) {
          setPrompt(text)
          await generate(text)
          return
        }
        if (answer && answer.ops.length) {
          applyOps(text, answer.ops, 'server', answer.reply)
          return
        }
        if (answer?.reply) {
          say({ role: 'ai', text: answer.reply })
          return
        }
      }
      // no rule and no server: what kind of request is it? then ask for the missing detail
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
      setChatBusy(false)
    }
  }

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const downloadCode = () => {
    const url = URL.createObjectURL(new Blob([file.code], { type: 'text/plain' }))
    const a = document.createElement('a')
    a.href = url
    a.download = file.path.split('/').pop() ?? 'GeneratedLandingPage.tsx'
    a.click()
    URL.revokeObjectURL(url)
  }

  const pageTabs = isMulti ? multi.pages.filter((p) => !p.slug) : []
  const onPost = isMulti && !!multi.pages.find((p) => p.path === route)?.slug

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      {/* ───────────── left: the prompt and everything that steers it ───────────── */}
      <aside className="flex w-full shrink-0 flex-col border-b border-gray-200 bg-white lg:h-full lg:w-[380px] lg:border-b-0 lg:border-r">
        <div className="space-y-3 border-b border-gray-100 p-4">
          <label htmlFor="prompt" className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <SparkIcon /> Describe your website
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void generate(prompt)
            }}
            rows={4}
            className="w-full resize-none rounded-xl border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            placeholder="e.g. Create a page for a gym called Iron Pulse"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => void generate(prompt)} className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
              Generate website
            </button>
            <button
              type="button"
              onClick={() => {
                {
                  const idea = planColors(submitted)
                  setVariation(idea.variation)
                  say({ role: 'ai', text: `Colour idea: ${idea.name}. ${idea.reasons[0] ?? ''}` })
                }
                setRuns((n) => n + 1)
                setView('preview')
              }}
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              Another variation
            </button>
          </div>
          <p className="text-xs text-gray-400">Cmd / Ctrl + Enter to generate</p>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 lg:max-h-none">
          <EditChat
            messages={messages}
            busy={chatBusy}
            canUndo={history.length > 0}
            canRedo={undone.length > 0}
            changes={history.length}
            serverReady={serverReady}
            useServer={useServer}
            onUseServer={setUseServer}
            onSend={(t) => void sendChat(t)}
            onChoose={choose}
            onColor={(hex, label, alt) => {
              say({ role: 'user', text: label })
              applyOps(label, [{ op: 'accent', hex }, ...(alt ? [{ op: 'alt' as const, hex: alt }] : [])], 'rules', alt ? 'Took the main colour and a second colour from the picture.' : 'Took the main colour from the picture.')
            }}
            onUndo={undo}
            onRedo={redo}
            onReset={reset}
          />

          <RatePictures
            items={drawn.map((scene, i) => {
              const photos = edits.photos
              const thumb = i === 0 ? photos?.hero : i === 1 ? photos?.about : photos?.gallery?.[i - 2]
              return { label: i === 0 ? 'first screen' : i === 1 ? 'about' : `gallery ${i - 1}`, thumb: thumb ?? '', state: rated[i], busy: rateBusy === i, key: scene.prompt }
            }).filter((item) => item.thumb)}
            onRate={(i, verdict) => void ratePicture(i, verdict)}
          />

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
              setProjectNote(result.ok ? (result.trimmed ? 'Saved. The pictures were too big to keep in the browser: use "Download file" to keep them.' : 'Saved in this browser.') : (result.error ?? 'Could not save.'))
            }}
            onLoad={(project) => void restore(project)}
            onDelete={(id) => {
              deleteProject(id)
              setProjects(listProjects())
            }}
            onImport={(project) => void restore(project)}
            onExportCurrent={(name) => ({ ...snapshot(), id: 'file', name: name.trim() || brandName, savedAt: new Date().toISOString() })}
            onMessage={setProjectNote}
          />

          <BusinessForm
            onApply={(ops) => {
              say({ role: 'user', text: 'My business details' })
              applyOps('My business details', ops, 'rules', 'Added your business details.')
            }}
          />

          <PhotosPanel
            defaultQuery={active.content.subject || brandName}
            hasPhotos={!!edits.photos}
            supported={shownEngine === 'templates'}
            planFor={(offset) => scenePlan(themeKey, niche, variation + offset)}
            accent={palette.light.accent}
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

          <details className="group rounded-xl border border-gray-200 bg-gray-50/60">
            <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-gray-700 [&::-webkit-details-marker]:hidden">Try an example ▾</summary>
            <div className="flex flex-wrap gap-2 px-3 pb-3">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => {
                    setPrompt(example)
                    void generate(example)
                  }}
                  className="rounded-full bg-white px-3 py-1 text-left text-xs text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100"
                >
                  {example}
                </button>
              ))}
            </div>
          </details>

          <UnderstandingPanel prompt={submitted} site={{ theme: themeKey, tier, variation, layout: `${isMulti ? 'multi' : 'single'}/${shownEngine}` }} onSmartReady={() => undefined} />

          <section className="space-y-3 rounded-xl border border-gray-200 p-3">
            <h2 className="text-sm font-semibold text-gray-900">Settings</h2>
            <Setting label="Pages">
              <Segmented
                value={pages}
                options={[['multi', 'Multi-page'], ['single', 'Single page']]}
                onChange={(p) => {
                  setPages(p)
                  setRoute('/')
                }}
              />
            </Setting>
            <Setting label="Built with">
              <Segmented
                value={shownEngine}
                options={[['library', 'My 92 components'], ['templates', 'Built-in templates']]}
                onChange={(e) => {
                  setEngine(e)
                  if (e === 'library') setPages('single')
                }}
              />
            </Setting>
            <Setting label="Design level">
              <Segmented value={level} options={[['auto', 'Auto'], ['normal', 'Normal'], ['better', 'Better'], ['premium', 'Premium']]} onChange={setLevel} />
            </Setting>
            <Setting label="Creativity">
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

          <details className="rounded-xl border border-gray-200 text-xs text-gray-600">
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
                  ? `${multi.pages.length} pages · ${pageTabs.map((p) => p.label).join(' · ')}`
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

          <section className="space-y-2 rounded-xl border border-gray-200 p-3 text-xs text-gray-500">
            <h2 className="text-sm font-semibold text-gray-900">Your data</h2>
            <p title="Blog posts, team, reviews, FAQ and gallery captions that you keep in src/data/dataPool.json">
              Pool: <b className="text-gray-700">{pool.text}</b> ({pool.mode}) · <code>src/data/dataPool.json</code>
              {pool.problems.length > 0 && <span className="text-amber-700"> · {pool.problems.length} left out: {pool.problems.slice(0, 2).join('; ')}</span>}
            </p>
            <ImportPanel />
          </section>

          <section className="space-y-2 rounded-xl border border-gray-200 p-3">
            <h2 className="text-sm font-semibold text-gray-900">Export</h2>
            <ExportPanel engine={shownEngine} isMulti={isMulti} multi={multi} site={site} library={library} details={details} onDetails={setDetails} />
          </section>
        </div>
      </aside>

      {/* ───────────── right: preview or code ───────────── */}
      <section className="flex min-h-[75vh] min-w-0 flex-1 flex-col lg:h-full lg:min-h-0">
        <header className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-3 py-2">
          <div role="tablist" aria-label="What to show" className="flex rounded-lg bg-gray-100 p-0.5">
            {(['preview', 'code'] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize ${view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="flex flex-1 justify-center">
            {view === 'preview' && (
              <div role="group" aria-label="Screen size" className="flex rounded-lg bg-gray-100 p-0.5">
                {(Object.keys(DEVICES) as Device[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDevice(d)}
                    aria-pressed={device === d}
                    aria-label={`${DEVICES[d].label} (${DEVICES[d].width}px)`}
                    title={`${DEVICES[d].label} · ${DEVICES[d].width}px`}
                    className={`rounded-md px-3 py-1.5 ${device === d ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    <DeviceIcon device={d} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <button type="button" onClick={openPreview} className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-gray-700" title="Open the site full size in a new tab">
            Preview
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 17 17 7M8 7h9v9" />
            </svg>
          </button>
        </header>

        {view === 'preview' && isMulti && (
          <nav className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap border-b border-gray-200 bg-white px-3 py-2 text-sm" aria-label="Pages of the site">
            {pageTabs.map((p) => (
              <button
                key={p.path}
                type="button"
                onClick={() => setRoute(p.path)}
                className={`rounded-md px-3 py-1 font-medium ${route === p.path ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {p.label}
              </button>
            ))}
            {onPost && <span className="rounded-md bg-indigo-600 px-3 py-1 font-medium text-white">Blog post</span>}
          </nav>
        )}

        {view === 'preview' ? (
          <div className="min-h-0 flex-1">
            <DeviceFrame device={device} html={previewHtml} title={brandName} route={route} onRoute={onRoute} />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col bg-gray-900">
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 bg-gray-950 px-3 py-2 text-xs">
              {files.length > 1 &&
                files.map((f, i) => (
                  <button
                    key={f.path}
                    type="button"
                    onClick={() => setFileIndex(i)}
                    className={`rounded-md px-2.5 py-1 font-mono ${file.path === f.path ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                  >
                    {f.path}
                  </button>
                ))}
              {files.length === 1 && <span className="font-mono text-gray-400">{file.path}</span>}
              <span className="ml-auto flex gap-2">
                <button type="button" onClick={() => void copyText(file.code)} className="rounded-md bg-gray-800 px-3 py-1 text-gray-200 hover:bg-gray-700">
                  {copied ? 'Copied!' : 'Copy file'}
                </button>
                {files.length > 1 && (
                  <button type="button" onClick={() => void copyText(files.map((f) => `// ===== ${f.path} =====\n${f.code}`).join('\n'))} className="rounded-md bg-gray-800 px-3 py-1 text-gray-200 hover:bg-gray-700">
                    Copy all {files.length} files
                  </button>
                )}
                <button type="button" onClick={downloadCode} className="rounded-md bg-gray-800 px-3 py-1 text-gray-200 hover:bg-gray-700">
                  Download this file
                </button>
              </span>
            </div>
            <pre className="min-h-0 flex-1 overflow-auto p-4 text-xs leading-relaxed text-gray-100">
              <code>{file.code}</code>
            </pre>
          </div>
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
          className={`rounded-lg px-2.5 py-1 text-xs font-medium ${value === key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
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

const SparkIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4 text-indigo-600" fill="currentColor" aria-hidden="true">
    <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2Zm7 11 .9 2.6L22.5 16.5l-2.6.9L19 20l-.9-2.6-2.6-.9 2.6-.9L19 13ZM6 15l.7 2 2 .7-2 .7L6 20.5l-.7-2.1-2-.7 2-.7L6 15Z" />
  </svg>
)

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

export default GeneratorPage
