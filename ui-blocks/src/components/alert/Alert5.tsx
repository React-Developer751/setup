export default function Alert5() {
  return (
    <div className="flex w-full max-w-sm overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="w-2 bg-gray-800 dark:bg-gray-900"></div>

        <div className="flex items-center px-2 py-3">
            <img className="object-cover w-10 h-10 rounded-full" alt="User avatar" src="https://images.unsplash.com/photo-1477118476589-bff2c5c4cfbb?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=200&q=200" />

            <div className="mx-3">
                <p className="text-gray-600 dark:text-gray-200">Sara has replied on the <a className="text-blue-500 dark:text-blue-300 hover:text-blue-400 hover:underline">uploaded image</a>.</p>
            </div>
        </div>
    </div>
  )
}
