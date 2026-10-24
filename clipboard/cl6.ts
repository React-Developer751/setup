
<div class="w-full max-w-lg">
    <div class="mb-2 flex justify-between items-center">
        <p class="block mb-2.5 text-sm font-medium text-heading">Card example with CTA button:</p>
    </div>
    <div class="relative bg-neutral-secondary-medium border border-default-medium rounded-base p-4 h-64">
        <div class="overflow-scroll max-h-full">
            <pre><code id="code-block" class="text-sm text-body whitespace-pre">&#x27;use client&#x27;;

import Link from &#x27;next/link&#x27;;
import { Navbar } from &#x27;flowbite-react&#x27;;

function Component() {
  return (
    &#x3C;Navbar fluid rounded&#x3E;
      &#x3C;Navbar.Brand as={Link} href=&#x22;https://flowbite-react.com&#x22;&#x3E;
        &#x3C;img src=&#x22;/favicon.svg&#x22; className=&#x22;mr-3 h-6 sm:h-9&#x22; alt=&#x22;Flowbite React Logo&#x22; /&#x3E;
        &#x3C;span className=&#x22;self-center whitespace-nowrap text-xl font-semibold dark:text-white&#x22;&#x3E;Flowbite React&#x3C;/span&#x3E;
      &#x3C;/Navbar.Brand&#x3E;
      &#x3C;Navbar.Toggle /&#x3E;
      &#x3C;Navbar.Collapse&#x3E;
        &#x3C;Navbar.Link href=&#x22;#&#x22; active&#x3E;
          Home
        &#x3C;/Navbar.Link&#x3E;
        &#x3C;Navbar.Link as={Link} href=&#x22;#&#x22;&#x3E;
          About
        &#x3C;/Navbar.Link&#x3E;
        &#x3C;Navbar.Link href=&#x22;#&#x22;&#x3E;Services&#x3C;/Navbar.Link&#x3E;
        &#x3C;Navbar.Link href=&#x22;#&#x22;&#x3E;Pricing&#x3C;/Navbar.Link&#x3E;
        &#x3C;Navbar.Link href=&#x22;#&#x22;&#x3E;Contact&#x3C;/Navbar.Link&#x3E;
      &#x3C;/Navbar.Collapse&#x3E;
    &#x3C;/Navbar&#x3E;
  );
}
</code></pre>
        </div>
    <div class="absolute top-2 end-2">
        <button data-copy-to-clipboard-target="code-block" data-copy-to-clipboard-content-type="innerHTML" data-copy-to-clipboard-html-entities="true" class="flex items-center text-body bg-neutral-primary-strong border border-default-strong hover:bg-neutral-secondary-strong/70 hover:text-heading focus:ring-4 focus:ring-neutral-tertiary-soft font-medium leading-5 rounded text-xs px-3 py-1.5 focus:outline-none">
            <span id="default-message">
                <span class="flex items-center">
                    <svg class="w-4 h-4 me-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-6 5h6m-6 4h6M10 3v4h4V3h-4Z"/></svg>
                    <span class="text-xs font-semibold">Copy</span>
                </span>
            </span>
            <span id="success-message" class="hidden">
                <span class="flex items-center">
                    <svg class="w-4 h-4 text-fg-brand me-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-6 7 2 2 4-4m-5-9v4h4V3h-4Z"/></svg>
                    <span class="text-xs font-semibold text-fg-brand">Copied</span>
                </span>
            </span>
        </button>
    </div>
    </div>
    <p class="mt-2.5 text-sm text-body">Configure Tailwind CSS and Flowbite before copying the code</p>
</div>
