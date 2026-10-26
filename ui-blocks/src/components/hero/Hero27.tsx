export default function Hero27() {
  return (
    <header className="bg-white dark:bg-gray-900">
        <nav className="px-6 py-4 shadow">
            <div className="lg:items-center lg:justify-between lg:flex">
                <div className="flex items-center justify-between">
                    <a href="#" className="mx-auto ">
                        <img className="w-auto h-6 sm:h-7" src="https://merakiui.com/images/full-logo.svg" alt="" />
                    </a>

                    {/* Mobile menu button */}
                    <div className="lg:hidden">
                        <button type="button" className="text-gray-500 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400 focus:outline-none focus:text-gray-600 dark:focus:text-gray-400" aria-label="toggle menu">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                            </svg>
                
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu open: "block", Menu closed: "hidden" */}
                <div className="absolute inset-x-0 z-20 w-full px-6 py-4 transition-all duration-300 ease-in-out bg-white shadow-md lg:bg-transparent lg:dark:bg-transparent lg:shadow-none dark:bg-gray-900 lg:mt-0 lg:p-0 lg:top-0 lg:relative lg:w-auto lg:opacity-100 lg:translate-x-0 lg:flex lg:items-center">
                    <a href="#" className="block px-3 py-2 text-gray-600 rounded-lg dark:text-gray-200 hover:bg-gray-100 lg:mx-2">Home</a>
                    <a href="#" className="block px-3 py-2 text-gray-600 rounded-lg dark:text-gray-200 hover:bg-gray-100 lg:mx-2">About</a>
                    <a href="#" className="block px-3 py-2 text-gray-600 rounded-lg dark:text-gray-200 hover:bg-gray-100 lg:mx-2">Contact</a>
                </div>
            </div>
        </nav>

        <div className="lg:flex">
            <div className="flex items-center justify-center w-full px-6 py-8 lg:h-[32rem] lg:w-1/2">
                <div className="max-w-xl">
                    <h2 className="text-3xl font-semibold text-gray-800 dark:text-white lg:text-4xl">Build Your New <span className="text-blue-600 dark:text-blue-400">Idea</span></h2>

                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 lg:text-base">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Blanditiis commodi cum cupiditate ducimus, fugit harum id necessitatibus odio quam quasi, quibusdam rem tempora voluptates.</p>

                    <div className="flex flex-col mt-6 space-y-3 lg:space-y-0 lg:flex-row">
                        <a href="#" className="block px-5 py-2 text-sm font-medium tracking-wider text-center text-white transition-colors duration-300 transform bg-gray-900 rounded-md hover:bg-gray-700">Get Started</a>
                        <a href="#" className="block px-5 py-2 text-sm font-medium tracking-wider text-center text-gray-700 transition-colors duration-300 transform bg-gray-200 rounded-md lg:mx-4 hover:bg-gray-300">Learn More</a>
                    </div>
                </div>
            </div>

            <div className="w-full h-64 lg:w-1/2 lg:h-auto">
                <div className="w-full h-full bg-cover" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1508394522741-82ac9c15ba69?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=748&q=80)' }}>
                    <div className="w-full h-full bg-black opacity-25"></div>
                </div>
            </div>
        </div>
    </header>
  )
}
