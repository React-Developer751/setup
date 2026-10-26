export default function Toast7() {
  return (
    <div id="toast-interactive" className="w-full space-y-4 max-w-xs p-3 text-body bg-neutral-primary-soft rounded-base shadow-xs border border-default" role="alert">
        <div className="flex">
            <div className="inline-flex items-center justify-center shrink-0 w-9 h-9 text-fg-brand bg-neutral-primary-medium rounded">
                <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h3a3 3 0 0 0 0-6h-.025a5.56 5.56 0 0 0 .025-.5A5.5 5.5 0 0 0 7.207 9.021C7.137 9.017 7.071 9 7 9a4 4 0 1 0 0 8h2.167M12 19v-9m0 0-2 2m2-2 2 2" /></svg>
                <span className="sr-only">Refresh icon</span>
            </div>
            <div className="ms-3 text-sm font-normal text-body">
                <span className="mb-1 text-base font-medium text-heading">Update available</span>
                <div className="mb-3">A new software version is available for download.</div> 
                <div className="grid grid-cols-2 gap-3">
                    <button type="button" data-dismiss-target="#toast-interactive" className="w-full text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium leading-5 rounded-base text-xs px-3 py-1.5 focus:outline-none">Not now</button>
                    <button type="button" className="w-full inline-flex items-center justify-center text-white bg-brand hover:bg-brand-strong box-border border border-transparent focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-xs px-3 py-1.5 focus:outline-none">
                        <svg className="w-3.5 h-3.5 me-1.5 -ms-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 13V4M7 14H5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-2m-1-5-4 5-4-5m9 8h.01" /></svg>
                        Update
                    </button> 
                </div>    
            </div>
        </div>
    </div>
  )
}
