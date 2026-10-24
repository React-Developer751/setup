

<!-- drawer init and show -->
<div class="text-center">
   <button class="inline-flex items-center justify-center text-white bg-brand box-border border border-transparent hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none" type="button" data-drawer-target="drawer-form" data-drawer-show="drawer-form" aria-controls="drawer-form">
   Show drawer form
   </button>
</div>

<!-- drawer component -->
<div id="drawer-form" class="fixed top-0 left-0 z-40 h-screen p-4 overflow-y-auto transition-transform -translate-x-full bg-neutral-primary-soft w-80 border-e border-default" tabindex="-1" aria-labelledby="drawer-form-label">
   <div class="border-b border-default pb-4 mb-5 flex items-center">
      <h5 id="drawer-label-event" class="text-lg font-medium text-body">
         New event
      </h5>
      <button type="button" data-drawer-hide="drawer-form" aria-controls="drawer-form" class="text-body bg-transparent hover:text-heading hover:bg-neutral-tertiary rounded-base w-9 h-9 absolute top-2.5 end-2.5 flex items-center justify-center">
         <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6"/></svg>
         <span class="sr-only">Close menu</span>
      </button>
   </div>
   <form class="mb-6 space-y-4">
        <div>
            <label for="title" class="block mb-2.5 text-sm font-medium text-heading">Title<span class="ms-1 text-fg-danger">*</span></label>
            <input type="text" id="title" class="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="Apple Keynote" required />
        </div>
      <label for="description" class="block mb-2.5 text-sm font-medium text-heading">Description</label>
      <textarea id="description" rows="4" class="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full p-3.5 shadow-xs placeholder:text-body" placeholder="Write your description here..."></textarea>
      <div class="relative max-w-sm">
         <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
            <svg class="w-4 h-4 text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 10h16m-8-3V4M7 7V4m10 3V4M5 20h14a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Zm3-7h.01v.01H8V13Zm4 0h.01v.01H12V13Zm4 0h.01v.01H16V13Zm-8 4h.01v.01H8V17Zm4 0h.01v.01H12V17Zm4 0h.01v.01H16V17Z"/></svg>
         </div>
         <input datepicker id="default-datepicker" type="text" class="block w-full ps-9 pe-3 py-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="Select date">
      </div>
      <div class="mb-4">
         <label for="guests" class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Invite guests</label>
         <div class="relative">
            <input type="search" id="guests" class="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="Add guest email" required />
            <button class="absolute flex items-center end-1.5 top-1/2 -translate-y-1/2 text-body bg-neutral-primary-strong border border-default-strong hover:bg-neutral-secondary-strong/70 hover:text-heading focus:ring-4 focus:ring-neutral-tertiary-soft font-medium leading-5 rounded text-xs px-3 py-1.5 focus:outline-none">
               <span class="flex items-center">
                  <svg class="w-4 h-4 me-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12h4m-2 2v-4M4 18v-1a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Zm8-10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg>
                  <span class="text-xs font-semibold">Add</span>
               </span>
            </button>
         </div>
      </div>
      <div class="flex mb-4 -space-x-4 rtl:space-x-reverse">
         <img class="w-8 h-8 border-2 border-buffer-medium rounded-full" src="/docs/images/people/profile-picture-5.jpg" alt="">
         <img class="w-8 h-8 border-2 border-buffer-medium rounded-full" src="/docs/images/people/profile-picture-2.jpg" alt="">
         <img class="w-8 h-8 border-2 border-buffer-medium rounded-full" src="/docs/images/people/profile-picture-3.jpg" alt="">
         <img class="w-8 h-8 border-2 border-buffer-medium rounded-full" src="/docs/images/people/profile-picture-4.jpg" alt="">
      </div>
      <button type="submit" class="inline-flex items-center justify-center w-full text-white bg-brand box-border border border-transparent hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">
         <svg class="w-4 h-4 me-1.5 -ms-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M4 9.05H3v2h1v-2Zm16 2h1v-2h-1v2ZM10 14a1 1 0 1 0 0 2v-2Zm4 2a1 1 0 1 0 0-2v2Zm-3 1a1 1 0 1 0 2 0h-2Zm2-4a1 1 0 1 0-2 0h2Zm-2-5.95a1 1 0 1 0 2 0h-2Zm2-3a1 1 0 1 0-2 0h2Zm-7 3a1 1 0 0 0 2 0H6Zm2-3a1 1 0 1 0-2 0h2Zm8 3a1 1 0 1 0 2 0h-2Zm2-3a1 1 0 1 0-2 0h2Zm-13 3h14v-2H5v2Zm14 0v12h2v-12h-2Zm0 12H5v2h14v-2Zm-14 0v-12H3v12h2Zm0 0H3a2 2 0 0 0 2 2v-2Zm14 0v2a2 2 0 0 0 2-2h-2Zm0-12h2a2 2 0 0 0-2-2v2Zm-14-2a2 2 0 0 0-2 2h2v-2Zm-1 6h16v-2H4v2ZM10 16h4v-2h-4v2Zm3 1v-4h-2v4h2Zm0-9.95v-3h-2v3h2Zm-5 0v-3H6v3h2Zm10 0v-3h-2v3h2Z"/></svg>
         Create event
      </button>
   </form>
</div>
