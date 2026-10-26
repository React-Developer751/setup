export default function Tables12() {
  return (
    <div className="relative overflow-x-auto">
        <table className="w-full text-sm text-left rtl:text-right text-body">
            <thead className="text-sm text-body bg-neutral-secondary-medium">
                <tr>
                    <th scope="col" className="px-6 py-3 rounded-s-base font-medium">
                        Product name
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                        Qty
                    </th>
                    <th scope="col" className="px-6 py-3 rounded-e-base font-medium">
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
                        1
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
                        1
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
                       1
                    </td>
                    <td className="px-6 py-4">
                        $99
                    </td>
                </tr>
            </tbody>
            <tfoot>
                <tr className="font-semibold text-heading">
                    <th scope="row" className="px-6 py-3 text-base">Total</th>
                    <td className="px-6 py-3">3</td>
                    <td className="px-6 py-3">21,000</td>
                </tr>
            </tfoot>
        </table>
    </div>
  )
}
