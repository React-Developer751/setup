// @ts-nocheck - markup of a third-party snippet kept as it is (non-standard attributes)
export default function Avatar19() {
  return (
    <>
      <img id="avatarButton" type="button" data-dropdown-toggle="userDropdown" data-dropdown-placement="bottom-start" className="w-10 h-10 rounded-full cursor-pointer" src="/docs/images/people/profile-picture-5.jpg" alt="User dropdown" />

      {/* Dropdown menu */}
      <div id="userDropdown" className="z-10 hidden bg-neutral-primary-medium border border-default-medium rounded-base shadow-lg w-44">
          <div className="px-4 py-3 border-b border-default-medium text-sm text-heading">
            <div className="font-medium">Bonnie Green</div>
            <div className="truncate">name@flowbite.com</div>
          </div>
          <ul className="p-2 text-sm text-body font-medium" aria-labelledby="avatarButton">
            <li>
              <a href="#" className="block w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded-md">Dashboard</a>
            </li>
            <li>
              <a href="#" className="block w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded-md">Settings</a>
            </li>
            <li>
              <a href="#" className="block w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded-md">Earnings</a>
            </li>
            <li>
              <a href="#" className="block w-full p-2 hover:bg-neutral-tertiary-medium text-fg-danger rounded-md">Sign out</a>
            </li>
          </ul>
      </div>
    </>
  )
}
