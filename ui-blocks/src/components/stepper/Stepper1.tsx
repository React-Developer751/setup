export default function Stepper1() {
  return (
    <ol className="flex items-center w-full text-sm font-medium text-center text-body sm:text-base">
        <li className="flex md:w-full items-center text-fg-brand sm:after:content-[''] after:w-full after:h-1 after:border-b after:border-default after:border-px after:hidden sm:after:inline-block after:mx-6 xl:after:mx-10">
            <span className="flex items-center after:content-['/'] sm:after:hidden after:mx-2 after:text-fg-disabled">
                <svg className="w-5 h-5 me-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                Personal <span className="hidden sm:inline-flex sm:ms-2">Info</span>
            </span>
        </li>
        <li className="flex md:w-full items-center after:content-[''] after:w-full after:h-1 after:border-b after:border-default after:border-px after:hidden sm:after:inline-block after:mx-6 xl:after:mx-10">
            <span className="flex items-center after:content-['/'] sm:after:hidden after:mx-2 after:text-fg-disabled">
                <span className="me-2">2</span>
                Account <span className="hidden sm:inline-flex sm:ms-2">Info</span>
            </span>
        </li>
        <li className="flex items-center">
            <span className="me-2">3</span>
            Confirmation
        </li>
    </ol>
  )
}
