
<div class="w-full max-w-sm">
  <label for="website-url" class="block mb-2.5 text-sm font-medium text-heading">Verify your website:</label>
  <div class="flex items-stretch rounded-base shadow-xs">
    <!-- Prefix -->
    <span class="shrink-0 z-10 inline-flex items-center px-3 py-2.5 text-sm text-body bg-neutral-tertiary border border-default-medium border-e-0 rounded-s-base">URL</span>
    <!-- Input -->
    <div class="relative w-full">
      <input id="website-url" type="text" aria-describedby="helper-text-explanation" class="bg-neutral-secondary-medium border border-default-medium border-e-0 text-body text-sm focus:ring-brand focus:border-brand block w-full px-3 py-2.5 placeholder:text-body" value="https://flowbite.com" readonly disabled />
    </div>
    <!-- Button -->
    <button data-tooltip-target="tooltip-website-url" data-copy-to-clipboard-target="website-url" type="button" class="shrink-0 z-10 inline-flex items-center justify-center text-white bg-brand hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium font-medium rounded-e-base text-sm px-4 py-2.5 focus:outline-none border border-brand border-s-0">
      <span id="default-icon">
        <svg class="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-3 5h3m-6 0h.01M12 16h3m-6 0h.01M10 3v4h4V3h-4Z" /></svg>
      </span>
      <span id="success-icon" class="hidden">
        <svg class="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-6 7 2 2 4-4m-5-9v4h4V3h-4Z" /></svg>
      </span>
    </button>
    <!-- Tooltip -->
    <div id="tooltip-website-url" role="tooltip"
      class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-dark rounded-base shadow-xs opacity-0 tooltip">
      <span id="default-tooltip-message">Copy link</span>
      <span id="success-tooltip-message" class="hidden">Copied!</span>
      <div class="tooltip-arrow" data-popper-arrow></div>
    </div>
  </div>
  <p id="helper-text-explanation" class="mt-2.5 text-sm text-body">Security certificate is required for approval</p>
</div>
