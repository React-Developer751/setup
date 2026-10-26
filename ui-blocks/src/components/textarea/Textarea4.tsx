// @ts-nocheck - markup of a third-party snippet kept as it is (non-standard attributes)
export default function Textarea4() {
  return (
    <form>
        <label htmlFor="chat" className="sr-only">Your message</label>
        <div className="flex items-center px-3 py-2 rounded-base bg-neutral-secondary-soft">
            <button type="button" className="p-2 text-body rounded-sm cursor-pointer hover:text-heading hover:bg-neutral-tertiary-medium">
                <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8v8a5 5 0 1 0 10 0V6.5a3.5 3.5 0 1 0-7 0V15a2 2 0 0 0 4 0V8" /></svg>
                <span className="sr-only">Attach file</span>
            </button>
            <button type="button" className="p-2 text-body rounded-sm cursor-pointer hover:text-heading hover:bg-neutral-tertiary-medium">
                <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M16 18H8l2.5-6 2 4 1.5-2 2 4Zm-1-8.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z" /><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 3v4a1 1 0 0 1-1 1H5m14-4v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7.914a1 1 0 0 1 .293-.707l3.914-3.914A1 1 0 0 1 9.914 3H18a1 1 0 0 1 1 1ZM8 18h8l-2-4-1.5 2-2-4L8 18Zm7-8.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z" /></svg>
                <span className="sr-only">Upload image</span>
            </button>
            <textarea id="chat" rows="1" className="mx-4 bg-neutral-primary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 placeholder:text-body" placeholder="Your message..."></textarea>
                <button type="submit" className="inline-flex justify-center p-2 text-fg-brand rounded-full cursor-pointer hover:bg-brand-softer">
                <svg className="w-6 h-6 rotate-90 rtl:-rotate-90" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m12 18-7 3 7-18 7 18-7-3Zm0 0v-5" /></svg>
                <span className="sr-only">Send message</span>
            </button>
        </div>
    </form>
  )
}
