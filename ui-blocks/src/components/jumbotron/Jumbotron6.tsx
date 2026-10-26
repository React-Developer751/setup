export default function Jumbotron6() {
  return (
    <section className="bg-neutral-primary">
        <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16">
            <div className="bg-neutral-secondary-soft border border-default rounded-base p-8 md:p-12 mb-8">
                <span className="inline-flex items-center bg-brand-softer border border-brand-subtle text-fg-brand-strong text-xs font-medium px-1.5 py-0.5 rounded-sm">
                    <svg className="w-3 h-3 me-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 6H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1Zm7 11-6-2V9l6-2v10Z" /></svg>
                    Tutorial
                </span>
                <h1 className="text-heading tracking-tighter text-3xl md:text-5xl font-bold my-6">How to quickly deploy <br />a static website</h1>
                <p className="md:text-lg font-normal text-body mb-6">Static websites are now used to bootstrap lots of websites and are becoming the basis for a variety of tools that even influence web designers.</p>
                <button type="button" className="inline-flex items-center justify-center text-white bg-brand hover:bg-brand-strong box-border border border-transparent focus:ring-4 focus:ring-brand-medium shadow-xs font-medium rounded-base text-base px-5 py-3 focus:outline-none">
                    Getting started
                    <svg className="w-4 h-4 ms-1.5 -me-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m14 0-4 4m4-4-4-4" /></svg>
                </button>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-neutral-secondary-soft border border-default rounded-base p-8 md:p-12">
                    <span className="inline-flex items-center bg-brand-softer border border-brand-subtle text-fg-brand-strong text-xs font-medium px-1.5 py-0.5 rounded-sm">
                        <svg className="w-3 h-3 me-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 7h.01m3.486 1.513h.01m-6.978 0h.01M6.99 12H7m9 4h2.706a1.957 1.957 0 0 0 1.883-1.325A9 9 0 1 0 3.043 12.89 9.1 9.1 0 0 0 8.2 20.1a8.62 8.62 0 0 0 3.769.9 2.013 2.013 0 0 0 2.03-2v-.857A2.036 2.036 0 0 1 16 16Z" /></svg>
                        Design
                    </span>
                    <h2 className="text-heading text-3xl font-semobild my-4">Start with Flowbite Design System</h2>
                    <p className=" font-normal text-body mb-4">Static websites are now used to bootstrap lots of websites and are becoming the basis for a variety of tools that even influence both web designers and developers.</p>
                    <a href="#" className="text-fg-brand hover:underline font-medium text-lg inline-flex items-center">Read more
                        <svg className="w-6 h-6 rtl:rotate-180 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m14 0-4 4m4-4-4-4" /></svg>
                    </a>
                </div>
                <div className="bg-neutral-secondary-soft border border-default rounded-base p-8 md:p-12">
                    <span className="inline-flex items-center bg-brand-softer border border-brand-subtle text-fg-brand-strong text-xs font-medium px-1.5 py-0.5 rounded-sm">
                        <svg className="w-3 h-3 me-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m8 8-4 4 4 4m8 0 4-4-4-4m-2-3-4 14" /></svg>
                        Code
                    </span>
                    <h2 className="text-heading text-3xl font-semobild my-4">Best react libraries around the web</h2>
                    <p className=" font-normal text-body mb-4">Static websites are now used to bootstrap lots of websites and are becoming the basis for a variety of tools that even influence both web designers and developers.</p>
                    <a href="#" className="text-fg-brand hover:underline font-medium text-lg inline-flex items-center">Read more
                        <svg className="w-6 h-6 rtl:rotate-180 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m14 0-4 4m4-4-4-4" /></svg>
                    </a>
                </div>
            </div>
        </div>
    </section>
  )
}
