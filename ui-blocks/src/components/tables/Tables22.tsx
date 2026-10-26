export default function Tables22() {
  return (
    <div className="relative overflow-x-auto bg-neutral-primary-soft shadow-xs rounded-base border border-default">
        <table className="w-full text-sm text-left rtl:text-right text-body">
            <thead className="text-sm text-body bg-neutral-secondary-medium border-b border-default-medium">
                <tr>
                    <th scope="col" className="px-16 py-3">
                        <span className="sr-only">Image</span>
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                        Product
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                        Qty
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                        Price
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                        Action
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr className="bg-neutral-primary-soft border-b border-default hover:bg-neutral-secondary-medium">
                    <td className="p-4">
                        <img src="/docs/images/products/apple-watch.png" className="w-16 md:w-24 max-w-full max-h-full" alt="Apple Watch" />
                    </td>
                    <td className="px-6 py-4 font-semibold text-heading">
                        Apple Watch
                    </td>
                    <td className="px-6 py-4">
                        <form className="max-w-xs mx-auto">
                            <label htmlFor="counter-input-1" className="sr-only">Choose quantity:</label>
                            <div className="relative flex items-center">
                                <button type="button" id="decrement-button-1" data-input-counter-decrement="counter-input-1" className="flex items-center justify-center text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary rounded-full text-sm focus:outline-none h-6 w-6">
                                    <svg className="w-3 h-3 text-heading" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14" /></svg>
                                </button>
                                <input type="text" id="counter-input-1" data-input-counter className="shrink-0 text-heading border-0 bg-transparent text-sm font-normal focus:outline-none focus:ring-0 max-w-[2.5rem] text-center" placeholder="" defaultValue="12" required />
                                <button type="button" id="increment-button-1" data-input-counter-increment="counter-input-1" className="flex items-center justify-center text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary rounded-full text-sm focus:outline-none h-6 w-6">
                                    <svg className="w-3 h-3 text-heading" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-7 7V5" /></svg>
                                </button>
                            </div>
                        </form>
                    </td>
                    <td className="px-6 py-4 font-semibold text-heading">
                        $599
                    </td>
                    <td className="px-6 py-4">
                        <a href="#" className="font-medium text-fg-danger hover:underline">Remove</a>
                    </td>
                </tr>
                <tr className="bg-neutral-primary-soft border-b border-default hover:bg-neutral-secondary-medium">
                    <td className="p-4">
                        <img src="/docs/images/products/imac.png" className="w-16 md:w-24 max-w-full max-h-full" alt="Apple iMac" />
                    </td>
                    <td className="px-6 py-4 font-semibold text-heading">
                        iMac 27"
                    </td>
                    <td className="px-6 py-4">
                        <form className="max-w-xs mx-auto">
                            <label htmlFor="counter-input-2" className="sr-only">Choose quantity:</label>
                            <div className="relative flex items-center">
                                <button type="button" id="decrement-button-2" data-input-counter-decrement="counter-input-2" className="flex items-center justify-center text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary rounded-full text-sm focus:outline-none h-6 w-6">
                                    <svg className="w-3 h-3 text-heading" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14" /></svg>
                                </button>
                                <input type="text" id="counter-input-2" data-input-counter className="shrink-0 text-heading border-0 bg-transparent text-sm font-normal focus:outline-none focus:ring-0 max-w-[2.5rem] text-center" placeholder="" defaultValue="12" required />
                                <button type="button" id="increment-button-2" data-input-counter-increment="counter-input-2" className="flex items-center justify-center text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary rounded-full text-sm focus:outline-none h-6 w-6">
                                    <svg className="w-3 h-3 text-heading" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-7 7V5" /></svg>
                                </button>
                            </div>
                        </form>
                    </td>
                    <td className="px-6 py-4 font-semibold text-heading">
                        $2499
                    </td>
                    <td className="px-6 py-4">
                        <a href="#" className="font-medium text-fg-danger hover:underline">Remove</a>
                    </td>
                </tr>
                <tr className="bg-neutral-primary-soft border-b border-default hover:bg-neutral-secondary-medium">
                    <td className="p-4">
                        <img src="/docs/images/products/iphone-12.png" className="w-16 md:w-24 max-w-full max-h-full" alt="iPhone 12" />
                    </td>
                    <td className="px-6 py-4 font-semibold text-heading">
                        IPhone 12 
                    </td>
                    <td className="px-6 py-4">
                        <form className="max-w-xs mx-auto">
                            <label htmlFor="counter-input-3" className="sr-only">Choose quantity:</label>
                            <div className="relative flex items-center">
                                <button type="button" id="decrement-button-3" data-input-counter-decrement="counter-input-3" className="flex items-center justify-center text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary rounded-full text-sm focus:outline-none h-6 w-6">
                                    <svg className="w-3 h-3 text-heading" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14" /></svg>
                                </button>
                                <input type="text" id="counter-input-3" data-input-counter className="shrink-0 text-heading border-0 bg-transparent text-sm font-normal focus:outline-none focus:ring-0 max-w-[2.5rem] text-center" placeholder="" defaultValue="12" required />
                                <button type="button" id="increment-button-3" data-input-counter-increment="counter-input-3" className="flex items-center justify-center text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary rounded-full text-sm focus:outline-none h-6 w-6">
                                    <svg className="w-3 h-3 text-heading" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-7 7V5" /></svg>
                                </button>
                            </div>
                        </form>
                    </td>
                    <td className="px-6 py-4 font-semibold text-heading">
                        $999
                    </td>
                    <td className="px-6 py-4">
                        <a href="#" className="font-medium text-fg-danger hover:underline">Remove</a>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
  )
}
