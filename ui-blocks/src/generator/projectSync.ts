// Projects on the server (per person, see userId.ts): every save is a version, the last 30 stay, and any of them can be opened again. The local list in projects.ts stays the
// first place (it works without a server); this is the copy that survives a cleared browser and the history behind it.
import { parseProject, type Project } from './projects'

export type RemoteProject = { slug: string; name: string; savedAt: string; versions: number; prompt: string }
export type Version = { id: string; at: string; bytes: number }

const get = async <T>(path: string): Promise<T | undefined> => {
  try {
    const res = await fetch(path, { signal: AbortSignal.timeout(5000) })
    return res.ok ? ((await res.json()) as T) : undefined
  } catch {
    return undefined
  }
}

export const listRemote = async (): Promise<RemoteProject[]> => (await get<{ projects: RemoteProject[] }>('/api/projects'))?.projects ?? []
export const versionsOf = async (name: string): Promise<Version[]> => (await get<{ versions: Version[] }>(`/api/projects/versions?name=${encodeURIComponent(name)}`))?.versions ?? []
export async function openVersion(name: string, id = 'latest'): Promise<Project | undefined> {
  const body = await get<{ project: unknown }>(`/api/projects/version?name=${encodeURIComponent(name)}&id=${encodeURIComponent(id)}`)
  return body ? parseProject(body.project) : undefined
}
/** keeps a version on the server; false when there is no server (the local copy is still there) */
export async function saveRemote(name: string, project: Project): Promise<boolean> {
  try {
    const res = await fetch('/api/projects/save', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, project }), signal: AbortSignal.timeout(15000) })
    return res.ok
  } catch {
    return false
  }
}
export async function deleteRemote(name: string): Promise<void> {
  try {
    await fetch('/api/projects/delete', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name }), signal: AbortSignal.timeout(8000) })
  } catch {
    // nothing to delete
  }
}
