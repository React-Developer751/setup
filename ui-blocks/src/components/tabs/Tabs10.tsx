export default function Tabs10() {
  return (
    <>
      <div className="sm:hidden">
          <label htmlFor="tabs" className="sr-only">Select your country</label>
          <select id="tabs" className="block w-full px-3 py-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand px-3 py-2.5 shadow-xs placeholder:text-body">
              <option>Profile</option>
              <option>Dashboard</option>
              <option>setting</option>
              <option>Invoice</option>
          </select>
      </div>
      <ul className="hidden text-sm font-medium text-center text-body sm:flex -space-x-px">
          <li className="w-full focus-within:z-10">
              <a href="#" className="inline-block w-full text-body bg-neutral-primary-soft border border-default rounded-s-base hover:bg-neutral-secondary-medium hover:text-heading focus:ring-4 focus:ring-neutral-secondary-strong font-medium leading-5 text-sm px-4 py-2.5 focus:outline-none" aria-current="page">Profile</a>
          </li>
          <li className="w-full focus-within:z-10">
              <a href="#" className="inline-block w-full text-body bg-neutral-primary-soft border border-default hover:bg-neutral-secondary-medium hover:text-heading focus:ring-4 focus:ring-neutral-secondary-strong font-medium leading-5 text-sm px-4 py-2.5 focus:outline-none">Dashboard</a>
          </li>
          <li className="w-full focus-within:z-10">
              <a href="#" className="inline-block w-full text-body bg-neutral-primary-soft border border-default hover:bg-neutral-secondary-medium hover:text-heading focus:ring-4 focus:ring-neutral-secondary-strong font-medium leading-5 text-sm px-4 py-2.5 focus:outline-none">Settings</a>
          </li>
          <li className="w-full focus-within:z-10">
              <a href="#" className="inline-block w-full text-body bg-neutral-primary-soft border border-default rounded-e-base hover:bg-neutral-secondary-medium hover:text-heading focus:ring-4 focus:ring-neutral-secondary-strong font-medium leading-5 text-sm px-4 py-2.5 focus:outline-none">Invoice</a>
          </li>
      </ul>
    </>
  )
}
