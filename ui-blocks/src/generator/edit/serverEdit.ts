// Calls to the local server of this project (server/index.mjs): its health, the image engine, and the feedback file. No external AI or API.
import type { EditOp } from './edits'

export async function serverHealth(): Promise<boolean> {
  try {
    const res = await fetch('/api/health', { signal: AbortSignal.timeout(2500) })
    if (!res.ok) return false
    const body = (await res.json()) as { ok?: boolean }
    return !!body.ok
  } catch {
    return false
  }
}

/** is the image engine (PixelMath) reachable through the server of this project? */
export async function imageEngineUp(): Promise<boolean> {
  try {
    const res = await fetch('/api/health', { signal: AbortSignal.timeout(2500) })
    return res.ok && !!((await res.json()) as { images?: boolean }).images
  } catch {
    return false
  }
}

/** tells the server what the person did with an answer, so that the examples can be collected for training the offline parser */
export function sendFeedback(entry: { text: string; ops: EditOp[]; accepted: boolean; source: 'rules' | 'server' }): void {
  try {
    void fetch('/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(entry), keepalive: true }).catch(() => undefined)
  } catch {
    // feedback is optional
  }
}
