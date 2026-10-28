// The closing band: a headline, a line, two buttons and a row of ticks.
export default function RefCta1() {
  return (
    <section data-ref="cta">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:py-16">
        <div className="ref-cta-box rounded-[2rem] bg-gray-900 px-6 py-12 text-center text-white sm:px-12 lg:py-16">
          <h2 data-slot="title" className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Title
          </h2>
          <p data-slot="lead" className="mx-auto mt-4 max-w-2xl text-base opacity-80">
            Lead
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a data-slot="button" href="#contact" className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:opacity-90">
              Button
            </a>
            <a data-slot="button2" href="#features" className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
              Second button
            </a>
          </div>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm opacity-80">
            {[0, 1, 2].map((i) => (
              <li key={i} data-slot="tick" className="inline-flex items-center gap-2">
                <svg className="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z" clipRule="evenodd" />
                </svg>
                <span data-slot="tick-text">Tick</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
