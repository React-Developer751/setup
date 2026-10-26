export default function Pagination9() {
  return (
    <>
      <div className="flex flex-col items-center">
        {/* Help text */}
        <span className="text-sm text-body">
            Showing <span className="font-semibold text-heading">1</span> to <span className="font-semibold text-heading">10</span> of <span className="font-semibold text-heading">100</span> Entries
        </span>
        {/* Buttons */}
        <div className="inline-flex mt-4 -space-x-px">
          {/* Previous Button */}
          <button type="button" className="inline-flex items-center text-body bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading shadow-xs font-medium leading-5 rounded-s-base text-sm px-3 py-2 focus:outline-none">
            <svg className="w-4 h-4 me-1.5 -ms-0.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12l4-4m-4 4 4 4" /></svg>
            Previous
          </button>
          {/* Next Button */}
          <button type="button" className="inline-flex items-center text-body bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading shadow-xs font-medium leading-5 rounded-e-base text-sm px-3 py-2 focus:outline-none">
            Next
            <svg className="w-4 h-4 ms-1.5 -me-0.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m14 0-4 4m4-4-4-4" /></svg>
          </button>
        </div>
      </div>
      <div className="flex flex-col items-center">
        {/* Help text */}
        <span className="text-sm text-body">
            Showing <span className="font-semibold text-heading">1</span> to <span className="font-semibold text-heading">10</span> of <span className="font-semibold text-heading">100</span> Entries
        </span>
        {/* Buttons */}
        <div className="inline-flex mt-4 -space-x-px">
          {/* Previous Button */}
          <button type="button" className="inline-flex items-center text-body bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading shadow-xs font-medium leading-5 rounded-s-base text-sm px-4 py-2.5 focus:outline-none">
            <svg className="w-4 h-4 me-1.5 -ms-0.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12l4-4m-4 4 4 4" /></svg>
            Previous
          </button>
          {/* Next Button */}
          <button type="button" className="inline-flex items-center text-body bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading shadow-xs font-medium leading-5 rounded-e-base text-sm px-4 py-2.5 focus:outline-none">
            Next
            <svg className="w-4 h-4 ms-1.5 -me-0.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m14 0-4 4m4-4-4-4" /></svg>
          </button>
        </div>
      </div>
    </>
  )
}
