export default function Tables26() {
  return (
    <div className="relative overflow-x-auto bg-neutral-primary-soft shadow-xs rounded-base border border-default">
        <table className="w-full text-sm text-left rtl:text-right text-fg-brand-subtle">
            <thead className="text-sm text-white bg-brand">
                <tr>
                    <th scope="col" className="px-6 py-3 font-medium bg-brand-strong">
                        Product name
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                        Color
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium bg-brand-strong">
                        Category
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                        Price
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium bg-brand-strong">
                        Action
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr className="bg-brand border-b border-brand-light">
                    <th scope="row" className="px-6 py-4 font-medium text-fg-brand-subtle whitespace-nowrap bg-brand-strong">
                        Apple MacBook Pro 17"
                    </th>
                    <td className="px-6 py-4">
                        Silver
                    </td>
                    <td className="px-6 py-4 bg-brand-strong">
                        Laptop
                    </td>
                    <td className="px-6 py-4">
                        $2999
                    </td>
                    <td className="px-6 py-4 bg-brand-strong">
                        <a href="#" className="font-medium text-white hover:underline">Edit</a>
                    </td>
                </tr>
                <tr className="bg-brand border-b border-brand-light">
                    <th scope="row" className="px-6 py-4 font-medium text-fg-brand-subtle whitespace-nowrap bg-brand-strong">
                        Microsoft Surface Pro
                    </th>
                    <td className="px-6 py-4">
                        White
                    </td>
                    <td className="px-6 py-4 bg-brand-strong">
                        Laptop PC
                    </td>
                    <td className="px-6 py-4">
                        $1999
                    </td>
                    <td className="px-6 py-4 bg-brand-strong">
                        <a href="#" className="font-medium text-white hover:underline">Edit</a>
                    </td>
                </tr>
                <tr className="bg-brand border-b border-brand-light">
                    <th scope="row" className="px-6 py-4 font-medium text-fg-brand-subtle whitespace-nowrap bg-brand-strong">
                        Magic Mouse 2
                    </th>
                    <td className="px-6 py-4">
                        Black
                    </td>
                    <td className="px-6 py-4 bg-brand-strong">
                        Accessories
                    </td>
                    <td className="px-6 py-4">
                        $99
                    </td>
                    <td className="px-6 py-4 bg-brand-strong">
                        <a href="#" className="font-medium text-white hover:underline">Edit</a>
                    </td>
                </tr>
                <tr className="bg-brand border-b border-brand-light">
                    <th scope="row" className="px-6 py-4 font-medium text-fg-brand-subtle whitespace-nowrap bg-brand-strong">
                        Google Pixel Phone
                    </th>
                    <td className="px-6 py-4">
                        Gray
                    </td>
                    <td className="px-6 py-4 bg-brand-strong">
                        Phone
                    </td>
                    <td className="px-6 py-4">
                        $799
                    </td>
                    <td className="px-6 py-4 bg-brand-strong">
                        <a href="#" className="font-medium text-white hover:underline">Edit</a>
                    </td>
                </tr>
                <tr className="bg-brand">
                    <th scope="row" className="px-6 py-4 font-medium text-fg-brand-subtle whitespace-nowrap bg-brand-strong">
                        Apple Watch 5
                    </th>
                    <td className="px-6 py-4">
                        Red
                    </td>
                    <td className="px-6 py-4 bg-brand-strong">
                        Wearables
                    </td>
                    <td className="px-6 py-4">
                        $999
                    </td>
                    <td className="px-6 py-4 bg-brand-strong">
                        <a href="#" className="font-medium text-white hover:underline">Edit</a>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
  )
}
