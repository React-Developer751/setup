
<form class="max-w-sm mx-auto">
    <div class="mb-2.5 flex justify-between items-center">
        <label for="phone-numbers" class="text-sm font-medium text-heading">Primary phone number:</label>
        <a href="#" class="text-fg-brand text-xs font-medium hover:underline">Manage numbers</a>
    </div>
    <div class="flex items-center shadow-xs rounded-base">
        <div class="relative w-full">
            <select id="phone-numbers" aria-describedby="helper-text-explanation" class="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-s-base border-e-0 focus:ring-brand focus:border-brand block w-full px-3 py-2.5 placeholder:text-body">
                <option selected value="+1 234 456 7890">+1 234 456 7890</option>
                <option value="+1 456 234 7890">+1 456 234 7890</option>
                <option value="+1 432 621 3163">+1 432 621 3163</option>
            </select>
        </div>
        <button id="copy-number" data-copy-to-clipboard-target="phone-numbers" data-tooltip-target="tooltip-phone" class="shrink-0 z-10 flex items-center text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary font-medium leading-5 rounded-e-base text-sm px-4 h-[42px] focus:outline-none" type="button">
            <svg id="copy-icon" class="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-6 5h6m-6 4h6M10 3v4h4V3h-4Z"/></svg>
            <svg id="copy-icon-success" class="w-4 h-4 hidden" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-6 7 2 2 4-4m-5-9v4h4V3h-4Z"/></svg>
        </button>
        <div id="tooltip-phone" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-dark rounded-lg shadow-xs opacity-0 tooltip">
            <span id="tooltip-text">Copy number</span>
            <span id="tooltip-text-success" class="hidden">Copied!</span>
            <div class="tooltip-arrow" data-popper-arrow></div>
        </div>
    </div>
    <p id="helper-text-explanation" class="mt-2.5 text-sm text-body">Please set your primary phone number.</p>
</form>
