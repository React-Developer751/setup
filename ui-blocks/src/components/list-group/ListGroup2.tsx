export default function ListGroup2() {
  return (
    <div className="w-48 text-sm font-medium text-heading bg-neutral-primary-soft border border-default rounded-base">
        <a href="#" aria-current="true" className="block w-full px-4 py-2 text-fg-brand bg-neutral-secondary-medium border-b border-default rounded-t-base cursor-pointer">
            Profile
        </a>
        <a href="#" className="block w-full px-4 py-2 border-b border-default cursor-pointer hover:bg-neutral-secondary-medium hover:text-fg-brand focus:outline-none focus:ring-2 focus:ring-brand focus:text-fg-brand">
            Settings
        </a>
        <a href="#" className="block w-full px-4 py-2 border-b border-default cursor-pointer hover:bg-neutral-secondary-medium hover:text-fg-brand focus:outline-none focus:ring-2 focus:ring-brand focus:text-fg-brand">
            Messages
        </a>
        <a href="#" className="block w-full px-4 py-2 rounded-b-base cursor-pointer hover:bg-neutral-secondary-medium hover:text-fg-brand focus:outline-none focus:ring-2 focus:ring-brand focus:text-fg-brand">
            Download
        </a>
    </div>
  )
}
