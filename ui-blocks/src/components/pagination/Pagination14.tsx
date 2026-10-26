export default function Pagination14() {
  return (
    <nav aria-label="Page navigation example">
      <div className="inline-flex rounded-base shadow-xs -space-x-px" role="group">
        <button data-tooltip-target="tooltip-previous" type="button" className="inline-flex items-center justify-center text-body bg-neutral-secondary-medium rounded-s-base box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-3 focus:ring-neutral-tertiary leading-5 w-9 h-9 focus:outline-none">
          <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m15 19-7-7 7-7" /></svg>
        </button>
        <div id="tooltip-previous" role="tooltip" className="absolute z-10 invisible inline-block px-3 py-2 text-sm leading-4 font-medium text-white transition-opacity duration-300 bg-dark rounded-base shadow-xs opacity-0 tooltip">
          Previous
          <div className="tooltip-arrow" data-popper-arrow></div>
        </div>
        <button type="button" className="inline-flex shrink-0 text-sm items-center justify-center text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading leading-5 px-3 h-9 focus:outline-none">
          1 of 99
        </button>
        <button data-tooltip-target="tooltip-next" type="button" className="inline-flex items-center justify-center text-body bg-neutral-secondary-medium rounded-e-base box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-3 focus:ring-neutral-tertiary leading-5 w-9 h-9 focus:outline-none">
          <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m9 5 7 7-7 7" /></svg>
        </button>
        <div id="tooltip-next" role="tooltip" className="absolute z-10 invisible inline-block px-3 py-2 text-sm leading-4 font-medium text-white transition-opacity duration-300 bg-dark rounded-base shadow-xs opacity-0 tooltip">
          Next
          <div className="tooltip-arrow" data-popper-arrow></div>
        </div>
      </div>
    </nav>
  )
}
