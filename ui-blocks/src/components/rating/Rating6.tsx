export default function Rating6() {
  return (
    <>
      <div className="flex items-center mb-5">
          <p className="bg-brand-softer text-fg-brand-strong text-sm font-semibold inline-flex items-center p-1.5 rounded-base">8.7</p>
          <p className="ms-2 font-medium text-heading">Excellent</p>
          <span className="w-1 h-1 mx-2 rounded-full bg-neutral-quaternary"></span>
          <p className="text-sm font-medium text-body">376 reviews</p>
          <a href="#" className="ms-auto text-sm font-medium text-fg-brand hover:underline">Read all reviews</a>
      </div>
      <div className="gap-8 sm:grid sm:grid-cols-2">
          <div>
              <dl>
                  <dt className="text-sm font-medium text-body">Staff</dt>
                  <dd className="flex items-center mb-3">
                      <div className="w-full bg-neutral-quaternary rounded-base h-2.5 me-2">
                          <div className="bg-brand h-2.5 rounded-base" style={{ width: '88%' }}></div>
                      </div>
                      <span className="text-sm font-medium text-body">8.8</span>
                  </dd>
              </dl>
              <dl>
                  <dt className="text-sm font-medium text-body">Comfort</dt>
                  <dd className="flex items-center mb-3">
                      <div className="w-full bg-neutral-quaternary rounded-base h-2.5 me-2">
                          <div className="bg-brand h-2.5 rounded-base" style={{ width: '89%' }}></div>
                      </div>
                      <span className="text-sm font-medium text-body">8.9</span>
                  </dd>
              </dl>
              <dl>
                  <dt className="text-sm font-medium text-body">Free WiFi</dt>
                  <dd className="flex items-center mb-3">
                      <div className="w-full bg-neutral-quaternary rounded-base h-2.5 me-2">
                          <div className="bg-brand h-2.5 rounded-base" style={{ width: '88%' }}></div>
                      </div>
                      <span className="text-sm font-medium text-body">8.8</span>
                  </dd>
              </dl>
              <dl>
                  <dt className="text-sm font-medium text-body">Facilities</dt>
                  <dd className="flex items-center">
                      <div className="w-full bg-neutral-quaternary rounded-base h-2.5 me-2">
                          <div className="bg-brand h-2.5 rounded-base" style={{ width: '54%' }}></div>
                      </div>
                      <span className="text-sm font-medium text-body">5.4</span>
                  </dd>
              </dl>
          </div>
          <div>
              <dl>
                  <dt className="text-sm font-medium text-body">Value for money</dt>
                  <dd className="flex items-center mb-3">
                      <div className="w-full bg-neutral-quaternary rounded-base h-2.5 me-2">
                          <div className="bg-brand h-2.5 rounded-base" style={{ width: '89%' }}></div>
                      </div>
                      <span className="text-sm font-medium text-body">8.9</span>
                  </dd>
              </dl>
              <dl>
                  <dt className="text-sm font-medium text-body">Cleanliness</dt>
                  <dd className="flex items-center mb-3">
                      <div className="w-full bg-neutral-quaternary rounded-base h-2.5 me-2">
                          <div className="bg-brand h-2.5 rounded-base" style={{ width: '70%' }}></div>
                      </div>
                      <span className="text-sm font-medium text-body">7.0</span>
                  </dd>
              </dl>
              <dl>
                  <dt className="text-sm font-medium text-body">Location</dt>
                  <dd className="flex items-center">
                      <div className="w-full bg-neutral-quaternary rounded-base h-2.5 me-2">
                          <div className="bg-brand h-2.5 rounded-base" style={{ width: '89%' }}></div>
                      </div>
                      <span className="text-sm font-medium text-body">8.9</span>
                  </dd>
              </dl>
          </div>
      </div>
    </>
  )
}
