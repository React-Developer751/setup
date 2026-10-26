export default function StepSection3() {
  return (
    <section className="bg-white dark:bg-gray-900">
      <div className="container px-6 py-16 mx-auto">
        <h2 className="text-2xl font-semibold text-center text-gray-800 capitalize lg:text-3xl dark:text-white">Section title</h2>
        <p className="max-w-2xl mx-auto mt-4 mb-10 text-center text-gray-500 dark:text-gray-300">Section text goes here, a short line that introduces what follows.</p>
        <div className="max-w-4xl mx-auto">
          <ol className="items-center w-full space-y-4 sm:flex sm:space-x-8 sm:space-y-0 rtl:space-x-reverse">
        <li className="flex items-center text-fg-brand space-x-3 rtl:space-x-reverse">
            <span className="flex items-center justify-center w-10 h-10 bg-brand-softer rounded-full lg:h-12 lg:w-12 shrink-0">
                <svg className="w-5 h-5 text-fg-brand" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 11.917 9.724 16.5 19 7.5" /></svg>
            </span>
            <span>
                <h3 className="font-medium leading-tight">User info</h3>
                <p className="text-sm">Step details here</p>
            </span>
        </li>
        <li className="flex items-center text-body space-x-3 rtl:space-x-reverse">
            <span className="flex items-center justify-center w-10 h-10 bg-neutral-tertiary rounded-full lg:h-12 lg:w-12 shrink-0">
                <svg className="w-5 h-5 text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 9h3m-3 3h3m-3 3h3m-6 1c-.306-.613-.933-1-1.618-1H7.618c-.685 0-1.312.387-1.618 1M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm7 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" /></svg>
            </span>
            <span>
                <h3 className="font-medium leading-tight">Company info</h3>
                <p className="text-sm">Step details here</p>
            </span>
        </li>
        <li className="flex items-center text-body space-x-3 rtl:space-x-reverse">
            <span className="flex items-center justify-center w-10 h-10 bg-neutral-tertiary rounded-full lg:h-12 lg:w-12 shrink-0">
                <svg className="w-5 h-5 text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M6 14h2m3 0h5M3 7v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1Z" /></svg>
            </span>
            <span>
                <h3 className="font-medium leading-tight">Payment info</h3>
                <p className="text-sm">Step details here</p>
            </span>
        </li>
    </ol>
        </div>
      </div>
    </section>
  )
}
