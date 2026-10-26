export default function Tabs8() {
  return (
    <ul className="flex flex-wrap text-sm font-medium text-center text-body">
        <li className="me-2">
            <a href="#" className="inline-block px-4 py-2.5 text-white bg-brand rounded-base active" aria-current="page">Tab 1</a>
        </li>
        <li className="me-2">
            <a href="#" className="inline-block px-4 py-3 rounded-base hover:text-heading hover:bg-neutral-secondary-soft">Tab 2</a>
        </li>
        <li className="me-2">
            <a href="#" className="inline-block px-4 py-3 rounded-base hover:text-heading hover:bg-neutral-secondary-soft">Tab 3</a>
        </li>
        <li className="me-2">
            <a href="#" className="inline-block px-4 py-3 rounded-base hover:text-heading hover:bg-neutral-secondary-soft">Tab 4</a>
        </li>
        <li>
            <a className="inline-block px-4 py-3 text-fg-disabled cursor-not-allowed">Tab 5</a>
        </li>
    </ul>
  )
}
