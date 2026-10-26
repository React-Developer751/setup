export default function Avatar15() {
  return (
    <>
      <div>
        <div id="tooltip-jese" role="tooltip" className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-dark rounded-base shadow-xs opacity-0 tooltip">
            Jese Leos
            <div className="tooltip-arrow" data-popper-arrow></div>
        </div>
        <img data-tooltip-target="tooltip-jese" className="w-10 h-10 rounded-base" src="/docs/images/people/profile-picture-5.jpg" alt="Medium avatar" />
      </div>
      <div>
        <div id="tooltip-roberta" role="tooltip" className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-dark rounded-base shadow-xs opacity-0 tooltip">
            Roberta Casas
            <div className="tooltip-arrow" data-popper-arrow></div>
        </div>
        <img data-tooltip-target="tooltip-roberta" className="w-10 h-10 rounded-base" src="/docs/images/people/profile-picture-4.jpg" alt="Medium avatar" />
      </div>
      <div>
        <div id="tooltip-bonnie" role="tooltip" className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-dark rounded-base shadow-xs opacity-0 tooltip">
            Bonnie Green
            <div className="tooltip-arrow" data-popper-arrow></div>
        </div>
        <img data-tooltip-target="tooltip-bonnie" className="w-10 h-10 rounded-base" src="/docs/images/people/profile-picture-3.jpg" alt="Medium avatar" />
      </div>
    </>
  )
}
