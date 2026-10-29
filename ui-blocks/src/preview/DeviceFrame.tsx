// A real device preview: the site runs in an <iframe> that has its own viewport (390 / 820 / 1280 px wide), so the media queries of the
// site see a phone, a tablet or a desktop. When the pane is narrower than the device, the frame is scaled down to fit.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { DEVICES, type Device } from './devices'

type Props = {
  device: Device
  /** the whole page as one HTML document (undefined while it is being built) */
  html: string | undefined
  title: string
  /** the page to show inside the site, as a hash route ("/about") */
  route: string
  /** called when the person moves to another page inside the site */
  onRoute: (route: string) => void
}

const PADDING = 24

/** Moves the site inside the frame to a page. Only the hash is set: a relative address would be resolved against the page of the generator. */
function goTo(win: Window, route: string) {
  win.location.hash = `#${route}`
}

function DeviceFrame({ device, html, title, route, onRoute }: Props) {
  const wrapper = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const [area, setArea] = useState({ width: 900, height: 700 })
  const routeRef = useRef(route)

  // the space that the frame can use
  useLayoutEffect(() => {
    const element = wrapper.current
    if (!element) return
    const measure = () => setArea({ width: element.clientWidth, height: element.clientHeight })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // the site tells which page it shows (its own links, the back button ...)
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return
      const data = event.data as { site?: string; path?: string } | null
      if (data?.site === 'preview-route' && typeof data.path === 'string' && data.path !== routeRef.current) onRoute(data.path)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [onRoute])

  // the page chosen in the tabs above the preview
  useEffect(() => {
    routeRef.current = route
    const win = frame.current?.contentWindow
    const wanted = `#${route}`
    if (win && win.location.hash !== wanted && !(route === '/' && win.location.hash === '')) {
      try {
        goTo(win, route)
      } catch {
        // the frame is not ready yet: onLoad sets it
      }
    }
  }, [route])

  const { width, height: deviceHeight } = DEVICES[device]
  const scale = Math.min(1, (area.width - PADDING * 2) / width)
  // the frame is as tall as the pane (a phone does not have to be 844 px tall on a small laptop), but never taller than the device
  const availableHeight = Math.max(320, area.height - PADDING * 2 - (device === 'desktop' ? 34 * scale : 0))
  const height = Math.min(deviceHeight * (device === 'desktop' ? 2 : 1.2), availableHeight / scale)
  const bezel = device === 'mobile' ? 10 : device === 'tablet' ? 12 : 0

  return (
    <div ref={wrapper} className="relative flex h-full w-full items-start justify-center overflow-auto bg-transparent p-6">
      <div style={{ width: (width + bezel * 2) * scale, height: (height + bezel * 2 + (device === 'desktop' ? 34 : 0)) * scale }} className="shrink-0">
        <div
          style={{ width: width + bezel * 2, transform: `scale(${scale})`, transformOrigin: 'top left', padding: bezel }}
          className={`overflow-hidden bg-gray-900 shadow-2xl ring-1 ring-black/10 ${device === 'mobile' ? 'rounded-[44px]' : device === 'tablet' ? 'rounded-[28px]' : 'rounded-lg bg-white'}`}
        >
          {device === 'desktop' && (
            <div className="flex h-[34px] items-center gap-2 border-b border-gray-200 bg-gray-50 px-3">
              <span className="size-2.5 rounded-full bg-red-400" />
              <span className="size-2.5 rounded-full bg-amber-400" />
              <span className="size-2.5 rounded-full bg-emerald-400" />
              <span className="mx-3 flex-1 truncate rounded-md bg-white px-3 py-0.5 text-center text-xs text-gray-500 ring-1 ring-gray-200">{title}{route === '/' ? '' : route}</span>
            </div>
          )}
          <div className={`relative overflow-hidden bg-white ${device === 'mobile' ? 'rounded-[34px]' : device === 'tablet' ? 'rounded-[18px]' : ''}`} style={{ width, height }}>
            {html ? (
              <iframe
                ref={frame}
                key={html.length}
                title={`${title} (${DEVICES[device].label} preview)`}
                srcDoc={html}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                style={{ width, height }}
                className="block border-0 bg-white"
                onLoad={() => {
                  const win = frame.current?.contentWindow
                  if (win && routeRef.current !== '/') goTo(win, routeRef.current)
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">Building the preview…</div>
            )}
          </div>
        </div>
      </div>
      <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-xs text-gray-500 shadow-sm ring-1 ring-gray-200">
        {DEVICES[device].label} · {width} px{scale < 1 ? ` · shown at ${Math.round(scale * 100)}%` : ''}
      </span>
    </div>
  )
}

export default DeviceFrame
