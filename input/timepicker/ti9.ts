
<button type="button" data-modal-target="timepicker-modal" data-modal-toggle="timepicker-modal" class="inline-flex items-center justify-center text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">
   <svg class="w-4 h-4 me-1.5 -ms-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
   Schedule appointment
</button>

<!-- Main modal -->
<div id="timepicker-modal" tabindex="-1" aria-hidden="true" class="hidden overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full">
    <div class="relative p-4 w-full max-w-[23rem] max-h-full">
        <!-- Modal content -->
        <div class="relative bg-neutral-primary-soft rounded-base">
            <!-- Modal header -->
            <div class="flex items-center justify-between p-4 border-b rounded-t border-default">
                <h3 class="font-medium text-heading">
                    Schedule an appointment
                </h3>
               <button type="button" class="text-body bg-transparent hover:bg-neutral-tertiary hover:text-heading rounded-base text-sm w-9 h-9 ms-auto inline-flex justify-center items-center" data-modal-toggle="timepicker-modal">
                    <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6"/></svg>
                    <span class="sr-only">Close modal</span>
                </button>
            </div>
            <!-- Modal body -->
            <div class="p-4 pt-0">
                <div inline-datepicker datepicker-autoselect-today class="mx-auto sm:mx-0 flex justify-center my-5 [&>div>div]:shadow-none [&>div>div]:bg-neutral-secondary-soft [&_div>button]:bg-neutral-secondary-soft"></div>
                <label class="text-sm font-medium text-heading mb-2 block">
                Pick your time
                </label>
                <ul id="timetable" class="grid w-full grid-cols-3 gap-2 mb-5">
                    <li>
                        <input type="radio" id="10-am" value="" class="hidden peer" name="timetable">
                        <label for="10-am"
                        class="inline-flex items-center justify-center w-full p-2 text-sm font-medium text-center bg-neutral-primary-soft border rounded-base cursor-pointer text-fg-brand border-brand peer-checked:border-brand peer-checked:bg-brand hover:text-white peer-checked:text-white hover:bg-brand-strong">
                        10:00 AM
                        </label>
                    </li>
                    <li>
                        <input type="radio" id="10-30-am" value="" class="hidden peer" name="timetable">
                        <label for="10-30-am"
                        class="inline-flex items-center justify-center w-full p-2 text-sm font-medium text-center bg-neutral-primary-soft border rounded-base cursor-pointer text-fg-brand border-brand peer-checked:border-brand peer-checked:bg-brand hover:text-white peer-checked:text-white hover:bg-brand-strong">
                        10:30 AM
                        </label>
                    </li>
                    <li>
                        <input type="radio" id="11-am" value="" class="hidden peer" name="timetable">
                        <label for="11-am"
                        class="inline-flex items-center justify-center w-full p-2 text-sm font-medium text-center bg-neutral-primary-soft border rounded-base cursor-pointer text-fg-brand border-brand peer-checked:border-brand peer-checked:bg-brand hover:text-white peer-checked:text-white hover:bg-brand-strong">
                        11:00 AM
                        </label>
                    </li>
                    <li>
                        <input type="radio" id="11-30-am" value="" class="hidden peer" name="timetable">
                        <label for="11-30-am"
                        class="inline-flex items-center justify-center w-full p-2 text-sm font-medium text-center bg-neutral-primary-soft border rounded-base cursor-pointer text-fg-brand border-brand peer-checked:border-brand peer-checked:bg-brand hover:text-white peer-checked:text-white hover:bg-brand-strong">
                        11:30 AM
                        </label>
                    </li>
                    <li>
                        <input type="radio" id="12-am" value="" class="hidden peer" name="timetable" checked>
                        <label for="12-am"
                        class="inline-flex items-center justify-center w-full p-2 text-sm font-medium text-center bg-neutral-primary-soft border rounded-base cursor-pointer text-fg-brand border-brand peer-checked:border-brand peer-checked:bg-brand hover:text-white peer-checked:text-white hover:bg-brand-strong">
                        12:00 AM
                        </label>
                    </li>
                    <li>
                        <input type="radio" id="12-30-pm" value="" class="hidden peer" name="timetable">
                        <label for="12-30-pm"
                        class="inline-flex items-center justify-center w-full p-2 text-sm font-medium text-center bg-neutral-primary-soft border rounded-base cursor-pointer text-fg-brand border-brand peer-checked:border-brand peer-checked:bg-brand hover:text-white peer-checked:text-white hover:bg-brand-strong">
                        12:30 PM
                        </label>
                    </li>
                    <li>
                        <input type="radio" id="1-pm" value="" class="hidden peer" name="timetable">
                        <label for="1-pm"
                        class="inline-flex items-center justify-center w-full p-2 text-sm font-medium text-center bg-neutral-primary-soft border rounded-base cursor-pointer text-fg-brand border-brand peer-checked:border-brand peer-checked:bg-brand hover:text-white peer-checked:text-white hover:bg-brand-strong">
                        01:00 PM
                        </label>
                    </li>
                    <li>
                        <input type="radio" id="1-30-pm" value="" class="hidden peer" name="timetable">
                        <label for="1-30-pm"
                        class="inline-flex items-center justify-center w-full p-2 text-sm font-medium text-center bg-neutral-primary-soft border rounded-base cursor-pointer text-fg-brand border-brand peer-checked:border-brand peer-checked:bg-brand hover:text-white peer-checked:text-white hover:bg-brand-strong">
                        01:30 PM
                        </label>
                    </li>
                    <li>
                        <input type="radio" id="2-pm" value="" class="hidden peer" name="timetable">
                        <label for="2-pm"
                        class="inline-flex items-center justify-center w-full p-2 text-sm font-medium text-center bg-neutral-primary-soft border rounded-base cursor-pointer text-fg-brand border-brand peer-checked:border-brand peer-checked:bg-brand hover:text-white peer-checked:text-white hover:bg-brand-strong">
                        02:00 PM
                        </label>
                    </li>
                    <li>
                        <input type="radio" id="2-30-pm" value="" class="hidden peer" name="timetable">
                        <label for="2-30-pm"
                        class="inline-flex items-center justify-center w-full p-2 text-sm font-medium text-center bg-neutral-primary-soft border rounded-base cursor-pointer text-fg-brand border-brand peer-checked:border-brand peer-checked:bg-brand hover:text-white peer-checked:text-white hover:bg-brand-strong">
                        02:30 PM
                        </label>
                    </li>
                    <li>
                        <input type="radio" id="3-pm" value="" class="hidden peer" name="timetable">
                        <label for="3-pm"
                        class="inline-flex items-center justify-center w-full p-2 text-sm font-medium text-center bg-neutral-primary-soft border rounded-base cursor-pointer text-fg-brand border-brand peer-checked:border-brand peer-checked:bg-brand hover:text-white peer-checked:text-white hover:bg-brand-strong">
                        03:00 PM
                        </label>
                    </li>
                    <li>
                        <input type="radio" id="3-30-pm" value="" class="hidden peer" name="timetable">
                        <label for="3-30-pm"
                        class="inline-flex items-center justify-center w-full p-2 text-sm font-medium text-center bg-neutral-primary-soft border rounded-base cursor-pointer text-fg-brand border-brand peer-checked:border-brand peer-checked:bg-brand hover:text-white peer-checked:text-white hover:bg-brand-strong">
                        03:30 PM
                        </label>
                    </li>
                </ul>
                <div class="grid grid-cols-2 gap-2">
                    <button type="button" class="text-white bg-brand box-border border border-transparent hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">Save</button>
                    <button type="button" data-modal-hide="timepicker-modal" class="text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">Discard</button>
                </div>
            </div>
        </div>
    </div>
</div>
