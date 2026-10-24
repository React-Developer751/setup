
<!-- drawer init and show -->
<div class="text-center">
   <button class="text-white bg-brand box-border border border-transparent hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none" type="button" data-drawer-target="drawer-timepicker" data-drawer-show="drawer-timepicker" aria-controls="drawer-timepicker">
   Set time schedule
   </button>
</div>
<!-- drawer component -->
<div id="drawer-timepicker" class="fixed top-0 left-0 z-40 h-screen p-4 overflow-y-auto transition-transform -translate-x-full bg-neutral-primary-soft w-96" tabindex="-1" aria-labelledby="drawer-timepicker-label">
   <div class="border-b border-default pb-4 mb-5 flex items-center">
      <h5 id="drawer-label" class="inline-flex items-center text-lg font-medium text-body">
         <svg class="w-5 h-5 me-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
         <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
         Time schedule
      </h5>
      <button type="button" data-drawer-hide="drawer-timepicker" aria-controls="drawer-timepicker" class="text-body bg-transparent hover:text-heading hover:bg-neutral-tertiary rounded-base w-9 h-9 absolute top-2.5 end-2.5 flex items-center justify-center">
         <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6"/></svg>
         <span class="sr-only">Close menu</span>
      </button>
   </div>
   <form>
      <div class="rounded-lg border border-default-medium bg-neutral-secondary-medium p-4 mb-6">
         <div class="flex justify-between items-center mb-3">
            <span class="text-heading text-base font-medium">Business hours</span>
            <label class="inline-flex items-center cursor-pointer">
            <input type="checkbox" value="" class="sr-only peer">
            <div class="relative w-9 h-5 bg-neutral-quaternary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-soft dark:peer-focus:ring-brand-soft rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-buffer after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand"></div>
            <span class="sr-only select-none">Business hours</span>
            </label>
         </div>
         <p class="text-sm text-body font-normal">Enable or disable business working hours for all weekly working days</p>
      </div>
      <div class="pb-6 mb-6 border-b border-default">
           <label for="timezone" class="block mb-2.5 text-sm font-medium text-heading">Select a timezone</label>
            <select id="timezone" class="block w-full px-3 py-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand px-3 py-2.5 shadow-xs placeholder:text-body">
            <option selected value>Choose a timezone</option>
            <option value="America/New_York">EST (Eastern Standard Time) - GMT-5 (New York)</option>
            <option value="America/Los_Angeles">PST (Pacific Standard Time) - GMT-8 (Los Angeles)</option>
            <option value="Europe/London">GMT (Greenwich Mean Time) - GMT+0 (London)</option>
            <option value="Europe/Paris">CET (Central European Time) - GMT+1 (Paris)</option>
            <option value="Asia/Tokyo">JST (Japan Standard Time) - GMT+9 (Tokyo)</option>
            <option value="Australia/Sydney">AEDT (Australian Eastern Daylight Time) - GMT+11 (Sydney)</option>
            <option value="Canada/Mountain">MST (Mountain Standard Time) - GMT-7 (Canada)</option>
            <option value="Canada/Central">CST (Central Standard Time) - GMT-6 (Canada)</option>
            <option value="Canada/Eastern">EST (Eastern Standard Time) - GMT-5 (Canada)</option>
            <option value="Europe/Berlin">CET (Central European Time) - GMT+1 (Berlin)</option>
            <option value="Asia/Dubai">GST (Gulf Standard Time) - GMT+4 (Dubai)</option>
            <option value="Asia/Singapore">SGT (Singapore Standard Time) - GMT+8 (Singapore)</option>
            </select>
      </div>
      <div class="mb-6">
         <div class="flex items-center justify-between">
            <div class="flex items-center min-w-[4rem]">
               <input checked id="monday" name="days" type="checkbox" value="monday" class="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft">
               <label for="monday" class="ms-2 text-sm font-medium text-heading">Mon</label>
            </div>
            <div class="w-full max-w-[7rem]">
               <label for="start-time-monday" class="sr-only">Sart time:</label>
               <div class="relative">
                  <div class="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
                        <svg class="w-4 h-4 text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
                  </div>
                  <input type="time" id="start-time-monday" class="block w-full p-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body" min="09:00" max="18:00" value="00:00" required />
               </div>
            </div>
            <div class="w-full max-w-[7rem]">
               <label for="end-time-monday" class="sr-only">End time:</label>
               <div class="relative">
                  <div class="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
                        <svg class="w-4 h-4 text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
                  </div>
                  <input type="time" id="end-time-monday" class="block w-full p-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body" min="09:00" max="18:00" value="00:00" required />
               </div>
            </div>
            <div>
               <button type="button" class="inline-flex items-center p-1.5 text-sm font-medium text-center rounded-base focus:outline-none text-body hover:bg-neutral-tertiary hover:text-heading">
<svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"/>
</svg>

                  <span class="sr-only">Delete</span>
               </button>
            </div>
         </div>
      </div>
      <div class="mb-6">
         <div class="flex items-center justify-between">
            <div class="flex items-center min-w-[4rem]">
               <input id="tuesday" name="days" type="checkbox" value="tuesday" class="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft">
               <label for="tuesday" class="ms-2 text-sm font-medium text-heading">Tue</label>
            </div>
            <div class="w-full max-w-[7rem]">
               <label for="start-time-tuesday" class="sr-only">Start time:</label>
               <div class="relative">
                  <div class="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
