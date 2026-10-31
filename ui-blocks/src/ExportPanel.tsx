// The Export area: download buttons, and the details the person can fill in first (their own email, phone, address,
// website address, a form service, a logo and a hero picture). Without them the placeholders stay.
import { useState } from 'react'
import { buildLibraryProject, buildLibraryStandalone, buildLibraryStaticFiles, buildLibraryStaticZip, libraryProjectName, libraryWithDetails } from './generator/exportLibrary'
import { withEdits, type FileEdit } from './codeEdits'
import { applyDetails, buildProject, buildStandalone, projectName, sourceFromPage, sourceFromSite, type ExportDetails, type ExportSource } from './generator/exportSite'
import { buildStaticZip } from './generator/exportStatic'
import type { generateSite } from './generator/generateSite'
import type { generateWebsite } from './generator/generateWebsite'
import type { generateLibraryPage } from './generator/library/generateLibraryPage'
import { createZip, downloadFile } from './generator/zip'
import { readPicture } from './generator/edit/imageFile'
import { publishedFor, publishSite, unpublishSite, type Published } from './generator/publish'

type Props = {
  /** which engine made the page on screen */
  engine: 'templates' | 'library'
  isMulti: boolean
  multi: ReturnType<typeof generateSite>
  site: ReturnType<typeof generateWebsite>
  library: ReturnType<typeof generateLibraryPage>
  /** what the person filled in (shared with the preview) */
  details: ExportDetails
  onDetails: (next: ExportDetails | ((current: ExportDetails) => ExportDetails)) => void
  /** called when a file is downloaded: the person kept this site (a thumb up for its texts) */
  onExport?: () => void
  /** the files the person changed in the Code tab: they are in the project .zip as they wrote them */
  fileEdits?: Record<string, FileEdit>
  /** the name on the site was made up by the generator (the person gave none): nothing is downloaded or published until they write theirs or keep this one */
  madeUpName?: string
  onRename?: (name: string) => void
  onKeepName?: () => void
}

/** Reads a picture and shrinks it, so that it can be embedded in the pages without making them heavy. */
const FIELDS: { key: 'email' | 'phone' | 'address' | 'siteUrl' | 'formEndpoint'; label: string; placeholder: string; templatesOnly?: boolean }[] = [
  { key: 'email', label: 'Email', placeholder: 'hello@yourbusiness.com' },
  { key: 'phone', label: 'Phone', placeholder: '+91 98765 43210' },
  { key: 'address', label: 'Address', placeholder: '12 MG Road, Pune 411001' },
  { key: 'siteUrl', label: 'Website address', placeholder: 'https://www.yourbusiness.com' },
  { key: 'formEndpoint', label: 'Form service', placeholder: 'https://formspree.io/f/xxxxxxx', templatesOnly: true },
]

