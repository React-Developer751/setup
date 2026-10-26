export default function Progress5() {
  return (
    <>
      <div className="mb-1 text-sm font-medium text-heading">Dark</div>
      <div className="w-full bg-neutral-quaternary rounded-full h-2">
        <div className="bg-dark h-2 rounded-full" style={{ width: '45%' }}></div>
      </div>
      <div className="mb-1 text-sm font-medium text-fg-brand">Brand</div>
      <div className="w-full bg-neutral-quaternary rounded-full h-2">
        <div className="bg-brand h-2 rounded-full" style={{ width: '45%' }}></div>
      </div>
      <div className="mb-1 text-sm font-medium text-fg-success">Success</div>
      <div className="w-full bg-neutral-quaternary rounded-full h-2">
        <div className="bg-success h-2 rounded-full" style={{ width: '45%' }}></div>
      </div>
      <div className="mb-1 text-sm font-medium text-fg-danger">Danger</div>
      <div className="w-full bg-neutral-quaternary rounded-full h-2">
        <div className="bg-danger h-2 rounded-full" style={{ width: '45%' }}></div>
      </div>
      <div className="mb-1 text-sm font-medium text-fg-warning">Danger</div>
      <div className="w-full bg-neutral-quaternary rounded-full h-2">
        <div className="bg-warning h-2 rounded-full" style={{ width: '45%' }}></div>
      </div>
    </>
  )
}
