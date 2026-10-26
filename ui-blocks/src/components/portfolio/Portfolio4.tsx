export default function Portfolio4() {
  return (
    <section className="bg-white dark:bg-gray-900">
        <div className="container px-6 py-12 mx-auto">
            <h1 className="text-2xl font-semibold text-gray-800 lg:text-3xl dark:text-white">Portfolio</h1>

            <div className="mt-8 xl:mt-16 lg:flex lg:-mx-12">
                <div className="lg:mx-12">
                    <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Table of Content</h1>

                    <div className="mt-4 space-y-4 lg:mt-8">
                        <a href="#" className="block text-blue-500 dark:text-blue-400 hover:underline">Web design</a>
                        <a href="#" className="block text-gray-500 dark:text-gray-300 hover:underline">App design</a>
                        <a href="#" className="block text-gray-500 dark:text-gray-300 hover:underline">Branding</a>
                        <a href="#" className="block text-gray-500 dark:text-gray-300 hover:underline">Animation</a>
                    </div>
                </div>

                <div className="flex-1 mt-8 lg:mx-12 lg:mt-0">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3 ">
                        <div>
                            <img className="object-cover w-full rounded-lg h-96 " src="https://images.unsplash.com/photo-1621111848501-8d3634f82336?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1565&q=80" alt="" />
                            <h2 className="mt-4 text-xl font-semibold text-gray-800 capitalize dark:text-white">Best website
                                collections</h2>
                            <p className="mt-2 text-lg tracking-wider text-blue-500 uppercase dark:text-blue-400 ">Website</p>
                        </div>

                        <div>
                            <img className="object-cover w-full rounded-lg h-96 " src="https://images.unsplash.com/photo-1621609764180-2ca554a9d6f2?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=764&q=80" alt="" />
                            <h2 className="mt-4 text-xl font-semibold text-gray-800 capitalize dark:text-white">Block of Ui kit
                                collections</h2>
                            <p className="mt-2 text-lg tracking-wider text-blue-500 uppercase dark:text-blue-400 ">Ui kit</p>
                        </div>

                        <div>
                            <img className="object-cover w-full rounded-lg h-96 " src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80" alt="" />
                            <h2 className="mt-4 text-xl font-semibold text-gray-800 capitalize dark:text-white">Ton’s of mobile
                                mockup</h2>
                            <p className="mt-2 text-lg tracking-wider text-blue-500 uppercase dark:text-blue-400 ">Mockups</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
  )
}