function ExportPanel({ engine, isMulti, multi, site, library, details, onDetails: setDetails, onExport, fileEdits = {}, madeUpName, onRename, onKeepName }: Props) {
  const [typedName, setTypedName] = useState('')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [published, setPublished] = useState<Published | undefined>(() => publishedFor(libraryProjectName(library)))
  const [publishing, setPublishing] = useState(false)
  const [copied, setCopied] = useState(false)
  const isLibrary = engine === 'library'

  const source = (): ExportSource => applyDetails(isMulti ? sourceFromSite(multi) : sourceFromPage(site), details)
  const lib = () => libraryWithDetails(library, details)

  const set = (key: keyof ExportDetails, value: string) => setDetails((current) => ({ ...current, [key]: value }))

  const pick = async (key: 'logo' | 'hero', file: File | undefined, maxSize: number) => {
    setError('')
    if (!file) return set(key, '')
    try {
      set(key, await readPicture(file, maxSize, key === 'logo'))
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not read the picture.')
    }
  }

  const zip = async () => {
    if (madeUpName) return
    onExport?.()
    if (isLibrary) return downloadFile(`${libraryProjectName(library)}.zip`, createZip(withEdits(await buildLibraryProject(lib()), fileEdits)), 'application/zip')
    const s = source()
    downloadFile(`${projectName(s)}.zip`, createZip(withEdits(buildProject(s), fileEdits)), 'application/zip')
  }
  const staticZip = () => {
    if (madeUpName) return
    onExport?.()
    if (isLibrary) return downloadFile(`${libraryProjectName(library)}-static.zip`, buildLibraryStaticZip(lib(), details), 'application/zip')
    const s = source()
    downloadFile(`${projectName(s)}-static.zip`, buildStaticZip(s), 'application/zip')
  }
  const html = () => {
    if (madeUpName) return
    onExport?.()
    if (isLibrary) return downloadFile(`${libraryProjectName(library)}.html`, buildLibraryStandalone(lib()), 'text/html')
    const s = source()
    downloadFile(`${projectName(s)}.html`, buildStandalone(s), 'text/html')
  }

  const publish = async () => {
    if (madeUpName) return
    setError('')
    setPublishing(true)
    try {
      onExport?.()
      setPublished(await publishSite(libraryProjectName(library), buildLibraryStaticFiles(lib(), details)))
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not publish the site.')
    } finally {
      setPublishing(false)
    }
  }
  const takeDown = async () => {
    setError('')
    try {
      await unpublishSite(libraryProjectName(library))
      setPublished(undefined)
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not take the site down.')
    }
  }

  const filled = Object.values(details).filter(Boolean).length

  return (
    <div className="basis-full space-y-3">
      {madeUpName && (
        <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
          <p>
            The name on this site, <b>{madeUpName}</b>, was made up by the generator: you did not give one. Write your real business name before you download or publish.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input value={typedName} onChange={(e) => setTypedName(e.target.value)} placeholder="Your business name" aria-label="Your business name" className="min-w-0 flex-1 rounded-md border border-amber-300 bg-white px-2.5 py-1.5 text-sm" />
            <button type="button" disabled={typedName.trim().length < 2} onClick={() => onRename?.(typedName.trim())} className="rounded-md bg-amber-600 px-3 py-1.5 font-medium text-white hover:bg-amber-700 disabled:opacity-50">
              Use this name
            </button>
            <button type="button" onClick={onKeepName} className="rounded-md border border-amber-400 px-3 py-1.5 font-medium text-amber-900 hover:bg-amber-100">
              Keep “{madeUpName}”
            </button>
          </div>
        </div>
      )}
      <div className={`flex flex-wrap items-center gap-2 ${madeUpName ? 'pointer-events-none opacity-50' : ''}`} aria-disabled={!!madeUpName}>
        <span className="text-gray-500">Export</span>
        <button type="button" onClick={zip} disabled={!!madeUpName} className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700">
          Project (.zip)
        </button>
        <button
          type="button"
          onClick={staticZip}
          title="Plain HTML files with sitemap, robots.txt and SEO tags: upload to any host"
          className="rounded-md bg-emerald-600 px-3 py-1.5 font-medium text-white hover:bg-emerald-700"
        >
          SEO-ready HTML (.zip)
        </button>
        {isLibrary && (
          <button type="button" onClick={publish} disabled={publishing} title="Puts the finished site on this server and gives you a link to open or share" className="rounded-md bg-violet-600 px-3 py-1.5 font-medium text-white hover:bg-violet-700 disabled:opacity-60">
            {publishing ? 'Publishing ...' : published ? 'Update published site' : 'Publish (get a link)'}
          </button>
        )}
        <button type="button" onClick={html} className="rounded-md bg-gray-100 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-200">
          One .html file
        </button>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-100">
          Your details{filled > 0 ? ` (${filled})` : ''} {open ? '▴' : '▾'}
        </button>
      </div>

      {isLibrary && published && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm" role="status">
          <span className="font-medium text-violet-900">Published:</span>
          <a href={published.url} target="_blank" rel="noopener noreferrer" className="break-all text-violet-700 underline">
            {published.url}
          </a>
          <button type="button" onClick={() => void navigator.clipboard?.writeText(published.url).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1500) })} className="rounded-md border border-violet-300 px-2 py-1 text-xs text-violet-800 hover:bg-violet-100">
            {copied ? 'Copied' : 'Copy link'}
          </button>
          <button type="button" onClick={() => void takeDown()} className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100">
            Take down
          </button>
          <p className="basis-full text-xs text-gray-600">
            The link works while this server runs and for whoever can reach it (on your computer: only you). For a public address, run this server on a host or upload the &quot;SEO-ready HTML&quot; files to Netlify, Vercel or GitHub Pages.
          </p>
        </div>
      )}

      {open && (
        <div className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm sm:grid-cols-2">
          <p className="text-xs text-gray-500 sm:col-span-2">
            Fill in what you know: it replaces the placeholders in every exported file. Leave a field empty to keep the generated one.
          </p>
          {FIELDS.filter((field) => !(isLibrary && field.templatesOnly)).map((field) => (
            <label key={field.key} className="space-y-1">
              <span className="font-medium text-gray-700">{field.label}</span>
              <input
                type="text"
                value={details[field.key] ?? ''}
                onChange={(e) => set(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5"
              />
            </label>
          ))}
          {!isLibrary && (
            <>
              <label className="space-y-1">
                <span className="font-medium text-gray-700">Logo {details.logo && <span className="text-emerald-600">✓ added</span>}</span>
                <input type="file" accept="image/*" onChange={(e) => pick('logo', e.target.files?.[0], 256)} className="block w-full text-xs" />
              </label>
              <label className="space-y-1">
                <span className="font-medium text-gray-700">Main picture (home page) {details.hero && <span className="text-emerald-600">✓ added</span>}</span>
                <input type="file" accept="image/*" onChange={(e) => pick('hero', e.target.files?.[0], 1400)} className="block w-full text-xs" />
              </label>
              <p className="text-xs text-gray-500 sm:col-span-2">
                The form service address (for example from formspree.io) makes the contact form send messages to your inbox. Without it, the form opens the visitor&apos;s email app.
              </p>
            </>
          )}
          {error && <p className="text-xs text-red-600 sm:col-span-2">{error}</p>}
        </div>
      )}
    </div>
  )
}

export default ExportPanel
