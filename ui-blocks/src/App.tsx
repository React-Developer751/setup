import { lazy, Suspense, useState } from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import GeneratorPage from './GeneratorPage'

// the catalogue of the 92 stored components is only needed when its tab is opened
const ComponentLibrary = lazy(() => import('./ComponentLibrary'))

const MODES = {
  generator: { label: 'Website Generator', Page: GeneratorPage },
  library: { label: 'Component Library', Page: ComponentLibrary },
} as const

type Mode = keyof typeof MODES

function App() {
  const [mode, setMode] = useState<Mode>('generator')
  const { Page } = MODES[mode]

  return (
    <div className="lv-shell flex h-screen flex-col">
      <div className="lv-bar relative z-10 flex shrink-0 items-center gap-3 px-4 py-2">
        <div className="flex items-center gap-2.5 pr-2">
          <span className="flex size-8 items-center justify-center rounded-xl text-white shadow-md" style={{ background: 'var(--lv-grad)' }} aria-hidden="true">
            <svg viewBox="0 0 24 24" className="size-4.5" fill="currentColor">
              <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2Zm7 11 .9 2.6 2.6.9-2.6.9L19 20l-.9-2.6-2.6-.9 2.6-.9L19 13Z" />
            </svg>
          </span>
          <span className="text-[15px] font-bold tracking-tight text-stone-900">Site Studio</span>
        </div>
        <div className="lv-pill-tabs" role="tablist" aria-label="Sections">
          {(Object.keys(MODES) as Mode[]).map((key) => (
            <button key={key} type="button" role="tab" aria-selected={mode === key} onClick={() => setMode(key)}>
              {MODES[key].label}
            </button>
          ))}
        </div>
      </div>
      <div className={mode === 'generator' ? 'flex min-h-0 flex-1 flex-col overflow-auto lg:overflow-hidden' : 'min-h-0 flex-1 overflow-auto'}>
        <ErrorBoundary key={mode}>
          <Suspense fallback={<p className="p-6 text-sm text-gray-500">Loading ...</p>}>
            <Page />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  )
}

export default App
