
<form>
    <label for="time" class="block mb-2 text-sm font-medium text-heading">Select time:</label>
    <div class="flex">
        <input type="time" id="time" class="rounded-none rounded-s-lg flex-1 block w-full p-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body" min="09:00" max="18:00" value="00:00" required>
        <select id="timezones" name="timezone" class="rounded-none border border-s-0 rounded-e-lg p-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body" required>
            <option value="America/New_York" selected>EST - GMT-5 (New York)</option>
            <option value="America/Los_Angeles">PST - GMT-8 (Los Angeles)</option>
            <option value="Europe/London">GMT - GMT+0 (London)</option>
            <option value="Europe/Paris">CET - GMT+1 (Paris)</option>
            <option value="Asia/Tokyo">JST - GMT+9 (Tokyo)</option>
            <option value="Australia/Sydney">AEDT - GMT+11 (Sydney)</option>
            <option value="Canada/Mountain">MST - GMT-7 (Canada)</option>
            <option value="Canada/Central">CST - GMT-6 (Canada)</option>
            <option value="Canada/Eastern">EST - GMT-5 (Canada)</option>
            <option value="Europe/Berlin">CET - GMT+1 (Berlin)</option>
            <option value="Asia/Dubai">GST - GMT+4 (Dubai)</option>
            <option value="Asia/Singapore">SGT - GMT+8 (Singapore)</option>
         </select>
    </div>
</form>
