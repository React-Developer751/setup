

<form class="max-w-2xl mx-auto">
    <div class="flex shadow-xs rounded-base -space-x-0.5">
        <label for="search-dropdown-advanced" class="block mb-2.5 text-sm font-medium text-heading sr-only ">Your Email</label>
        <button id="dropdown-button-links" data-dropdown-toggle="dropdown-links" type="button" class="inline-flex items-center shrink-0 z-10 text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary font-medium leading-5 rounded-s-base text-sm px-4 py-2.5 focus:outline-none">
            http + https
            <svg class="w-4 h-4 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7"/></svg>
        </button>
        <div id="dropdown-links" class="z-10 hidden bg-neutral-primary-medium border border-default-medium rounded-base shadow-lg w-36">
            <ul class="p-2 text-sm text-body font-medium" aria-labelledby="dropdown-button-links">
                <li>
                    <a href="#" class="block p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded-md">http</a>
                </li>
                <li>
                    <a href="#" class="block p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded-md">https</a>
                </li>
                <li>
                    <a href="#" class="block p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded-md">http + https</a>
                </li>
            </ul>
        </div>
        <input type="search" id="search-dropdown-advanced" id="input-group-6" class="px-3 py-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm focus:ring-brand focus:border-brand block w-full placeholder:text-body" placeholder="Search for domain or URL" required>
        <button id="dropdown-button-links" data-dropdown-toggle="dropdown-domains" type="button" class="inline-flex items-center shrink-0 z-10 text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary font-medium leading-5 text-sm px-4 py-2.5 focus:outline-none">
            Subdomain
            <svg class="w-4 h-4 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7"/></svg>
        </button>
        <div id="dropdown-domains" class="z-10 hidden bg-neutral-primary-medium border border-default-medium rounded-base shadow-lg w-44">
            <ul class="p-2 text-sm text-body font-medium" aria-labelledby="dropdown-button-links">
                <li>
                    <a href="#" class="block p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded-md">Subdomain</a>
                </li>
                <li>
                    <a href="#" class="block p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded-md">Domain</a>
                </li>
                <li>
                    <a href="#" class="block p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded-md">Top-Level Domain</a>
                </li>
                <li>
                    <a href="#" class="block p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded-md">Root Domain</a>
                </li>
            </ul>
        </div>
        <button type="submit" class="inline-flex items-center  text-white bg-brand hover:bg-brand-strong box-border border border-transparent focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-e-base text-sm px-4 py-2.5 focus:outline-none">
        <svg class="w-4 h-4 me-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"/></svg>
        Search
        </button>
    </div>
</form>

