export default function Banner1() {
  return (
    <div id="sticky-banner" tabIndex={-1} className="fixed top-0 start-0 z-50 flex justify-between w-full p-4 border-b border-default bg-neutral-primary-soft">
        <div className="flex items-center mx-auto">
            <p className="flex items-center text-sm font-normal text-body">
                <span className="inline-flex items-center justify-center w-6 h-6 shrink-0 me-2.5 bg-neutral-tertiary rounded-full">
                    <svg className="w-3.5 h-3.5 text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 9H5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h6m0-6v6m0-6 5.419-3.87A1 1 0 0 1 18 5.942v12.114a1 1 0 0 1-1.581.814L11 15m7 0a3 3 0 0 0 0-6M6 15h3v5H6v-5Z" /></svg>
                    <span className="sr-only">Bullhorn</span>
                </span>
                <span>New brand identity has been launched for the <a href="https://flowbite.com" className="inline font-medium text-fg-brand underline hover:no-underline">Flowbite Library</a></span>
            </p>
        </div>
        <div className="flex items-center">
            <button data-dismiss-target="#sticky-banner" type="button" className="shrink-0 inline-flex justify-center text-sm w-7 h-7 items-center text-body hover:bg-neutral-tertiary hover:text-heading rounded-sm">
                <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 17.94 6M18 18 6.06 6" /></svg>
                <span className="sr-only">Close banner</span>
            </button>
        </div>
    </div>
  )
}
