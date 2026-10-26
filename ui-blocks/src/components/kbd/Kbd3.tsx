export default function Kbd3() {
  return (
    <div className="relative overflow-x-auto">
        <table className="w-full text-sm text-left rtl:text-right text-body">
            <thead className="text-xs text-body uppercase bg-neutral-tertiary">
                <tr>
                    <th scope="col" className="px-6 py-3">
                        Key
                    </th>
                    <th scope="col" className="px-6 py-3">
                        Description
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr className="bg-neutral-primary border-b border-default">
                    <th scope="row" className="px-6 py-4 font-medium text-body whitespace-nowrap">
                        <kbd className="px-2 py-1.5 text-xs font-semibold text-heading bg-neutral-tertiary border border-default-medium rounded-base">Shift</kbd>
                            <span className="mx-2">or</span>
                        <kbd className="px-2 py-1.5 text-xs font-semibold text-heading bg-neutral-tertiary border border-default-medium rounded-base">Tab</kbd>
                    </th>
                    <td className="px-6 py-4">
                        Navigate to interactive elements
                    </td>
                </tr>
                <tr className="bg-neutral-primary border-b border-default">
                    <th scope="row" className="px-6 py-4 font-medium text-body whitespace-nowrap">
                        <kbd className="px-2 py-1.5 text-xs font-semibold text-heading bg-neutral-tertiary border border-default-medium rounded-base">Enter</kbd>
                        <span className="mx-2">or</span>
                        <kbd className="px-2 py-1.5 text-xs font-semibold text-heading bg-neutral-tertiary border border-default-medium rounded-base">Spacebar</kbd>
                    </th>
                    <td className="px-6 py-4">
                        Ensure elements with ARIA role="button" can be activated with both key commands.
                    </td>
                </tr>
                <tr className="bg-neutral-primary">
                    <th scope="row" className="inline-flex items-center px-6 py-4 font-medium text-body whitespace-nowrap">
                        <kbd className="inline-flex items-center me-1 px-2 py-1.5 text-xs font-semibold text-heading bg-neutral-tertiary border border-default-medium rounded-base">
                            <svg className="w-2.5 h-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 10">
                                <path d="M9.207 1A2 2 0 0 0 6.38 1L.793 6.586A2 2 0 0 0 2.207 10H13.38a2 2 0 0 0 1.414-3.414L9.207 1Z" />
                            </svg>
                            <span className="sr-only">Arrow key up</span>
                        </kbd>
                        <kbd className="inline-flex items-center px-2 py-1.5 text-xs font-semibold text-heading bg-neutral-tertiary border border-default-medium rounded-base">
                            <svg className="w-2.5 h-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 10">
                                <path d="M15.434 1.235A2 2 0 0 0 13.586 0H2.414A2 2 0 0 0 1 3.414L6.586 9a2 2 0 0 0 2.828 0L15 3.414a2 2 0 0 0 .434-2.179Z" />
                            </svg>
                            <span className="sr-only">Arrow key down</span>
                        </kbd>
                        <span className="mx-2">or</span>
                        <kbd className="rtl:rotate-180 inline-flex items-center me-1 px-2 py-1.5 text-xs font-semibold text-heading bg-neutral-tertiary border border-default-medium rounded-base">
                            <svg className="w-2.5 h-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 10 16">
                                <path d="M8.766.566A2 2 0 0 0 6.586 1L1 6.586a2 2 0 0 0 0 2.828L6.586 15A2 2 0 0 0 10 13.586V2.414A2 2 0 0 0 8.766.566Z" />
                            </svg>
                            <span className="sr-only">Arrow key left</span>
                        </kbd>
                        <kbd className="rtl:rotate-180 inline-flex items-center px-2 py-1.5 text-xs font-semibold text-heading bg-neutral-tertiary border border-default-medium rounded-base">
                            <svg className="w-2.5 h-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 10 16">
                                <path d="M3.414 1A2 2 0 0 0 0 2.414v11.172A2 2 0 0 0 3.414 15L9 9.414a2 2 0 0 0 0-2.828L3.414 1Z" />
                            </svg>
                            <span className="sr-only">Arrow key right</span>
                        </kbd>
                    </th>
                    <td className="px-6 py-4">
                        Choose and activate previous/next tab.
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
  )
}
