export default function Tabs13() {
  return (
    <>
      <div className="mb-4 border-b border-default">
          <ul className="flex flex-wrap -mb-px text-sm font-medium text-center" id="default-styled-tab" data-tabs-toggle="#default-styled-tab-content" data-tabs-active-classes="text-purple hover:text-purple border-purple" data-tabs-inactive-classes="dark:border-transparent text-body hover:text-fg-brand border-default hover:border-brand" role="tablist">
              <li className="me-2" role="presentation">
                  <button className="inline-block p-4 border-b-2 rounded-t-base" id="profile-styled-tab" data-tabs-target="#styled-profile" type="button" role="tab" aria-controls="profile" aria-selected="false">Profile</button>
              </li>
              <li className="me-2" role="presentation">
                  <button className="inline-block p-4 border-b-2 rounded-t-base hover:text-fg-brand hover:border-brand" id="dashboard-styled-tab" data-tabs-target="#styled-dashboard" type="button" role="tab" aria-controls="dashboard" aria-selected="false">Dashboard</button>
              </li>
              <li className="me-2" role="presentation">
                  <button className="inline-block p-4 border-b-2 rounded-t-base hover:text-fg-brand hover:border-brand" id="settings-styled-tab" data-tabs-target="#styled-settings" type="button" role="tab" aria-controls="settings" aria-selected="false">Settings</button>
              </li>
              <li role="presentation">
                  <button className="inline-block p-4 border-b-2 rounded-t-base hover:text-fg-brand hover:border-brand" id="contacts-styled-tab" data-tabs-target="#styled-contacts" type="button" role="tab" aria-controls="contacts" aria-selected="false">Contacts</button>
              </li>
          </ul>
      </div>
      <div id="default-styled-tab-content">
          <div className="hidden p-4 rounded-base bg-neutral-secondary-soft" id="styled-profile" role="tabpanel" aria-labelledby="profile-tab">
              <p className="text-sm text-body">This is some placeholder content the <strong className="font-medium text-heading">Profile tab's associated content</strong>. Clicking another tab will toggle the visibility of this one for the next. The tab JavaScript swaps classes to control the content visibility and styling.</p>
          </div>
          <div className="hidden p-4 rounded-base bg-neutral-secondary-soft" id="styled-dashboard" role="tabpanel" aria-labelledby="dashboard-tab">
              <p className="text-sm text-body">This is some placeholder content the <strong className="font-medium text-heading">Dashboard tab's associated content</strong>. Clicking another tab will toggle the visibility of this one for the next. The tab JavaScript swaps classes to control the content visibility and styling.</p>
          </div>
          <div className="hidden p-4 rounded-base bg-neutral-secondary-soft" id="styled-settings" role="tabpanel" aria-labelledby="settings-tab">
              <p className="text-sm text-body">This is some placeholder content the <strong className="font-medium text-heading">Settings tab's associated content</strong>. Clicking another tab will toggle the visibility of this one for the next. The tab JavaScript swaps classes to control the content visibility and styling.</p>
          </div>
          <div className="hidden p-4 rounded-base bg-neutral-secondary-soft" id="styled-contacts" role="tabpanel" aria-labelledby="contacts-tab">
              <p className="text-sm text-body">This is some placeholder content the <strong className="font-medium text-heading">Contacts tab's associated content</strong>. Clicking another tab will toggle the visibility of this one for the next. The tab JavaScript swaps classes to control the content visibility and styling.</p>
          </div>
      </div>
    </>
  )
}
