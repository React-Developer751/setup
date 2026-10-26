export default function Stepper5() {
  return (
    <ol className="flex items-center w-full p-3 space-x-2 text-sm font-medium text-center text-body bg-neutral-primary-soft border border-default rounded-base shadow-xs sm:p-4 sm:space-x-4 rtl:space-x-reverse">
        <li className="flex items-center text-fg-brand">
            <span className="flex items-center justify-center w-5 h-5 me-2 text-xs border border-brand rounded-full shrink-0">
                1
            </span>
            Personal <span className="hidden sm:inline-flex ms-2">Info</span>
            <svg className="w-5 h-5 ms-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m7 16 4-4-4-4m6 8 4-4-4-4" /></svg>
        </li>
        <li className="flex items-center">
            <span className="flex items-center justify-center w-5 h-5 me-2 text-xs border border-body rounded-full shrink-0">
                2
            </span>
            Account <span className="hidden sm:inline-flex ms-2">Info</span>
            <svg className="w-5 h-5 ms-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m7 16 4-4-4-4m6 8 4-4-4-4" /></svg>
        </li>
        <li className="flex items-center">
            <span className="flex items-center justify-center w-5 h-5 me-2 text-xs border border-body rounded-full shrink-0">
                3
            </span>
            Review
        </li>
    </ol>
  )
}
