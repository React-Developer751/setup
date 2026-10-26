export default function Select5() {
  return (
    <form className="max-w-sm mx-auto">
      <label htmlFor="underline_select" className="sr-only">Underline select</label>
      <select id="underline_select" className="block py-2.5 ps-0 w-full text-sm text-body bg-transparent border-0 border-b-2 border-default-medium appearance-none focus:outline-none focus:ring-0 focus:border-brand peer">
          <option selected>Choose a country</option>
          <option value="US">United States</option>
          <option value="CA">Canada</option>
          <option value="FR">France</option>
          <option value="DE">Germany</option>
      </select>
    </form>
  )
}
