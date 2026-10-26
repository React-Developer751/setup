export default function MegaMenu1() {
  return (
    <nav className="bg-neutral-primary border-default">
        <div className="flex flex-wrap items-center justify-between max-w-screen-xl mx-auto p-4">
            <a href="https://flowbite.com" className="flex items-center space-x-3 rtl:space-x-reverse">
                <img src="https://flowbite.com/docs/images/logo.svg" className="h-7" alt="Flowbite Logo" />
                <span className="self-center text-xl font-semibold whitespace-nowrap text-heading">Flowbite</span>
            </a>
            <div className="flex items-center md:order-2 space-x-1 md:space-x-2 rtl:space-x-reverse">
                <a href="#" className="text-heading bg-neutral-primary box-border border border-transparent hover:bg-neutral-secondary-medium focus:ring-4 focus:ring-neutral-tertiary-soft font-medium leading-5 rounded-base text-sm px-3 py-2 focus:outline-none">Login</a>
                <a href="#" className="text-white bg-brand hover:bg-brand-strong box-border border border-transparent focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-3 py-2 focus:outline-none">Sign Up</a>
                <button data-collapse-toggle="mega-menu" type="button" className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-body rounded-lg md:hidden hover:bg-neutral-secondary-soft hover:text-heading focus:outline-none focus:ring-2 focus:ring-default" aria-controls="mega-menu" aria-expanded="false">
                    <span className="sr-only">Open main menu</span>
                    <svg className="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M5 7h14M5 12h14M5 17h14" /></svg>
                </button>
            </div>
            <div id="mega-menu" className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1">
                <ul className="flex flex-col mt-4 font-medium md:flex-row md:mt-0 md:space-x-8 rtl:space-x-reverse">
                    <li>
                        <a href="#" className="block py-2 px-3 text-fg-brand border-b border-light hover:bg-neutral-secondary-soft md:hover:bg-transparent md:border-0 md:hover:text-fg-brand md:p-0" aria-current="page">Home</a>
                    </li>
                    <li>
                        <button id="mega-menu-dropdown-button" data-dropdown-toggle="mega-menu-dropdown" className="flex items-center justify-between w-full py-2 px-3 font-medium text-heading border-b border-light md:w-auto hover:bg-neutral-secondary-soft md:hover:bg-transparent md:border-0 md:hover:text-fg-brand md:p-0">
                            Company 
                            <svg className="w-4 h-4 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 9-7 7-7-7" /></svg>
                        </button>
                        <div id="mega-menu-dropdown" className="absolute z-10 grid hidden w-auto grid-cols-2 text-sm bg-neutral-primary-soft border border-default rounded-base shadow md:grid-cols-3">
                            <div className="p-4 pb-0 text-heading md:pb-4">
                                <ul className="space-y-3" aria-labelledby="mega-menu-dropdown-button">
                                    <li>
                                        <a href="#" className="text-body hover:text-fg-brand">
                                            About Us
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" className="text-body hover:text-fg-brand">
                                            Library
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" className="text-body hover:text-fg-brand">
                                            Resources
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" className="text-body hover:text-fg-brand">
                                            Pro Version
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            <div className="p-4 pb-0 md:pb-4">
                                <ul className="space-y-3">
                                    <li>
                                        <a href="#" className="text-body hover:text-fg-brand">
                                            Blog
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" className="text-body hover:text-fg-brand">
                                            Newsletter
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" className="text-body hover:text-fg-brand">
                                            Playground
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" className="text-body hover:text-fg-brand">
                                            License
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            <div className="p-4">
                                <ul className="space-y-3">
                                    <li>
                                        <a href="#" className="text-body hover:text-fg-brand">
                                            Contact Us
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" className="text-body hover:text-fg-brand">
                                            Support Center
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" className="text-body hover:text-fg-brand">
                                            Terms
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </li>
                    <li>
                        <a href="#" className="block py-2 px-3 text-heading border-b border-light hover:bg-neutral-secondary-soft md:hover:bg-transparent md:border-0 md:hover:text-fg-brand md:p-0">Team</a>
                    </li>
                    <li>
                        <a href="#" className="block py-2 px-3 text-heading border-b border-light hover:bg-neutral-secondary-soft md:hover:bg-transparent md:border-0 md:hover:text-fg-brand md:p-0">Contact</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
  )
}
