import { useState } from 'react'
import type { EditOp } from './generator/edit/edits'
import { parseHoursText, parseServices } from './generator/edit/understand'
import { readPicture } from './generator/edit/imageFile'

const PHOTO_SIZE = (i: number) => (i === 0 ? { side: 1280, chars: 170_000 } : i === 1 ? { side: 1000, chars: 130_000 } : { side: 800, chars: 100_000 })

type Props = {
  onApply: (ops: EditOp[]) => void
  /** the name the generator made up (the person did not give one): the name field asks for the real one */
  madeUpName?: string
  /** shown in the chat right after a site is made: closed fields that are not needed are not asked */
  compact?: boolean
}

/** The real facts of the business in one place: they become ordinary changes (undo works, the chat sees them). */
function BusinessForm({ onApply, madeUpName, compact }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [hours, setHours] = useState('')
  const [address, setAddress] = useState('')
  const [services, setServices] = useState('')
  const [note, setNote] = useState('')
  const [pictures, setPictures] = useState<string[]>([])
  const [reading, setReading] = useState(false)
  const choosePictures = async (files: FileList | null) => {
    const list = [...(files ?? [])].filter((f) => f.type.startsWith('image/')).slice(0, 8)
    if (!list.length) return
    setReading(true)
    try {
      setPictures(await Promise.all(list.map((f, i) => readPicture(f, PHOTO_SIZE(i).side, false, PHOTO_SIZE(i).chars))))
      setNote('')
    } catch (error) {
      setNote(error instanceof Error ? error.message : 'Could not read the pictures.')
    }
    setReading(false)
  }

  const apply = () => {
    const ops: EditOp[] = []
    if (name.trim().length >= 2) ops.push({ op: 'rename', name: name.trim().slice(0, 40) })
    if (phone.trim()) {
      if (phone.replace(/\D/g, '').length < 8) return setNote('The phone number looks too short.')
      ops.push({ op: 'contact', field: 'phone', value: phone.trim() })
    }
    if (email.trim()) {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setNote('The e-mail address does not look right.')
      ops.push({ op: 'contact', field: 'email', value: email.trim() })
    }
    if (whatsapp.trim()) ops.push({ op: 'contact', field: 'whatsapp', value: whatsapp.trim() })
    const parsedHours = hours.trim() ? parseHoursText(`hours: ${hours.trim()}`) : undefined
    if (hours.trim() && !parsedHours) {
      setNote('The opening hours need a time, for example "Mon-Sat 9am-7pm, Sun closed".')
      return
    }
    if (parsedHours) ops.push({ op: 'contact', field: 'hours', value: parsedHours })
    if (address.trim()) ops.push({ op: 'contact', field: 'address', value: address.trim() })
    const items = services.trim() ? parseServices(`services: ${services.split('\n').map((l) => l.trim()).filter(Boolean).join(', ')}`) : undefined
    if (services.trim() && !items) {
      setNote('I could not read the services. One per line, with the price after the name: "Haircut 300".')
      return
    }
    if (items) ops.push({ op: 'services', items })
    if (pictures.length) ops.push({ op: 'photos', hero: pictures[0], ...(pictures[1] ? { about: pictures[1] } : {}), ...(pictures.length > 2 ? { gallery: pictures.slice(2) } : {}) })
    if (!ops.length) {
      setNote('Fill in at least one field.')
      return
    }
    setNote('')
    onApply(ops)
  }

  const field = 'w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
  return (
    <details className="rounded-xl border border-gray-200 bg-white" open>
      <summary className="cursor-pointer list-none px-3 py-2 text-sm font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">{compact ? "Make it yours" : "Your business details"} ▾</summary>
      <div className="space-y-2.5 px-3 pb-3 text-xs text-gray-600">
        <p>Real facts instead of the samples: your name, how people reach you, the WhatsApp button, the map, opening hours and your own services and prices.</p>
        <label className="block space-y-1">
          <span className="font-medium text-gray-700">{madeUpName ? `Business name (the site says "${madeUpName}", which I made up)` : 'Business name'}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={madeUpName ? 'Your real business name' : 'Leave empty to keep the name'} className={field} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block space-y-1">
            <span className="font-medium text-gray-700">Phone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className={field} inputMode="tel" />
          </label>
          <label className="block space-y-1">
            <span className="font-medium text-gray-700">E-mail (form messages come here)</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={field} inputMode="email" />
          </label>
        </div>
        <label className="block space-y-1">
          <span className="font-medium text-gray-700">Your own photos (up to 8) {reading ? '...' : pictures.length ? `(${pictures.length} ready)` : ''}</span>
          <input type="file" accept="image/*" multiple onChange={(e) => void choosePictures(e.target.files)} className="block w-full text-xs" />
          <span className="block text-[11px] text-gray-500">The pictures drawn by the image AI are illustrations. Real photos of your place and your work replace them: the first is the main picture, the second goes in About, the rest in the gallery.</span>
        </label>
        <label className="block space-y-1">
          <span className="font-medium text-gray-700">WhatsApp number (with country code)</span>
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+91 98765 43210" className={field} inputMode="tel" />
        </label>
        <label className="block space-y-1">
          <span className="font-medium text-gray-700">Opening hours</span>
          <input value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Mon-Sat 9am-7pm, Sun closed" className={field} />
        </label>
        <label className="block space-y-1">
          <span className="font-medium text-gray-700">Address (shows a Google map)</span>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="12 MG Road, Pune 411001" className={field} />
        </label>
        <label className="block space-y-1">
          <span className="font-medium text-gray-700">Services and prices (one per line)</span>
          <textarea value={services} onChange={(e) => setServices(e.target.value)} rows={4} placeholder={'Haircut 300\nFacial 800\nBridal makeup 5000'} className={`${field} resize-y`} />
        </label>
        {note && <p className="text-amber-700">{note}</p>}
        <button type="button" onClick={apply} className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          Put these on my site
        </button>
      </div>
    </details>
  )
}

export default BusinessForm
