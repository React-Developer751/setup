export default function Progress4() {
  return (
    <>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-body">Flowbite</span>
        <span className="text-sm font-medium text-body">45%</span>
      </div>
      <div className="w-full bg-neutral-quaternary rounded-full h-2">
        <div className="bg-brand h-2 rounded-full" style={{ width: '45%' }}></div>
      </div>
    </>
  )
}
