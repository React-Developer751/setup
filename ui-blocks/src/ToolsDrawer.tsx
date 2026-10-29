import { useEffect, useRef, type ReactNode } from 'react'

// The tools of the studio (design settings, the business details, projects and export, what the generator understood) sit in one panel that slides over the
// preview, so the chat and the preview stay clean. Tabs, Esc and a click on the dark side close it.
export type ToolsPane = { id: string; label: string; content: ReactNode }

export function ToolsDrawer({ open, onClose, tab, onTab, panes }: { open: boolean; onClose: () => void; tab: string; onTab: (id: string) => void; panes: ToolsPane[] }) {
  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    // focus goes into the panel when it opens
    panel.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    // (closed: not reachable by keyboard or screen reader either, after the slide-out)
    <div className={`absolute inset-0 z-40 ${open ? '' : 'pointer-events-none'}`} style={{ visibility: open ? 'visible' : 'hidden', transition: open ? 'none' : 'visibility 0s 300ms' }} aria-hidden={!open}>
      <div onClick={onClose} className={`absolute inset-0 bg-stone-900/25 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Studio tools"
        tabIndex={-1}
        className={`absolute inset-y-0 right-0 flex w-full max-w-[460px] flex-col bg-[#fbf8f5] shadow-2xl outline-none ring-1 ring-black/10 transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-black/5 px-4 py-3">
          <div className="lv-pill-tabs" role="tablist" aria-label="Tools">
            {panes.map((pane) => (
              <button key={pane.id} type="button" role="tab" aria-selected={tab === pane.id} onClick={() => onTab(pane.id)}>
                {pane.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={onClose} aria-label="Close the tools" className="lv-btn lv-btn-ghost size-8 !rounded-full">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4" role="tabpanel">
          {/* every pane stays mounted (a form half filled is not lost when another tab is opened); only the open one is shown */}
          {panes.map((pane) => (
            <div key={pane.id} hidden={tab !== pane.id} className="space-y-4">
              {pane.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
