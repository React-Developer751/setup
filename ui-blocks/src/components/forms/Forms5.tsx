export default function Forms5() {
  return (
    <form className="max-w-sm mx-auto">
      <div className="mb-5">
        <label htmlFor="email-alternative" className="block mb-2.5 text-sm font-medium text-heading">Your email</label>
        <input type="email" id="email-alternative" className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow placeholder:text-body" placeholder="name@flowbite.com" required />
      </div>
      <div className="mb-5">
        <label htmlFor="password-alternative" className="block mb-2.5 text-sm font-medium text-heading">Your password</label>
        <input type="password" id="password-alternative" className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow placeholder:text-body" placeholder="••••••••" required />
      </div>
      <div className="flex items-start mb-5">
        <label htmlFor="remember-alternative" className="flex items-center h-5">
          <input id="remember-alternative" type="checkbox" defaultValue="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" required />
          <p className="ms-2 text-sm font-medium text-heading select-none">I agree with the <a href="#" className="text-fg-brand hover:underline">terms and conditions</a>.</p>
        </label>
      </div>
      <button type="submit" className="text-white bg-brand box-border border border-transparent hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">Submit</button>
    </form>
  )
}
