export default function EmailTemplate5() {
  return (
    <section className="max-w-2xl px-6 py-8 mx-auto bg-white dark:bg-gray-900">
        <header>
            <a href="#">
                <img className="w-auto h-7 sm:h-8" src="https://merakiui.com/images/full-logo.svg" alt="" />
            </a>
        
            <nav className="flex items-center mt-6 gap-x-6 sm:gap-x-8">
                <a href="#" className="text-sm text-gray-600 transition-colors duration-300 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400" aria-label="Reddit"> Home </a>            
                <a href="#" className="text-sm text-gray-600 transition-colors duration-300 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400" aria-label="Reddit"> Blog </a>        
                <a href="#" className="text-sm text-gray-600 transition-colors duration-300 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400" aria-label="Reddit"> Tutorials </a>
                <a href="#" className="text-sm text-gray-600 transition-colors duration-300 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400" aria-label="Reddit"> Support </a>
            </nav>
        </header>

        <main className="mt-8">
            <h2 className="text-gray-700 dark:text-gray-200">Hi Olivia,</h2>

            <p className="mt-2 leading-loose text-gray-600 dark:text-gray-300">
                We’re glad to have you onboard! You’re already on your way to 
                creating beautiful visual products.
                Whether you’re here for your brand, for a cause, or just for fun — 
                welcome! If there’s anything you need, we’ll be here every step of the way.
            </p>
        
            <p className="mt-2 text-gray-600 dark:text-gray-300">
                Thanks, <br />
                Meraki UI team
            </p>
        
            <button className="px-6 py-2 mt-8 text-sm font-medium tracking-wider text-white capitalize transition-colors duration-300 transform bg-blue-600 rounded-lg hover:bg-blue-500 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-80">
                Login
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
