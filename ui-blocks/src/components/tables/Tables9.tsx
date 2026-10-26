export default function Tables9() {
  return (
    <div className="relative overflow-x-auto bg-neutral-primary shadow-xs rounded-base border border-default">
        <table className="w-full text-sm text-left rtl:text-right text-body">
            <thead className="text-sm text-body border-b border-default">
                <tr>
                    <th scope="col" className="px-6 py-3 bg-neutral-secondary-soft font-medium">
                        Product name
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                        Color
                    </th>
                    <th scope="col" className="px-6 py-3 bg-neutral-secondary-soft font-medium">
                        Category
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                        Price
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr className="border-b border-default">
                    <th scope="row" className="px-6 py-4 font-medium text-heading whitespace-nowrap bg-neutral-secondary-soft">
                        Apple MacBook Pro 17"
                    </th>
                    <td className="px-6 py-4">
                        Silver
                    </td>
                    <td className="px-6 py-4 bg-neutral-secondary-soft">
                        Laptop
                    </td>
                    <td className="px-6 py-4">
                        $2999
                    </td>
                </tr>
                <tr className="border-b border-default">
                    <th scope="row" className="px-6 py-4 font-medium text-heading whitespace-nowrap bg-neutral-secondary-soft">
                        Microsoft Surface Pro
                    </th>
                    <td className="px-6 py-4">
                        White
                    </td>
                    <td className="px-6 py-4 bg-neutral-secondary-soft">
                        Laptop PC
                    </td>
                    <td className="px-6 py-4">
                        $1999
                    </td>
                </tr>
                <tr className="border-b border-default">
                    <th scope="row" className="px-6 py-4 font-medium text-heading whitespace-nowrap bg-neutral-secondary-soft">
                        Magic Mouse 2
                    </th>
                    <td className="px-6 py-4">
                        Black
                    </td>
                    <td className="px-6 py-4 bg-neutral-secondary-soft">
                        Accessories
                    </td>
                    <td className="px-6 py-4">
                        $99
                    </td>
                </tr>
                <tr className="border-b border-default">
                    <th scope="row" className="px-6 py-4 font-medium text-heading whitespace-nowrap bg-neutral-secondary-soft">
                        Google Pixel Phone
                    </th>
                    <td className="px-6 py-4">
                        Gray
                    </td>
                    <td className="px-6 py-4 bg-neutral-secondary-soft">
                        Phone
                    </td>
                    <td className="px-6 py-4">
                        $799
                    </td>
                </tr>
                <tr>
                    <th scope="row" className="px-6 py-4 font-medium text-heading whitespace-nowrap bg-neutral-secondary-soft">
                        Apple Watch 5
                    </th>
                    <td className="px-6 py-4">
                        Red
                    </td>
                    <td className="px-6 py-4 bg-neutral-secondary-soft">
                        Wearables
                    </td>
                    <td className="px-6 py-4">
                        $999
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
  )
}
