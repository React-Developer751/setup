export default function EmailTemplate3() {
  return (
    <section className="max-w-2xl px-6 py-8 mx-auto bg-white dark:bg-gray-900">
        <header>
            <a href="#">
                <img className="w-auto h-7 sm:h-8" src="https://merakiui.com/images/full-logo.svg" alt="" />
            </a>
        </header>

        <main className="mt-8">
            <p className="text-xl text-gray-700 dark:text-gray-200">Welcome to Company</p>
        
            <p className="mt-4 leading-loose text-gray-600 dark:text-gray-300">
                We’re excited to welcome you to Untitled and we’re even more excited about what we’ve got planned. You’re already on your way to creating beautiful visual products.
                Whether you’re here for your brand, for a cause, or just for fun — welcome! If there’s anything you need, we’ll be here every step of the way.
            </p>

            <hr className="my-6 border-gray-200 dark:border-gray-700" />

            <div>
                <div>
                    <a href="#" className="inline-flex items-center text-blue-600 underline dark:text-blue-400 gap-x-2 underline-offset-4">
                        <span>Meraki UI changelog</span>
                    
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 rtl:rotate-180">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                        </svg>
                    </a>

                    <p className="mt-2 text-gray-500 dark:text-gray-400">Weekly new updates and improvements to Meraki UI.</p>
                </div>

                <hr className="my-6 border-gray-200 dark:border-gray-700" />

                <div>
                    <a href="#" className="inline-flex items-center text-blue-600 underline dark:text-blue-400 gap-x-2 underline-offset-4">
                        <span>Follow us on Twitter</span>
                    
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 rtl:rotate-180">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                        </svg>
                    </a>

                    <p className="mt-2 text-gray-500 dark:text-gray-400">Stay up-to-date with the latest announcements and jobs.</p>
                </div>

                <hr className="my-6 border-gray-200 dark:border-gray-700" />

                <div>
                    <a href="#" className="inline-flex items-center text-blue-600 underline dark:text-blue-400 gap-x-2 underline-offset-4">
                        <span>Why we’re building Merki UI</span>
                    
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 rtl:rotate-180">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                        </svg>
                    </a>

                    <p className="mt-2 text-gray-500 dark:text-gray-400">Meraki UI is a new standard of design system and UI kit.</p>
                </div>

                <hr className="my-6 border-gray-200 dark:border-gray-700" />
            </div>

            <p className="mt-2 text-gray-500 dark:text-gray-400">
                Thanks for signing up. If you have any questions, send us a message <br /> at
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">hi@merakiui.com</a>
                or on <a href="#" className="font-medium text-blue-600 hover:text-blue-500">Twitter</a>. We’d love to hear from you.<br />
                — The team
            </p>
        
            <button className="px-6 py-2 mt-6 text-sm font-medium tracking-wider text-white capitalize transition-colors duration-300 transform bg-blue-600 rounded-lg hover:bg-blue-500 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-80">
                Get started
            </button>
        </main>
    

        <footer className="mt-8">
            <p className="text-gray-500 dark:text-gray-400">
                This email was sent to <a href="#" className="text-blue-600 hover:underline dark:text-blue-400" target="_blank">contact@merakiui.com</a>. 
                If you'd rather not receive this kind of email, you can <a href="#" className="text-blue-600 hover:underline dark:text-blue-400">unsubscribe</a> or <a href="#" className="text-blue-600 hover:underline dark:text-blue-400">manage your email preferences</a>.
            </p>

            <p className="mt-3 text-gray-500 dark:text-gray-400">© 2025 Meraki UI. All Rights Reserved.</p>
        </footer>
    </section>
  )
}
