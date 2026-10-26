export default function Clipboard7() {
  return (
    <div className="w-full max-w-lg bg-neutral-primary-soft border border-default shadow-xs rounded-base p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-heading mb-2">Create a role with read only in-line policies</h2>
        <p className="text-body mb-6">To give Flowbite read access, please create an IAM Role following <a href="#" className="text-fg-brand underline hover:no-underline font-medium">trust relationship</a> and <a href="#" className="text-fg-brand underline hover:no-underline font-medium">inline policy</a>.</p>
        <label htmlFor="account-id" className="block mb-2.5 text-sm font-medium text-heading mb-2 block">Flowbite account ID:</label>
        <div className="relative mb-4">
            <input id="account-id" type="text" className="col-span-6 bg-neutral-secondary-medium border border-default-medium text-body text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" defaultValue="756593826" disabled readOnly />
            <button data-copy-to-clipboard-target="account-id" data-tooltip-target="tooltip-account-id" className="absolute end-1.5 top-1/2 -translate-y-1/2 text-body hover:bg-neutral-quaternary hover:text-heading rounded p-2 inline-flex items-center justify-center">
                <span id="default-icon-account-id">
                    <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-6 5h6m-6 4h6M10 3v4h4V3h-4Z" /></svg>
                </span>
                <span id="success-icon-account-id" className="hidden">
                    <svg className="w-4 h-4 text-fg-brand" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-6 7 2 2 4-4m-5-9v4h4V3h-4Z" /></svg>
                </span>
            </button>
            <div id="tooltip-account-id" role="tooltip" className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-dark rounded-base shadow-xs opacity-0 tooltip">
                <span id="default-tooltip-message-account-id">Copy to clipboard</span>
                <span id="success-tooltip-message-account-id" className="hidden">Copied!</span>
                <div className="tooltip-arrow" data-popper-arrow></div>
            </div>
        </div>
        <label htmlFor="api-key" className="block mb-2.5 text-sm font-medium text-heading mb-2 block">API key:</label>
        <div className="relative mb-4">
            <input id="api-key" type="text" className="col-span-6 bg-neutral-secondary-medium border border-default-medium text-body text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" defaultValue="f4h6sd3t-jsy63ind-hsgdt7rs-jdhf76st" disabled readOnly />
            <button data-copy-to-clipboard-target="api-key" data-tooltip-target="tooltip-api-key" className="absolute end-1.5 top-1/2 -translate-y-1/2 text-body hover:bg-neutral-quaternary hover:text-heading rounded p-2 inline-flex items-center justify-center">
                <span id="default-icon-api-key">
                    <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-6 5h6m-6 4h6M10 3v4h4V3h-4Z" /></svg>
                </span>
                <span id="success-icon-api-key" className="hidden">
                    <svg className="w-4 h-4 text-fg-brand" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-6 7 2 2 4-4m-5-9v4h4V3h-4Z" /></svg>
                </span>
            </button>
            <div id="tooltip-api-key" role="tooltip" className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-dark rounded-base shadow-xs opacity-0 tooltip">
                <span id="default-tooltip-message-api-key">Copy to clipboard</span>
                <span id="success-tooltip-message-api-key" className="hidden">Copied!</span>
                <div className="tooltip-arrow" data-popper-arrow></div>
            </div>
        </div>
        <label htmlFor="role-arn" className="block mb-2.5 text-sm font-medium text-heading mb-2 block">Role ARN:</label>
        <div className="relative mb-6">
            <input id="role-arn" type="text" className="col-span-6 bg-neutral-secondary-medium border border-default-medium text-body text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" defaultValue="123456789012:user/Flowbite" disabled readOnly />
            <button data-copy-to-clipboard-target="role-arn" data-tooltip-target="tooltip-role-arn" className="absolute end-1.5 top-1/2 -translate-y-1/2 text-body hover:bg-neutral-quaternary hover:text-heading rounded p-2 inline-flex items-center justify-center">
                <span id="default-icon-role-arn">
                    <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-6 5h6m-6 4h6M10 3v4h4V3h-4Z" /></svg>
                </span>
                <span id="success-icon-role-arn" className="hidden">
                    <svg className="w-4 h-4 text-fg-brand" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-6 7 2 2 4-4m-5-9v4h4V3h-4Z" /></svg>
                </span>
            </button>
            <div id="tooltip-role-arn" role="tooltip" className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-dark rounded-base shadow-xs opacity-0 tooltip">
                <span id="default-tooltip-message-role-arn">Copy to clipboard</span>
                <span id="success-tooltip-message-role-arn" className="hidden">Copied!</span>
                <div className="tooltip-arrow" data-popper-arrow></div>
            </div>
        </div>
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <button type="button" className="text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">Cancel</button>
            <button type="button" className="text-white bg-brand box-border border border-transparent hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">Next step</button>
        </div>
    </div>
  )
}
