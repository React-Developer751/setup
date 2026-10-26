export default function SpeedDial3() {
  return (
    <>
      <div data-dial-init className="fixed bottom-6 end-24 group">
          <div id="speed-dial-menu-text-inside-button" className="flex flex-col items-center hidden mb-4 space-y-2">
              <button type="button" className="w-[56px] h-[56px] text-body hover:text-heading bg-neutral-primary-soft rounded-full border border-default shadow-xs hover:bg-neutral-secondary-medium hover:border-default-medium focus:ring-4 focus:ring-neutral-secondary-soft focus:outline-none">
                  <svg className="w-4 h-4 mx-auto mb-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M7.926 10.898 15 7.727m-7.074 5.39L15 16.29M8 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm12 5.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm0-11a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" /></svg>
                  <span className="block mb-px text-xs font-medium">Share</span>
              </button>
              <button type="button" className="w-[56px] h-[56px] text-body hover:text-heading bg-neutral-primary-soft rounded-full border border-default shadow-xs hover:bg-neutral-secondary-medium hover:border-default-medium focus:ring-4 focus:ring-neutral-secondary-soft focus:outline-none">
                  <svg className="w-4 h-4 mx-auto mb-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinejoin="round" strokeWidth="2" d="M16.444 18H19a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h2.556M17 11V5a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v6h10ZM7 15h10v4a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-4Z" /></svg>
                  <span className="block mb-px text-xs font-medium">Print</span>
              </button>
              <button type="button" className="w-[56px] h-[56px] text-body hover:text-heading bg-neutral-primary-soft rounded-full border border-default shadow-xs hover:bg-neutral-secondary-medium hover:border-default-medium focus:ring-4 focus:ring-neutral-secondary-soft focus:outline-none">
                  <svg className="w-4 h-4 mx-auto mb-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M11 16h2m6.707-9.293-2.414-2.414A1 1 0 0 0 16.586 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7.414a1 1 0 0 0-.293-.707ZM16 20v-6a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v6h8ZM9 4h6v3a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V4Z" /></svg>
                  <span className="block mb-px text-xs font-medium">Save</span>
              </button>
              <button type="button" className="w-[56px] h-[56px] text-body hover:text-heading bg-neutral-primary-soft rounded-full border border-default shadow-xs hover:bg-neutral-secondary-medium hover:border-default-medium focus:ring-4 focus:ring-neutral-secondary-soft focus:outline-none">
                  <svg className="w-4 h-4 mx-auto mb-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinejoin="round" strokeWidth="2" d="M14 4v3a1 1 0 0 1-1 1h-3m4 10v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h2m11-3v10a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V7.87a1 1 0 0 1 .24-.65l2.46-2.87a1 1 0 0 1 .76-.35H18a1 1 0 0 1 1 1Z" /></svg>
                  <span className="block mb-px text-xs font-medium">Copy</span>
              </button>
          </div>
          <button type="button" data-dial-toggle="speed-dial-menu-text-inside-button" aria-controls="speed-dial-menu-text-inside-button" aria-expanded="false" className="flex items-center justify-center text-white bg-brand rounded-full w-14 h-14 hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium focus:outline-none">
              <svg className="w-5 h-5 transition-transform group-hover:rotate-45" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-7 7V5" /></svg>
              <span className="sr-only">Open actions menu</span>
          </button>
      </div>

      <div data-dial-init className="fixed end-6 bottom-6 group">
          <div id="speed-dial-menu-text-inside-button-square" className="flex flex-col items-center hidden mb-4 space-y-2">
              <button type="button" className="w-[56px] h-[56px] text-body hover:text-heading bg-neutral-primary-soft rounded-base border border-default shadow-xs hover:bg-neutral-secondary-medium hover:border-default-medium focus:ring-4 focus:ring-neutral-secondary-soft focus:outline-none">
                  <svg className="w-4 h-4 mx-auto mb-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M7.926 10.898 15 7.727m-7.074 5.39L15 16.29M8 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm12 5.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm0-11a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" /></svg>
                  <span className="block mb-px text-xs font-medium">Share</span>
              </button>
              <button type="button" className="w-[56px] h-[56px] text-body hover:text-heading bg-neutral-primary-soft rounded-base border border-default shadow-xs hover:bg-neutral-secondary-medium hover:border-default-medium focus:ring-4 focus:ring-neutral-secondary-soft focus:outline-none">
                  <svg className="w-4 h-4 mx-auto mb-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinejoin="round" strokeWidth="2" d="M16.444 18H19a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h2.556M17 11V5a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v6h10ZM7 15h10v4a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-4Z" /></svg>
                  <span className="block mb-px text-xs font-medium">Print</span>
              </button>
              <button type="button" className="w-[56px] h-[56px] text-body hover:text-heading bg-neutral-primary-soft rounded-base border border-default shadow-xs hover:bg-neutral-secondary-medium hover:border-default-medium focus:ring-4 focus:ring-neutral-secondary-soft focus:outline-none">
                  <svg className="w-4 h-4 mx-auto mb-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M11 16h2m6.707-9.293-2.414-2.414A1 1 0 0 0 16.586 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7.414a1 1 0 0 0-.293-.707ZM16 20v-6a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v6h8ZM9 4h6v3a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V4Z" /></svg>
                  <span className="block mb-px text-xs font-medium">Save</span>
              </button>
              <button type="button" className="w-[56px] h-[56px] text-body hover:text-heading bg-neutral-primary-soft rounded-base border border-default shadow-xs hover:bg-neutral-secondary-medium hover:border-default-medium focus:ring-4 focus:ring-neutral-secondary-soft focus:outline-none">
                  <svg className="w-4 h-4 mx-auto mb-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinejoin="round" strokeWidth="2" d="M14 4v3a1 1 0 0 1-1 1h-3m4 10v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h2m11-3v10a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V7.87a1 1 0 0 1 .24-.65l2.46-2.87a1 1 0 0 1 .76-.35H18a1 1 0 0 1 1 1Z" /></svg>
                  <span className="block mb-px text-xs font-medium">Copy</span>
              </button>
          </div>
          <button type="button" data-dial-toggle="speed-dial-menu-text-inside-button-square" aria-controls="speed-dial-menu-text-inside-button-square" aria-expanded="false" className="flex items-center justify-center text-white bg-brand rounded-base w-14 h-14 hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium focus:outline-none">
              <svg className="w-5 h-5 transition-transform group-hover:rotate-45" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-7 7V5" /></svg>
              <span className="sr-only">Open actions menu</span>
          </button>
      </div>
    </>
  )
}
