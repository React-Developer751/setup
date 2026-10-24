
<form class="max-w-xl mx-auto">
    <div class="space-x-0 space-y-4 sm:space-y-0 sm:space-x-4 rtl:space-x-reverse flex items-center flex-col sm:flex-row mb-4">
        <div class="flex -space-x-px">
            <label for="fiat-currency-input" class="mb-2.5 text-sm font-medium text-heading sr-only">Your Email</label>
            <div class="relative w-full">
                <input type="number" id="fiat-currency-input" class="block w-full bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-s-base focus:ring-brand focus:border-brand px-3 py-2.5 placeholder:text-body" placeholder="421 USD" required />
            </div>
            <button id="dropdown-fiat-currency-button" data-dropdown-toggle="dropdown-fiat-currency" type="button" class="inline-flex items-center shrink-0 z-10 text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-fg-brand focus:ring-4 focus:ring-neutral-tertiary font-medium leading-5 rounded-e-base text-sm px-4 py-2.5 focus:outline-none">
                <svg class="w-4 h-4 me-1.5" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.00013 14.6666C11.6821 14.6666 14.667 11.6818 14.667 7.99992C14.667 4.31802 11.6821 1.33325 8.00013 1.33325C4.31811 1.33325 1.33325 4.31802 1.33325 7.99992C1.33325 11.6818 4.31811 14.6666 8.00013 14.6666Z" fill="white"/><path d="M7.71167 7.99975H14.6678C14.6678 7.39807 14.5876 6.8152 14.4382 6.26074H7.71167V7.99975Z" fill="#D80027"/><path d="M7.71167 4.52172H13.6894C13.2813 3.85583 12.7596 3.26726 12.1512 2.78271H7.71167V4.52172Z" fill="#D80027"/><path d="M8.00053 14.6667C9.56944 14.6667 11.0115 14.1244 12.1502 13.2175H3.85083C4.98958 14.1244 6.43162 14.6667 8.00053 14.6667Z" fill="#D80027"/><path d="M2.31233 11.4784H13.689C14.0167 10.9438 14.2708 10.3594 14.4379 9.73926H1.56348C1.73059 10.3594 1.98469 10.9438 2.31233 11.4784V11.4784Z" fill="#D80027"/><path d="M4.42123 2.37426H5.02873L4.46365 2.78478L4.6795 3.44902L4.11445 3.03851L3.5494 3.44902L3.73584 2.87519C3.23832 3.28961 2.80224 3.77514 2.44289 4.31614H2.63754L2.27784 4.57745C2.2218 4.67093 2.16806 4.7659 2.11655 4.86227L2.28831 5.3909L1.96786 5.15808C1.8882 5.32684 1.81534 5.49941 1.74985 5.67557L1.93908 6.25802H2.63754L2.07246 6.66853L2.28831 7.33278L1.72326 6.92226L1.38479 7.16818C1.35091 7.4405 1.33325 7.71788 1.33325 7.99939H7.9996C7.9996 4.31781 7.9996 3.88378 7.9996 1.33325C6.68268 1.33325 5.45506 1.71525 4.42123 2.37426V2.37426ZM4.6795 7.33278L4.11445 6.92226L3.5494 7.33278L3.76524 6.66853L3.20017 6.25802H3.89862L4.11445 5.59377L4.33027 6.25802H5.02873L4.46365 6.66853L4.6795 7.33278ZM4.46365 4.72666L4.6795 5.3909L4.11445 4.98039L3.5494 5.3909L3.76524 4.72666L3.20017 4.31614H3.89862L4.11445 3.6519L4.33027 4.31614H5.02873L4.46365 4.72666ZM7.07068 7.33278L6.50563 6.92226L5.94058 7.33278L6.15643 6.66853L5.59135 6.25802H6.28981L6.50563 5.59377L6.72146 6.25802H7.41991L6.85484 6.66853L7.07068 7.33278ZM6.85484 4.72666L7.07068 5.3909L6.50563 4.98039L5.94058 5.3909L6.15643 4.72666L5.59135 4.31614H6.28981L6.50563 3.6519L6.72146 4.31614H7.41991L6.85484 4.72666ZM6.85484 2.78478L7.07068 3.44902L6.50563 3.03851L5.94058 3.44902L6.15643 2.78478L5.59135 2.37426H6.28981L6.50563 1.71002L6.72146 2.37426H7.41991L6.85484 2.78478Z" fill="#1A47B8"/></svg>
                USD
                <svg class="w-4 h-4 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7"/></svg>
            </button>
            <div id="dropdown-fiat-currency" class="z-10 hidden bg-neutral-primary-medium border border-default-medium rounded-base shadow-lg w-32">
                <ul class="p-2 text-sm text-body font-medium" aria-labelledby="dropdown-fiat-currency-button">
                    <li>
                        <a href="#" class="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded-md">
                            <svg class="w-4 h-4 me-1.5" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.00013 14.6666C11.6821 14.6666 14.667 11.6818 14.667 7.99992C14.667 4.31802 11.6821 1.33325 8.00013 1.33325C4.31811 1.33325 1.33325 4.31802 1.33325 7.99992C1.33325 11.6818 4.31811 14.6666 8.00013 14.6666Z" fill="white"/><path d="M7.71167 7.99975H14.6678C14.6678 7.39807 14.5876 6.8152 14.4382 6.26074H7.71167V7.99975Z" fill="#D80027"/><path d="M7.71167 4.52172H13.6894C13.2813 3.85583 12.7596 3.26726 12.1512 2.78271H7.71167V4.52172Z" fill="#D80027"/><path d="M8.00053 14.6667C9.56944 14.6667 11.0115 14.1244 12.1502 13.2175H3.85083C4.98958 14.1244 6.43162 14.6667 8.00053 14.6667Z" fill="#D80027"/><path d="M2.31233 11.4784H13.689C14.0167 10.9438 14.2708 10.3594 14.4379 9.73926H1.56348C1.73059 10.3594 1.98469 10.9438 2.31233 11.4784V11.4784Z" fill="#D80027"/><path d="M4.42123 2.37426H5.02873L4.46365 2.78478L4.6795 3.44902L4.11445 3.03851L3.5494 3.44902L3.73584 2.87519C3.23832 3.28961 2.80224 3.77514 2.44289 4.31614H2.63754L2.27784 4.57745C2.2218 4.67093 2.16806 4.7659 2.11655 4.86227L2.28831 5.3909L1.96786 5.15808C1.8882 5.32684 1.81534 5.49941 1.74985 5.67557L1.93908 6.25802H2.63754L2.07246 6.66853L2.28831 7.33278L1.72326 6.92226L1.38479 7.16818C1.35091 7.4405 1.33325 7.71788 1.33325 7.99939H7.9996C7.9996 4.31781 7.9996 3.88378 7.9996 1.33325C6.68268 1.33325 5.45506 1.71525 4.42123 2.37426V2.37426ZM4.6795 7.33278L4.11445 6.92226L3.5494 7.33278L3.76524 6.66853L3.20017 6.25802H3.89862L4.11445 5.59377L4.33027 6.25802H5.02873L4.46365 6.66853L4.6795 7.33278ZM4.46365 4.72666L4.6795 5.3909L4.11445 4.98039L3.5494 5.3909L3.76524 4.72666L3.20017 4.31614H3.89862L4.11445 3.6519L4.33027 4.31614H5.02873L4.46365 4.72666ZM7.07068 7.33278L6.50563 6.92226L5.94058 7.33278L6.15643 6.66853L5.59135 6.25802H6.28981L6.50563 5.59377L6.72146 6.25802H7.41991L6.85484 6.66853L7.07068 7.33278ZM6.85484 4.72666L7.07068 5.3909L6.50563 4.98039L5.94058 5.3909L6.15643 4.72666L5.59135 4.31614H6.28981L6.50563 3.6519L6.72146 4.31614H7.41991L6.85484 4.72666ZM6.85484 2.78478L7.07068 3.44902L6.50563 3.03851L5.94058 3.44902L6.15643 2.78478L5.59135 2.37426H6.28981L6.50563 1.71002L6.72146 2.37426H7.41991L6.85484 2.78478Z" fill="#1A47B8"/></svg>
                            USD
                        </a>
                    </li>
                    <li>
                        <a href="#" class="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded-md">
                        <svg class="w-4 h-4 me-1.5" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" fill="white"/>
                            <path d="M3.05081 4.43384C2.46168 5.20033 2.01745 6.08378 1.75879 7.04352H5.66049L3.05081 4.43384Z" fill="#1A47B8"/>
                            <path d="M16.2415 7.04349C15.9828 6.08378 15.5386 5.20033 14.9495 4.43384L12.3398 7.04349H16.2415Z" fill="#1A47B8"/>
                            <path d="M1.75879 10.9567C2.01748 11.9164 2.46171 12.7998 3.05081 13.5663L5.6604 10.9567H1.75879Z" fill="#1A47B8"/>
                            <path d="M13.5677 3.05047C12.8012 2.46134 11.9178 2.01711 10.9581 1.75842V5.66009L13.5677 3.05047Z" fill="#1A47B8"/>
                            <path d="M4.43457 14.9497C5.20106 15.5388 6.08451 15.983 7.04422 16.2417V12.3401L4.43457 14.9497Z" fill="#1A47B8"/>
                            <path d="M7.04419 1.75842C6.08448 2.01711 5.20104 2.46134 4.43457 3.05044L7.04419 5.66006V1.75842Z" fill="#1A47B8"/>
                            <path d="M10.9581 16.2417C11.9178 15.983 12.8012 15.5388 13.5677 14.9497L10.9581 12.3401V16.2417Z" fill="#1A47B8"/>
                            <path d="M12.3398 10.9568L14.9495 13.5664C15.5386 12.8 15.9828 11.9165 16.2415 10.9568H12.3398Z" fill="#1A47B8"/>
                            <path d="M16.4365 8.02175H9.97831H9.97828V1.56349C9.65804 1.5218 9.33155 1.5 9 1.5C8.66839 1.5 8.34196 1.5218 8.02175 1.56349V8.02169V8.02172H1.56349C1.5218 8.34196 1.5 8.66845 1.5 9C1.5 9.33161 1.5218 9.65804 1.56349 9.97825H8.02169H8.02172V16.4365C8.34196 16.4782 8.66839 16.5 9 16.5C9.33155 16.5 9.65804 16.4782 9.97825 16.4365V9.97831V9.97828H16.4365C16.4782 9.65804 16.5 9.33161 16.5 9C16.5 8.66845 16.4782 8.34196 16.4365 8.02175Z" fill="#D80027"/>
                            <path d="M10.9556 10.9566L14.3023 14.3033C14.4563 14.1495 14.6031 13.9886 14.7432 13.8218L11.8779 10.9565H10.9556V10.9566Z" fill="#D80027"/>
                            <path d="M7.04405 10.9565H7.04399L3.69727 14.3033C3.85113 14.4572 4.012 14.604 4.17876 14.7441L7.04405 11.8788V10.9565Z" fill="#D80027"/>
                            <path d="M7.04299 7.0435V7.04344L3.69623 3.69666C3.5423 3.85052 3.39547 4.01139 3.25537 4.17815L6.12069 7.04347H7.04299V7.0435Z" fill="#D80027"/>
                            <path d="M10.9556 7.04363L14.3024 3.69681C14.1485 3.54289 13.9876 3.39605 13.8209 3.25598L10.9556 6.1213V7.04363Z" fill="#D80027"/>
                        </svg>
                        GPB
                        </a>
                    </li>
                    <li>
                        <a href="#" class="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded-md">
                        <svg class="w-4 h-4 me-1.5" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" fill="#1A47B8"/>
                            <path d="M9.00078 4.43494L9.24362 5.18227H10.0294L9.39365 5.64414L9.63649 6.39147L9.00078 5.92957L8.36504 6.39147L8.60788 5.64414L7.97217 5.18227H8.75794L9.00078 4.43494Z" fill="#FFDA44"/>
                            <path d="M5.7711 5.77211L6.4713 6.12883L7.02691 5.57324L6.90396 6.34932L7.60412 6.70606L6.82802 6.82899L6.70509 7.60513L6.34834 6.90496L5.57227 7.02792L6.12788 6.4723L5.7711 5.77211Z" fill="#FFDA44"/>
                            <path d="M4.43457 9.00005L5.1819 8.75721V7.97144L5.64374 8.60718L6.3911 8.36434L5.92918 9.00005L6.3911 9.63576L5.64374 9.39295L5.1819 10.0287V9.24289L4.43457 9.00005Z" fill="#FFDA44"/>
                            <path d="M5.7711 12.2283L6.12785 11.5281L5.57227 10.9724L6.34837 11.0954L6.70506 10.3953L6.82802 11.1714L7.60409 11.2943L6.90401 11.651L7.02691 12.4271L6.4713 11.8715L5.7711 12.2283Z" fill="#FFDA44"/>
                            <path d="M9.00078 13.5655L8.75791 12.8181H7.97217L8.60791 12.3563L8.36504 11.609L9.00078 12.0708L9.63649 11.609L9.39365 12.3563L10.0294 12.8181H9.24359L9.00078 13.5655Z" fill="#FFDA44"/>
                            <path d="M12.227 12.2283L11.5268 11.8715L10.9712 12.4271L11.0941 11.651L10.394 11.2943L11.1701 11.1714L11.293 10.3953L11.6497 11.0954L12.4258 10.9724L11.8702 11.5281L12.227 12.2283Z" fill="#FFDA44"/>
                            <path d="M13.5639 9.00017L12.8166 9.24301V10.0288L12.3547 9.39304L11.6074 9.63588L12.0693 9.00017L11.6074 8.36446L12.3547 8.6073L12.8166 7.97156V8.75736L13.5639 9.00017Z" fill="#FFDA44"/>
                            <path d="M12.227 5.77208L11.8702 6.47228L12.4258 7.02789L11.6497 6.9049L11.293 7.60507L11.1701 6.82897L10.394 6.70601L11.0941 6.34929L10.9712 5.57324L11.5268 6.12883L12.227 5.77208Z" fill="#FFDA44"/>
                        </svg>
                        EUR
                        </a>
                    </li>
                    <li>
                        <a href="#" class="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded-md">
                        <svg class="w-4 h-4 me-1.5" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.00012 16.5C13.1423 16.5 16.5002 13.1421 16.5002 9C16.5002 4.85786 13.1423 1.5 9.00012 1.5C4.85792 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85792 16.5 9.00012 16.5Z" fill="white"/>
                            <path d="M16.5009 8.99956C16.5009 6.02627 14.7705 3.4572 12.2619 2.24414V15.7549C14.7705 14.5419 16.5009 11.9728 16.5009 8.99956Z" fill="#D80027"/>
                            <path d="M1.5 8.99955C1.5 11.9728 3.23035 14.5419 5.73897 15.755V2.24414C3.23035 3.4572 1.5 6.02627 1.5 8.99955Z" fill="#D80027"/>
                            <path d="M10.3031 9.9782L11.6073 9.32606L10.9552 9.00001V8.34787L9.65092 9.00001L10.3031 7.69573H9.65092L8.99877 6.71753L8.34662 7.69573H7.69447L8.34662 9.00001L7.04232 8.34787V9.00001L6.3902 9.32606L7.69447 9.9782L7.36841 10.6303H8.67271V11.6085H9.32483V10.6303H10.6291L10.3031 9.9782Z" fill="#D80027"/>
                        </svg>
                        CAD
                        </a>
                    </li>
                </ul>
            </div>
        </div>
        <svg class="w-4 h-4 text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m16 10 3-3m0 0-3-3m3 3H5v3m3 4-3 3m0 0 3 3m-3-3h14v-3"/></svg>
        <div class="flex -space-x-px">
            <label for="crypto-input" class="mb-2.5 text-sm font-medium text-heading sr-only">Your Email</label>
            <div class="relative w-full">
                <input type="number" id="crypto-input" class="block w-full bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-s-base focus:ring-brand focus:border-brand px-3 py-2.5 placeholder:text-body" placeholder="0.323 BTC" required />
            </div>
            <button id="dropdown-crypto-button" data-dropdown-toggle="dropdown-crypto" class="inline-flex items-center shrink-0 z-10 text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-fg-brand focus:ring-4 focus:ring-neutral-tertiary font-medium leading-5 rounded-e-base text-sm px-4 py-2.5 focus:outline-none" type="button">
                <svg class="h-4 w-4 me-2" fill="none" viewBox="0 0 16 15"><path fill="#F7931A" d="M14.83 9.204A7.04 7.04 0 111.17 5.797a7.04 7.04 0 0113.66 3.407z"/><path fill="#fff" d="M11.104 6.498c.14-.937-.573-1.44-1.548-1.777l.316-1.269-.773-.192-.308 1.235c-.203-.05-.411-.098-.619-.145l.31-1.244-.771-.193-.317 1.269a25.752 25.752 0 01-.493-.116v-.004l-1.065-.266-.205.825s.573.132.56.14c.314.078.37.285.36.449l-.36 1.446c.022.005.05.013.08.025l-.08-.02-.506 2.026c-.038.095-.135.237-.354.183.008.011-.562-.14-.562-.14l-.383.884 1.005.251c.187.047.37.096.55.142l-.319 1.284.772.192.317-1.27c.21.058.415.11.615.16l-.315 1.264.772.193.32-1.281c1.317.249 2.308.148 2.724-1.043.336-.96-.016-1.513-.71-1.874.505-.116.886-.448.987-1.134zM9.34 8.973c-.239.96-1.854.44-2.378.31l.424-1.7c.524.13 2.203.39 1.954 1.39zm.239-2.49c-.218.874-1.562.43-1.999.321l.385-1.542c.436.109 1.84.312 1.614 1.222z"/></svg>
                BTC 
                <svg class="w-4 h-4 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7"/></svg>
            </button>
            <div id="dropdown-crypto" class="z-10 bg-neutral-primary-medium border border-default-medium rounded-base shadow-lg w-32 block">
                <ul class="p-2 text-sm text-body font-medium" aria-labelledby="dropdown-crypto-button">
                    <li>
                        <button type="button" class="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded-md" role="menuitem">
                            <div class="inline-flex items-center">
                                <svg class="h-4 w-4 me-2" fill="none" viewBox="0 0 16 15"><path fill="#F7931A" d="M14.83 9.204A7.04 7.04 0 111.17 5.797a7.04 7.04 0 0113.66 3.407z"/><path fill="#fff" d="M11.104 6.498c.14-.937-.573-1.44-1.548-1.777l.316-1.269-.773-.192-.308 1.235c-.203-.05-.411-.098-.619-.145l.31-1.244-.771-.193-.317 1.269a25.752 25.752 0 01-.493-.116v-.004l-1.065-.266-.205.825s.573.132.56.14c.314.078.37.285.36.449l-.36 1.446c.022.005.05.013.08.025l-.08-.02-.506 2.026c-.038.095-.135.237-.354.183.008.011-.562-.14-.562-.14l-.383.884 1.005.251c.187.047.37.096.55.142l-.319 1.284.772.192.317-1.27c.21.058.415.11.615.16l-.315 1.264.772.193.32-1.281c1.317.249 2.308.148 2.724-1.043.336-.96-.016-1.513-.71-1.874.505-.116.886-.448.987-1.134zM9.34 8.973c-.239.96-1.854.44-2.378.31l.424-1.7c.524.13 2.203.39 1.954 1.39zm.239-2.49c-.218.874-1.562.43-1.999.321l.385-1.542c.436.109 1.84.312 1.614 1.222z"/></svg>
                                BTC
                            </div>
                        </button>
                    </li>
                    <li>
                        <button type="button" class="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded-md" role="menuitem">
                            <div class="inline-flex items-center">
                                <svg class="h-4 w-4 me-2" fill="none" viewBox="0 0 10 17"><path fill="#343434" d="M5 .5l-.11.364v10.582l.11.105 4.91-2.902L5 .5z"/><path fill="#8C8C8C" d="M5 .5L.086 8.65 5 11.55V.5z"/><path fill="#3C3C3B" d="M5 12.48l-.061.075v3.77L5 16.5l4.914-6.922L5 12.48z"/><path fill="#8C8C8C" d="M5 16.5v-4.02L.086 9.578 5 16.5z"/><path fill="#141414" d="M5 11.55L9.91 8.65 5 6.418v5.133z"/><path fill="#393939" d="M.086 8.649L5 11.551V6.418L.086 8.649z"/></svg>
                                ETH
                            </div>
                        </button>
                    </li>
                    <li>
                        <button type="button" class="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded-md" role="menuitem">
                            <div class="inline-flex items-center">
                                <svg class="h-4 w-4 me-2" fill="none" viewBox="0 0 16 17"><path fill="#C2A633" d="M16 8.5a8 8 0 11-16 0 8 8 0 0116 0z"/><path fill="#fff" fill-rule="evenodd" d="M5.355 12.685h2.761S12 13.015 12 8.567c0-4.275-3.546-4.26-4.232-4.257H5.355v3.73H4.38v.914h.974v3.73zM6.91 5.858H8c.407 0 2.458.167 2.461 2.74.003 2.542-2.064 2.54-2.396 2.539H6.91V8.954h1.715v-.913H6.91V5.858z" clip-rule="evenodd"/></svg>
                                DOGE
                            </div>
                        </button>
                    </li>
                    <li>
                        <button type="button" class="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded-md" role="menuitem">
                            <div class="inline-flex items-center">
                                <svg class="h-4 w-4 me-2" fill="none" viewBox="0 0 16 13"><g clip-path="url(#clip0_460_40742)"><path fill="url(#paint0_linear_460_40742)" d="M2.599 9.8a.524.524 0 01.37-.152h12.77c.233 0 .35.282.185.447L13.4 12.617a.523.523 0 01-.37.153H.261a.261.261 0 01-.184-.447l2.522-2.522z"/><path fill="url(#paint1_linear_460_40742)" d="M2.599.383a.538.538 0 01.37-.153h12.77c.232 0 .35.282.184.446L13.401 3.2a.523.523 0 01-.37.153H.26a.262.262 0 01-.185-.447L2.599.383z"/><path fill="url(#paint2_linear_460_40742)" d="M13.401 5.062a.523.523 0 00-.37-.153H.261a.262.262 0 00-.184.446l2.522 2.523c.097.096.23.153.37.153h12.77c.233 0 .35-.282.185-.447L13.4 5.062z"/></g><defs><linearGradient id="paint0_linear_460_40742" x1="14.519" x2="5.681" y1="-1.277" y2="15.65" gradientUnits="userSpaceOnUse"><stop stop-color="#00FFA3"/><stop offset="1" stop-color="#DC1FFF"/></linearGradient><linearGradient id="paint1_linear_460_40742" x1="10.654" x2="1.817" y1="-3.294" y2="13.633" gradientUnits="userSpaceOnUse"><stop stop-color="#00FFA3"/><stop offset="1" stop-color="#DC1FFF"/></linearGradient><linearGradient id="paint2_linear_460_40742" x1="12.574" x2="3.737" y1="-2.292" y2="14.635" gradientUnits="userSpaceOnUse"><stop stop-color="#00FFA3"/><stop offset="1" stop-color="#DC1FFF"/></linearGradient><clipPath id="clip0_460_40742"><path fill="#fff" d="M0 0h16v12.54H0z" transform="translate(0 .23)"/></clipPath></defs></svg>
                                SOL
                            </div>
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    </div>
    <div class="flex justify-between items-center flex-col sm:flex-row space-y-2 sm:space-y-0">
        <p class="text-sm text-body">Last update: 20:45 AM, November 20, 2023</p>
        <button type="reset" class="text-sm text-fg-brand inline-flex items-center font-medium hover:underline">
            Refresh <svg class="w-3 h-3 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 20">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 1v5h-5M2 19v-5h5m10-4a8 8 0 0 1-14.947 3.97M1 10a8 8 0 0 1 14.947-3.97"/>
            </svg>
        </button>
    </div>
</form>
