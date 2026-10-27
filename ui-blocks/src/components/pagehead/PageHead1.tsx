export default function PageHead1() {
  return (
    <section className="bg-white dark:bg-gray-900">
      <div className="container mx-auto px-6 pt-16 pb-10 text-center">
        <p className="text-sm font-medium text-blue-500 dark:text-blue-400">Home</p>
        <h1 className="mt-3 text-3xl font-semibold capitalize text-gray-800 lg:text-4xl dark:text-white">Page title</h1>
        <p className="mx-auto mt-4 max-w-2xl text-gray-500 dark:text-gray-300">A short line about this page.</p>
        <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-blue-500" />
      </div>
    </section>
  )
}
