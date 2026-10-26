export default function Tables13() {
  return (
    <div className="relative overflow-x-auto bg-neutral-primary-soft shadow-xs rounded-base border border-default">
        <table className="w-full text-sm text-left rtl:text-right text-body">
            <caption className="p-5 text-lg font-medium text-left rtl:text-right text-heading">
                Our products
                <p className="mt-1.5 text-sm font-normal text-body">Browse a list of Flowbite products designed to help you work and play, stay organized, get answers, keep in touch, grow your business, and more.</p>
            </caption>
            <thead className="text-sm text-body bg-neutral-secondary-medium border-b border-t border-default-medium">
                <tr>
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
                        <span className="sr-only">Edit</span>
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr className="bg-neutral-primary-soft border-b border-default">
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
                <tr className="bg-neutral-primary-soft border-b border-default">
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
