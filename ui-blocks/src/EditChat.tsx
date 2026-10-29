import { useEffect, useRef, useState } from 'react'
import type { Choice } from './generator/edit/clarify'
import { colorFromFile } from './generator/edit/imageColor'
import { describeOp, type EditOp } from './generator/edit/edits'

export type ChatMessage = {
  id: number
  role: 'user' | 'ai'
  text: string
  ops?: EditOp[]
  /** where the understanding came from: the offline rules */
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
  onSend: (text: string) => void
  onChoose: (choice: Choice) => void
  /** a colour picked by hand or taken from a picture */
  onColor: (hex: string, label: string, alt?: string) => void
  onUndo: () => void
  onRedo: () => void
  onReset: () => void
}

const SUGGESTIONS = ['remove the FAQ', 'rename it to Green Leaf', 'make the buttons blue', 'dark mode', 'pricing hatao', 'add a gallery', 'no animations', 'rename pricing to Our Plans', 'move FAQ above pricing', 'make the gallery shorter', 'center the hero']

function EditChat({ messages, busy, canUndo, canRedo, changes, onSend, onChoose, onColor, onUndo, onRedo, onReset }: Props) {
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
    <section className="flex h-full min-h-0 flex-col" aria-label="Chat: ask for a change">
      {/* the history: what was made and what was changed, newest at the bottom */}
      <div role="log" aria-live="polite" className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="rounded-2xl bg-white/70 p-3 text-sm text-stone-600 ring-1 ring-black/5">
            Your website is ready. Tell me what to change, in English, Hinglish or Hindi: remove a section, rename the business, change a colour, a headline, the phone number ...
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'ai' && (
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-white" style={{ background: 'var(--lv-grad)' }} aria-hidden="true">
                <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
                  <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2Z" />
                </svg>
              </span>
            )}
            <div className={`max-w-[88%] rounded-2xl px-3.5 py-2 text-[13.5px] leading-relaxed ${m.role === 'user' ? 'rounded-br-md bg-stone-900 text-white' : 'rounded-tl-md bg-white text-stone-800 shadow-sm ring-1 ring-black/5'}`}>
              <p className="whitespace-pre-wrap break-words">{m.text}</p>
              {m.ops && m.ops.length > 0 && (
                <ul className="mt-1.5 flex flex-wrap gap-1">
                  {m.ops.map((op, i) => (
                    <li key={i} className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-600">
                      {describeOp(op)}
                    </li>
                  ))}
                </ul>
              )}
              {m.via === 'server' && <p className="mt-0.5 text-[10px] text-stone-400">understood by the local server</p>}
              {m.choices && m.choices.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.choices.map((choice) => (
                    <button
                      key={choice.label}
                      type="button"
                      disabled={busy || m.id !== messages[messages.length - 1]?.id}
                      onClick={() => onChoose(choice)}
                      className="lv-chip !px-3 !py-1 !text-xs !text-violet-700 disabled:opacity-40"
                    >
                      {choice.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-xs text-stone-500" role="status">
            <span className="lv-spinner !size-4" aria-hidden="true" /> thinking ...
          </div>
        )}
        <div ref={end} />
      </div>

      {/* the box to write in stays at the bottom */}
      <div className="space-y-2.5 border-t border-black/5 bg-white/60 px-4 pb-4 pt-3 backdrop-blur">
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]" aria-label="Ideas">
          {SUGGESTIONS.map((suggestion) => (
            <button key={suggestion} type="button" onClick={() => send(suggestion)} className="lv-chip shrink-0 !px-2.5 !py-1 !text-[11.5px]">
              {suggestion}
            </button>
          ))}
        </div>
        <form
          className="lv-composer flex items-end gap-2 !rounded-2xl p-2"
          onSubmit={(e) => {
            e.preventDefault()
            send(text)
          }}
        >
          <label htmlFor="chat-input" className="sr-only">
            What should change?
          </label>
          <textarea
            id="chat-input"
            value={text}
            rows={1}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send(text)
              }
            }}
            placeholder='Ask for a change, e.g. "FAQ hatao"'
            className="max-h-28 min-h-9 flex-1 px-2 py-1.5 !text-sm"
          />
          <button type="submit" disabled={busy || !text.trim()} aria-label="Send" className="lv-btn lv-btn-primary size-9 shrink-0 !rounded-full disabled:opacity-40">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </form>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-600">
          <label className="lv-chip !px-2.5 !py-1 !text-[11px]">
            <span aria-hidden="true">🎨</span> Colour
            <input type="color" defaultValue="#2563eb" aria-label="Pick the main colour" className="size-4 cursor-pointer border-0 bg-transparent p-0" onChange={(e) => onColor(e.target.value, `colour ${e.target.value}`)} />
          </label>
          <label className="lv-chip !px-2.5 !py-1 !text-[11px]">
            🖼 Colours from my logo
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => void pick(e.target.files?.[0])} />
          </label>
          <span className="ml-auto flex gap-1">
            <button type="button" onClick={onUndo} disabled={!canUndo} className="lv-btn lv-btn-ghost px-2.5 py-1 text-[11px] disabled:opacity-40">
              Undo
            </button>
            <button type="button" onClick={onRedo} disabled={!canRedo} className="lv-btn lv-btn-ghost px-2.5 py-1 text-[11px] disabled:opacity-40">
              Redo
            </button>
            <button type="button" onClick={onReset} disabled={!changes} className="lv-btn lv-btn-ghost px-2.5 py-1 text-[11px] disabled:opacity-40">
              Reset
            </button>
          </span>
        </div>
        {note && <p className="text-[11px] text-amber-700">{note}</p>}
      </div>
    </section>
  )
}

/** the optional local server (it keeps feedback and picture ratings): one line in the settings */
export function ServerSetting({ serverReady, useServer, onUseServer }: { serverReady: boolean; useServer: boolean; onUseServer: (on: boolean) => void }) {
  return (
    <label className="flex items-start gap-2 text-xs text-stone-500" title="Optional: your own local server (npm run server) keeps your feedback and picture ratings. No external AI is used. Without it everything works offline.">
      <input type="checkbox" checked={useServer} onChange={(e) => onUseServer(e.target.checked)} className="mt-0.5" />
      <span>
        Save my feedback and picture ratings on my own server <b className={serverReady ? 'text-emerald-700' : 'text-stone-400'}>{serverReady ? '(connected)' : '(not running: works offline)'}</b>
      </span>
    </label>
  )
}

export default EditChat
