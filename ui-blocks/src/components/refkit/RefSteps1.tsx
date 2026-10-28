// Numbered step cards with a small label and a large ghost numeral.
export default function RefSteps1() {
  return (
    <section data-ref="steps">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span data-slot="eyebrow" className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700">
            Eyebrow
          </span>
          <h2 data-slot="title" className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Title
          </h2>
        </div>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <li key={i} data-slot="step" className="relative overflow-hidden rounded-3xl bg-white p-6 ring-1 ring-gray-200">
              <span data-slot="step-number" aria-hidden="true" className="pointer-events-none absolute -top-2 right-4 text-7xl font-extrabold text-gray-200 opacity-60">
                01
              </span>
              <p data-slot="step-label" className="text-[0.7rem] font-semibold uppercase tracking-widest text-gray-500">
                Step
              </p>
              <h3 data-slot="step-title" className="mt-2 text-lg font-bold text-gray-900">
                Step title
              </h3>
              <p data-slot="step-text" className="mt-2 text-sm leading-relaxed text-gray-600">
                Step text
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
