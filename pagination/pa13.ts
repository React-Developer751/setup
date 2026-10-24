

<nav aria-label="Page navigation example">
  <form class="mx-auto flex items-center space-x-3">
    <label for="countries" class="sr-only">Select an option</label>
    <select id="countries" class="block w-16 px-3 py-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm leading-4 rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body">
      <option selected>03</option>
      <option value="4">04</option>
      <option value="5">05</option>
      <option value="6">06</option>
      <option value="7">07</option>
      <option value="8">08</option>
      <option value="9">09</option>
      <option value="10">10</option>
    </select>
    <input type="text" id="visitors" class="bg-disabled w-28 border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block px-2.5 py-2 shadow-xs placeholder:text-fg-disabled" placeholder="of 99 pages" disabled/>
    <div class="inline-flex rounded-base shadow-xs -space-x-px" role="group">
      <button data-tooltip-target="tooltip-previous" type="button" class="inline-flex items-center justify-center text-body bg-neutral-secondary-medium rounded-s-base box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-3 focus:ring-neutral-tertiary leading-5 w-9 h-9 focus:outline-none">
        <svg class="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m15 19-7-7 7-7"/></svg>
      </button>
      <div id="tooltip-previous" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm leading-4 font-medium text-white transition-opacity duration-300 bg-dark rounded-base shadow-xs opacity-0 tooltip">
        Previous
        <div class="tooltip-arrow" data-popper-arrow></div>
      </div>
      <button data-tooltip-target="tooltip-next" type="button" class="inline-flex items-center justify-center text-body bg-neutral-secondary-medium rounded-e-base box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-3 focus:ring-neutral-tertiary leading-5 w-9 h-9 focus:outline-none">
        <svg class="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 5 7 7-7 7"/></svg>
      </button>
      <div id="tooltip-next" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm leading-4 font-medium text-white transition-opacity duration-300 bg-dark rounded-base shadow-xs opacity-0 tooltip">
        Next
        <div class="tooltip-arrow" data-popper-arrow></div>
      </div>
    </div>
  </form>
</nav>

