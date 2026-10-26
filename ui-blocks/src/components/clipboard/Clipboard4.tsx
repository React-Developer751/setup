export default function Clipboard4() {
  return (
    <div className="w-full max-w-sm">
      <label htmlFor="website-url" className="block mb-2.5 text-sm font-medium text-heading">Verify your website:</label>
      <div className="flex items-stretch rounded-base shadow-xs">
        {/* Prefix */}
        <span className="shrink-0 z-10 inline-flex items-center px-3 py-2.5 text-sm text-body bg-neutral-tertiary border border-default-medium border-e-0 rounded-s-base">URL</span>
        {/* Input */}
        <div className="relative w-full">
          <input id="website-url" type="text" aria-describedby="helper-text-explanation" className="bg-neutral-secondary-medium border border-default-medium border-e-0 text-body text-sm focus:ring-brand focus:border-brand block w-full px-3 py-2.5 placeholder:text-body" defaultValue="https://flowbite.com" readOnly disabled />
        </div>
        {/* Button */}
        <button data-tooltip-target="tooltip-website-url" data-copy-to-clipboard-target="website-url" type="button" className="shrink-0 z-10 inline-flex items-center justify-center text-white bg-brand hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium font-medium rounded-e-base text-sm px-4 py-2.5 focus:outline-none border border-brand border-s-0">
          <span id="default-icon">
            <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-3 5h3m-6 0h.01M12 16h3m-6 0h.01M10 3v4h4V3h-4Z" /></svg>
          </span>
          <span id="success-icon" className="hidden">
            <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-6 7 2 2 4-4m-5-9v4h4V3h-4Z" /></svg>
          </span>
        </button>
        {/* Tooltip */}
        <div id="tooltip-website-url" role="tooltip" className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-dark rounded-base shadow-xs opacity-0 tooltip">
          <span id="default-tooltip-message">Copy link</span>
          <span id="success-tooltip-message" className="hidden">Copied!</span>
          <div className="tooltip-arrow" data-popper-arrow></div>
        </div>
      </div>
      <p id="helper-text-explanation" className="mt-2.5 text-sm text-body">Security certificate is required for approval</p>
    </div>
  )
}
