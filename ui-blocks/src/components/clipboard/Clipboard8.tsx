export default function Clipboard8() {
  return (
    <div className="w-full max-w-md bg-neutral-primary-soft border border-default shadow-xs rounded-base p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-heading mb-4">Contact details</h2>
        <address className="relative bg-neutral-secondary-medium p-4 rounded-base border border-default-medium font-italic grid grid-cols-2">
            <div className="space-y-2 text-body leading-loose hidden sm:block">
                Name <br />
                Email <br />
                Phone Number
            </div>
            <div id="contact-details" className="space-y-2 text-heading font-medium leading-loose">
                Bonnie Green <br />
                name@flowbite.com <br />
                + 12 345 67890
            </div>
            <button data-copy-to-clipboard-target="contact-details" data-copy-to-clipboard-content-type="textContent" data-tooltip-target="tooltip-contact-details" className="absolute end-2 top-2 text-body hover:bg-neutral-quaternary hover:text-heading rounded-base p-2 inline-flex items-center justify-center">
                <span id="default-icon-contact-details">
                    <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-6 5h6m-6 4h6M10 3v4h4V3h-4Z" /></svg>
                </span>
                <span id="success-icon-contact-details" className="hidden">
                    <svg className="w-4 h-4 text-fg-brand" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-6 7 2 2 4-4m-5-9v4h4V3h-4Z" /></svg>
                </span>
            </button>
            <div id="tooltip-contact-details" role="tooltip" className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-dark rounded-base shadow-xs opacity-0 tooltip">
                <span id="default-tooltip-message-contact-details">Copy to clipboard</span>
                <span id="success-tooltip-message-contact-details" className="hidden">Copied!</span>
                <div className="tooltip-arrow" data-popper-arrow></div>
            </div>
        </address>
    </div>
  )
}
