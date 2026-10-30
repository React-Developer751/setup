// Backups of server/data (designs, prompts, edit log, projects with their versions, published sites): one .tar.gz per run, the newest N are kept.
//   node scripts/backup-data.mjs            (or set EDIT_BACKUP_HOURS=24 and the server does it itself)
// Restore: stop the server, then  tar -xzf backups/data-<time>.tar.gz -C server/  (it holds the folder "data").
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

export function backupData(dataDir, outDir, keep = 14) {
  if (!fs.existsSync(dataDir)) return { ok: false, error: 'there is no data folder yet' }
  fs.mkdirSync(outDir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19)
  const file = path.join(outDir, `data-${stamp}.tar.gz`)
  // the picture cache is rebuilt by itself and the half-written temporary files are not worth keeping
  const run = spawnSync('tar', ['-czf', file, '--exclude=photo-cache', '--exclude=*.tmp*', '-C', path.dirname(dataDir), path.basename(dataDir)], { encoding: 'utf8' })
  if (run.status !== 0) return { ok: false, error: String(run.stderr || 'tar failed').slice(0, 200) }
  const all = fs.readdirSync(outDir).filter((f) => /^data-.*\.tar\.gz$/.test(f)).sort()
  for (const old of all.slice(0, Math.max(0, all.length - keep))) fs.rmSync(path.join(outDir, old), { force: true })
  return { ok: true, file, bytes: fs.statSync(file).size, kept: Math.min(all.length, keep) }
}
