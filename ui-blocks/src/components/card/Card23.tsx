export default function Card23() {
  return (
    <div className="grid mb-8 bg-neutral-primary-soft border border-default rounded-base shadow-xs md:mb-12 md:grid-cols-2">
        <figure className="flex flex-col items-center justify-center p-8 text-center border-b border-default rounded-t-base md:rounded-t-none md:rounded-ss-base md:border-e">
            <blockquote className="max-w-2xl mx-auto mb-4 text-body lg:mb-8">
                <h3 className="text-lg font-semibold text-heading">Very easy this was to integrate</h3>
                <p className="my-4">If you care for your time, I hands down would go with this."</p>
            </blockquote>
            <figcaption className="flex items-center justify-center">
                <img className="rounded-full w-9 h-9" src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/avatars/karen-nelson.png" alt="profile picture" />
                <div className="space-y-0.5 text-left rtl:text-right ms-2">
                    <div className="leading-tight text-base text-heading font-medium mb-0.5">Bonnie Green</div>
                    <div className="text-sm text-body">Developer at Open AI</div>
                </div>
            </figcaption>    
        </figure>
        <figure className="flex flex-col items-center justify-center p-8 text-center border-b border-default md:rounded-se-base">
            <blockquote className="max-w-2xl mx-auto mb-4 text-body lg:mb-8">
                <h3 className="text-lg font-semibold text-heading">Solid foundation for any project</h3>
                <p className="my-4">Designing with Figma components that can be easily translated to the utility classes of Tailwind CSS is a huge timesaver!"</p>
            </blockquote>
            <figcaption className="flex items-center justify-center ">
                <img className="rounded-full w-9 h-9" src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/avatars/roberta-casas.png" alt="profile picture" />
                <div className="space-y-0.5 text-left rtl:text-right ms-2">
                    <div className="leading-tight text-base text-heading font-medium mb-0.5">Roberta Casas</div>
                    <div className="text-sm text-body">Lead designer at Dropbox</div>
                </div>
            </figcaption>    
        </figure>
        <figure className="flex flex-col items-center justify-center p-8 text-center border-b border-default md:rounded-es-base md:border-b-0 md:border-e">
            <blockquote className="max-w-2xl mx-auto mb-4 text-body lg:mb-8">
                <h3 className="text-lg font-semibold text-heading">Mindblowing workflow</h3>
                <p className="my-4">Aesthetically, the well designed components are beautiful and will undoubtedly level up your app."</p>
            </blockquote>
            <figcaption className="flex items-center justify-center ">
                <img className="rounded-full w-9 h-9" src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/avatars/jese-leos.png" alt="profile picture" />
                <div className="space-y-0.5 text-left rtl:text-right ms-2">
                    <div className="leading-tight text-base text-heading font-medium mb-0.5">Jese Leos</div>
                    <div className="text-sm text-body">Software Engineer at Facebook</div>
                </div>
            </figcaption>    
        </figure>
        <figure className="flex flex-col items-center justify-center p-8 text-center border-default rounded-b-base md:rounded-se-base">
            <blockquote className="max-w-2xl mx-auto mb-4 text-body lg:mb-8">
                <h3 className="text-lg font-semibold text-heading">Efficient Collaborating</h3>
                <p className="my-4">You have many examples that can be used to create a fast prototype for your team."</p>
            </blockquote>
            <figcaption className="flex items-center justify-center ">
                <img className="rounded-full w-9 h-9" src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/avatars/joseph-mcfall.png" alt="profile picture" />
                <div className="space-y-0.5 text-left rtl:text-right ms-2">
                    <div className="leading-tight text-base text-heading font-medium mb-0.5">Joseph McFall</div>
                    <div className="text-sm text-body">CTO at Google</div>
                </div>
            </figcaption>    
        </figure>
    </div>
  )
}
