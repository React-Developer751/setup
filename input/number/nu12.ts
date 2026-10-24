
<form class="max-w-xs mx-auto">
    <label for="bedrooms-input" class="sr-only">Choose bedrooms number:</label>
    <div class="relative flex items-center mb-2">
        <button type="button" id="decrement-button" data-input-counter-decrement="bedrooms-input" class="text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary font-medium leading-5 rounded-s-base text-sm px-3 focus:outline-none h-10">
            <svg class="w-4 h-4 text-heading" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14"/></svg>
        </button>
        <input type="text" id="bedrooms-input" data-input-counter data-input-counter-min="1" data-input-counter-max="5" class="border-x-0 h-10 placeholder:text-heading text-heading text-center w-full bg-neutral-secondary-medium border-default-medium py-2.5 placeholder:text-body block pb-6 text-xs" placeholder="" value="2" required />
        <div class="absolute bottom-1 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 flex items-center text-xs text-body space-x-1 rtl:space-x-reverse">
            <svg class="w-3 h-3 text-body-subtle" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 17v2M12 5.5V10m-6 7v2m15-2v-4c0-1.6569-1.3431-3-3-3H6c-1.65685 0-3 1.3431-3 3v4h18Zm-2-7V8c0-1.65685-1.3431-3-3-3H8C6.34315 5 5 6.34315 5 8v2h14Z"/>
            </svg>
            <span>Bedrooms</span>
        </div>
        <button type="button" id="increment-button" data-input-counter-increment="bedrooms-input" class="text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary font-medium leading-5 rounded-e-base text-sm px-3 focus:outline-none h-10">
            <svg class="w-4 h-4 text-heading" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7 7V5"/></svg>
        </button>
    </div>
    <label for="nights-input" class="sr-only">Choose number of nights:</label>
    <div class="relative flex items-center mb-2">
        <button type="button" id="decrement-button" data-input-counter-decrement="nights-input" class="text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary font-medium leading-5 rounded-s-base text-sm px-3 focus:outline-none h-10">
            <svg class="w-4 h-4 text-heading" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14"/></svg>
        </button>
        <input type="text" id="nights-input" data-input-counter data-input-counter-min="1" data-input-counter-max="30" class="border-x-0 h-10 placeholder:text-heading text-heading text-center w-full bg-neutral-secondary-medium border-default-medium py-2.5 placeholder:text-body block pb-6 text-xs" placeholder="" value="7" required />
        <div class="absolute bottom-1 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 flex items-center text-xs text-body space-x-1 rtl:space-x-reverse">
            <svg class="w-3 h-3 text-body-subtle" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 10h16m-8-3V4M7 7V4m10 3V4M5 20h14a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Zm3-7h.01v.01H8V13Zm4 0h.01v.01H12V13Zm4 0h.01v.01H16V13Zm-8 4h.01v.01H8V17Zm4 0h.01v.01H12V17Zm4 0h.01v.01H16V17Z"/>
            </svg>
            <span>Night stays</span>
        </div>
        <button type="button" id="increment-button" data-input-counter-increment="nights-input" class="text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary font-medium leading-5 rounded-e-base text-sm px-3 focus:outline-none h-10">
            <svg class="w-4 h-4 text-heading" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7 7V5"/></svg>
        </button>
    </div>
    <label for="guests-input" class="sr-only">Choose guests:</label>
    <div class="relative flex items-center">
        <button type="button" id="decrement-button" data-input-counter-decrement="guests-input" class="text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary font-medium leading-5 rounded-s-base text-sm px-3 focus:outline-none h-10">
            <svg class="w-4 h-4 text-heading" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14"/></svg>
        </button>
        <input type="text" id="guests-input" data-input-counter data-input-counter-min="1" data-input-counter-max="5" class="border-x-0 h-10 placeholder:text-heading text-heading text-center w-full bg-neutral-secondary-medium border-default-medium py-2.5 placeholder:text-body block pb-6 text-xs" placeholder="" value="3" required />
        <div class="absolute bottom-1 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 flex items-center text-xs text-body space-x-1 rtl:space-x-reverse">
            <svg class="w-3 h-3 text-body-subtle" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M4.5 17H4a1 1 0 0 1-1-1 3 3 0 0 1 3-3h1m0-3.05A2.5 2.5 0 1 1 9 5.5M19.5 17h.5a1 1 0 0 0 1-1 3 3 0 0 0-3-3h-1m0-3.05a2.5 2.5 0 1 0-2-4.45m.5 13.5h-7a1 1 0 0 1-1-1 3 3 0 0 1 3-3h3a3 3 0 0 1 3 3 1 1 0 0 1-1 1Zm-1-9.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"/>
            </svg>
            <span>Guests</span>
        </div>
        <button type="button" id="increment-button" data-input-counter-increment="guests-input" class="text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary font-medium leading-5 rounded-e-base text-sm px-3 focus:outline-none h-10">
            <svg class="w-4 h-4 text-heading" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7 7V5"/></svg>
        </button>
    </div>
</form>
