
<div class="w-[16rem]">
    <button id="selectTimeToggle" data-collapse-toggle="time-range-container" type="button" class="text-fg-brand text-base font-medium hover:underline p-0 inline-flex items-center mb-2">Select time 
      <svg class="w-5 h-5 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
         <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7"/>
      </svg>
    </button>
    <div id="time-range-container" class="max-w-[16rem] mx-auto grid grid-cols-2 gap-4 mb-2 hidden">
        <div>
        <label for="start-time-3" class="block mb-2 text-sm font-medium text-heading">Start time:</label>
        <div class="relative">
            <div class="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
               <svg class="w-4 h-4 text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
            </div>
            <input type="time" id="start-time-3" class="block w-full p-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body" min="09:00" max="18:00" value="00:00" required />
        </div>
    </div>
    <div>
        <label for="end-time-3" class="block mb-2 text-sm font-medium text-heading">End time:</label>
        <div class="relative">
            <div class="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
               <svg class="w-4 h-4 text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
            </div>
            <input type="time" id="end-time-3" class="block w-full p-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body" min="09:00" max="18:00" value="00:00" required />
        </div>
    </div>
    </div>
</div>
