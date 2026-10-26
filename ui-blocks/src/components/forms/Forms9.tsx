export default function Forms9() {
  return (
    <form className="max-w-sm mx-auto">
      <div className="mb-6">
        <label htmlFor="success" className="block mb-2.5 text-sm font-medium text-fg-success-strong">Your name</label>
        <input type="text" id="success" className="bg-success-soft border border-success-subtle text-fg-success-strong text-sm rounded-base focus:ring-success focus:border-success block w-full px-3 py-2.5 shadow-xs placeholder:text-fg-success-strong" placeholder="Success input" />
        <p className="mt-2.5 text-sm text-fg-success-strong"><span className="font-medium">Well done!</span> Some success message.</p>
      </div>
      <div className="mb-6">
        <label htmlFor="danger" className="block mb-2.5 text-sm font-medium text-fg-danger-strong">Your name</label>
        <input type="text" id="danger" className="bg-danger-soft border border-danger-subtle text-fg-danger-strong text-sm rounded-base focus:ring-danger focus:border-danger block w-full px-3 py-2.5 shadow-xs placeholder:text-fg-danger-strong" placeholder="Error input" />
        <p className="mt-2.5 text-sm text-fg-danger-strong"><span className="font-medium">Oh, snapp!</span> Some error message.</p>
      </div>
    </form>
  )
}
