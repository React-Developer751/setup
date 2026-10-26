export default function Toast9() {
  return (
    <div id="toast-interactive" className="w-full space-y-4 max-w-xs p-4 text-body bg-neutral-primary-soft rounded-base shadow-xs border border-default" role="alert">
        <div className="inline-flex items-center justify-center shrink-0 w-9 h-9 text-fg-brand bg-neutral-primary-medium rounded">
            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h3a3 3 0 0 0 0-6h-.025a5.56 5.56 0 0 0 .025-.5A5.5 5.5 0 0 0 7.207 9.021C7.137 9.017 7.071 9 7 9a4 4 0 1 0 0 8h2.167M12 19v-9m0 0-2 2m2-2 2 2" /></svg>
            <span className="sr-only">Refresh icon</span>
        </div>
        <div className="text-sm font-normal text-body">
            <span className="mb-1 text-base font-medium text-heading">Uploading in progress</span>
            <div className="mb-4 mt-1">Please wait while your file is being uploaded. This may take a moment.</div> 
            <div className="flex items-center space-x-2 mb-4">
                <div className="w-full bg-neutral-quaternary rounded-full h-1.5">
                    <div className="bg-brand h-1.5 rounded-full" style={{ width: '75%' }}></div>
                </div>
                <div className="text-xs font-medium text-heading">75%</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <button type="button" className="w-full text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium leading-5 rounded-base text-xs px-3 py-1.5 focus:outline-none">Cancel upload</button>
                <button type="button" className="w-full inline-flex items-center justify-center text-white bg-brand hover:bg-brand-strong box-border border border-transparent focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-xs px-3 py-1.5 focus:outline-none">
                    Go to uploads
                </button> 
            </div>    
        </div>
    </div>
  )
}
