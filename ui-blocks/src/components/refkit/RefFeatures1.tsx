// A centred heading and a grid of tinted cards with a dark icon tile, a small tag chip, a title and a text.
const Icon = () => (
  <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
    <path d="M14 3v5h5M9 13h6M9 17h4" />
  </svg>
)

export default function RefFeatures1() {
  return (
    <section data-ref="features">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span data-slot="eyebrow" className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700">
            Eyebrow
          </span>
          <h2 data-slot="title" className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Title
          </h2>
          <p data-slot="lead" className="mt-4 text-base leading-relaxed text-gray-600">
            Lead
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <article key={i} data-slot="card" className="flex flex-col rounded-3xl bg-white p-6 ring-1 ring-gray-200">
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <Icon />
                </span>
                <span data-slot="card-tag" className="rounded-full bg-gray-100 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-gray-600">
                  Tag
                </span>
              </div>
              <h3 data-slot="card-title" className="mt-5 text-lg font-bold text-gray-900">
                Card title
              </h3>
              <p data-slot="card-text" className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">
                Card text
              </p>
              <a data-slot="card-link" href="#contact" className="mt-4 text-sm font-semibold text-indigo-700 hover:underline">
                Read more
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
