export default function Stepper2() {
  return (
    <ol className="flex items-center w-full space-x-4">
        <li className="flex w-full items-center text-fg-brand after:content-[''] after:w-full after:h-1 after:border-b after:border-brand-subtle after:border-4 after:inline-block after:ms-4 after:rounded-full">
            <span className="flex items-center justify-center w-10 h-10 bg-brand-softer rounded-full lg:h-12 lg:w-12 shrink-0">
                <svg className="w-5 h-5 text-fg-brand" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 11.917 9.724 16.5 19 7.5" /></svg>
            </span>
        </li>
        <li className="flex w-full items-center after:content-[''] after:w-full after:h-1 after:border-b after:border-default after:border-4 after:inline-block  after:ms-4 after:rounded-full">
            <span className="flex items-center justify-center w-10 h-10 bg-neutral-tertiary rounded-full lg:h-12 lg:w-12 shrink-0">
                <svg className="w-5 h-5 text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 9h3m-3 3h3m-3 3h3m-6 1c-.306-.613-.933-1-1.618-1H7.618c-.685 0-1.312.387-1.618 1M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm7 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" /></svg>
            </span>
        </li>
        <li className="flex items-center w-full">
            <span className="flex items-center justify-center w-10 h-10 bg-neutral-tertiary rounded-full lg:h-12 lg:w-12 shrink-0">
                <svg className="w-5 h-5 text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-6 7 2 2 4-4m-5-9v4h4V3h-4Z" /></svg>
            </span>
        </li>
    </ol>
  )
}
