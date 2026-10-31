import { useEffect, useState } from 'react'

type Lead = { id: string; site: string; at: string; fields: Record<string, string> }

/** The messages that visitors sent from the contact form of my sites (the preview in this app, and sites published from here). They come to the server of this app: nobody else reads them. */
function LeadsPanel() {
  const [leads, setLeads] = useState<Lead[] | undefined>()
  const [note, setNote] = useState('')
  const load = () => {
    setNote('')
    void fetch('/api/leads', { signal: AbortSignal.timeout(6000) })
      .then((r) => (r.ok ? (r.json() as Promise<{ leads: Lead[] }>) : Promise.reject(new Error('no server'))))
      .then((body) => setLeads(body.leads))
      .catch(() => {
        setLeads(undefined)
        setNote('The server of this app is not running (npm run app), so messages cannot be read here.')
      })
  }
  useEffect(load, [])
  return (
    <details className="rounded-xl border border-gray-200 bg-white">
      <summary className="cursor-pointer list-none px-3 py-2 text-sm font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
        Messages from your contact form {leads ? `(${leads.length})` : ''} ▾
      </summary>
      <div className="space-y-2 px-3 pb-3 text-xs text-gray-600">
        <p>What visitors write in the form of a published site comes here. Messages sent from the preview show as "draft".</p>
        <button type="button" onClick={load} className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
          Refresh
        </button>
        {note && <p className="text-amber-700">{note}</p>}
        {leads && leads.length === 0 && <p>No messages yet.</p>}
        <ul className="max-h-72 space-y-2 overflow-y-auto">
          {(leads ?? []).map((lead) => (
            <li key={lead.id} className="rounded-lg border border-gray-200 bg-gray-50 p-2">
              <p className="text-[11px] text-gray-500">
                {new Date(lead.at).toLocaleString()} · {lead.site === 'draft' ? 'draft (preview)' : `site ${lead.site}`}
              </p>
              {Object.entries(lead.fields).map(([key, value]) => (
                <p key={key} className="break-words">
                  <b className="text-gray-700">{key}:</b> {value}
                </p>
              ))}
            </li>
          ))}
        </ul>
      </div>
    </details>
  )
}

export default LeadsPanel
