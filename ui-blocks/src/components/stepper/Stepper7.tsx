export default function Stepper7() {
  return (
    <>
      <ol className="flex items-center w-full space-x-4 mb-8">
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

      <form className="max-w-sm">
          <h3 className="mb-6 text-lg font-medium leading-none text-heading">Sign In details</h3>
        <div className="mb-5">
          <label htmlFor="email" className="block mb-2.5 text-sm font-medium text-heading">Your email</label>
          <input type="email" id="email" className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="name@flowbite.com" required />
        </div>
        <div className="mb-5">
          <label htmlFor="password" className="block mb-2.5 text-sm font-medium text-heading">Your password</label>
          <input type="password" id="password" className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="••••••••" required />
        </div>
        <div className="flex items-start mb-5">
          <div className="flex items-center h-5">
            <input id="remember" type="checkbox" defaultValue="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" required />
          </div>
          <label htmlFor="remember" className="ms-2 text-sm font-medium text-heading select-none">I agree with the <a href="#" className="text-fg-brand hover:underline">terms and conditions</a>.</label>
        </div>
        <button type="submit" className="text-white bg-brand box-border border border-transparent hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">Next Step: Payment Info</button>
      </form>
    </>
  )
}
