export default function Badge15() {
  return (
    <>
      <span id="badge-avatar-dismiss-brand" className="inline-flex items-center bg-brand-softer border border-brand-subtle text-fg-brand-strong text-xs font-medium ps-1.5 pe-0.5 py-0.5 rounded gap-1">
      <img className="w-3.5 h-3.5 rounded-full me-1" src="/docs/images/people/profile-picture-5.jpg" alt="Rounded avatar" />
      Brand
      <button type="button" className="inline-flex items-center p-0.5 text-sm bg-transparent rounded-xs hover:bg-brand-soft" data-dismiss-target="#badge-avatar-dismiss-brand" aria-label="Remove">
        <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 17.94 6M18 18 6.06 6" /></svg>
        <span className="sr-only">Remove badge</span>
      </button>
      </span>

      <span id="badge-avatar-dismiss-alternative" className="inline-flex items-center bg-neutral-primary-soft border border-default text-heading text-xs font-medium ps-1.5 pe-0.5 py-0.5 rounded gap-1">
      <img className="w-3.5 h-3.5 rounded-full me-1" src="/docs/images/people/profile-picture-5.jpg" alt="Rounded avatar" />
      Alternative
      <button type="button" className="inline-flex items-center p-0.5 text-sm bg-transparent rounded-xs hover:bg-neutral-tertiary" data-dismiss-target="#badge-avatar-dismiss-alternative" aria-label="Remove">
        <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 17.94 6M18 18 6.06 6" /></svg>
        <span className="sr-only">Remove badge</span>
      </button>
      </span>

      <span id="badge-avatar-dismiss-gray" className="inline-flex items-center bg-neutral-secondary-medium border border-default-medium text-heading text-xs font-medium ps-1.5 pe-0.5 py-0.5 rounded gap-1">
      <img className="w-3.5 h-3.5 rounded-full me-1" src="/docs/images/people/profile-picture-5.jpg" alt="Rounded avatar" />
      Gray
      <button type="button" className="inline-flex items-center p-0.5 text-sm bg-transparent rounded-xs hover:bg-neutral-quaternary" data-dismiss-target="#badge-avatar-dismiss-gray" aria-label="Remove">
        <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 17.94 6M18 18 6.06 6" /></svg>
        <span className="sr-only">Remove badge</span>
      </button>
      </span>

      <span id="badge-avatar-dismiss-danger" className="inline-flex items-center bg-danger-soft border border-danger-subtle text-fg-danger-strong text-xs font-medium ps-1.5 pe-0.5 py-0.5 rounded gap-1">
      <img className="w-3.5 h-3.5 rounded-full me-1" src="/docs/images/people/profile-picture-5.jpg" alt="Rounded avatar" />
      Danger
      <button type="button" className="inline-flex items-center p-0.5 text-sm bg-transparent rounded-xs hover:bg-danger-medium" data-dismiss-target="#badge-avatar-dismiss-danger" aria-label="Remove">
        <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 17.94 6M18 18 6.06 6" /></svg>
        <span className="sr-only">Remove badge</span>
      </button>
      </span>

      <span id="badge-avatar-dismiss-success" className="inline-flex items-center bg-success-soft border border-success-subtle text-fg-success-strong text-xs font-medium ps-1.5 pe-0.5 py-0.5 rounded gap-1">
      <img className="w-3.5 h-3.5 rounded-full me-1" src="/docs/images/people/profile-picture-5.jpg" alt="Rounded avatar" />
      Success
      <button type="button" className="inline-flex items-center p-0.5 text-sm bg-transparent rounded-xs hover:bg-success-medium" data-dismiss-target="#badge-avatar-dismiss-success" aria-label="Remove">
        <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 17.94 6M18 18 6.06 6" /></svg>
        <span className="sr-only">Remove badge</span>
      </button>
      </span>

      <span id="badge-avatar-dismiss-warning" className="inline-flex items-center bg-warning-soft border border-warning-subtle text-fg-warning text-xs font-medium ps-1.5 pe-0.5 py-0.5 rounded gap-1">
      <img className="w-3.5 h-3.5 rounded-full me-1" src="/docs/images/people/profile-picture-5.jpg" alt="Rounded avatar" />
      Warning
      <button type="button" className="inline-flex items-center p-0.5 text-sm bg-transparent rounded-xs hover:bg-warning-medium" data-dismiss-target="#badge-avatar-dismiss-warning" aria-label="Remove">
        <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 17.94 6M18 18 6.06 6" /></svg>
        <span className="sr-only">Remove badge</span>
      </button>
      </span>
    </>
  )
}
