
<div class="flex items-center justify-center w-full">
  <div class="flex flex-col items-center justify-center w-full h-64 bg-neutral-secondary-medium border border-dashed border-default-strong rounded-base">
    <div class="flex flex-col items-center justify-center text-body pt-5 pb-6">
      <svg class="w-8 h-8 mb-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v9m-5 0H5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-2M8 9l4-5 4 5m1 8h.01"/></svg>
      <p class="mb-2 text-sm">Click the button below to upload</p>
      <p class="text-xs mb-4">Max. File Size: <span class="font-semibold">30MB</span></p>
      <!-- Upload Button -->
      <button type="button" onclick="document.getElementById('dropzone-file-2').click()" class="inline-flex items-center text-white bg-brand hover:bg-brand-strong box-border border border-transparent focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-3 py-2 focus:outline-none">
        <svg class="w-4 h-4 me-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"/></svg>
        Browse file
      </button>
    </div>
  </div>
  <!-- Hidden File Input (Outside Label) -->
  <input id="dropzone-file-2" type="file" class="hidden" />
</div>
