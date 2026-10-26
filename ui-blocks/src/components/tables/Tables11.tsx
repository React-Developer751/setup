export default function Tables11() {
  return (
    <div className="relative overflow-x-auto bg-neutral-primary-soft shadow-xs rounded-base border border-default">
        <table className="w-full text-sm text-left rtl:text-right text-body">
            <thead className="text-sm text-body bg-neutral-secondary-medium border-b border-default-medium">
                <tr>
                    <th scope="col" className="px-6 py-3 font-medium">
                        Product name
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                        <div className="flex items-center">
                            Color
                            <a href="#">
                                <svg className="w-4 h-4 ms-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m8 15 4 4 4-4m0-6-4-4-4 4" /></svg>
                            </a>
                        </div>
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                        <div className="flex items-center">
                            Category
                            <a href="#">
                                <svg className="w-4 h-4 ms-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m8 15 4 4 4-4m0-6-4-4-4 4" /></svg>
                            </a>
                        </div>
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                        <div className="flex items-center">
                            Price
                            <a href="#">
                                <svg className="w-4 h-4 ms-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m8 15 4 4 4-4m0-6-4-4-4 4" /></svg>
                            </a>
                        </div>
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                        <span className="sr-only">Edit</span>
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr className="bg-neutral-primary-soft border-b  border-default">
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
                    <td className="px-6 py-4 text-right">
                        <a href="#" className="font-medium text-fg-brand hover:underline">Edit</a>
                    </td>
                </tr>
                <tr className="bg-neutral-primary-soft border-b  border-default">
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
                    <td className="px-6 py-4 text-right">
                        <a href="#" className="font-medium text-fg-brand hover:underline">Edit</a>
                    </td>
                </tr>
                <tr className="bg-neutral-primary-soft">
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
                    <td className="px-6 py-4 text-right">
                        <a href="#" className="font-medium text-fg-brand hover:underline">Edit</a>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
  )
}
