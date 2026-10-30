// node scripts/backup-data.mjs [outDir] [keep]   (default: backups/, 14)
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { backupData } from '../server/backup.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const result = backupData(process.env.EDIT_DATA_DIR ?? path.join(root, 'server', 'data'), process.argv[2] ?? path.join(root, 'backups'), Number(process.argv[3]) || 14)
console.log(result.ok ? `backup written: ${result.file} (${(result.bytes / 1024).toFixed(0)} KB, ${result.kept} kept)` : `backup failed: ${result.error}`)
process.exit(result.ok ? 0 : 1)
