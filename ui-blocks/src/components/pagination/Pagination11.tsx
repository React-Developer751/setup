export default function Pagination11() {
  return (
    <nav aria-label="Page navigation example" className="flex items-center space-x-4">
      <ul className="flex -space-x-px text-sm">
        <li>
          <a href="#" className="flex items-center justify-center text-body bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading shadow-xs font-medium leading-5 rounded-s-base text-sm px-3 h-9 focus:outline-none">Previous</a>
        </li>
        <li>
          <a href="#" className="flex items-center justify-center text-body bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading shadow-xs font-medium leading-5 text-sm w-9 h-9 focus:outline-none">1</a>
        </li>
        <li>
          <a href="#" className="flex items-center justify-center text-body bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading shadow-xs font-medium leading-5 text-sm w-9 h-9 focus:outline-none">2</a>
        </li>
        <li>
          <a href="#" aria-current="page" className="flex items-center justify-center text-fg-brand bg-neutral-tertiary-medium box-border border border-default-medium hover:text-fg-brand font-medium text-sm w-9 h-9 focus:outline-none">3</a>
        </li>
        <li>
          <a href="#" className="flex items-center justify-center text-body bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading shadow-xs font-medium leading-5 text-sm w-9 h-9 focus:outline-none">4</a>
        </li>
        <li>
          <a href="#" className="flex items-center justify-center text-body bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading shadow-xs font-medium leading-5 text-sm w-9 h-9 focus:outline-none">5</a>
        </li>
        <li>
          <a href="#" className="flex items-center justify-center text-body bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading shadow-xs font-medium leading-5 rounded-e-base text-sm px-3 h-9 focus:outline-none">Next</a>
        </li>
      </ul>
      <form className="mx-auto">
        <div className="flex items-center space-x-2">
            <label htmlFor="visitors" className="text-sm font-medium text-body shrink-0">Go to</label>
            <input type="text" id="visitors" className="bg-neutral-secondary-medium w-10 border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block px-2.5 py-2 shadow-xs placeholder:text-body" placeholder="99" required />
            <span className="text-sm font-medium text-body">page</span>
        </div>
      </form>
    </nav>
  )
}
