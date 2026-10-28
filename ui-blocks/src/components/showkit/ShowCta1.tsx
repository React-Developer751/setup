// One large centred statement with two buttons.
export default function ShowCta1() {
  return (
    <section data-ref="show-cta" className="show-cta">
      <div className="mx-auto max-w-5xl px-6 py-24 text-center sm:py-32">
        <h2 data-slot="title" className="text-4xl font-semibold leading-[1.05] tracking-tight text-gray-900 sm:text-6xl">
          Title
        </h2>
        <p data-slot="lead" className="mx-auto mt-5 max-w-xl text-base text-gray-600">
          Lead
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a data-slot="button" href="#contact" className="show-btn show-btn-primary inline-flex items-center justify-center bg-indigo-600 px-7 py-3 text-sm font-semibold text-white hover:opacity-90">
            Button
          </a>
          <a data-slot="button2" href="#features" className="show-btn show-btn-second inline-flex items-center justify-center border border-gray-400 px-7 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-100">
            Second button
          </a>
        </div>
      </div>
    </section>
  )
}
