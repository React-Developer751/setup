import { useEffect, useState } from 'react'
import { listRemote, openVersion, versionsOf, type RemoteProject, type Version } from './generator/projectSync'
import { setUserId, userId } from './generator/userId'
import { projectFileName, projectFromJson, projectToJson, type Project } from './generator/projects'

type Props = {
  projects: Project[]
  message: string
  onSave: (name: string) => void
  onLoad: (project: Project) => void
  onDelete: (id: string) => void
  /** a project read from a file the person chose */
  onImport: (project: Project) => void
  onExportCurrent: (name: string) => Project
  onMessage: (text: string) => void
}

/** Save the work in this browser, keep it as a file, or open a file again. */
function ProjectsPanel({ projects, message, onSave, onLoad, onDelete, onImport, onExportCurrent, onMessage }: Props) {
  const [name, setName] = useState('')
  const [remote, setRemote] = useState<RemoteProject[]>([])
  const [history, setHistory] = useState<{ name: string; versions: Version[] } | undefined>()
  const [code, setCode] = useState('')
  const [shown, setShown] = useState(false)
  useEffect(() => {
    void listRemote().then(setRemote)
  }, [projects])
  const showHistory = async (projectName: string) => setHistory(history?.name === projectName ? undefined : { name: projectName, versions: await versionsOf(projectName) })
  const restoreVersion = async (projectName: string, id: string) => {
    const project = await openVersion(projectName, id)
    if (project) onLoad(project)
    else onMessage('That version could not be opened.')
  }
  const useCode = () => {
    if (!setUserId(code)) return onMessage('That is not a sync code (32 letters and numbers).')
    onMessage('Code saved. The page reloads to use it.')
    window.setTimeout(() => window.location.reload(), 600)
  }
  const onlyRemote = remote.filter((r) => !projects.some((p) => p.name.toLowerCase() === r.name.toLowerCase()))

  const download = () => {
    const project = onExportCurrent(name)
    const url = URL.createObjectURL(new Blob([projectToJson(project)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = projectFileName(project)
    a.click()
    URL.revokeObjectURL(url)
  }

  const open = async (file: File | undefined) => {
    if (!file) return
    const project = projectFromJson(await file.text())
    if (!project) return onMessage('That file is not a website project of this tool.')
    onImport(project)
  }

  return (
    <details className="rounded-xl border border-gray-200 bg-white">
      <summary className="cursor-pointer list-none px-3 py-2 text-sm font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">My projects ▾</summary>
      <div className="space-y-2.5 px-3 pb-3 text-xs text-gray-600">
        <div className="flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name, e.g. Glow Studio" aria-label="Project name" className="min-w-0 flex-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
          <button type="button" onClick={() => onSave(name)} className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700">
            Save
          </button>
        </div>
        {message && <p className="text-gray-700">{message}</p>}
        {projects.length > 0 && (
          <ul className="space-y-1">
            {projects.map((p) => (
              <li key={p.id} className="flex items-center gap-2 rounded-lg bg-gray-50 px-2 py-1.5">
                <span className="min-w-0 flex-1 truncate" title={p.prompt}>
                  <b className="text-gray-800">{p.name}</b> <span className="text-gray-400">{new Date(p.savedAt).toLocaleDateString()}</span>
                </span>
                <button type="button" onClick={() => onLoad(p)} className="rounded-md border border-gray-300 bg-white px-2 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-100">
                  Open
                </button>
                <button type="button" onClick={() => void showHistory(p.name)} aria-expanded={history?.name === p.name} className="rounded-md border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-100">
                  Versions
                </button>
                <button type="button" onClick={() => onDelete(p.id)} aria-label={`Delete ${p.name}`} className="rounded-md px-1.5 py-0.5 text-xs text-gray-500 hover:bg-gray-200">
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        {history && (
          <div className="rounded-lg border border-gray-200 bg-white p-2" role="region" aria-label={`Versions of ${history.name}`}>
            <p className="mb-1 font-semibold text-gray-800">Versions of {history.name} (the last 30 saves)</p>
            {history.versions.length === 0 ? (
              <p>No saved versions on the server yet: press Save.</p>
            ) : (
              <ul className="space-y-1">
                {history.versions.slice(0, 12).map((v, i) => (
                  <li key={v.id} className="flex items-center gap-2">
                    <span className="flex-1">{new Date(v.at).toLocaleString()}{i === 0 ? ' (latest)' : ''}</span>
                    <button type="button" onClick={() => void restoreVersion(history.name, v.id)} className="rounded-md border border-gray-300 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-100">
                      Open this one
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {onlyRemote.length > 0 && (
          <div>
            <p className="mb-1 font-semibold text-gray-800">Also on the server</p>
            <ul className="space-y-1">
              {onlyRemote.map((r) => (
                <li key={r.slug} className="flex items-center gap-2 rounded-lg bg-gray-50 px-2 py-1.5">
                  <span className="min-w-0 flex-1 truncate" title={r.prompt}>
                    <b className="text-gray-800">{r.name}</b> <span className="text-gray-400">{r.versions} version{r.versions === 1 ? '' : 's'}</span>
                  </span>
                  <button type="button" onClick={() => void restoreVersion(r.name, 'latest')} className="rounded-md border border-gray-300 bg-white px-2 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-100">
                    Open
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={download} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100">
            Download file
          </button>
          <label className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100">
            Open file
            <input type="file" accept=".json,application/json" className="sr-only" onChange={(e) => void open(e.target.files?.[0])} />
          </label>
        </div>
        <details className="rounded-lg bg-gray-50 px-2 py-1.5" onToggle={(e) => setShown((e.target as HTMLDetailsElement).open)}>
          <summary className="cursor-pointer font-medium text-gray-700">Use my projects on another computer</summary>
          <div className="mt-1.5 space-y-1.5">
            <p>Your saves are kept on the server under this private code (no account needed). Paste the same code in the other browser.</p>
            <p className="break-all rounded bg-white px-2 py-1 font-mono text-[11px] text-gray-800">{shown ? userId() : 'shown when opened'}</p>
            <div className="flex gap-2">
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="code from another browser" aria-label="Sync code" className="min-w-0 flex-1 rounded-lg border border-gray-300 px-2 py-1 text-xs" />
              <button type="button" onClick={useCode} className="rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100">
                Use this code
              </button>
            </div>
          </div>
        </details>
        <p className="text-[11px] text-gray-500">Projects are kept in this browser and on the server (every save is a version). The file holds everything (also big pictures) and can be opened on another computer.</p>
      </div>
    </details>
  )
}

export default ProjectsPanel
