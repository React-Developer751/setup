export default function Tabs6() {
  return (
    <div className="text-sm font-medium text-center text-body border-b border-default">
        <ul className="flex flex-wrap -mb-px">
            <li className="me-2">
                <a href="#" className="inline-block p-4 border-b border-transparent rounded-t-base hover:text-fg-brand hover:border-brand">Profile</a>
            </li>
            <li className="me-2">
                <a href="#" className="inline-block p-4 text-fg-brand border-b border-brand rounded-t-base active" aria-current="page">Dashboard</a>
            </li>
            <li className="me-2">
                <a href="#" className="inline-block p-4 border-b border-transparent rounded-t-base hover:text-fg-brand hover:border-brand">Settings</a>
            </li>
            <li className="me-2">
                <a href="#" className="inline-block p-4 border-b border-transparent rounded-t-base hover:text-fg-brand hover:border-brand">Contacts</a>
            </li>
            <li>
                <a className="inline-block p-4 text-fg-disabled rounded-t-base cursor-not-allowed dark:text-body">Disabled</a>
            </li>
        </ul>
    </div>
  )
}
