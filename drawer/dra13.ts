

<!-- drawer init and toggle -->
<div class="text-center">
   <button class="inline-flex items-center justify-center text-white bg-brand box-border border border-transparent hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none" type="button" data-drawer-target="drawer-swipe" data-drawer-show="drawer-swipe" data-drawer-placement="bottom" data-drawer-edge="true" data-drawer-edge-offset="bottom-[60px]" aria-controls="drawer-swipe">
   Show swipeable drawer
   </button>
</div>

<!-- drawer component -->
<div id="drawer-swipe" class="fixed z-40 w-full overflow-y-auto bg-neutral-primary-soft border-t border-default rounded-t-base transition-transform bottom-0 left-0 right-0 translate-y-full bottom-[60px]" tabindex="-1" aria-labelledby="drawer-swipe-label">
   <div class="p-4 cursor-pointer hover:bg-neutral-secondary-soft" data-drawer-toggle="drawer-swipe">
      <span class="absolute w-8 h-1 -translate-x-1/2 bg-neutral-quaternary rounded-lg top-3 left-1/2"></span>
      <h5 id="drawer-swipe-label" class="inline-flex items-center text-base text-body font-medium">
         <svg class="w-5 h-5 me-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 17h6m-3 3v-6M4.857 4h4.286c.473 0 .857.384.857.857v4.286a.857.857 0 0 1-.857.857H4.857A.857.857 0 0 1 4 9.143V4.857C4 4.384 4.384 4 4.857 4Zm10 0h4.286c.473 0 .857.384.857.857v4.286a.857.857 0 0 1-.857.857h-4.286A.857.857 0 0 1 14 9.143V4.857c0-.473.384-.857.857-.857Zm-10 10h4.286c.473 0 .857.384.857.857v4.286a.857.857 0 0 1-.857.857H4.857A.857.857 0 0 1 4 19.143v-4.286c0-.473.384-.857.857-.857Z"/></svg>
         Add widget
      </h5>
   </div>
   <div class="grid grid-cols-3 gap-4 p-4 lg:grid-cols-4">
      <div class="p-4 rounded-base cursor-pointer bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium">
         <div class="flex justify-center items-center p-2 mx-auto mb-2 bg-neutral-primary-strong border border-default-strong rounded-full w-12 h-12">
            <svg class="w-7 h-7 inline text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6.025A7.5 7.5 0 1 0 17.975 14H10V6.025Z"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.5 3c-.169 0-.334.014-.5.025V11h7.975c.011-.166.025-.331.025-.5A7.5 7.5 0 0 0 13.5 3Z"/></svg>
         </div>
         <div class="font-medium text-center text-body">Chart</div>
      </div>
      <div class="p-4 rounded-base cursor-pointer bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium">
         <div class="flex justify-center items-center p-2 mx-auto mb-2 bg-neutral-primary-strong border border-default-strong rounded-full w-12 h-12">
            <svg class="w-7 h-7 inline text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="2" d="M3 11h18M3 15h18M8 10.792V19m4-8.208V19m4-8.208V19M4 19h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Z"/></svg>
         </div>
         <div class="font-medium text-center text-body">Table</div>
      </div>
      <div class="hidden p-4 rounded-base cursor-pointer bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium lg:block">
         <div class="flex justify-center items-center p-2 mx-auto mb-2 bg-neutral-primary-strong border border-default-strong rounded-full w-12 h-12">
            <svg class="w-7 h-7 inline text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.5 12A2.5 2.5 0 0 1 21 9.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v2.5a2.5 2.5 0 0 1 0 5V17a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-2.5a2.5 2.5 0 0 1-2.5-2.5Z"/></svg>
         </div>
         <div class="hidden font-medium text-center text-body">Ticket</div>
      </div>
      <div class="p-4 rounded-base cursor-pointer bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium">
         <div class="flex justify-center items-center p-2 mx-auto mb-2 bg-neutral-primary-strong border border-default-strong rounded-full w-12 h-12">
            <svg class="w-7 h-7 inline text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6h8m-8 6h8m-8 6h8M4 16a2 2 0 1 1 3.321 1.5L4 20h5M4 5l2-1v6m-2 0h4"/></svg>
         </div>
         <div class="font-medium text-center text-body">List</div>
      </div>
      <div class="p-4 rounded-base cursor-pointer bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium">
         <div class="flex justify-center items-center p-2 mx-auto mb-2 bg-neutral-primary-strong border border-default-strong rounded-full w-12 h-12">
            <svg class="w-7 h-7 inline text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M8 7V6a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-1M3 18v-7a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Zm8-3.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"/></svg>
         </div>
         <div class="font-medium text-center text-body">Price</div>
      </div>
      <div class="p-4 rounded-base cursor-pointer bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium">
         <div class="flex justify-center items-center p-2 mx-auto mb-2 bg-neutral-primary-strong border border-default-strong rounded-full w-12 h-12">
            <svg class="w-7 h-7 inline text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M4.5 17H4a1 1 0 0 1-1-1 3 3 0 0 1 3-3h1m0-3.05A2.5 2.5 0 1 1 9 5.5M19.5 17h.5a1 1 0 0 0 1-1 3 3 0 0 0-3-3h-1m0-3.05a2.5 2.5 0 1 0-2-4.45m.5 13.5h-7a1 1 0 0 1-1-1 3 3 0 0 1 3-3h3a3 3 0 0 1 3 3 1 1 0 0 1-1 1Zm-1-9.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"/></svg>
         </div>
         <div class="font-medium text-center text-body">Users</div>
      </div>
      <div class="hidden p-4 rounded-base cursor-pointer bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium lg:block">
         <div class="flex justify-center items-center p-2 mx-auto mb-2 bg-neutral-primary-strong border border-default-strong rounded-full w-12 h-12">
            <svg class="w-7 h-7 inline text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-3 5h3m-6 0h.01M12 16h3m-6 0h.01M10 3v4h4V3h-4Z"/></svg>
         </div>
         <div class="font-medium text-center text-body">Task</div>
      </div>
      <div class="p-4 rounded-base cursor-pointer bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium">
         <div class="flex justify-center items-center p-2 mx-auto mb-2 bg-neutral-primary-strong border border-default-strong rounded-full w-12 h-12">
            <svg class="w-7 h-7 inline text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M6 4v10m0 0a2 2 0 1 0 0 4m0-4a2 2 0 1 1 0 4m0 0v2m6-16v2m0 0a2 2 0 1 0 0 4m0-4a2 2 0 1 1 0 4m0 0v10m6-16v10m0 0a2 2 0 1 0 0 4m0-4a2 2 0 1 1 0 4m0 0v2"/></svg>
         </div>
         <div class="font-medium text-center text-body">Custom</div>
      </div>
   </div>
</div>
