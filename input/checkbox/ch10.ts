
<button id="dropdownSearchButton" data-dropdown-toggle="dropdownSearch" type="button" class="inline-flex items-center text-white bg-brand box-border border border-transparent hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">
    Dropdown search
    <svg class="w-4 h-4 ms-1.5 -me-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7"/></svg>
</button>
<!-- Dropdown menu -->
<div id="dropdownSearch" class="z-10 bg-neutral-primary-medium border border-default-medium rounded-base shadow-lg w-60 block">
    <div class="px-2 pt-2">
      <label for="input-group-search" class="sr-only">Search</label>
      <div class="relative">
        <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
            <svg class="w-4 h-4 text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"/></svg>
        </div>
        <input type="text" id="input-group-1" class="block w-full ps-9 pe-3 py-2.5 bg-neutral-secondary-strong border border-default-strong text-heading text-sm rounded focus:ring-brand focus:border-brand px-2.5 py-2 placeholder:text-body" placeholder="Search user">
      </div>
    </div>
    <ul class="h-48 select-none overflow-y-auto p-2 text-sm text-body font-medium" aria-labelledby="dropdownSearchButton">
      <li>
        <div class="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded-md">
          <input id="checkbox-item-11" type="checkbox" value="" class="w-4 h-4 border border-default-strong rounded-xs bg-neutral-secondary-strong focus:ring-2 focus:ring-brand-soft">
          <label for="checkbox-item-11" class="w-full ms-2 text-sm font-medium text-heading">Bonnie Green</label>
        </div>
      </li>
      <li>
        <div class="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded-md">
            <input checked id="checkbox-item-12" type="checkbox" value="" class="w-4 h-4 border border-default-strong rounded-xs bg-neutral-secondary-strong focus:ring-2 focus:ring-brand-soft">
            <label for="checkbox-item-12" class="w-full ms-2 text-sm font-medium text-heading">Jese Leos</label>
          </div>
      </li>
      <li>
        <div class="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded-md">
          <input id="checkbox-item-13" type="checkbox" value="" class="w-4 h-4 border border-default-strong rounded-xs bg-neutral-secondary-strong focus:ring-2 focus:ring-brand-soft">
          <label for="checkbox-item-13" class="w-full ms-2 text-sm font-medium text-heading">Michael Gough</label>
        </div>
      </li>
      <li>
        <div class="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded-md">
          <input id="checkbox-item-14" type="checkbox" value="" class="w-4 h-4 border border-default-strong rounded-xs bg-neutral-secondary-strong focus:ring-2 focus:ring-brand-soft">
          <label for="checkbox-item-14" class="w-full ms-2 text-sm font-medium text-heading">Robert Wall</label>
        </div>
      </li>
      <li>
        <div class="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded-md">
          <input id="checkbox-item-15" type="checkbox" value="" class="w-4 h-4 border border-default-strong rounded-xs bg-neutral-secondary-strong focus:ring-2 focus:ring-brand-soft">
          <label for="checkbox-item-15" class="w-full ms-2 text-sm font-medium text-heading">Joseph Mcfall</label>
        </div>
      </li>
      <li>
        <div class="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded-md">
          <input id="checkbox-item-16" type="checkbox" value="" class="w-4 h-4 border border-default-strong rounded-xs bg-neutral-secondary-strong focus:ring-2 focus:ring-brand-soft">
          <label for="checkbox-item-16" class="w-full ms-2 text-sm font-medium text-heading">Leslie Livingston</label>
        </div>
      </li>
            <li>
        <div class="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded-md">
          <input id="checkbox-item-17" type="checkbox" value="" class="w-4 h-4 border border-default-strong rounded-xs bg-neutral-secondary-strong focus:ring-2 focus:ring-brand-soft">
          <label for="checkbox-item-17" class="w-full ms-2 text-sm font-medium text-heading">Roberta Casas</label>
        </div>
      </li>
    </ul>
    <div class="p-2">
        <button type="button" class="inline-flex items-center justify-center text-white bg-danger box-border border border-transparent hover:bg-danger-strong focus:ring-4 focus:ring-danger-medium shadow-xs font-medium leading-5 rounded w-full text-xs px-3 py-1.5 focus:outline-none">
        <svg class="w-4 h-4 me-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12h4M4 18v-1a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Zm8-10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg>
        Delete user
        </button>
    </div>
</div>
