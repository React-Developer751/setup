export default function Gallery10() {
  return (
    <>
      <div className="flex items-center justify-center py-4 md:py-8 flex-wrap">
          <button type="button" className="text-fg-brand border border-brand bg-neutral-primary focus:ring-4 focus:outline-none focus:ring-neutral-tertiary rounded-base text-base font-medium px-5 py-2.5 text-center me-3 mb-3">All categories</button>
          <button type="button" className="text-heading border border-buffer hover:border-default bg-neutral-primary focus:ring-4 focus:outline-none focus:ring-neutral-tertiary rounded-base text-base font-medium px-5 py-2.5 text-center me-3 mb-3">Shoes</button>
          <button type="button" className="text-heading border border-buffer hover:border-default bg-neutral-primary focus:ring-4 focus:outline-none focus:ring-neutral-tertiary rounded-base text-base font-medium px-5 py-2.5 text-center me-3 mb-3">Bags</button>
          <button type="button" className="text-heading border border-buffer hover:border-default bg-neutral-primary focus:ring-4 focus:outline-none focus:ring-neutral-tertiary rounded-base text-base font-medium px-5 py-2.5 text-center me-3 mb-3">Electronics</button>
          <button type="button" className="text-heading border border-buffer hover:border-default bg-neutral-primary focus:ring-4 focus:outline-none focus:ring-neutral-tertiary rounded-base text-base font-medium px-5 py-2.5 text-center me-3 mb-3">Gaming</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
              <img className="h-auto max-w-full rounded-base" src="https://flowbite.s3.amazonaws.com/docs/gallery/square/image.jpg" alt="" />
          </div>
          <div>
              <img className="h-auto max-w-full rounded-base" src="https://flowbite.s3.amazonaws.com/docs/gallery/square/image-1.jpg" alt="" />
          </div>
          <div>
              <img className="h-auto max-w-full rounded-base" src="https://flowbite.s3.amazonaws.com/docs/gallery/square/image-2.jpg" alt="" />
          </div>
          <div>
              <img className="h-auto max-w-full rounded-base" src="https://flowbite.s3.amazonaws.com/docs/gallery/square/image-3.jpg" alt="" />
          </div>
          <div>
              <img className="h-auto max-w-full rounded-base" src="https://flowbite.s3.amazonaws.com/docs/gallery/square/image-4.jpg" alt="" />
          </div>
          <div>
              <img className="h-auto max-w-full rounded-base" src="https://flowbite.s3.amazonaws.com/docs/gallery/square/image-5.jpg" alt="" />
          </div>
          <div>
              <img className="h-auto max-w-full rounded-base" src="https://flowbite.s3.amazonaws.com/docs/gallery/square/image-6.jpg" alt="" />
          </div>
          <div>
              <img className="h-auto max-w-full rounded-base" src="https://flowbite.s3.amazonaws.com/docs/gallery/square/image-7.jpg" alt="" />
          </div>
          <div>
              <img className="h-auto max-w-full rounded-base" src="https://flowbite.s3.amazonaws.com/docs/gallery/square/image-8.jpg" alt="" />
          </div>
          <div>
              <img className="h-auto max-w-full rounded-base" src="https://flowbite.s3.amazonaws.com/docs/gallery/square/image-9.jpg" alt="" />
          </div>
          <div>
              <img className="h-auto max-w-full rounded-base" src="https://flowbite.s3.amazonaws.com/docs/gallery/square/image-10.jpg" alt="" />
          </div>
          <div>
              <img className="h-auto max-w-full rounded-base" src="https://flowbite.s3.amazonaws.com/docs/gallery/square/image-11.jpg" alt="" />
          </div>
      </div>
    </>
  )
}
