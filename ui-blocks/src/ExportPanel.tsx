// The Export area: download buttons, and the details the person can fill in first (their own email, phone, address,
// website address, a form service, a logo and a hero picture). Without them the placeholders stay.
import { useState } from 'react'
import { buildLibraryStandalone, buildLibraryStaticZip, buildLibraryZip, libraryProjectName, libraryWithDetails } from './generator/exportLibrary'
import { applyDetails, buildStandalone, buildZip, projectName, sourceFromPage, sourceFromSite, type ExportDetails, type ExportSource } from './generator/exportSite'
import { buildStaticZip } from './generator/exportStatic'
import type { generateSite } from './generator/generateSite'
import type { generateWebsite } from './generator/generateWebsite'
import type { generateLibraryPage } from './generator/library/generateLibraryPage'
import { downloadFile } from './generator/zip'
import { readPicture } from './generator/edit/imageFile'

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
}

/** Reads a picture and shrinks it, so that it can be embedded in the pages without making them heavy. */
const FIELDS: { key: 'email' | 'phone' | 'address' | 'siteUrl' | 'formEndpoint'; label: string; placeholder: string; templatesOnly?: boolean }[] = [
  { key: 'email', label: 'Email', placeholder: 'hello@yourbusiness.com' },
  { key: 'phone', label: 'Phone', placeholder: '+91 98765 43210' },
  { key: 'address', label: 'Address', placeholder: '12 MG Road, Pune 411001' },
  { key: 'siteUrl', label: 'Website address', placeholder: 'https://www.yourbusiness.com' },
  { key: 'formEndpoint', label: 'Form service', placeholder: 'https://formspree.io/f/xxxxxxx', templatesOnly: true },
]

function ExportPanel({ engine, isMulti, multi, site, library, details, onDetails: setDetails, onExport }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
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
    onExport?.()
    if (isLibrary) return downloadFile(`${libraryProjectName(library)}.zip`, await buildLibraryZip(lib()), 'application/zip')
    const s = source()
    downloadFile(`${projectName(s)}.zip`, buildZip(s), 'application/zip')
  }
  const staticZip = () => {
    onExport?.()
    if (isLibrary) return downloadFile(`${libraryProjectName(library)}-static.zip`, buildLibraryStaticZip(lib(), details), 'application/zip')
    const s = source()
    downloadFile(`${projectName(s)}-static.zip`, buildStaticZip(s), 'application/zip')
  }
  const html = () => {
    onExport?.()
    if (isLibrary) return downloadFile(`${libraryProjectName(library)}.html`, buildLibraryStandalone(lib()), 'text/html')
    const s = source()
    downloadFile(`${projectName(s)}.html`, buildStandalone(s), 'text/html')
  }

  const filled = Object.values(details).filter(Boolean).length

  return (
    <div className="basis-full space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-gray-500">Export</span>
        <button type="button" onClick={zip} className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700">
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
        <button type="button" onClick={html} className="rounded-md bg-gray-100 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-200">
          One .html file
        </button>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-100">
          Your details{filled > 0 ? ` (${filled})` : ''} {open ? '▴' : '▾'}
        </button>
      </div>

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
