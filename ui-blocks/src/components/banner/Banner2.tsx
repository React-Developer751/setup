export default function Banner2() {
  return (
    <div id="bottom-banner" tabIndex={-1} className="fixed bottom-0 start-0 z-50 flex justify-between w-full p-4 border-t border-default bg-neutral-primary-soft">
        <div className="flex items-center mx-auto">
            <p className="flex items-center text-sm font-normal text-body">
                <span className="inline-flex items-center justify-center w-6 h-6 shrink-0 me-2.5 bg-neutral-tertiary rounded-full">
                    <svg className="w-3.5 h-3.5 text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.891 15.107 15.11 8.89m-5.183-.52h.01m3.089 7.254h.01M14.08 3.902a2.849 2.849 0 0 0 2.176.902 2.845 2.845 0 0 1 2.94 2.94 2.849 2.849 0 0 0 .901 2.176 2.847 2.847 0 0 1 0 4.16 2.848 2.848 0 0 0-.901 2.175 2.843 2.843 0 0 1-2.94 2.94 2.848 2.848 0 0 0-2.176.902 2.847 2.847 0 0 1-4.16 0 2.85 2.85 0 0 0-2.176-.902 2.845 2.845 0 0 1-2.94-2.94 2.848 2.848 0 0 0-.901-2.176 2.848 2.848 0 0 1 0-4.16 2.849 2.849 0 0 0 .901-2.176 2.845 2.845 0 0 1 2.941-2.94 2.849 2.849 0 0 0 2.176-.901 2.847 2.847 0 0 1 4.159 0Z" /></svg>
                    <span className="sr-only">Discount</span>
                </span>
                <span>Get 5% commission per sale <a href="https://flowbite.com" className="flex items-center ms-0 text-sm font-medium text-fg-brand md:ms-1 md:inline-flex hover:underline">Become a partner
                    <svg className="w-4 h-4 ms-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m14 0-4 4m4-4-4-4" /></svg>
                    </a>
                </span>
            </p>
        </div>
        <div className="flex items-center">
            <button data-dismiss-target="#bottom-banner" type="button" className="shrink-0 inline-flex justify-center text-sm w-7 h-7 items-center text-body hover:bg-neutral-tertiary hover:text-heading rounded-sm">
                <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 17.94 6M18 18 6.06 6" /></svg>
                <span className="sr-only">Close banner</span>
            </button>
        </div>
    </div>
  )
}
