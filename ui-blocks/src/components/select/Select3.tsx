// @ts-nocheck - markup of a third-party snippet kept as it is (non-standard attributes)
export default function Select3() {
  return (
    <form className="max-w-sm mx-auto">
      <label htmlFor="years" className="block mb-2.5 text-sm font-medium text-heading">Select an option</label>
      <select id="years" size="5" className="block w-full bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand px-3 py-2.5 shadow-xs placeholder:text-body">
        <option>2016</option>
        <option>2017</option>
        <option>2018</option>
        <option>2019</option>
        <option>2020</option>
        <option>2021</option>
        <option>2022</option>
      </select>
    </form>
  )
}
