export default function Clipboard2() {
  return (
    <div className="w-full max-w-[16rem]">
        <div className="relative">
            <label htmlFor="npm-install-copy-button" className="sr-only">Label</label>
            <input id="npm-install-copy-button" type="text" className="col-span-6 bg-neutral-secondary-medium border border-default-medium text-body text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" defaultValue="npm install flowbite" disabled readOnly />
            <button data-copy-to-clipboard-target="npm-install-copy-button" data-tooltip-target="tooltip-copy-npm-install-copy-button" className="absolute end-2 top-1/2 -translate-y-1/2 text-body hover:bg-neutral-quaternary rounded p-1.5 inline-flex items-center justify-center">
                <span id="default-icon">
                    <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-6 5h6m-6 4h6M10 3v4h4V3h-4Z" /></svg>
                </span>
                <span id="success-icon" className="hidden">
                    <svg className="w-4 h-4 text-fg-brand" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-6 7 2 2 4-4m-5-9v4h4V3h-4Z" /></svg>
                </span>
            </button>
            <div id="tooltip-copy-npm-install-copy-button" role="tooltip" className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-dark rounded-base shadow-xs opacity-0 tooltip">
                <span id="default-tooltip-message">Copy to clipboard</span>
                <span id="success-tooltip-message" className="hidden">Copied!</span>
                <div className="tooltip-arrow" data-popper-arrow></div>
            </div>
        </div>
    </div>
  )
}
