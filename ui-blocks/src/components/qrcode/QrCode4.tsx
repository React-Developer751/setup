export default function QrCode4() {
  return (
    <div className="bg-neutral-primary-soft block max-w-sm p-6 border border-default rounded-base shadow-xs">
        <div className="flex flex-col items-center justify-center gap-2">
          <img className="w-10 h-10 rounded-full" src="/docs/images/people/profile-picture-5.jpg" alt="Rounded avatar" />
          <span className="text-heading font-semibold text-2xl">Jese Leos</span>
        </div>
        <a href="#" className="block mx-auto flex justify-center items-center">
            <div id="qrcode" className="w-56 h-56">
              <svg className="text-heading" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29 29" shapeRendering="crispEdges"><path fill="none" d="M0 0h29v29H0z"></path><path stroke="currentColor" d="M4 4.5h7m1 0h1m1 0h2m2 0h7M4 5.5h1m5 0h1m4 0h2m1 0h1m5 0h1M4 6.5h1m1 0h3m1 0h1m2 0h1m2 0h1m1 0h1m1 0h3m1 0h1M4 7.5h1m1 0h3m1 0h1m3 0h1m3 0h1m1 0h3m1 0h1M4 8.5h1m1 0h3m1 0h1m1 0h1m2 0h1m2 0h1m1 0h3m1 0h1M4 9.5h1m5 0h1m1 0h1m5 0h1m5 0h1M4 10.5h7m1 0h1m1 0h1m1 0h1m1 0h7M13 11.5h2M5 12.5h7m3 0h2m2 0h2m3 0h1M6 13.5h1m1 0h1m6 0h1m1 0h1m2 0h5M4 14.5h3m1 0h3m1 0h2m3 0h2m2 0h1m1 0h1M4 15.5h1m2 0h1m3 0h1m5 0h1m1 0h4m1 0h1M4 16.5h1m1 0h2m2 0h2m3 0h1m2 0h1m4 0h1M12 17.5h2m2 0h2m1 0h4m1 0h1M4 18.5h7m1 0h3m2 0h1m3 0h3M4 19.5h1m5 0h1m1 0h1m2 0h1m1 0h1m3 0h2m1 0h1M4 20.5h1m1 0h3m1 0h1m1 0h2m1 0h1m2 0h1m5 0h1M4 21.5h1m1 0h3m1 0h1m1 0h2m2 0h2m1 0h4M4 22.5h1m1 0h3m1 0h1m1 0h1m1 0h2m2 0h1M4 23.5h1m5 0h1m1 0h1m1 0h1m5 0h3M4 24.5h7m2 0h3m5 0h1m1 0h1"></path></svg>
            </div>
        </a>
        <p className="text-body text-center">Share your QR code and make it easy for others to follow you.</p>
    </div>
  )
}
