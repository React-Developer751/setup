// Saving the work: a project is the prompt, the settings and the list of changes (a site is always prompt + changes, see generator/edit/edits.ts),
// plus the details and pictures the person added. Kept in this browser (localStorage) and as a file the person can keep or send.
import type { Tier } from './designBrain'
import { cleanOp, type EditOp } from './edit/edits'
import type { ExportDetails } from './exportSite'
import type { MotionSetting } from './motionBrain'

export type Project = {
  v: 1
  id: string
  name: string
  savedAt: string
  prompt: string
  variation: number
  level: 'auto' | Tier
  creative: boolean
  motion: MotionSetting
  engine: 'templates' | 'library'
  pages: 'multi' | 'single'
  history: { text: string; ops: EditOp[]; logId?: string }[]
  details: ExportDetails
}

export type Snapshot = Omit<Project, 'id' | 'name' | 'savedAt'>

const PROJECTS = 'website-generator-projects'
const SESSION = 'website-generator-session'
const MAX_PROJECTS = 20
/** what is safe to keep in localStorage (about 5 MB for the whole site): pictures beyond this stay in the file export only */
const MAX_CHARS = 3_000_000

const store = () => {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    return undefined
  }
}

const isDataUrl = (v: unknown) => typeof v === 'string' && v.startsWith('data:')
const stripPictures = (project: Project): Project => ({
  ...project,
  details: { ...project.details, logo: undefined, hero: undefined },
  history: project.history
    .map((h) => ({ ...h, ops: h.ops.filter((op) => !(op.op === 'photos' && [op.hero, op.about, ...(op.gallery ?? [])].some(isDataUrl))) }))
    .filter((h) => h.ops.length),
})

/** Checks anything that comes from outside (a file, the storage): the shape, and every operation again. */
export function parseProject(raw: unknown): Project | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const o = raw as Record<string, unknown>
  if (o.v !== 1 || typeof o.prompt !== 'string' || !o.prompt.trim() || o.prompt.length > 4000) return undefined
  const history = (Array.isArray(o.history) ? o.history : []).slice(0, 200).map((h) => {
    const entry = (h ?? {}) as Record<string, unknown>
    const ops = (Array.isArray(entry.ops) ? entry.ops : []).map(cleanOp).filter((op): op is EditOp => !!op)
    return { text: typeof entry.text === 'string' ? entry.text.slice(0, 300) : '', ops }
  }).filter((h) => h.ops.length)
  const d = (o.details && typeof o.details === 'object' ? o.details : {}) as Record<string, unknown>
  const str = (v: unknown, max = 600) => (typeof v === 'string' ? v.slice(0, max) : undefined)
  const picture = (v: unknown) => (typeof v === 'string' && /^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/=]{20,600000}$/.test(v) ? v : undefined)
  return {
    v: 1,
    id: typeof o.id === 'string' && /^[\w-]{1,40}$/.test(o.id) ? o.id : `p${Date.now().toString(36)}`,
    name: (str(o.name, 60) ?? 'My website').trim() || 'My website',
    savedAt: typeof o.savedAt === 'string' ? o.savedAt.slice(0, 40) : new Date().toISOString(),
    prompt: o.prompt.trim(),
    variation: Number.isInteger(o.variation) && (o.variation as number) >= 0 && (o.variation as number) < 1000 ? (o.variation as number) : 0,
    level: o.level === 'normal' || o.level === 'better' || o.level === 'premium' ? o.level : 'auto',
    creative: o.creative !== false,
    motion: o.motion === 'off' || o.motion === 'subtle' || o.motion === 'rich' ? o.motion : 'auto',
    engine: o.engine === 'templates' ? 'templates' : 'library',
    pages: o.pages === 'single' ? 'single' : 'multi',
    history,
    details: {
      email: str(d.email, 120), phone: str(d.phone, 60), address: str(d.address, 200), siteUrl: str(d.siteUrl, 200), formEndpoint: str(d.formEndpoint, 300),
      logo: picture(d.logo), hero: picture(d.hero),
    },
  }
}

export function listProjects(): Project[] {
  try {
    const list = JSON.parse(store()?.getItem(PROJECTS) ?? '[]') as unknown[]
    return list.map(parseProject).filter((p): p is Project => !!p)
  } catch {
    return []
  }
}

/** Saves under a name (the same name replaces the old one). Returns what happened. */
export function saveProject(name: string, snapshot: Snapshot): { ok: boolean; trimmed: boolean; error?: string } {
  const storage = store()
  if (!storage) return { ok: false, trimmed: false, error: 'This browser does not allow saving here. Use "Download file" instead.' }
  const clean = name.trim().slice(0, 60) || 'My website'
  let project: Project = { ...snapshot, v: 1, id: `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name: clean, savedAt: new Date().toISOString() }
  let trimmed = false
  const others = listProjects().filter((p) => p.name.toLowerCase() !== clean.toLowerCase())
  const write = (candidate: Project) => storage.setItem(PROJECTS, JSON.stringify([candidate, ...others].slice(0, MAX_PROJECTS)))
  try {
    if (JSON.stringify(project).length > MAX_CHARS) {
      project = stripPictures(project)
      trimmed = true
    }
    write(project)
    return { ok: true, trimmed }
  } catch {
    try {
      write(stripPictures(project))
      return { ok: true, trimmed: true }
    } catch {
      return { ok: false, trimmed: false, error: 'There is no space left to save. Download the file instead.' }
    }
  }
}

export function deleteProject(id: string): void {
  try {
    store()?.setItem(PROJECTS, JSON.stringify(listProjects().filter((p) => p.id !== id)))
  } catch {
    // nothing to delete
  }
}

/** the last session, kept without pictures (it is rewritten often): the page offers to continue it */
export function rememberSession(snapshot: Snapshot): void {
  try {
    store()?.setItem(SESSION, JSON.stringify(stripPictures({ ...snapshot, id: 'session', name: 'Last session', savedAt: new Date().toISOString() })))
  } catch {
    // the session is a convenience only
  }
}
export function lastSession(): Project | undefined {
  try {
    return parseProject(JSON.parse(store()?.getItem(SESSION) ?? 'null'))
  } catch {
    return undefined
  }
}
export function forgetSession(): void {
  try {
    store()?.removeItem(SESSION)
  } catch {
    // nothing
  }
}

export const projectFileName = (project: { name: string }) => `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'website'}.website.json`
export const projectToJson = (project: Project) => JSON.stringify(project, null, 1)
export const projectFromJson = (text: string): Project | undefined => {
  try {
    return text.length > 12_000_000 ? undefined : parseProject(JSON.parse(text))
  } catch {
    return undefined
  }
}
