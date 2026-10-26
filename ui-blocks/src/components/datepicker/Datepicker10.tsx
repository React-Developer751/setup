export default function Datepicker10() {
  return (
    <form className="max-w-[8rem] mx-auto">
        <label htmlFor="time" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Select time:</label>
        <div className="relative">
            <div className="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
                <svg className="w-4 h-4 text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
            </div>
            <input type="time" id="time" className="block w-full px-3 py-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand px-3 py-2.5 shadow-xs placeholder:text-body" min="09:00" max="18:00" defaultValue="00:00" required />
        </div>
    </form>
  )
}
