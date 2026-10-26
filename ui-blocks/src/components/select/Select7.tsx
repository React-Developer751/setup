export default function Select7() {
  return (
    <form className="max-w-sm mx-auto">
      <label htmlFor="small" className="block mb-2.5 text-sm font-medium text-heading">Small select</label>
      <select id="small" className="block w-full px-3 py-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body mb-4">
        <option selected>Choose a country</option>
        <option value="US">United States</option>
        <option value="CA">Canada</option>
        <option value="FR">France</option>
        <option value="DE">Germany</option>
      </select>
      <label htmlFor="default" className="block mb-2.5 text-sm font-medium text-heading">Default select</label>
      <select id="default" className="block w-full px-3 py-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body mb-4">
        <option selected>Choose a country</option>
        <option value="US">United States</option>
        <option value="CA">Canada</option>
        <option value="FR">France</option>
        <option value="DE">Germany</option>
      </select>
      <label htmlFor="large" className="block mb-2.5 text-sm font-medium text-heading">Large select</label>
      <select id="large" className="block w-full bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand px-3.5 py-3 shadow-xs placeholder:text-body mb-4">
        <option selected>Choose a country</option>
        <option value="US">United States</option>
        <option value="CA">Canada</option>
        <option value="FR">France</option>
        <option value="DE">Germany</option>
      </select>
      <label htmlFor="extra-large" className="block mb-2.5 text-sm font-medium text-heading">Extra Large select</label>
      <select id="extra-large" className="block w-full bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand px-4 py-3.5 shadow-xs placeholder:text-body mb-4">
        <option selected>Choose a country</option>
        <option value="US">United States</option>
        <option value="CA">Canada</option>
        <option value="FR">France</option>
        <option value="DE">Germany</option>
      </select>
    </form>
  )
}
