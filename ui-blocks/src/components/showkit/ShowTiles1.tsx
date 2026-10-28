// Edge-to-edge picture tiles with a small caption under each (Gucci, Nowness).
export default function ShowTiles1() {
  return (
    <section data-ref="show-tiles" className="show-tiles">
      <div className="mx-auto max-w-7xl px-6 pb-6 pt-16 text-center">
        <h2 data-slot="title" className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-900">
          Title
        </h2>
        <p data-slot="lead" className="mx-auto mt-3 max-w-xl text-sm text-gray-600">
          Lead
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <figure key={i} data-slot="tile" className="show-tile m-0">
            <div className="aspect-[4/5] overflow-hidden bg-gray-200">
              <img data-slot="tile-image" alt="" className="size-full object-cover" />
            </div>
            <figcaption className="px-4 py-5 text-center">
              <span data-slot="tile-title" className="block text-xs font-semibold uppercase tracking-[0.2em] text-gray-900">
                Title
              </span>
              <span data-slot="tile-text" className="mt-1 block text-sm text-gray-600">
                Text
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
