export default function MegaMenu4() {
  return (
    <nav className="bg-neutral-primary-soft border-default">
        <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl p-4">
            <a href="https://flowbite.com" className="flex items-center space-x-3 rtl:space-x-reverse">
                <img src="https://flowbite.com/docs/images/logo.svg" className="h-7" alt="Flowbite Logo" />
                <span className="self-center text-xl font-semibold whitespace-nowrap text-heading">Flowbite</span>
            </a>
            <button data-collapse-toggle="mega-menu-full-cta" type="button" className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-body rounded-lg md:hidden hover:bg-neutral-secondary-soft hover:text-heading focus:outline-none focus:ring-2 focus:ring-default" aria-controls="mega-menu-full-cta" aria-expanded="false">
                <span className="sr-only">Open main menu</span>
                <svg className="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M5 7h14M5 12h14M5 17h14" /></svg>
            </button>
            <div id="mega-menu-full-cta" className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1">
                <ul className="flex flex-col mt-4 font-medium md:flex-row md:mt-0 md:space-x-8 rtl:space-x-reverse">
                    <li>
                        <a href="#" className="block py-2 px-3 text-heading hover:text-fg-brand border-b border-light hover:bg-neutral-secondary-soft md:hover:bg-transparent md:border-0 md:hover:text-fg-brand md:p-0" aria-current="page">Home</a>
                    </li>
                    <li>
                        <button id="mega-menu-full-cta-dropdown-button" data-collapse-toggle="mega-menu-full-cta-dropdown" data-dropdown-placement="bottom" className="flex items-center justify-between w-full py-2 px-3 font-medium text-heading border-b border-light md:w-auto hover:bg-neutral-secondary-soft hover:text-fg-brand md:hover:bg-transparent md:border-0 md:hover:text-fg-brand md:p-0">
                            Company
                            <svg className="w-4 h-4 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 9-7 7-7-7" /></svg>
                        </button>
                    </li>
                    <li>
                        <a href="#" className="block py-2 px-3 text-heading hover:text-fg-brand border-b border-light hover:bg-neutral-secondary-soft md:hover:bg-transparent md:border-0 md:hover:text-fg-brand md:p-0">Marketplace</a>
                    </li>
                    <li>
                        <a href="#" className="block py-2 px-3 text-heading hover:text-fg-brand border-b border-light hover:bg-neutral-secondary-soft md:hover:bg-transparent md:border-0 md:hover:text-fg-brand md:p-0">Resources</a>
                    </li>
                    <li>
                        <a href="#" className="block py-2 px-3 text-heading hover:text-fg-brand border-b border-light hover:bg-neutral-secondary-soft md:hover:bg-transparent md:border-0 md:hover:text-fg-brand md:p-0">Contact</a>
                    </li>
                </ul>
            </div>
        </div>
        <div id="mega-menu-full-cta-dropdown" className="mt-1 bg-neutral-primary-soft border-default shadow-xs border-y">
            <div className="grid max-w-screen-xl px-4 py-5 mx-auto text-sm text-body md:grid-cols-3 md:px-6">
                <ul className="space-y-3 sm:mb-4 md:mb-0" aria-labelledby="mega-menu-full-cta-button">
                    <li>
                        <a href="#" className="hover:underline hover:text-fg-brand">
                            Online Stores
                        </a>
                    </li>
                    <li>
                        <a href="#" className="hover:underline hover:text-fg-brand">
                            Segmentation
                        </a>
                    </li>
                    <li>
                        <a href="#" className="hover:underline hover:text-fg-brand">
                            Marketing CRM
                        </a>
                    </li>
                    <li>
                        <a href="#" className="hover:underline hover:text-fg-brand">
                            Online Stores
                        </a>
                    </li>
                </ul>
                <ul className="hidden mb-4 space-y-3 md:mb-0 sm:block">
                    <li>
                        <a href="#" className="hover:underline hover:text-fg-brand">
                            Our Blog
                        </a>
                    </li>
                    <li>
                        <a href="#" className="hover:underline hover:text-fg-brand">
                            Terms & Conditions
                        </a>
                    </li>
                    <li>
                        <a href="#" className="hover:underline hover:text-fg-brand">
                            License
                        </a>
                    </li>
                    <li>
                        <a href="#" className="hover:underline hover:text-fg-brand">
                            Resources
                        </a>
                    </li>
                </ul>
                <div className="mt-4 md:mt-0">
                    <h2 className="mb-2.5 font-semibold text-heading">Our brands</h2>
                    <p className="mb-2.5 text-body">At Flowbite, we have a portfolio of brands that cater to a variety of preferences.</p>
                    <a href="#" className="inline-flex items-center text-sm font-medium text-fg-brand hover:underline">
                        Explore our brands 
                        <span className="sr-only">Explore our brands </span>
                        <svg className="w-4 h-4 ms-1.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m14 0-4 4m4-4-4-4" /></svg>
                    </a>
                </div>
            </div>
        </div>
    </nav>
  )
}
