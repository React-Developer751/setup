export default function QrCode7() {
  return (
    <div className="relative">
      <div className="absolute top-0 start-0 w-full h-full bg-neutral-primary/95 z-10 gap-2 flex items-center justify-center flex-col">
        <svg className="w-6 h-6 text-fg-danger" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m15 9-6 6m0-6 6 6m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <span className="font-medium text-heading text-sm">QR code expired</span>
        <button className="text-fg-brand hover:underline flex items-center gap-1 text-sm"><svg className="w-4 h-4 text-fg-brand" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.651 7.65a7.131 7.131 0 0 0-12.68 3.15M18.001 4v4h-4m-7.652 8.35a7.13 7.13 0 0 0 12.68-3.15M6 20v-4h4" />
    </svg>
    Refresh</button>
      </div>
      <div id="qrcode" className="w-48 h-48">
        <svg className="text-heading" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29 29" shapeRendering="crispEdges"><path fill="none" d="M0 0h29v29H0z"></path><path stroke="currentColor" d="M4 4.5h7m1 0h1m1 0h2m2 0h7M4 5.5h1m5 0h1m4 0h2m1 0h1m5 0h1M4 6.5h1m1 0h3m1 0h1m2 0h1m2 0h1m1 0h1m1 0h3m1 0h1M4 7.5h1m1 0h3m1 0h1m3 0h1m3 0h1m1 0h3m1 0h1M4 8.5h1m1 0h3m1 0h1m1 0h1m2 0h1m2 0h1m1 0h3m1 0h1M4 9.5h1m5 0h1m1 0h1m5 0h1m5 0h1M4 10.5h7m1 0h1m1 0h1m1 0h1m1 0h7M13 11.5h2M5 12.5h7m3 0h2m2 0h2m3 0h1M6 13.5h1m1 0h1m6 0h1m1 0h1m2 0h5M4 14.5h3m1 0h3m1 0h2m3 0h2m2 0h1m1 0h1M4 15.5h1m2 0h1m3 0h1m5 0h1m1 0h4m1 0h1M4 16.5h1m1 0h2m2 0h2m3 0h1m2 0h1m4 0h1M12 17.5h2m2 0h2m1 0h4m1 0h1M4 18.5h7m1 0h3m2 0h1m3 0h3M4 19.5h1m5 0h1m1 0h1m2 0h1m1 0h1m3 0h2m1 0h1M4 20.5h1m1 0h3m1 0h1m1 0h2m1 0h1m2 0h1m5 0h1M4 21.5h1m1 0h3m1 0h1m1 0h2m2 0h2m1 0h4M4 22.5h1m1 0h3m1 0h1m1 0h1m1 0h2m2 0h1M4 23.5h1m5 0h1m1 0h1m1 0h1m5 0h3M4 24.5h7m2 0h3m5 0h1m1 0h1"></path></svg>
      </div>
    </div>
  )
}
