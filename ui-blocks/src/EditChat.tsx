import { useEffect, useRef, useState } from 'react'
import type { Choice } from './generator/edit/clarify'
import { colorFromFile } from './generator/edit/imageColor'
import { describeOp, type EditOp } from './generator/edit/edits'

export type ChatMessage = {
  id: number
  role: 'user' | 'ai'
  text: string
  ops?: EditOp[]
  /** where the understanding came from: the offline rules or the AI server */
  via?: 'rules' | 'server' | 'guess'
  /** buttons that answer a question of the chat (the last message's buttons are the live ones) */
  choices?: Choice[]
}

type Props = {
  messages: ChatMessage[]
  busy: boolean
  canUndo: boolean
  canRedo: boolean
  changes: number
  serverReady: boolean
  useServer: boolean
  onUseServer: (on: boolean) => void
  onSend: (text: string) => void
  onChoose: (choice: Choice) => void
  /** a colour picked by hand or taken from a picture */
  onColor: (hex: string, label: string, alt?: string) => void
  onUndo: () => void
  onRedo: () => void
  onReset: () => void
}

const SUGGESTIONS = ['remove the FAQ', 'rename it to Green Leaf', 'make the buttons blue', 'dark mode', 'pricing hatao', 'add a gallery', 'no animations', 'rename pricing to Our Plans', 'move FAQ above pricing', 'make the gallery shorter', 'center the hero']

function EditChat({ messages, busy, canUndo, canRedo, changes, serverReady, useServer, onUseServer, onSend, onChoose, onColor, onUndo, onRedo, onReset }: Props) {
  const [text, setText] = useState('')
  const end = useRef<HTMLDivElement>(null)
  const [note, setNote] = useState('')
  const pick = async (file: File | undefined) => {
    if (!file) return
    const found = await colorFromFile(file)
    if (found) {
      setNote('')
      onColor(found.accent, `colours from ${file.name}`, found.alt)
    } else setNote('I could not read a colour from that picture. Try a png, jpg or svg.')
  }

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' })
  }, [messages.length, busy])

  const send = (value: string) => {
    if (!value.trim() || busy) return
    onSend(value.trim())
    setText('')
  }

  return (
    <section className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/40 p-3" aria-label="Edit the website by chatting">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-900">Ask for a change</h2>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onUndo} disabled={!canUndo} className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40">
            Undo
          </button>
          <button type="button" onClick={onRedo} disabled={!canRedo} className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40">
            Redo
          </button>
          <button type="button" onClick={onReset} disabled={!changes} className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40">
            Reset
          </button>
        </div>
      </div>

      <div role="log" aria-live="polite" className="max-h-64 min-h-16 space-y-2 overflow-y-auto rounded-lg bg-white p-2 text-sm ring-1 ring-gray-200">
        {messages.length === 0 && (
          <p className="px-1 py-2 text-xs text-gray-500">
            The website is made. Tell me what to change, in English, Hinglish or Hindi: remove a section, rename the business, change a colour, a headline, the phone number ...
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div className={`max-w-[92%] rounded-2xl px-3 py-1.5 ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
              <p className="whitespace-pre-wrap break-words">{m.text}</p>
              {m.ops && m.ops.length > 0 && (
                <ul className="mt-1 flex flex-wrap gap-1">
                  {m.ops.map((op, i) => (
                    <li key={i} className="rounded-full bg-white px-2 py-0.5 text-[11px] text-gray-700 ring-1 ring-gray-200">
                      {describeOp(op)}
                    </li>
                  ))}
                </ul>
              )}
              {m.via === 'server' && <p className="mt-0.5 text-[10px] text-gray-500">understood by the AI server</p>}
              {m.choices && m.choices.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {m.choices.map((choice) => (
                    <button
                      key={choice.label}
                      type="button"
                      disabled={busy || m.id !== messages[messages.length - 1]?.id}
                      onClick={() => onChoose(choice)}
                      className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 disabled:opacity-40"
                    >
                      {choice.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && <p className="px-1 text-xs text-gray-500">thinking ...</p>}
        <div ref={end} />
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          send(text)
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="What should change?"
          placeholder='e.g. "FAQ hatao aur naam Zen Cafe rakho"'
          className="min-w-0 flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
        <button type="submit" disabled={busy || !text.trim()} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
          Send
        </button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" onClick={() => send(s)} className="rounded-full bg-white px-2.5 py-1 text-[11px] text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100">
            {s}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
        <label className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-2.5 py-1 ring-1 ring-gray-200 hover:bg-gray-100">
          <span aria-hidden>🎨</span> Pick a colour
          <input type="color" defaultValue="#2563eb" aria-label="Pick the main colour" className="size-4 cursor-pointer border-0 bg-transparent p-0" onChange={(e) => onColor(e.target.value, `colour ${e.target.value}`)} />
        </label>
        <label className="cursor-pointer rounded-full bg-white px-2.5 py-1 ring-1 ring-gray-200 hover:bg-gray-100">
          🖼 Colour from my logo / photo
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => void pick(e.target.files?.[0])} />
        </label>
        {note && <span className="text-amber-700">{note}</span>}
      </div>

      <label className="flex items-start gap-2 text-[11px] text-gray-500" title="Optional: a small server (npm run server) asks an AI model to read the request. Without it everything works offline.">
        <input type="checkbox" checked={useServer} onChange={(e) => onUseServer(e.target.checked)} className="mt-0.5" />
        <span>
          Also ask the AI server for hard requests{' '}
          <b className={serverReady ? 'text-emerald-700' : 'text-gray-400'}>{serverReady ? '(connected)' : '(not running: works offline)'}</b>
        </span>
      </label>
    </section>
  )
}

export default EditChat
