export default function Pagination8() {
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
            Previous
          </button>
          {/* Next Button */}
          <button type="button" className="inline-flex items-center text-body bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading shadow-xs font-medium leading-5 rounded-e-base text-sm px-3 py-2 focus:outline-none">
            Next
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
            Previous
          </button>
          {/* Next Button */}
          <button type="button" className="inline-flex items-center text-body bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading shadow-xs font-medium leading-5 rounded-e-base text-sm px-4 py-2.5 focus:outline-none">
            Next
          </button>
        </div>
      </div>
    </>
  )
}
