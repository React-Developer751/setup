export default function Tables14() {
  return (
    <div className="relative overflow-x-auto">
        <table className="w-full text-sm text-left rtl:text-right text-body">
            <thead className="text-sm text-heading">
                <tr>
                    <th scope="col" className="px-6 py-3 font-semibold">
                        Product name
                    </th>
                    <th scope="col" className="px-6 py-3 font-semibold">
                        Color
                    </th>
                    <th scope="col" className="px-6 py-3 font-semibold">
                        Category
                    </th>
                    <th scope="col" className="px-6 py-3 font-semibold">
                        Price
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr className="bg-neutral-primary">
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
                </tr>
                <tr className="bg-neutral-primary">
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
                </tr>
                <tr className="bg-neutral-primary">
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
                </tr>
            </tbody>
        </table>
    </div>
  )
}
