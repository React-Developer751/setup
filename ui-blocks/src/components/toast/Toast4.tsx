export default function Toast4() {
  return (
    <div id="toast-undo" className="flex items-center w-full max-w-xs p-4 text-body bg-neutral-primary-soft rounded-base shadow-xs border border-default" role="alert">
        <div className="text-sm font-normal">
           Conversation archived.
        </div>
        <div className="flex items-center ms-auto space-x-2 rtl:space-x-reverse">
            <a className="text-sm font-medium text-fg-brand hover:underline" href="#">Undo</a>
            <button type="button" className="ms-auto flex items-center justify-center text-body hover:text-heading bg-transparent box-border border border-transparent hover:bg-neutral-secondary-medium focus:ring-4 focus:ring-neutral-tertiary font-medium leading-5 rounded text-sm h-8 w-8 focus:outline-none" data-dismiss-target="#toast-undo" aria-label="Close">
                <span className="sr-only">Close</span>
                <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 17.94 6M18 18 6.06 6" /></svg>
            </button>
        </div>
    </div>
  )
}
