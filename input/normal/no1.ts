
<form>
    <div class="grid gap-6 mb-6 md:grid-cols-2">
        <div>
            <label for="first_name" class="block mb-2.5 text-sm font-medium text-heading">First name</label>
            <input type="text" id="first_name" class="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="John" required />
        </div>
        <div>
            <label for="last_name" class="block mb-2.5 text-sm font-medium text-heading">Last name</label>
            <input type="text" id="last_name" class="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="Doe" required />
        </div>
        <div>
            <label for="company" class="block mb-2.5 text-sm font-medium text-heading">Company</label>
            <input type="text" id="company" class="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="Flowbite" required />
        </div>  
        <div>
            <label for="phone" class="block mb-2.5 text-sm font-medium text-heading">Phone number</label>
            <input type="tel" id="phone" class="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="123-45-678" pattern="[0-9]{3}-[0-9]{2}-[0-9]{3}" required />
        </div>
        <div>
            <label for="website" class="block mb-2.5 text-sm font-medium text-heading">Website URL</label>
            <input type="url" id="website" class="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="flowbite.com" required />
        </div>
        <div>
            <label for="visitors" class="block mb-2.5 text-sm font-medium text-heading">Unique visitors (per month)</label>
            <input type="number" id="visitors" class="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="" required />
        </div>
    </div>
    <div class="mb-6">
        <label for="email" class="block mb-2.5 text-sm font-medium text-heading">Email address</label>
        <input type="email" id="email" class="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="john.doe@company.com" required />
    </div> 
    <div class="mb-6">
        <label for="password" class="block mb-2.5 text-sm font-medium text-heading">Password</label>
        <input type="password" id="password" class="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="•••••••••" required />
    </div> 
    <div class="mb-6">
        <label for="confirm_password" class="block mb-2.5 text-sm font-medium text-heading">Confirm password</label>
        <input type="password" id="confirm_password" class="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="•••••••••" required />
    </div> 
    <div class="flex items-start mb-6">
        <div class="flex items-center h-5">
        <input id="remember" type="checkbox" value="" class="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" required />
        </div>
        <label for="remember" class="ms-2 text-sm font-medium text-heading">I agree with the <a href="#" class="text-fg-brand hover:underline">terms and conditions</a>.</label>
    </div>
    <button type="submit" class="text-white bg-brand box-border border border-transparent hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">Submit</button>
</form>
