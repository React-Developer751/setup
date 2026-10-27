export default function PageHead2() {
  return (
    <section className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="container mx-auto px-6 py-14">
        <p className="text-sm text-gray-500 dark:text-gray-300">
          <a href="#/" className="text-blue-500 hover:underline dark:text-blue-400">Home</a>
          <span className="mx-2">/</span>
          <span>Page</span>
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-gray-800 lg:text-4xl dark:text-white">Page title</h1>
        <p className="mt-3 max-w-2xl text-gray-500 dark:text-gray-300">A short line about this page.</p>
      </div>
    </section>
  )
}
