// @ts-nocheck - markup of a third-party snippet kept as it is (non-standard attributes)
export default function Tables23() {
  return (
    <div className="relative overflow-x-auto bg-neutral-primary-soft shadow-xs rounded-base border border-default">
        <div className="flex items-center justify-between flex-column md:flex-row flex-wrap space-y-4 md:space-y-0 p-4">
            <div>
                <button id="dropdownDefaultButton2" data-dropdown-toggle="dropdown-2" className="inline-flex items-center justify-center text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium leading-5 rounded-base text-sm px-3 py-2 focus:outline-none" type="button">
                    Action
                    <svg className="w-4 h-4 ms-1.5 -me-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 9-7 7-7-7" /></svg>
                </button>
                {/* Dropdown menu */}
                <div id="dropdown-2" className="z-10 hidden bg-neutral-primary-medium border border-default-medium rounded-base shadow-lg w-32">
                    <ul className="p-2 text-sm text-body font-medium" aria-labelledby="dropdownDefaultButton2">
                    <li>
                        <a href="#" className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">Reward</a>
                    </li>
                    <li>
                        <a href="#" className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">Promote</a>
                    </li>
                    <li>
                        <a href="#" className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">Archive</a>
                    </li>
                    <li>
                        <a href="#" className="inline-flex items-center w-full p-2 text-fg-danger hover:bg-neutral-tertiary-medium rounded">Delete</a>
                    </li>
                    </ul>
                </div>
            </div>
            <label htmlFor="input-group-1" className="sr-only">Search</label>
            <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    <svg className="w-4 h-4 text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" /></svg>
                </div>
                <input type="text" id="input-group-1" className="block w-full max-w-96 ps-9 pe-3 py-2 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body" placeholder="Search" />
            </div>
        </div>
        <table className="w-full text-sm text-left rtl:text-right text-body">
            <thead className="text-sm text-body bg-neutral-secondary-medium border-b border-t border-default-medium">
                <tr>
                    <th scope="col" className="p-4">
                        <div className="flex items-center">
                            <input id="table-checkbox-51" type="checkbox" defaultValue="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                            <label htmlFor="table-checkbox-51" className="sr-only">Table checkbox</label>
                        </div>
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                        Name
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                        Position
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                        Status
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                        Action
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr className="bg-neutral-primary-soft border-b border-default hover:bg-neutral-secondary-medium">
                    <td className="w-4 p-4">
                        <div className="flex items-center">
                            <input id="table-checkbox-52" type="checkbox" defaultValue="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                            <label htmlFor="table-checkbox-52" className="sr-only">Table checkbox</label>
                        </div>
                    </td>
                    <th scope="row" className="flex items-center px-6 py-4 text-heading whitespace-nowrap">
                        <img className="w-10 h-10 rounded-full" src="/docs/images/people/profile-picture-1.jpg" alt="Jese image" />
                        <div className="ps-3">
                            <div className="text-base font-semibold">Neil Sims</div>
                            <div className="font-normal text-body">neil.sims@flowbite.com</div>
                        </div>  
                    </th>
                    <td className="px-6 py-4">
                        React Developer
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center">
                            <div className="h-2.5 w-2.5 rounded-full bg-success me-2"></div> Online
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        {/* Modal toggle */}
                        <a href="#" type="button" data-modal-target="editUserModal" data-modal-show="editUserModal" className="font-medium text-fg-brand hover:underline">Edit user</a>
                    </td>
                </tr>
                <tr className="bg-neutral-primary-soft border-b border-default hover:bg-neutral-secondary-medium">
                    <td className="w-4 p-4">
                        <div className="flex items-center">
                            <input id="table-checkbox-53" type="checkbox" defaultValue="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                            <label htmlFor="table-checkbox-53" className="sr-only">Table checkbox</label>
                        </div>
                    </td>
                    <th scope="row" className="flex items-center px-6 py-4 font-medium text-heading whitespace-nowrap">
                        <img className="w-10 h-10 rounded-full" src="/docs/images/people/profile-picture-3.jpg" alt="Jese image" />
                        <div className="ps-3">
                            <div className="text-base font-semibold">Bonnie Green</div>
                            <div className="font-normal text-body">bonnie@flowbite.com</div>
                        </div>
                    </th>
                    <td className="px-6 py-4">
                        Designer
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center">
                            <div className="h-2.5 w-2.5 rounded-full bg-success me-2"></div> Online
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        {/* Modal toggle */}
                        <a href="#" type="button" data-modal-show="editUserModal" className="font-medium text-fg-brand hover:underline">Edit user</a>
                    </td>
                </tr>
                <tr className="bg-neutral-primary-soft border-b border-default hover:bg-neutral-secondary-medium">
                    <td className="w-4 p-4">
                        <div className="flex items-center">
                            <input id="table-checkbox-54" type="checkbox" defaultValue="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                            <label htmlFor="table-checkbox-54" className="sr-only">Table checkbox</label>
                        </div>
                    </td>
                    <th scope="row" className="flex items-center px-6 py-4 font-medium text-heading whitespace-nowrap">
                        <img className="w-10 h-10 rounded-full" src="/docs/images/people/profile-picture-2.jpg" alt="Jese image" />
                        <div className="ps-3">
                            <div className="text-base font-semibold">Jese Leos</div>
                            <div className="font-normal text-body">jese@flowbite.com</div>
                        </div>
                    </th>
                    <td className="px-6 py-4">
                        Vue JS Developer
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center">
                            <div className="h-2.5 w-2.5 rounded-full bg-success me-2"></div> Online
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        {/* Modal toggle */}
                        <a href="#" type="button" data-modal-show="editUserModal" className="font-medium text-fg-brand hover:underline">Edit user</a>
                    </td>
                </tr>
                <tr className="bg-neutral-primary-soft border-b border-default hover:bg-neutral-secondary-medium">
                    <td className="w-4 p-4">
                        <div className="flex items-center">
                            <input id="table-checkbox-55" type="checkbox" defaultValue="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                            <label htmlFor="table-checkbox-55" className="sr-only">Table checkbox</label>
                        </div>
                    </td>
                    <th scope="row" className="flex items-center px-6 py-4 font-medium text-heading whitespace-nowrap">
                        <img className="w-10 h-10 rounded-full" src="/docs/images/people/profile-picture-5.jpg" alt="Jese image" />
                        <div className="ps-3">
                            <div className="text-base font-semibold">Thomas Lean</div>
                            <div className="font-normal text-body">thomas@flowbite.com</div>
                        </div>
                    </th>
                    <td className="px-6 py-4">
                        UI/UX Engineer
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center">
                            <div className="h-2.5 w-2.5 rounded-full bg-success me-2"></div> Online
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        {/* Modal toggle */}
                        <a href="#" type="button" data-modal-show="editUserModal" className="font-medium text-fg-brand hover:underline">Edit user</a>
                    </td>
                </tr>
                <tr className="bg-neutral-primary-soft hover:bg-neutral-secondary-medium">
                    <td className="w-4 p-4">
                        <div className="flex items-center">
                            <input id="table-checkbox-56" type="checkbox" defaultValue="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                            <label htmlFor="table-checkbox-56" className="sr-only">Table checkbox</label>
                        </div>
                    </td>
                    <th scope="row" className="flex items-center px-6 py-4 font-medium text-heading whitespace-nowrap">
                        <img className="w-10 h-10 rounded-full" src="/docs/images/people/profile-picture-4.jpg" alt="Jese image" />
                        <div className="ps-3">
                            <div className="text-base font-semibold">Leslie Livingston</div>
                            <div className="font-normal text-body">leslie@flowbite.com</div>
                        </div>
                    </th>
                    <td className="px-6 py-4">
                        SEO Specialist
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center">
                            <div className="h-2.5 w-2.5 rounded-full bg-danger me-2"></div> Offline
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        {/* Modal toggle */}
                        <a href="#" type="button" data-modal-show="editUserModal" className="font-medium text-fg-brand hover:underline">Edit user</a>
                    </td>
                </tr>
            </tbody>
        </table>
        {/* Main modal */}
    <div id="editUserModal" tabIndex={-1} aria-hidden="true" className="hidden overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full">
        <div className="relative p-4 w-full max-w-md max-h-full">
            {/* Modal content */}
            <div className="relative bg-neutral-primary-soft border border-default rounded-base shadow-sm p-4 md:p-6">
                {/* Modal header */}
                <div className="flex items-center justify-between border-b border-default pb-4 md:pb-5">
                    <h3 className="text-lg font-medium text-heading">
                        Create new product
                    </h3>
                    <button type="button" className="text-body bg-transparent hover:bg-neutral-tertiary hover:text-heading rounded-base text-sm w-9 h-9 ms-auto inline-flex justify-center items-center" data-modal-hide="editUserModal">
                        <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 17.94 6M18 18 6.06 6" /></svg>
                        <span className="sr-only">Close modal</span>
                    </button>
                </div>
                {/* Modal body */}
                <form action="#">
                    <div className="grid gap-4 grid-cols-2 py-4 md:py-6">
                        <div className="col-span-2">
                            <label htmlFor="name" className="block mb-2.5 text-sm font-medium text-heading">Name</label>
                            <input type="text" name="name" id="name" className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="Bonnie Green" required="" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label htmlFor="position" className="block mb-2.5 text-sm font-medium text-heading">Position</label>
                            <input type="text" name="position" id="position" className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="React Developer" required="" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label htmlFor="category" className="block mb-2.5 text-sm font-medium text-heading">Status</label>
                            <select id="category" className="block w-full px-3 py-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand px-3 py-2.5 shadow-xs placeholder:text-body">
                                <option selected="">Online</option>
                                <option value="offline">Offline</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label htmlFor="biography" className="block mb-2.5 text-sm font-medium text-heading">Biography</label>
                            <textarea id="biography" rows="4" className="block bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full p-3.5 shadow-xs placeholder:text-body" placeholder="Write a short biography here"></textarea>                    
                        </div>
                    </div>
                    <div className="flex items-center space-x-4 border-t border-default pt-4 md:pt-6">
                        <button type="submit" className="inline-flex items-center  text-white bg-brand hover:bg-brand-strong box-border border border-transparent focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">
                            Update user
                        </button>
                        <button data-modal-hide="crud-modal" type="button" className="text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div> 
    </div>
  )
}
