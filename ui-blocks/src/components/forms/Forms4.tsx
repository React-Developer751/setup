export default function Forms4() {
  return (
    <form className="max-w-sm mx-auto space-y-4">
      <input type="text" id="disabled-input" aria-label="disabled input" className="bg-neutral-secondary-medium border border-default-medium text-fg-disabled text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" defaultValue="Disabled input" disabled />
      <input type="text" id="disabled-input-2" aria-label="disabled input 2" className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" defaultValue="Disabled readonly input" disabled readOnly />
    </form>
  )
}
