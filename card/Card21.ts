

<div class="w-full bg-neutral-primary border border-default rounded-base shadow-xs">
    <div class="sm:hidden">
        <label for="tabs" class="sr-only">Select tab</label>
        <select id="tabs" class="bg-neutral-secondary-soft border-0 border-b border-default text-heading text-sm rounded-t-base focus:ring-brand block w-full p-2.5">
            <option>Statistics</option>
            <option>Services</option>
            <option>FAQ</option>
        </select>
    </div>
    <ul class="hidden text-sm font-medium text-center text-body divide-x divide-default rounded-base sm:flex rtl:divide-x-reverse" id="fullWidthTab" data-tabs-toggle="#fullWidthTabContent" role="tablist">
        <li class="w-full">
            <button id="stats-tab" data-tabs-target="#stats" type="button" role="tab" aria-controls="stats" aria-selected="true" class="inline-block w-full p-4 rounded-ss-base bg-neutral-secondary-soft hover:bg-neutral-tertiary focus:outline-none focus:bg-neutral-tertiary">Statistics</button>
        </li>
        <li class="w-full">
            <button id="about-tab" data-tabs-target="#about" type="button" role="tab" aria-controls="about" aria-selected="false" class="inline-block w-full p-4 bg-neutral-secondary-soft hover:bg-neutral-tertiary focus:outline-none focus:bg-neutral-tertiary">Services</button>
        </li>
        <li class="w-full">
            <button id="faq-tab" data-tabs-target="#faq" type="button" role="tab" aria-controls="faq" aria-selected="false" class="inline-block w-full p-4 rounded-se-base bg-neutral-secondary-soft hover:bg-neutral-tertiary focus:outline-none focus:bg-neutral-tertiary">FAQ</button>
        </li>
    </ul>
    <div id="fullWidthTabContent" class="border-t border-default">
        <div class="hidden p-4 rounded-base md:p-8" id="stats" role="tabpanel" aria-labelledby="stats-tab">
            <dl class="grid max-w-screen-xl grid-cols-2 gap-8 p-4 mx-auto text-heading sm:grid-cols-3 xl:grid-cols-6 sm:p-8">
                <div class="flex flex-col">
                    <dt class="mb-2 text-2xl font-semibold tracking-tight text-heading">73M+</dt>
                    <dd class="text-body">Developers</dd>
                </div>
                <div class="flex flex-col">
                    <dt class="mb-2 text-2xl font-semibold tracking-tight text-heading">100M+</dt>
                    <dd class="text-body">Public repositories</dd>
                </div>
                <div class="flex flex-col">
                    <dt class="mb-2 text-2xl font-semibold tracking-tight text-heading">1000s</dt>
                    <dd class="text-body">Open source projects</dd>
                </div>
            </dl>
        </div>
        <div class="hidden p-4 rounded-base md:p-8" id="about" role="tabpanel" aria-labelledby="about-tab">
            <h2 class="mb-5 text-2xl font-semibold tracking-tight text-heading">We invest in the world’s potential</h2>
            <!-- List -->
            <ul role="list" class="space-y-4 text-body">
                <li class="flex space-x-1.5 rtl:space-x-reverse items-center">
                    <svg class="w-4 h-4 text-fg-brand shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
                    <span class="leading-tight">Dynamic reports and dashboards</span>
                </li>
                <li class="flex space-x-2 rtl:space-x-reverse items-center">
                    <svg class="w-4 h-4 text-fg-brand shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
                    <span class="leading-tight">Templates for everyone</span>
                </li>
                <li class="flex space-x-2 rtl:space-x-reverse items-center">
                    <svg class="w-4 h-4 text-fg-brand shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
                    <span class="leading-tight">Development workflow</span>
                </li>
                <li class="flex space-x-2 rtl:space-x-reverse items-center">
                    <svg class="w-4 h-4 text-fg-brand shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
                    <span class="leading-tight">Limitless business automation</span>
                </li>
            </ul>
        </div>
        <div class="hidden p-4 rounded-base" id="faq" role="tabpanel" aria-labelledby="faq-tab">
            <div id="accordion-flush" data-accordion="collapse" data-active-classes="bg-neutral-primary text-heading" data-inactive-classes="text-body">
              <h2 id="accordion-flush-heading-1">
                <button type="button" class="flex items-center justify-between w-full py-5 font-medium rtl:text-right text-body border-b border-default gap-3" data-accordion-target="#accordion-flush-body-1" aria-expanded="true" aria-controls="accordion-flush-body-1">
                  <span>What is Flowbite?</span>
                  <svg data-accordion-icon class="w-5 h-5 rotate-180 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 15 7-7 7 7"/></svg>
                </button>
              </h2>
              <div id="accordion-flush-body-1" class="hidden" aria-labelledby="accordion-flush-heading-1">
                <div class="py-5 border-b border-default text-body">
                  <p class="mb-2">Flowbite is an open-source library of interactive components built on top of Tailwind CSS including buttons, dropdowns, modals, navbars, and more.</p>
                  <p>Check out this guide to learn how to <a href="/docs/getting-started/introduction/" class="text-fg-brand hover:underline">get started</a> and start developing websites even faster with components on top of Tailwind CSS.</p>
                </div>
              </div>
              <h2 id="accordion-flush-heading-2">
                <button type="button" class="flex items-center justify-between w-full py-5 font-medium rtl:text-right text-body border-b border-default gap-3" data-accordion-target="#accordion-flush-body-2" aria-expanded="false" aria-controls="accordion-flush-body-2">
                  <span>Is there a Figma file available?</span>
                  <svg data-accordion-icon class="w-5 h-5 rotate-180 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 15 7-7 7 7"/></svg>
                </button>
              </h2>
              <div id="accordion-flush-body-2" class="hidden" aria-labelledby="accordion-flush-heading-2">
                <div class="py-5 border-b border-default text-body">
                  <p class="mb-2">Flowbite is first conceptualized and designed using the Figma software so everything you see in the library has a design equivalent in our Figma file.</p>
                  <p>Check out the <a href="https://flowbite.com/figma/" class="text-fg-brand hover:underline">Figma design system</a> based on the utility classes from Tailwind CSS and components from Flowbite.</p>
                </div>
              </div>
              <h2 id="accordion-flush-heading-3">
                <button type="button" class="flex items-center justify-between w-full py-5 font-medium rtl:text-right text-body border-b border-default gap-3" data-accordion-target="#accordion-flush-body-3" aria-expanded="false" aria-controls="accordion-flush-body-3">
                  <span>What are the differences between Flowbite and Tailwind UI?</span>
                  <svg data-accordion-icon class="w-5 h-5 rotate-180 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 15 7-7 7 7"/></svg>
                </button>
              </h2>
              <div id="accordion-flush-body-3" class="hidden" aria-labelledby="accordion-flush-heading-3">
                <div class="py-5 text-body border-b border-default">
                  <p class="mb-2">The main difference is that the core components from Flowbite are open source under the MIT license, whereas Tailwind UI is a paid product. Another difference is that Flowbite relies on smaller and standalone components, whereas Tailwind UI offers sections of pages.</p>
                  <p class="mb-2">However, we actually recommend using both Flowbite, Flowbite Pro, and even Tailwind UI as there is no technical reason stopping you from using the best of two worlds.</p>
                  <p class="mb-2">Learn more about these technologies:</p>
                  <ul class="ps-5 list-disc">
                    <li><a href="https://flowbite.com/pro/" class="text-fg-brand hover:underline">Flowbite Pro</a></li>
                    <li><a href="https://tailwindui.com/" rel="nofollow" class="text-fg-brand hover:underline">Tailwind UI</a></li>
                  </ul>
                </div>
              </div>
            </div>
        </div>
    </div>
</div>
