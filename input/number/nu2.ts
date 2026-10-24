
<form class="max-w-sm mx-auto">
    <label for="zip-input" class="block mb-2.5 text-sm font-medium text-heading">ZIP code:</label>
    <div class="relative">
        <div class="absolute inset-y-0 start-0 top-0 flex items-center ps-3.5 pointer-events-none">
            <svg class="w-4 h-4 text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.8 13.938h-.011a7 7 0 1 0-11.464.144h-.016l.14.171c.1.127.2.251.3.371L12 21l5.13-6.248c.194-.209.374-.429.54-.659l.13-.155Z"/></svg>
        </div>
        <input type="text" id="zip-input" aria-describedby="helper-text-explanation" class="block w-full ps-9 pe-3 py-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body" placeholder="12345 or 12345-6789" pattern="^\d{5}(-\d{4})?$" required />
    </div>
    <p id="helper-text-explanation" class="mt-2.5 text-sm text-body">Please select a 5 digit number from 0 to 9.</p>
</form>
