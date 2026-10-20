// The site as a JSON document (edit/blueprint.ts): read it, change a word or a colour in it, and the site changes by exactly that.
import { useMemo, useState } from 'react'
import { fromBlueprint, type Blueprint } from './generator/edit/blueprint'
import { cleanOp, describeOp, type EditOp } from './generator/edit/edits'

type Props = {
  blueprint: Blueprint
  onApply: (ops: EditOp[]) => void
}

function JsonEditor({ blueprint, onApply }: Props) {
  const shown = useMemo(() => JSON.stringify(blueprint, null, 2), [blueprint])
  // the document follows the site, unless the person is in the middle of changing it
  const [draft, setDraft] = useState<string>()
  const [copied, setCopied] = useState(false)
  const text = draft ?? shown
  const dirty = draft !== undefined

  const result = useMemo(() => {
    if (!dirty) return { ops: [] as EditOp[], problems: [] as string[] }
    try {
      const { ops, problems } = fromBlueprint(JSON.parse(text), blueprint)
      return { ops: ops.map(cleanOp).filter((op): op is EditOp => !!op), problems }
    } catch (error) {
      return { ops: [] as EditOp[], problems: [`This is not valid JSON: ${error instanceof Error ? error.message : 'check the commas and quotes'}`] }
    }
  }, [text, dirty, blueprint])

  const apply = () => {
    if (!result.ops.length || result.problems.length) return
    onApply(result.ops)
    setDraft(undefined)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-900">
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-300">
        <span className="font-mono text-gray-400">site.json</span>
        <span className="text-gray-500">Change a word or a colour here; the site changes by exactly that.</span>
        <span className="ml-auto flex gap-2">
          <button type="button" onClick={() => { void navigator.clipboard?.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 1500) }} className="rounded-md bg-gray-800 px-3 py-1 text-gray-200 hover:bg-gray-700">
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button type="button" onClick={() => setDraft(undefined)} disabled={!dirty} className="rounded-md bg-gray-800 px-3 py-1 text-gray-200 hover:bg-gray-700 disabled:opacity-40">
            Reset
          </button>
          <button type="button" onClick={apply} disabled={!result.ops.length || result.problems.length > 0} className="rounded-md bg-indigo-600 px-3 py-1 font-semibold text-white hover:bg-indigo-500 disabled:opacity-40">
            Apply {result.ops.length ? `${result.ops.length} change${result.ops.length === 1 ? '' : 's'}` : ''}
          </button>
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setDraft(e.target.value)}
        spellCheck={false}
        aria-label="The site as JSON"
        className="min-h-0 flex-1 resize-none bg-gray-900 p-4 font-mono text-xs leading-relaxed text-gray-100 outline-none"
      />
      {dirty && (
        <div className="max-h-32 overflow-auto border-t border-gray-800 bg-gray-950 px-3 py-2 text-xs">
          {result.problems.map((p) => (
            <p key={p} className="text-amber-300">
              {p}
            </p>
          ))}
          {!result.problems.length && result.ops.length === 0 && <p className="text-gray-500">No change yet.</p>}
          {!result.problems.length && result.ops.map((op, i) => (
            <p key={i} className="text-emerald-300">
              + {describeOp(op)}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

export default JsonEditor
