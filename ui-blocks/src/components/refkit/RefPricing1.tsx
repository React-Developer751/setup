// A price table (name, what is included, price) next to a dark "fixed quote" card.
export default function RefPricing1() {
  return (
    <section data-ref="pricing">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span data-slot="eyebrow" className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700">
            Eyebrow
          </span>
          <h2 data-slot="title" className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Title
          </h2>
        </div>
        <div className="mt-10 grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-gray-200">
            <div className="grid grid-cols-[1.4fr_1fr_auto] gap-3 border-b border-gray-200 px-5 py-3 text-[0.7rem] font-semibold uppercase tracking-widest text-gray-500">
              <span>Service</span>
              <span>Includes</span>
              <span>From</span>
            </div>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} data-slot="row" className="grid grid-cols-[1.4fr_1fr_auto] items-center gap-3 border-b border-gray-100 px-5 py-4 last:border-0">
                <span data-slot="row-name" className="text-sm font-bold text-gray-900">
                  Name
                </span>
                <span data-slot="row-text" className="text-sm text-gray-600">
                  Includes
                </span>
                <span data-slot="row-price" className="text-sm font-bold text-gray-900">
                  0
                </span>
              </div>
            ))}
          </div>
          <div className="rounded-3xl bg-gray-900 p-7 text-white">
            <p data-slot="card-title" className="text-xl font-bold">
              Card title
            </p>
            <p data-slot="card-text" className="mt-3 text-sm leading-relaxed opacity-80">
              Card text
            </p>
            <p className="mt-6 text-xs font-semibold uppercase tracking-widest opacity-70">Starting from</p>
            <p data-slot="card-price" className="text-4xl font-extrabold tracking-tight">
              0
            </p>
            <a data-slot="button" href="#contact" className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
              Button
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
