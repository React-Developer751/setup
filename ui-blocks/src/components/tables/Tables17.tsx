export default function Tables17() {
  return (
    <div className="relative overflow-x-auto bg-neutral-primary-soft shadow-xs rounded-base border border-default">
        <div className="p-4">
            <label htmlFor="input-group-1" className="sr-only">Search</label>
            <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    <svg className="w-4 h-4 text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" /></svg>
                </div>
                <input type="text" id="input-group-1" className="block w-full max-w-96 ps-9 pe-3 py-2 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="Search" />
            </div>
        </div>
        <table className="w-full text-sm text-left rtl:text-right text-body">
            <thead className="text-sm text-body bg-neutral-secondary-medium border-b border-t border-default-medium">
                <tr>
                    <th scope="col" className="p-4">
                        <div className="flex items-center">
                            <input id="table-checkbox-12" type="checkbox" defaultValue="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                            <label htmlFor="table-checkbox-12" className="sr-only">Table checkbox</label>
                        </div>
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                        Product name
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                        Color
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                        Category
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
                    <td className="w-4 p-4">
                        <div className="flex items-center">
                            <input id="table-checkbox-13" type="checkbox" defaultValue="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                            <label htmlFor="table-checkbox-13" className="sr-only">Table checkbox</label>
                        </div>
                    </td>
                    <th scope="row" className="px-6 py-4 font-medium text-heading whitespace-nowrap">
                        Apple MacBook Pro 17"
                    </th>
                    <td className="px-6 py-4">
                        Silver
                    </td>
                    <td className="px-6 py-4">
                        Laptop
                    </td>
                    <td className="px-6 py-4">
                        $2999
                    </td>
                    <td className="px-6 py-4">
                        <a href="#" className="font-medium text-fg-brand hover:underline">Edit</a>
                    </td>
                </tr>
                <tr className="bg-neutral-primary-soft border-b border-default hover:bg-neutral-secondary-medium">
                    <td className="w-4 p-4">
                        <div className="flex items-center">
                            <input id="table-checkbox-14" type="checkbox" defaultValue="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                            <label htmlFor="table-checkbox-14" className="sr-only">Table checkbox</label>
                        </div>
                    </td>
                    <th scope="row" className="px-6 py-4 font-medium text-heading whitespace-nowrap">
                        Microsoft Surface Pro
                    </th>
                    <td className="px-6 py-4">
                        White
                    </td>
                    <td className="px-6 py-4">
                        Laptop PC
                    </td>
                    <td className="px-6 py-4">
                        $1999
                    </td>
                    <td className="px-6 py-4">
                        <a href="#" className="font-medium text-fg-brand hover:underline">Edit</a>
                    </td>
                </tr>
                <tr className="bg-neutral-primary-soft border-b border-default hover:bg-neutral-secondary-medium">
                    <td className="w-4 p-4">
                        <div className="flex items-center">
                            <input id="table-checkbox-15" type="checkbox" defaultValue="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                            <label htmlFor="table-checkbox-15" className="sr-only">Table checkbox</label>
                        </div>
                    </td>
                    <th scope="row" className="px-6 py-4 font-medium text-heading whitespace-nowrap">
                        Magic Mouse 2
                    </th>
                    <td className="px-6 py-4">
                        Black
                    </td>
                    <td className="px-6 py-4">
                        Accessories
                    </td>
                    <td className="px-6 py-4">
                        $99
                    </td>
                    <td className="px-6 py-4">
                        <a href="#" className="font-medium text-fg-brand hover:underline">Edit</a>
                    </td>
                </tr>
                <tr className="bg-neutral-primary-soft border-b border-default hover:bg-neutral-secondary-medium">
                    <td className="w-4 p-4">
                        <div className="flex items-center">
                            <input id="table-checkbox-16" type="checkbox" defaultValue="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                            <label htmlFor="table-checkbox-16" className="sr-only">Table checkbox</label>
                        </div>
                    </td>
                    <th scope="row" className="px-6 py-4 font-medium text-heading whitespace-nowrap">
                        Apple Watch
                    </th>
                    <td className="px-6 py-4">
                        Silver
                    </td>
                    <td className="px-6 py-4">
                        Accessories
                    </td>
                    <td className="px-6 py-4">
                        $179
                    </td>
                    <td className="px-6 py-4">
                        <a href="#" className="font-medium text-fg-brand hover:underline">Edit</a>
                    </td>
                </tr>
                <tr className="bg-neutral-primary-soft border-b border-default hover:bg-neutral-secondary-medium">
                    <td className="w-4 p-4">
                        <div className="flex items-center">
                            <input id="table-checkbox-17" type="checkbox" defaultValue="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                            <label htmlFor="table-checkbox-17" className="sr-only">Table checkbox</label>
                        </div>
                    </td>
                    <th scope="row" className="px-6 py-4 font-medium text-heading whitespace-nowrap">
                        iPad
                    </th>
                    <td className="px-6 py-4">
                        Gold
                    </td>
                    <td className="px-6 py-4">
                        Tablet
                    </td>
                    <td className="px-6 py-4">
                        $699
                    </td>
                    <td className="px-6 py-4">
                        <a href="#" className="font-medium text-fg-brand hover:underline">Edit</a>
                    </td>
                </tr>
                <tr className="bg-neutral-primary-soft hover:bg-neutral-secondary-medium">
                    <td className="w-4 p-4">
                         <div className="flex items-center">
                            <input id="table-checkbox-18" type="checkbox" defaultValue="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                            <label htmlFor="table-checkbox-18" className="sr-only">Table checkbox</label>
                        </div>
                    </td>
                    <th scope="row" className="px-6 py-4 font-medium text-heading whitespace-nowrap">
                        Apple iMac 27"
                    </th>
                    <td className="px-6 py-4">
                        Silver
                    </td>
                    <td className="px-6 py-4">
                        PC Desktop
                    </td>
                    <td className="px-6 py-4">
                        $3999
                    </td>
                    <td className="px-6 py-4">
                        <a href="#" className="font-medium text-fg-brand hover:underline">Edit</a>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
  )
}
