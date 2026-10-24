
<form class="max-w-sm mx-auto">
    <div class="flex mb-2 space-x-2 rtl:space-x-reverse">
        <div>
            <label for="code-1" class="sr-only">First code</label>
            <input type="text" maxlength="1" data-focus-input-init data-focus-input-next="code-2" id="code-1" class="block bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand h-10 w-10 shadow-xs placeholder:text-body" required />
        </div>
        <div>
            <label for="code-2" class="sr-only">Second code</label>
            <input type="text" maxlength="1" data-focus-input-init data-focus-input-prev="code-1" data-focus-input-next="code-3" id="code-2" class="block bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand h-10 w-10 shadow-xs placeholder:text-body" required />
        </div>
        <div>
            <label for="code-3" class="sr-only">Third code</label>
            <input type="text" maxlength="1" data-focus-input-init data-focus-input-prev="code-2" data-focus-input-next="code-4" id="code-3" class="block bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand h-10 w-10 shadow-xs placeholder:text-body" required />
        </div>
        <div>
            <label for="code-4" class="sr-only">Fourth code</label>
            <input type="text" maxlength="1" data-focus-input-init data-focus-input-prev="code-3" data-focus-input-next="code-5" id="code-4" class="block bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand h-10 w-10 shadow-xs placeholder:text-body" required />
        </div>
        <div>
            <label for="code-5" class="sr-only">Fifth code</label>
            <input type="text" maxlength="1" data-focus-input-init data-focus-input-prev="code-4" data-focus-input-next="code-6" id="code-5" class="block bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand h-10 w-10 shadow-xs placeholder:text-body" required />
        </div>
        <div>
            <label for="code-6" class="sr-only">Sixth code</label>
            <input type="text" maxlength="1" data-focus-input-init data-focus-input-prev="code-5" id="code-6" class="block bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand h-10 w-10 shadow-xs placeholder:text-body" required />
        </div>
    </div>
    <p id="helper-text-explanation" class="mt-2.5 text-sm text-body">Please introduce the 6 digit code we sent via email.</p>
</form>
