export default function Drawer1() {
  // drawer init and toggle 
  return (
    <>
      <div className="text-center">
         <button className="inline-flex items-center justify-center text-white bg-brand box-border border border-transparent hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none" type="button" data-drawer-target="drawer-example" data-drawer-show="drawer-example" aria-controls="drawer-example">
         Show drawer
         </button>
      </div>

      {/* drawer component */}
      <div id="drawer-example" className="fixed top-0 left-0 z-40 h-screen p-4 overflow-y-auto transition-transform -translate-x-full bg-neutral-primary-soft w-96 border-e border-default" tabIndex={-1} aria-labelledby="drawer-label">
         <div className="border-b border-default pb-4 mb-5 flex items-center">
            <h5 id="drawer-label" className="inline-flex items-center text-lg font-medium text-body">
               <svg className="w-5 h-5 me-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 11h2v5m-2 0h4m-2.592-8.5h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
               Drawer heading
            </h5>
            <button type="button" data-drawer-hide="drawer-example" aria-controls="drawer-example" className="text-body bg-transparent hover:text-heading hover:bg-neutral-tertiary rounded-base w-9 h-9 absolute top-2.5 end-2.5 flex items-center justify-center">
               <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 17.94 6M18 18 6.06 6" /></svg>
               <span className="sr-only">Close menu</span>
            </button>
         </div>
         <p className="mb-3 text-sm text-body">Upgrade your Figma toolkit with a design system built on top <a href="#" className="font-medium text-heading underline hover:no-underline">Flowbite CSS</a> featuring variants, style guide and auto layout.</p>
         <p className="mb-5 text-sm text-body">Recommended for professional developers and companies building enterprise-level.</p>
         <div className="flex items-center gap-4">
            <button type="button" className="text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">Pricing & FAQ</button>
            <button type="button" className="inline-flex items-center justify-center text-white bg-brand box-border border border-transparent hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">
               Get access
               <svg className="rtl:rotate-180 w-4 h-4 ms-1.5 -me-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m14 0-4 4m4-4-4-4" /></svg>
            </button>
         </div>
      </div>
    </>
  )
}
