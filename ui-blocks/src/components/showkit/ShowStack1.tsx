// Full-width product tiles one under the other (Apple, Tesla): a headline, one line, two buttons and a picture, the tiles alternate light and dark.
export default function ShowStack1() {
  return (
    <section data-ref="show-stack" className="show-stack">
      {[0, 1, 2, 3].map((i) => (
        <article key={i} data-slot="tile" className={`show-tile ${i % 2 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'} px-6 pt-14 text-center`}>
          <h2 data-slot="tile-title" className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Title
          </h2>
          <p data-slot="tile-text" className="mx-auto mt-3 max-w-xl text-lg opacity-80">
            Text
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a data-slot="tile-link" href="#contact" className="show-btn show-btn-primary inline-flex items-center justify-center bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:opacity-90">
              Learn more
            </a>
            <a data-slot="tile-link2" href="#contact" className="show-btn show-btn-second inline-flex items-center justify-center border border-current px-6 py-2.5 text-sm font-medium hover:opacity-80">
              Contact
            </a>
          </div>
          <div className="mx-auto mt-10 max-w-5xl overflow-hidden">
            <img data-slot="tile-image" alt="" className="mx-auto h-72 w-full object-cover sm:h-[26rem]" />
          </div>
        </article>
      ))}
    </section>
  )
}
