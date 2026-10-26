export default function Toast6() {
  return (
    <div id="toast-notification" className="w-full space-y-4 max-w-xs p-3 text-body bg-neutral-primary-soft rounded-base shadow-xs border border-default" role="alert">
        <div className="flex items-center bg-neutral-tertiary py-2 px-2.5 rounded">
            <span className="text-sm font-medium text-heading">New notification</span>
        </div>
        <div className="flex">
            <div className="relative inline-block shrink-0">
                <img className="w-8 h-8 rounded-full" src="/docs/images/people/profile-picture-3.jpg" alt="Jese Leos image" />
            </div>
            <div className="ms-3 text-sm font-normal text-body">
                <div className="text-base font-medium text-heading">Bonnie Green</div>
                <div>commented on your photo</div> 
                <span className="text-xs text-fg-brand">a few seconds ago</span>   
            </div>
        </div>
        <div className="flex items-center space-x-3">
            <button type="button" data-dismiss-target="#toast-notification" className="w-full text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium leading-5 rounded-base text-xs px-3 py-1.5 focus:outline-none">Close</button>
            <button type="button" className="w-full inline-flex items-center justify-center text-white bg-brand hover:bg-brand-strong box-border border border-transparent focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-xs px-3 py-1.5 focus:outline-none">
                <svg className="w-3.5 h-3.5 me-1.5 -ms-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.5 8.046H11V6.119c0-.921-.9-1.446-1.524-.894l-5.108 4.49a1.2 1.2 0 0 0 0 1.739l5.108 4.49c.624.556 1.524.027 1.524-.893v-1.928h2a3.023 3.023 0 0 1 3 3.046V19a5.593 5.593 0 0 0-1.5-10.954Z" /></svg>
                Reply
            </button> 
        </div>
    </div>
  )
}
