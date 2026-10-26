export default function Card20() {
  return (
    <div className="w-full bg-neutral-primary border border-default rounded-base shadow-xs">
        <ul className="flex flex-wrap text-sm font-medium text-center text-body bg-neutral-secondary-soft border-b border-default rounded-t-base" id="defaultTab" data-tabs-toggle="#defaultTabContent" role="tablist">
            <li className="me-2">
                <button id="about-tab" data-tabs-target="#about" type="button" role="tab" aria-controls="about" aria-selected="true" className="inline-block p-4 text-fg-brand rounded-ss-base hover:bg-neutral-tertiary">About</button>
            </li>
            <li className="me-2">
                <button id="services-tab" data-tabs-target="#services" type="button" role="tab" aria-controls="services" aria-selected="false" className="inline-block p-4 hover:text-heading hover:bg-neutral-tertiary">Services</button>
            </li>
            <li className="me-2">
                <button id="statistics-tab" data-tabs-target="#statistics" type="button" role="tab" aria-controls="statistics" aria-selected="false" className="inline-block p-4 hover:text-heading hover:bg-neutral-tertiary">Facts</button>
            </li>
        </ul>
        <div id="defaultTabContent">
            <div className="hidden p-4 rounded-b-base md:p-8" id="about" role="tabpanel" aria-labelledby="about-tab">
                <h2 className="mb-2 text-2xl font-semibold tracking-tight text-heading">Powering innovation at <span className="font-extrabold">200,000+</span> companies worldwide</h2>
                <p className="mb-4 text-body">Empower Developers, IT Ops, and business teams to collaborate at high velocity. Respond to changes and deliver great customer and employee service experiences fast.</p>
                <a href="#" className="inline-flex items-center font-medium text-fg-brand hover:underline">
                    Learn more
                    <svg className="w-5 h-5 ms-1 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m14 0-4 4m4-4-4-4" /></svg>
                </a>
            </div>
            <div className="hidden p-4 rounded-b-base md:p-8" id="services" role="tabpanel" aria-labelledby="services-tab">
                <h2 className="mb-5 text-2xl font-semibold tracking-tight text-heading">We invest in the world’s potential</h2>
                {/* List */}
                <ul role="list" className="space-y-4 text-body">
                    <li className="flex space-x-1.5 rtl:space-x-reverse items-center">
                        <svg className="w-4 h-4 text-fg-brand shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                        <span className="leading-tight">Dynamic reports and dashboards</span>
                    </li>
                    <li className="flex space-x-2 rtl:space-x-reverse items-center">
                        <svg className="w-4 h-4 text-fg-brand shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                        <span className="leading-tight">Templates for everyone</span>
                    </li>
                    <li className="flex space-x-2 rtl:space-x-reverse items-center">
                        <svg className="w-4 h-4 text-fg-brand shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                        <span className="leading-tight">Development workflow</span>
                    </li>
                    <li className="flex space-x-2 rtl:space-x-reverse items-center">
                        <svg className="w-4 h-4 text-fg-brand shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                        <span className="leading-tight">Limitless business automation</span>
                    </li>
                </ul>
            </div>
            <div className="hidden p-4 rrounded-b-base md:p-8" id="statistics" role="tabpanel" aria-labelledby="statistics-tab">
                <dl className="grid max-w-screen-xl grid-cols-2 gap-8 p-4 mx-auto text-heading sm:grid-cols-3 xl:grid-cols-6 sm:p-8">
                    <div className="flex flex-col">
                        <dt className="mb-2 text-2xl font-semibold tracking-tight text-heading">73M+</dt>
                        <dd className="text-body">Developers</dd>
                    </div>
                    <div className="flex flex-col">
                        <dt className="mb-2 text-2xl font-semibold tracking-tight text-heading">100M+</dt>
                        <dd className="text-body">Public repositories</dd>
                    </div>
                    <div className="flex flex-col">
                        <dt className="mb-2 text-2xl font-semibold tracking-tight text-heading">1000s</dt>
                        <dd className="text-body">Open source projects</dd>
                    </div>
                </dl>
            </div>
        </div>
    </div>
  )
}
