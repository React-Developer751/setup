// A picture-led first screen (the pattern of Gucci, Tesla, Apple, Lusion): the picture fills the screen, a small label, a large headline, one line and two buttons.
// Each design (moodCss.ts) decides where the text sits, how round the picture is and what the buttons look like.
export default function ShowHero1() {
  return (
    <section data-ref="show-hero" className="show-hero relative isolate overflow-hidden bg-gray-900 text-white">
      <img data-slot="image" alt="" className="show-hero-img absolute inset-0 -z-10 size-full object-cover" />
      <div className="show-hero-scrim absolute inset-0 -z-10 bg-black/35" />
      <div className="show-hero-inner mx-auto flex min-h-[78vh] max-w-7xl flex-col items-center justify-end px-6 pb-14 pt-32 text-center sm:px-10">
        <p data-slot="eyebrow" className="text-xs font-semibold uppercase tracking-[0.25em] opacity-90">
          Eyebrow
        </p>
        <h1 data-slot="title" className="mt-4 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
          Headline
        </h1>
        <p data-slot="subtitle" className="mt-4 max-w-2xl text-base opacity-90 sm:text-lg">
          Subtitle
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a data-slot="button" href="#contact" className="show-btn show-btn-primary inline-flex items-center justify-center bg-white px-7 py-3 text-sm font-semibold text-black hover:opacity-90">
            Button
          </a>
          <a data-slot="button2" href="#features" className="show-btn show-btn-second inline-flex items-center justify-center border border-white/70 px-7 py-3 text-sm font-semibold text-white hover:bg-white/10">
            Second button
          </a>
        </div>
      </div>
    </section>
  )
}
