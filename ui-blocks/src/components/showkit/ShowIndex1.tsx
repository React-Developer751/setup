// A project index: one large row per service, a number, a title, a short line and an arrow, thin rules between the rows.
export default function ShowIndex1() {
  return (
    <section data-ref="show-index" className="show-index">
      <div className="mx-auto max-w-[110rem] px-5 py-20 sm:px-10">
        <div className="flex items-end justify-between gap-6 border-b border-gray-300 pb-6">
          <h2 data-slot="title" className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-900">
            Title
          </h2>
          <p data-slot="lead" className="hidden max-w-md text-right text-sm text-gray-600 sm:block">
            Lead
          </p>
        </div>
        <ol className="m-0 list-none p-0">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <li key={i} data-slot="row" className="show-row group grid grid-cols-[3rem_1fr_auto] items-baseline gap-4 border-b border-gray-300 py-7 sm:grid-cols-[5rem_1.2fr_1fr_auto]">
              <span data-slot="row-number" className="text-xs font-semibold tracking-[0.2em] text-gray-500">
                01
              </span>
              <span data-slot="row-title" className="text-3xl font-medium tracking-[-0.03em] text-gray-900 sm:text-5xl">
                Title
              </span>
              <span data-slot="row-text" className="hidden text-sm text-gray-600 sm:block">
                Text
              </span>
              <span aria-hidden="true" className="text-2xl text-gray-900 transition-transform group-hover:translate-x-2">
                &rarr;
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
