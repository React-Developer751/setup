export default function Select2() {
  return (
    <form className="max-w-sm mx-auto">
      <label htmlFor="countries_multiple" className="block mb-2.5 text-sm font-medium text-heading">Select an option</label>
      <select multiple id="countries_multiple" className="block w-full bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand px-3 py-2.5 shadow-xs placeholder:text-body">
        <option selected>Choose countries</option>
        <option value="US">United States</option>
        <option value="CA">Canada</option>
        <option value="FR">France</option>
        <option value="DE">Germany</option>
      </select>
    </form>
  )
}
