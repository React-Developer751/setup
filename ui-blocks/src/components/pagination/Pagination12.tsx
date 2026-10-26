export default function Pagination12() {
  return (
    <nav aria-label="Page navigation example">
      <form className="mx-auto flex items-center space-x-3">
        <div className="flex items-center space-x-2">
            <label htmlFor="visitors" className="text-sm font-medium text-heading shrink-0">Go to</label>
            <input type="text" id="visitors" className="bg-neutral-secondary-medium w-10 border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block px-2.5 py-2 shadow-xs placeholder:text-body" placeholder="99" />
            <span className="text-sm font-medium text-heading">page</span>
        </div>
        <button type="submit" className="text-white bg-brand hover:bg-brand-strong box-border border border-transparent focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-3 py-2 focus:outline-none">Go</button>
      </form>
    </nav>
  )
}
