
<form class="max-w-[13rem] mx-auto">
    <label for="time" class="block mb-2 text-sm font-medium text-heading">Select time:</label>
    <div class="flex">
        <input type="time" id="time" class="rounded-none rounded-s-lg flex-1 block w-full p-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body" min="09:00" max="18:00" value="00:00" required>
        <button id="dropdown-duration-button" data-dropdown-toggle="dropdown-duration" class="border-s-0 shrink-0 z-10 inline-flex items-center text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none" type="button">
         Duration 
         <svg class="w-4 h-4 -me-0.5 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7"/></svg>
        </button>
        <div id="dropdown-duration" class="z-10 hidden bg-neutral-primary-medium border border-default-medium rounded-base shadow-lg w-40">
            <ul class="p-2 text-sm text-body font-medium" aria-labelledby="dropdown-duration-button">
                <li>
                    <button type="button" class="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded" role="menuitem">
                        30 minutes
                    </button>
                </li>
                <li>
                    <button type="button" class="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded" role="menuitem">
                        1 hour
                    </button>
                </li>
                <li>
                    <button type="button" class="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded" role="menuitem">
                        2 hours
                    </button>
                </li>
            </ul>
        </div>
    </div>
</form>
