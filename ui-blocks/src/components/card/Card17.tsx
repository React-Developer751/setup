export default function Card17() {
  return (
    <div className="w-full max-w-sm bg-neutral-primary-soft p-6 border border-default rounded-base shadow-xs">
        <form action="#">
            <h5 className="text-xl font-semibold text-heading mb-6">Sign in to our platform</h5>
            <div className="mb-4">
                <label htmlFor="email" className="block mb-2.5 text-sm font-medium text-heading">Your email</label>
                <input type="email" id="email" className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="example@company.com" required />
            </div>
            <div>
                <label htmlFor="password" className="block mb-2.5 text-sm font-medium text-heading">Your password</label>
                <input type="password" id="password" className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="•••••••••" required />
            </div>
            <div className="flex items-start my-6">
                <div className="flex items-center">
                    <input id="checkbox-remember" type="checkbox" defaultValue="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                    <label htmlFor="checkbox-remember" className="ms-2 text-sm font-medium text-heading">Remember me</label>
                </div>
                <a href="#" className="ms-auto text-sm font-medium text-fg-brand hover:underline">Lost Password?</a>
            </div>
            <button type="submit" className="text-white bg-brand box-border border border-transparent hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none w-full mb-3">Login to your account</button>
            <div className="text-sm font-medium text-body">Not registered? <a href="#" className="text-fg-brand hover:underline">Create account</a></div>
        </form>
    </div>
  )
}
