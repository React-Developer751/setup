export default function Tables16() {
  return (
    <div className="relative overflow-x-auto bg-neutral-primary-soft shadow-xs rounded-base border border-default">
        <table className="w-full text-sm text-left rtl:text-right text-body">
            <thead className="text-sm text-body bg-neutral-secondary-medium border-b border-default-medium">
                <tr>
                    <th scope="col" className="p-4">
                        <div className="flex items-center">
                            <input id="table-checkbox" type="checkbox" defaultValue="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                            <label htmlFor="table-checkbox" className="sr-only">Table checkbox</label>
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
                        Accessories
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                        Available
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                        Price
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                        Weight
                    </th>
                    <th scope="col" className="px-6 py-3  font-medium">
                        Action
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr className="bg-neutral-primary-soft border-b border-default hover:bg-neutral-secondary-medium">
                    <td className="w-4 p-4">
                        <div className="flex items-center">
                            <input id="table-checkbox-2" type="checkbox" defaultValue="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                            <label htmlFor="table-checkbox-2" className="sr-only">Table checkbox</label>
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
                        Yes
                    </td>
                    <td className="px-6 py-4">
                        Yes
                    </td>
                    <td className="px-6 py-4">
                        $2999
                    </td>
                    <td className="px-6 py-4">
                        3.0 lb.
                    </td>
                    <td className="flex items-center px-6 py-4">
                        <a href="#" className="font-medium text-fg-brand hover:underline">Edit</a>
                        <a href="#" className="font-medium text-danger hover:underline ms-3">Remove</a>
                    </td>
                </tr>
                <tr className="bg-neutral-primary-soft border-b border-default hover:bg-neutral-secondary-medium">
                    <td className="w-4 p-4">
                        <div className="flex items-center">
                            <input id="table-checkbox-3" type="checkbox" defaultValue="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                            <label htmlFor="table-checkbox-3" className="sr-only">Table checkbox</label>
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
                        No
                    </td>
                    <td className="px-6 py-4">
                        Yes
                    </td>
                    <td className="px-6 py-4">
                        $1999
                    </td>
                    <td className="px-6 py-4">
                        1.0 lb.
                    </td>
                    <td className="flex items-center px-6 py-4">
                        <a href="#" className="font-medium text-fg-brand hover:underline">Edit</a>
                        <a href="#" className="font-medium text-danger hover:underline ms-3">Remove</a>
                    </td>
                </tr>
                <tr className="bg-neutral-primary-soft border-b border-default hover:bg-neutral-secondary-medium">
                    <td className="w-4 p-4">
                        <div className="flex items-center">
                            <input id="table-checkbox-4" type="checkbox" defaultValue="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                            <label htmlFor="table-checkbox-4" className="sr-only">Table checkbox</label>
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
                        Yes
                    </td>
                    <td className="px-6 py-4">
                        No
                    </td>
                    <td className="px-6 py-4">
                        $99
                    </td>
                    <td className="px-6 py-4">
                        0.2 lb.
                    </td>
                    <td className="flex items-center px-6 py-4">
                        <a href="#" className="font-medium text-fg-brand hover:underline">Edit</a>
                        <a href="#" className="font-medium text-danger hover:underline ms-3">Remove</a>
                    </td>
                </tr>
                <tr className="bg-neutral-primary-soft border-b border-default hover:bg-neutral-secondary-medium">
                    <td className="w-4 p-4">
                        <div className="flex items-center">
                            <input id="table-checkbox-5" type="checkbox" defaultValue="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                            <label htmlFor="table-checkbox-5" className="sr-only">Table checkbox</label>
                        </div>
                    </td>
                    <th scope="row" className="px-6 py-4 font-medium text-heading whitespace-nowrap">
                        Apple Watch
                    </th>
                    <td className="px-6 py-4">
                        Black
                    </td>
                    <td className="px-6 py-4">
                        Watches
                    </td>
                    <td className="px-6 py-4">
                        Yes
                    </td>
                    <td className="px-6 py-4">
                        No
                    </td>
                    <td className="px-6 py-4">
                        $199
                    </td>
                    <td className="px-6 py-4">
                        0.12 lb.
                    </td>
                    <td className="flex items-center px-6 py-4">
                        <a href="#" className="font-medium text-fg-brand hover:underline">Edit</a>
                        <a href="#" className="font-medium text-danger hover:underline ms-3">Remove</a>
                    </td>
                </tr>
                <tr className="bg-neutral-primary-soft border-b border-default hover:bg-neutral-secondary-medium">
                    <td className="w-4 p-4">
                        <div className="flex items-center">
                            <input id="table-checkbox-6" type="checkbox" defaultValue="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                            <label htmlFor="table-checkbox-6" className="sr-only">Table checkbox</label>
                        </div>
                    </td>
                    <th scope="row" className="px-6 py-4 font-medium text-heading whitespace-nowrap">
                        Apple iMac
                    </th>
                    <td className="px-6 py-4">
                        Silver
                    </td>
                    <td className="px-6 py-4">
                        PC
                    </td>
                    <td className="px-6 py-4">
                        Yes
                    </td>
                    <td className="px-6 py-4">
                        Yes
                    </td>
                    <td className="px-6 py-4">
                        $2999
                    </td>
                    <td className="px-6 py-4">
                        7.0 lb.
                    </td>
                    <td className="flex items-center px-6 py-4">
                        <a href="#" className="font-medium text-fg-brand hover:underline">Edit</a>
                        <a href="#" className="font-medium text-danger hover:underline ms-3">Remove</a>
                    </td>
                </tr>
                <tr className="bg-neutral-primary-soft border-b border-default hover:bg-neutral-secondary-medium">
                    <td className="w-4 p-4">
                        <div className="flex items-center">
                            <input id="table-checkbox-7" type="checkbox" defaultValue="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                            <label htmlFor="table-checkbox-7" className="sr-only">Table checkbox</label>
                        </div>
                    </td>
                    <th scope="row" className="px-6 py-4 font-medium text-heading whitespace-nowrap">
                        Apple AirPods
                    </th>
                    <td className="px-6 py-4">
                        White
                    </td>
                    <td className="px-6 py-4">
                        Accessories
                    </td>
                    <td className="px-6 py-4">
                        No
                    </td>
                    <td className="px-6 py-4">
                        Yes
                    </td>
                    <td className="px-6 py-4">
                        $399
                    </td>
                    <td className="px-6 py-4">
                        38 g
                    </td>
                    <td className="flex items-center px-6 py-4">
                        <a href="#" className="font-medium text-fg-brand hover:underline">Edit</a>
                        <a href="#" className="font-medium text-danger hover:underline ms-3">Remove</a>
                    </td>
                </tr>
                <tr className="bg-neutral-primary-soft border-b border-default hover:bg-neutral-secondary-medium">
                    <td className="w-4 p-4">
                        <div className="flex items-center">
                            <input id="table-checkbox-8" type="checkbox" defaultValue="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                            <label htmlFor="table-checkbox-8" className="sr-only">Table checkbox</label>
                        </div>
                    </td>
                    <th scope="row" className="px-6 py-4 font-medium text-heading whitespace-nowrap">
                        iPad Pro
                    </th>
                    <td className="px-6 py-4">
                        Gold
                    </td>
                    <td className="px-6 py-4">
                        Tablet
                    </td>
                    <td className="px-6 py-4">
                        No
                    </td>
                    <td className="px-6 py-4">
                        Yes
                    </td>
                    <td className="px-6 py-4">
                        $699
                    </td>
                    <td className="px-6 py-4">
                        1.3 lb.
                    </td>
                    <td className="flex items-center px-6 py-4">
                        <a href="#" className="font-medium text-fg-brand hover:underline">Edit</a>
                        <a href="#" className="font-medium text-danger hover:underline ms-3">Remove</a>
                    </td>
                </tr>
                <tr className="bg-neutral-primary-soft border-b border-default hover:bg-neutral-secondary-medium">
                    <td className="w-4 p-4">
                        <div className="flex items-center">
                            <input id="table-checkbox-9" type="checkbox" defaultValue="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                            <label htmlFor="table-checkbox-9" className="sr-only">Table checkbox</label>
                        </div>
                    </td>
                    <th scope="row" className="px-6 py-4 font-medium text-heading whitespace-nowrap">
                        Magic Keyboard
                    </th>
                    <td className="px-6 py-4">
                        Black
                    </td>
                    <td className="px-6 py-4">
                        Accessories
                    </td>
                    <td className="px-6 py-4">
                        Yes
                    </td>
                    <td className="px-6 py-4">
                        Yes
                    </td>
                    <td className="px-6 py-4">
                        $99
                    </td>
                    <td className="px-6 py-4">
                        453 g
                    </td>
                    <td className="flex items-center px-6 py-4">
                        <a href="#" className="font-medium text-fg-brand hover:underline">Edit</a>
                        <a href="#" className="font-medium text-danger hover:underline ms-3">Remove</a>
                    </td>
                </tr>
                <tr className="bg-neutral-primary-soft border-b border-default hover:bg-neutral-secondary-medium">
                    <td className="w-4 p-4">
                        <div className="flex items-center">
                            <input id="table-checkbox-10" type="checkbox" defaultValue="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                            <label htmlFor="table-checkbox-10" className="sr-only">Table checkbox</label>
                        </div>
                    </td>
                    <th scope="row" className="px-6 py-4 font-medium text-heading whitespace-nowrap">
                        Apple TV 4K
                    </th>
                    <td className="px-6 py-4">
                        Black
                    </td>
                    <td className="px-6 py-4">
                        TV
                    </td>
                    <td className="px-6 py-4">
                        Yes
                    </td>
                    <td className="px-6 py-4">
                        No
                    </td>
                    <td className="px-6 py-4">
                        $179
                    </td>
                    <td className="px-6 py-4">
                        1.78 lb.
                    </td>
                    <td className="flex items-center px-6 py-4">
                        <a href="#" className="font-medium text-fg-brand hover:underline">Edit</a>
                        <a href="#" className="font-medium text-danger hover:underline ms-3">Remove</a>
                    </td>
                </tr>
                <tr className="bg-neutral-primary-soft hover:bg-neutral-secondary-medium">
                    <td className="w-4 p-4">
                        <div className="flex items-center">
                            <input id="table-checkbox-11" type="checkbox" defaultValue="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                            <label htmlFor="table-checkbox-11" className="sr-only">Table checkbox</label>
                        </div>
                    </td>
                    <th scope="row" className="px-6 py-4 font-medium text-heading whitespace-nowrap">
                        AirTag
                    </th>
                    <td className="px-6 py-4">
                        Silver
                    </td>
                    <td className="px-6 py-4">
                        Accessories
                    </td>
                    <td className="px-6 py-4">
                        Yes
                    </td>
                    <td className="px-6 py-4">
                        No
                    </td>
                    <td className="px-6 py-4">
                        $29
                    </td>
                    <td className="px-6 py-4">
                        53 g
                    </td>
                    <td className="flex items-center px-6 py-4">
                        <a href="#" className="font-medium text-fg-brand hover:underline">Edit</a>
                        <a href="#" className="font-medium text-danger hover:underline ms-3">Remove</a>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
  )
}
