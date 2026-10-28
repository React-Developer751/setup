// Four stat tiles (value and label).
export default function RefStats1() {
  return (
    <section data-ref="stats">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 px-5 py-8 sm:px-6 lg:grid-cols-4 lg:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} data-slot="stat" className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-gray-200">
            <p data-slot="stat-value" className="text-3xl font-extrabold tracking-tight text-indigo-600">
              0
            </p>
            <p data-slot="stat-label" className="mt-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Label
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
