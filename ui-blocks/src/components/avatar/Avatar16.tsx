export default function Avatar16() {
  return (
    <>
      <div className="relative">
          <img className="w-10 h-10 rounded-full" src="/docs/images/people/profile-picture-5.jpg" alt="" />
          <span className="top-0 left-7 absolute  w-3.5 h-3.5 bg-success border-2 border-buffer rounded-full"></span>
      </div>
      <div className="relative">
          <img className="w-10 h-10 rounded-base" src="/docs/images/people/profile-picture-5.jpg" alt="" />
          <span className="absolute top-0 left-8 transform -translate-y-1/2 w-3.5 h-3.5 bg-danger border-2 border-buffer rounded-full"></span>
      </div>
      <div className="relative">
          <img className="w-10 h-10 rounded-full" src="/docs/images/people/profile-picture-5.jpg" alt="" />
          <span className="bottom-0 left-7 absolute  w-3.5 h-3.5 bg-success border-2 border-buffer rounded-full"></span>
      </div>
      <div className="relative">
          <img className="w-10 h-10 rounded-base" src="/docs/images/people/profile-picture-5.jpg" alt="" />
          <span className="absolute bottom-0 left-8 transform translate-y-1/4 w-3.5 h-3.5 bg-success border-2 border-buffer rounded-full"></span>
      </div>
    </>
  )
}
