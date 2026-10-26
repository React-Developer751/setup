export default function Pagination6() {
  return (
    <>
      <div className="flex space-x-2">
        {/* Previous Button */}
        <a href="#" className="text-body bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading shadow-xs font-medium leading-5 rounded-base text-sm px-3 py-2 focus:outline-none">
          Previous
        </a>

        {/* Next Button */}
        <a href="#" className="text-body bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading shadow-xs font-medium leading-5 rounded-base text-sm px-3 py-2 focus:outline-none">
          Next
        </a>
      </div>

      <div className="flex space-x-2">
        {/* Previous Button */}
        <a href="#" className="text-body bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">
          Previous
        </a>

        {/* Next Button */}
        <a href="#" className="text-body bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">
          Next
        </a>
      </div>
    </>
  )
}
