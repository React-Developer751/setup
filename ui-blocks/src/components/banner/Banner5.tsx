export default function Banner5() {
  return (
    <div id="informational-banner" tabIndex={-1} className="fixed top-0 start-0 z-50 flex flex-col justify-between w-full p-4 border-b border-default md:flex-row bg-neutral-secondary-soft">
        <div className="mb-4 md:mb-0 md:me-4">
            <h2 className="mb-1 text-base font-semibold text-heading">Integration is the key</h2>
            <p className="flex items-center text-sm font-normal text-body">You can integrate Flowbite with many tools to make your work even more efficient and lightning fast based on Tailwind.</p>
        </div>
        <div className="flex items-center shrink-0 space-x-2">
            <button type="button" className="text-white bg-brand hover:bg-brand-strong box-border border border-transparent focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-xs px-3 py-1.5 focus:outline-none">Sign Up</button>
            <button data-dismiss-target="#informational-banner" type="button" className="shrink-0 inline-flex justify-center text-sm w-7 h-7 items-center text-body hover:bg-neutral-tertiary hover:text-heading rounded-sm">
                <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 17.94 6M18 18 6.06 6" /></svg>
                <span className="sr-only">Close banner</span>
            </button>
        </div>
    </div>
  )
}
