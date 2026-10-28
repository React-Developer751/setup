// Hero in the pattern of the translation-service sites: an eyebrow chip, a headline with a coloured phrase, tick chips, two buttons and a quote card.
// The slots (data-slot) are filled by fillRef.ts; the form is a design element (it opens the visitor's mail program on the exported site).
const Tick = () => (
  <svg className="size-4 shrink-0 text-indigo-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z" clipRule="evenodd" />
  </svg>
)

export default function RefHero1() {
  return (
    <section data-ref="hero" className="relative">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:py-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-700 ring-1 ring-gray-200">
            <Tick />
            <span data-slot="eyebrow">Eyebrow</span>
          </span>
          <h1 data-slot="title" className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Headline
          </h1>
          <p data-slot="subtitle" className="mt-5 max-w-xl text-base leading-relaxed text-gray-600 sm:text-lg">
            Subtitle
          </p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} data-slot="chip" className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-gray-200">
                <Tick />
                <span data-slot="chip-text">Chip</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <a data-slot="button" href="#contact" className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
              Button
            </a>
            <a data-slot="button2" href="#features" className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50">
              Second button
            </a>
          </div>
        </div>
        <form className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-gray-200" onSubmit={(e) => e.preventDefault()}>
          <div className="bg-indigo-600 px-6 py-5 text-center text-white">
            <p data-slot="form-title" className="text-lg font-bold">
              Form title
            </p>
            <p data-slot="form-text" className="mt-1 text-sm opacity-90">
              Form text
            </p>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            {['Full name', 'Email', 'Phone', 'Subject'].map((label) => (
              <label key={label} className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                {label}
                <input type="text" placeholder={label} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none" />
              </label>
            ))}
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 sm:col-span-2">
              Message
              <textarea rows={3} placeholder="Message" className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none" />
            </label>
            <button data-slot="form-button" type="submit" className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 sm:col-span-2">
              Send
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
