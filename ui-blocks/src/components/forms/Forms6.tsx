export default function Forms6() {
  return (
    <form className="max-w-sm mx-auto"> 
      <label htmlFor="email" className="block mb-2.5 text-sm font-medium text-heading">Your email</label>
      <input type="email" id="email" aria-describedby="helper-text-explanation" className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="name@flowbite.com" />

      <p id="helper-text-explanation" className="mt-2.5 text-sm text-body">Read our <a href="#" className="font-medium text-fg-brand hover:underline ">Privacy Policy</a>.</p>
    </form>
  )
}
