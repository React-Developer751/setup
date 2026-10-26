export default function Tabs5() {
  return (
    <ul className="flex flex-wrap text-sm font-medium text-center text-body border-b border-default">
        <li className="me-2">
            <a href="#" aria-current="page" className="inline-block p-4 text-fg-brand bg-neutral-secondary-soft rounded-t-base active">Profile</a>
        </li>
        <li className="me-2">
            <a href="#" className="inline-block p-4 rounded-t-base hover:text-heading hover:bg-neutral-secondary-soft">Dashboard</a>
        </li>
        <li className="me-2">
            <a href="#" className="inline-block p-4 rounded-t-base hover:text-heading hover:bg-neutral-secondary-soft">Settings</a>
        </li>
        <li className="me-2">
            <a href="#" className="inline-block p-4 rounded-t-base hover:text-heading hover:bg-neutral-secondary-soft">Contacts</a>
        </li>
        <li>
            <a className="inline-block p-4 text-fg-disabled rounded-t-base cursor-not-allowed">Disabled</a>
        </li>
    </ul>
  )
}
