export default function Button3() {
  return (
    <div className="flex items-center">
        <button className="px-4 py-2 font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-blue-600 rounded-lg hover:bg-blue-500 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-80">Download</button>

        <span className="border border-transparent"></span>

        <div className="relative">
            {/* Menu toggle button */}
            <button className="relative z-10 block p-2 transition-colors duration-300 transform bg-blue-600 rounded-lg hover:bg-blue-500 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-80">
                <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
            </button>

            {/* Menu list */}
            <div className="absolute right-0 z-20 w-48 mt-2 overflow-hidden bg-white rounded-lg shadow-xl dark:bg-gray-800">
                <a href="#" className="block px-4 py-2 text-sm text-gray-800 transition-colors duration-300 transform border-b dark:text-gray-200 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">small <span className="text-gray-600 dark:text-gray-400">(640x426)</span></a>
                <a href="#" className="block px-4 py-2 text-sm text-gray-800 transition-colors duration-300 transform border-b dark:text-gray-200 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">medium <span className="text-gray-600 dark:text-gray-400">(1920x1280)</span></a>
                <a href="#" className="block px-4 py-2 text-sm text-gray-800 transition-colors duration-300 transform dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">large <span className="text-gray-600 dark:text-gray-400">(2400x1600)</span></a>
            </div>
        </div>
    </div>
  )
}