<svg class="w-4 h-4 text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
                  </div>
                  <input type="time" id="start-time-tuesday" name="start-time-tuesday" class="block w-full p-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body" min="09:00" max="18:00" value="00:00" required />
               </div>
            </div>
            <div class="w-full max-w-[7rem]">
               <label for="end-time-tuesday" class="sr-only">End time:</label>
               <div class="relative">
                  <div class="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
<svg class="w-4 h-4 text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
                  </div>
                  <input type="time" id="end-time-tuesday" name="end-time-tuesday" class="block w-full p-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body" min="09:00" max="18:00" value="00:00" required />
               </div>
            </div>
            <div>
               <button type="button" class="inline-flex items-center p-1.5 text-sm font-medium text-center rounded-base focus:outline-none text-body hover:bg-neutral-tertiary hover:text-heading">
<svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"/>
</svg>

                  <span class="sr-only">Delete</span>
               </button>
            </div>
         </div>
      </div>
      <div class="mb-6">
         <div class="flex items-center justify-between">
            <div class="flex items-center min-w-[4rem]">
               <input checked id="wednesday" name="days" type="checkbox" value="wednesday" class="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft">
               <label for="wednesday" class="ms-2 text-sm font-medium text-heading">Wed</label>
            </div>
            <div class="w-full max-w-[7rem]">
               <label for="start-time-wednesday" class="sr-only">Start time:</label>
               <div class="relative">
                  <div class="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
<svg class="w-4 h-4 text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
                  </div>
                  <input type="time" id="start-time-wednesday" name="start-time-wednesday" class="block w-full p-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body" min="09:00" max="18:00" value="00:00" required />
               </div>
            </div>
            <div class="w-full max-w-[7rem]">
               <label for="end-time-wednesday" class="sr-only">End time:</label>
               <div class="relative">
                  <div class="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
<svg class="w-4 h-4 text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
                  </div>
                  <input type="time" id="end-time-wednesday" name="end-time-wednesday" class="block w-full p-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body" min="09:00" max="18:00" value="00:00" required />
               </div>
            </div>
            <div>
               <button type="button" class="inline-flex items-center p-1.5 text-sm font-medium text-center rounded-base focus:outline-none text-body hover:bg-neutral-tertiary hover:text-heading">
<svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"/>
</svg>

                  <span class="sr-only">Delete</span>
               </button>
            </div>
         </div>
      </div>
      <div class="mb-6">
         <div class="flex items-center justify-between">
            <div class="flex items-center min-w-[4rem]">
               <input id="thursday" name="days" type="checkbox" value="thursday" class="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft">
               <label for="thursday" class="ms-2 text-sm font-medium text-heading">Thu</label>
            </div>
            <div class="w-full max-w-[7rem]">
               <label for="start-time-thursday" class="sr-only">Start time:</label>
               <div class="relative">
                  <div class="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
<svg class="w-4 h-4 text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
                  </div>
                  <input type="time" id="start-time-thursday" name="start-time-thursday" class="block w-full p-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body" min="09:00" max="18:00" value="00:00" required />
               </div>
            </div>
            <div class="w-full max-w-[7rem]">
               <label for="end-time-thursday" class="sr-only">End time:</label>
               <div class="relative">
                  <div class="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
<svg class="w-4 h-4 text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
                  </div>
                  <input type="time" id="end-time-thursday" name="end-time-thursday" class="block w-full p-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body" min="09:00" max="18:00" value="00:00" required />
               </div>
            </div>
            <div>
               <button type="button" class="inline-flex items-center p-1.5 text-sm font-medium text-center rounded-base focus:outline-none text-body hover:bg-neutral-tertiary hover:text-heading">
<svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"/>
</svg>

                  <span class="sr-only">Delete</span>
               </button>
            </div>
         </div>
      </div>
      <div class="mb-6">
         <div class="flex items-center justify-between">
            <div class="flex items-center min-w-[4rem]">
               <input id="friday" name="days" type="checkbox" value="friday" class="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft">
               <label for="friday" class="ms-2 text-sm font-medium text-heading">Fri</label>
            </div>
            <div class="w-full max-w-[7rem]">
               <label for="start-time-friday" class="sr-only">Start time:</label>
               <div class="relative">
                  <div class="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
<svg class="w-4 h-4 text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
                  </div>
                  <input type="time" id="start-time-friday" name="start-time-friday" class="block w-full p-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body" min="09:00" max="18:00" value="00:00" required />
               </div>
            </div>
            <div class="w-full max-w-[7rem]">
               <label for="end-time-friday" class="sr-only">End time:</label>
               <div class="relative">
                  <div class="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
<svg class="w-4 h-4 text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
                  </div>
                  <input type="time" id="end-time-friday" name="end-time-friday" class="block w-full p-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body" min="09:00" max="18:00" value="00:00" required />
               </div>
            </div>
            <div>
               <button type="button" class="inline-flex items-center p-1.5 text-sm font-medium text-center rounded-base focus:outline-none text-body hover:bg-neutral-tertiary hover:text-heading">
<svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"/>
</svg>

                  <span class="sr-only">Delete</span>
               </button>
            </div>
         </div>
      </div>
      <button type="button" class="inline-flex items-center justify-center w-full text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">
         <svg class="w-4 h-4 me-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7 7V5"/>
         </svg>
         Add interval
      </button>
      <div class="grid grid-cols-2 gap-4 bottom-4 left-0 w-full md:px-4 md:absolute">
         <button type="button" data-drawer-hide="drawer-timepicker" class="text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">Close</button>
         <button type="submit" class="text-white bg-brand box-border border border-transparent hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">
         Save all
         </button>
      </div>
   </form>
</div>
