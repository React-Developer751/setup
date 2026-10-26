export default function Progress2() {
  return (
    <>
      <div className="mb-1 text-sm font-medium text-heading">Small</div>
      <div className="w-full bg-neutral-quaternary rounded-full h-1.5">
        <div className="bg-brand h-1.5 rounded-full" style={{ width: '45%' }}></div>
      </div>
      <div className="mb-1 text-sm font-medium text-heading">Default</div>
      <div className="w-full bg-neutral-quaternary rounded-full h-2">
        <div className="bg-brand h-2 rounded-full" style={{ width: '45%' }}></div>
      </div>
      <div className="mb-1 text-base font-medium text-heading">Large</div>
      <div className="w-full bg-neutral-quaternary rounded-full h-2.5">
        <div className="bg-brand h-2.5 rounded-full" style={{ width: '45%' }}></div>
      </div>
    </>
  )
}
