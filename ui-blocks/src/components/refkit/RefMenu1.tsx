// A menu board: categories as cards, each with its dishes or drinks on dotted lines (name, a short note). No prices: the prices are the owner's to write.
export default function RefMenu1() {
  return (
    <section data-ref="menu">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span data-slot="eyebrow" className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700">
            Eyebrow
          </span>
          <h2 data-slot="title" className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            On the menu
          </h2>
          <p data-slot="lead" className="mt-3 text-sm leading-relaxed text-gray-600">
            Lead
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} data-slot="cat" className="rounded-3xl bg-white p-6 ring-1 ring-gray-200 sm:p-7">
              <h3 data-slot="cat-name" className="text-lg font-bold tracking-tight text-gray-900">
                Category
              </h3>
              <ul className="mt-4">
                {[0, 1, 2, 3, 4, 5].map((j) => (
                  <li key={j} data-slot="item" className="flex items-baseline gap-3 border-t border-dotted border-gray-300 py-2.5 first:border-0">
                    <span data-slot="item-name" className="text-sm font-semibold text-gray-900">
                      Item
                    </span>
                    <span data-slot="item-leader" className="flex-1" aria-hidden="true" />
                    <span data-slot="item-note" className="text-right text-xs text-gray-500">
                      Note
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
