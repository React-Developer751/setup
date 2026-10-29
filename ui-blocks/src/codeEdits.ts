// The files a person changed in the Code tab: their text, and the text the generator had when they changed it (to tell when the site moved on later).
export type FileEdit = { content: string; base: string }
type Entry = { path: string; content: string | Uint8Array }

/** the files with the person's own versions in place of the ones they changed (a binary file is never replaced) */
export const withEdits = <T extends Entry>(files: T[], edits: Record<string, FileEdit>): Entry[] =>
  files.map((f) => {
    const own = edits[f.path]
    return own && typeof f.content === 'string' && own.content !== f.content ? { path: f.path, content: own.content } : f
  })
