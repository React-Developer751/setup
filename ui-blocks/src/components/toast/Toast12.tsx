export default function Toast12() {
  return (
    <>
      <div id="toast-top-left" className="fixed flex items-center w-full max-w-xs p-4 text-body bg-neutral-primary-soft rounded-base shadow-xs border border-default top-5 start-5" role="alert">
          <div className="text-sm font-normal">Top left positioning.</div>
      </div>
      <div id="toast-top-right" className="fixed flex items-center w-full max-w-xs p-4 text-body bg-neutral-primary-soft rounded-base shadow-xs border border-default top-5 end-5" role="alert">
          <div className="text-sm font-normal">Top right positioning.</div>
      </div>
      <div id="toast-bottom-right" className="fixed flex items-center w-full max-w-xs p-4 text-body bg-neutral-primary-soft rounded-base shadow-xs border border-default end-5 bottom-5" role="alert">
          <div className="text-sm font-normal">Bottom right positioning.</div>
      </div>
      <div id="toast-bottom-left" className="fixed flex items-center w-full max-w-xs p-4 text-body bg-neutral-primary-soft rounded-base shadow-xs border border-default bottom-5 start-5" role="alert">
          <div className="text-sm font-normal">Bottom left positioning.</div>
      </div>
    </>
  )
}
