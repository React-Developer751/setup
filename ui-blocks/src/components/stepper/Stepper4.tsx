export default function Stepper4() {
  return (
    <ol className="space-y-4 w-72">
        <li>
            <div className="w-full p-4 bg-success-soft border border-success-subtle text-fg-success-strong rounded-base" role="alert">
                <div className="flex items-center justify-between">
                    <span className="sr-only">User info</span>
                    <h3 className="font-medium">1. User info</h3>
                    <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 11.917 9.724 16.5 19 7.5" /></svg>
                </div>
            </div>
        </li>
        <li>
            <div className="w-full p-4 bg-success-soft border border-success-subtle text-fg-success-strong rounded-base" role="alert">
                <div className="flex items-center justify-between">
                    <span className="sr-only">Account info</span>
                    <h3 className="font-medium">2. Account info</h3>
                    <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 11.917 9.724 16.5 19 7.5" /></svg>
                </div>
            </div>
        </li>
        <li>
            <div className="w-full p-4 bg-brand-softer border border-brand-subtle text-fg-brand-strong rounded-base" role="alert">
                <div className="flex items-center justify-between">
                    <span className="sr-only">Social accounts</span>
                    <h3 className="font-medium">3. Social accounts</h3>
                    <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m14 0-4 4m4-4-4-4" /></svg>
                </div>
            </div>
        </li>
        <li>
            <div className="w-full p-4 bg-neutral-secondary-soft border border-default text-body rounded-base" role="alert">
                <div className="flex items-center justify-between">
                    <span className="sr-only">Review</span>
                    <h3 className="font-medium">4. Review</h3>
                    <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m14 0-4 4m4-4-4-4" /></svg>
                </div>
            </div>
        </li>
        <li>
            <div className="w-full p-4 bg-neutral-secondary-soft border border-default text-body rounded-base" role="alert">
                <div className="flex items-center justify-between">
                    <span className="sr-only">Confirmation</span>
                    <h3 className="font-medium">5. Confirmation</h3>
                    <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m14 0-4 4m4-4-4-4" /></svg>
                </div>
            </div>
        </li>
    </ol>
  )
}
