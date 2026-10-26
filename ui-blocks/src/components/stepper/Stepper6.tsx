export default function Stepper6() {
  return (
    <ol className="relative text-body border-s border-default">                  
        <li className="mb-10 ms-7">            
            <span className="absolute flex items-center justify-center w-8 h-8 text-fg-success-strong bg-success-soft rounded-full -start-4 ring-4 ring-buffer">
                <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 11.917 9.724 16.5 19 7.5" /></svg>
            </span>
            <h3 className="font-medium leading-tight">Personal Info</h3>
            <p className="text-sm">Step details here</p>
        </li>
        <li className="mb-10 ms-7">
            <span className="absolute flex items-center justify-center w-8 h-8 bg-neutral-tertiary text-body rounded-full -start-4 ring-4 ring-buffer">
                <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 9h3m-3 3h3m-3 3h3m-6 1c-.306-.613-.933-1-1.618-1H7.618c-.685 0-1.312.387-1.618 1M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm7 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" /></svg>
            </span>
            <h3 className="font-medium leading-tight">Account Info</h3>
            <p className="text-sm">Step details here</p>
        </li>
        <li className="mb-10 ms-7">
            <span className="absolute flex items-center justify-center w-8 h-8 bg-neutral-tertiary text-body rounded-full -start-4 ring-4 ring-buffer">
                <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-3 5h3m-6 0h.01M12 16h3m-6 0h.01M10 3v4h4V3h-4Z" /></svg>
            </span>
            <h3 className="font-medium leading-tight">Review</h3>
            <p className="text-sm">Step details here</p>
        </li>
        <li className="ms-7">
            <span className="absolute flex items-center justify-center w-8 h-8 bg-neutral-tertiary text-body rounded-full -start-4 ring-4 ring-buffer">
                <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-6 7 2 2 4-4m-5-9v4h4V3h-4Z" /></svg>
            </span>
            <h3 className="font-medium leading-tight">Confirmation</h3>
            <p className="text-sm">Step details here</p>
        </li>
    </ol>
  )
}
