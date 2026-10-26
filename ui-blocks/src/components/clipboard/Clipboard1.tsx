export default function Clipboard1() {
  return (
    <div className="grid grid-cols-8 gap-2 w-full max-w-[23rem]">
        <label htmlFor="npm-install" className="sr-only">Label</label>
        <input id="npm-install" type="text" className="col-span-6 bg-neutral-secondary-medium border border-default-medium text-body text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" defaultValue="npm install flowbite" disabled readOnly />
        <button data-copy-to-clipboard-target="npm-install" className="col-span-2 col-span-2 text-white bg-brand box-border border border-transparent hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm py-2.5 focus:outline-none sm:w-auto">
            <span id="default-message">Copy</span>
            <span id="success-message" className="hidden">
                <div className="inline-flex items-center">
                    <svg className="w-3 h-3 me-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 11.917 9.724 16.5 19 7.5" /></svg>
                    Copied!
                </div>
            </span>
        </button>
    </div>
  )
}
