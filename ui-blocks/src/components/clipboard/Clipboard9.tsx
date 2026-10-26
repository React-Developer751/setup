export default function Clipboard9() {
  return (
    <>
      <button type="button" data-modal-target="course-modal" data-modal-toggle="course-modal" className="inline-flex items-center text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">
          <svg className="w-4 h-4 me-1.5 -ms-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M7.926 10.898 15 7.727m-7.074 5.39L15 16.29M8 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm12 5.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm0-11a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" /></svg>
          Share course
      </button>

      {/* Main modal */}
      <div id="course-modal" tabIndex={-1} aria-hidden="true" className="hidden overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full">
          <div className="relative p-4 w-full max-w-lg max-h-full">
              {/* Modal content */}
              <div className="relative bg-neutral-primary-soft rounded-base shadow-xs border border-default">
                  {/* Modal header */}
                  <div className="flex items-center justify-between p-4 md:p-5">
                      <h3 className="text-lg text-heading font-medium">
                          Share course
                      </h3>
                      <button type="button" className="text-body bg-transparent hover:bg-neutral-tertiary-medium hover:text-heading rounded text-sm h-8 w-8 ms-auto inline-flex justify-center items-center" data-modal-toggle="course-modal">
                          <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 17.94 6M18 18 6.06 6" /></svg>
                          <span className="sr-only">Close modal</span>
                      </button>
                  </div>
                  {/* Modal body */}
                  <div className="px-4 pb-4 md:px-5 md:pb-5">
                      <label htmlFor="course-url" className="block mb-2.5 text-sm font-medium text-heading">Share the course link below with your friends:</label>
                      <div className="relative mb-4">
                          <input id="course-url" type="text" className="col-span-6 bg-neutral-secondary-medium border border-default-medium text-body text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" defaultValue="https://flowbite.com/docs/components/alerts/" disabled readOnly />
                          <button data-copy-to-clipboard-target="course-url" data-tooltip-target="tooltip-course-url" className="absolute end-1.5 top-1/2 -translate-y-1/2 text-body bg-neutral-secondary-medium hover:bg-neutral-quaternary hover:text-heading rounded p-2 inline-flex items-center justify-center">
                              <span id="default-icon-course-url">
                                  <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-6 5h6m-6 4h6M10 3v4h4V3h-4Z" /></svg>
                              </span>
                              <span id="success-icon-course-url" className="hidden">
                                  <svg className="w-4 h-4 text-fg-brand" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-6 7 2 2 4-4m-5-9v4h4V3h-4Z" /></svg>
                              </span>
                          </button>
                          <div id="tooltip-course-url" role="tooltip" className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-dark rounded-base shadow-xs opacity-0 tooltip">
                              <span id="default-tooltip-message-course-url">Copy to clipboard</span>
                              <span id="success-tooltip-message-course-url" className="hidden">Copied!</span>
                              <div className="tooltip-arrow" data-popper-arrow></div>
                          </div>
                      </div>
                      <button type="button" data-modal-hide="course-modal" className="inline-flex items-center text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">Close</button>
                  </div>
              </div>
          </div>
      </div>
    </>
  )
}
