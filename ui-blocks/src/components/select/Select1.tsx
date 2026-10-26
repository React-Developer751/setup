export default function Select1() {
  return (
    <form className="max-w-sm mx-auto">
      <label htmlFor="countries" className="block mb-2.5 text-sm font-medium text-heading">Select an option</label>
      <select id="countries" className="block w-full px-3 py-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body">
        <option selected>Choose a country</option>
        <option value="US">United States</option>
        <option value="CA">Canada</option>
        <option value="FR">France</option>
        <option value="DE">Germany</option>
      </select>
    </form>
  )
}
