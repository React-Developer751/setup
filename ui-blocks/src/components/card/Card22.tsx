export default function Card22() {
  return (
    <div className="w-full max-w-sm p-6 bg-neutral-primary-soft border border-default rounded-base shadow-xs">
        <div className="flex items-center justify-between mb-4">
            <h5 className="text-xl font-semibold leading-none text-heading">Latest Customers</h5>
            <a href="#" className="font-medium text-fg-brand hover:underline">View all</a>
       </div>
       <div className="flow-root">
            <ul role="list" className="divide-y divide-default">
                <li className="py-4 sm:py-4">
                    <div className="flex items-center gap-2">
                        <div className="shrink-0">
                            <img className="w-8 h-8 rounded-full" src="/docs/images/people/profile-picture-1.jpg" alt="Neil image" />
                        </div>
                        <div className="flex-1 min-w-0 ms-2">
                            <p className="font-medium text-heading truncate">
                                Neil Sims
                            </p>
                            <p className="text-sm text-body truncate">
                                email@windster.com
                            </p>
                        </div>
                        <div className="inline-flex items-center font-medium text-heading">
                            $320
                        </div>
                    </div>
                </li>
                <li className="py-4 sm:py-4">
                    <div className="flex items-center gap-2">
                        <div className="shrink-0">
                            <img className="w-8 h-8 rounded-full" src="/docs/images/people/profile-picture-3.jpg" alt="Bonnie image" />
                        </div>
                        <div className="flex-1 min-w-0 ms-2">
                            <p className="font-medium text-heading truncate">
                                Bonnie Green
                            </p>
                            <p className="text-sm text-body truncate">
                                email@windster.com
                            </p>
                        </div>
                        <div className="inline-flex items-center font-medium text-heading">
                            $3467
                        </div>
                    </div>
                </li>
                <li className="py-4 sm:py-4">
                    <div className="flex items-center gap-2">
                        <div className="shrink-0">
                            <img className="w-8 h-8 rounded-full" src="/docs/images/people/profile-picture-2.jpg" alt="Michael image" />
                        </div>
                        <div className="flex-1 min-w-0 ms-2">
                            <p className="font-medium text-heading truncate">
                                Michael Gough
                            </p>
                            <p className="text-sm text-body truncate">
                                email@windster.com
                            </p>
                        </div>
                        <div className="inline-flex items-center font-medium text-heading">
                            $67
                        </div>
                    </div>
                </li>
                <li className="py-4 sm:py-4">
                    <div className="flex items-center gap-2">
                        <div className="shrink-0">
                            <img className="w-8 h-8 rounded-full" src="/docs/images/people/profile-picture-4.jpg" alt="Lana image" />
                        </div>
                        <div className="flex-1 min-w-0 ms-2">
                            <p className="font-medium text-heading truncate">
                                Lana Byrd
                            </p>
                            <p className="text-sm text-body truncate">
                                email@windster.com
                            </p>
                        </div>
                        <div className="inline-flex items-center font-medium text-heading">
                            $367
                        </div>
                    </div>
                </li>
                <li className="pt-4 pb-0">
                    <div className="flex items-center gap-2">
                        <div className="shrink-0">
                            <img className="w-8 h-8 rounded-full" src="/docs/images/people/profile-picture-5.jpg" alt="Thomas image" />
                        </div>
                        <div className="flex-1 min-w-0 ms-2">
                            <p className="font-medium text-heading truncate">
                                Thomas Lean
                            </p>
                            <p className="text-sm text-body truncate">
                                email@windster.com
                            </p>
                        </div>
                        <div className="inline-flex items-center font-medium text-heading">
                            $2367
                        </div>
                    </div>
                </li>
            </ul>
       </div>
    </div>
  )
}
