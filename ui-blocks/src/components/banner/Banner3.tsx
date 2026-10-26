export default function Banner3() {
  return (
    <div id="marketing-banner" tabIndex={-1} className="fixed z-50 flex flex-col md:flex-row justify-between w-[calc(100%-2rem)] p-4 -translate-x-1/2 bg-neutral-primary-soft border border-default rounded-base shadow-xs lg:max-w-7xl left-1/2 top-6">
        <div className="flex flex-col items-start mb-3 me-4 md:items-center md:flex-row md:mb-0">
            <a href="https://flowbite.com/" className="flex items-center mb-2 border-default md:pe-4 md:me-4 md:border-e md:mb-0">
                <img src="https://flowbite.com/docs/images/logo.svg" className="h-6 me-2" alt="Flowbite Logo" />
                <span className="text-heading self-center text-lg font-semibold whitespace-nowrap">Flowbite</span>
            </a>
            <p className="flex items-center text-sm font-normal text-body">Build websites even faster with components on top of Tailwind</p>
        </div>
        <div className="flex items-center shrink-0">
            <button type="button" className="text-white bg-brand hover:bg-brand-strong box-border border border-transparent focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-xs px-3 py-1.5 focus:outline-none me-2">Sign Up</button>
            <button data-dismiss-target="#marketing-banner" type="button" className="hidden shrink-0 md:inline-flex justify-center text-sm w-7 h-7 items-center text-body hover:bg-neutral-tertiary hover:text-heading rounded-sm">
                <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 17.94 6M18 18 6.06 6" /></svg>
                <span className="sr-only">Close banner</span>
            </button>
            <button type="button" className="md:hidden text-body bg-neutral-primary-soft border border-default hover:bg-neutral-secondary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary-soft shadow-xs font-medium leading-5 rounded-base text-xs px-3 py-1.5 focus:outline-none">Close</button>
        </div>
    </div>
  )
}
