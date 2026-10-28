// A type-led first screen (Obys, 14islands, Unseen, Immersive Garden): a row of tiny labels, a giant headline, a short line and text links, then one wide picture strip.
export default function ShowTypeHero1() {
  return (
    <section data-ref="show-type-hero" className="show-type-hero">
      <div className="mx-auto max-w-[110rem] px-5 pb-10 pt-28 sm:px-10">
        <div className="flex items-start justify-between gap-6 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-600">
          <span data-slot="eyebrow">Eyebrow</span>
          <span data-slot="meta" className="text-right">
            Meta
          </span>
        </div>
        <h1 data-slot="title" className="mt-8 text-[clamp(2.6rem,9vw,9.5rem)] font-medium leading-[0.92] tracking-[-0.04em] text-gray-900">
          Headline
        </h1>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_28rem] lg:items-end">
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold uppercase tracking-[0.14em]">
            <a data-slot="button" href="#contact" className="show-link border-b border-current pb-1 text-gray-900">
              Button
            </a>
            <a data-slot="button2" href="#features" className="show-link border-b border-transparent pb-1 text-gray-600 hover:border-current">
              Second button
            </a>
          </div>
          <p data-slot="subtitle" className="text-base leading-relaxed text-gray-600">
            Subtitle
          </p>
        </div>
      </div>
      <div className="px-5 pb-6 sm:px-10">
        <img data-slot="image" alt="" className="show-strip h-[48vh] w-full object-cover sm:h-[62vh]" />
      </div>
    </section>
  )
}
