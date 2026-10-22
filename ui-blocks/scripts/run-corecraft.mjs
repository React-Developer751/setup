// Starts the bridge to Core-Craft AI (the `cont` folder next to this project) so that "Core-Craft AI" suggestions work in the generator:
//   npm run corecraft
// The folder is only imported, never changed. Other places: CORECRAFT_DIR=/path/to/cont, CORECRAFT_PORT=8100.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const dir = path.resolve(process.env.CORECRAFT_DIR ?? '../../cont')
if (!fs.existsSync(path.join(dir, 'corecraft', 'content_engine.py'))) {
  console.error(`Core-Craft was not found in ${dir}. Set CORECRAFT_DIR to the folder that holds corecraft/.`)
  process.exit(1)
}
const python = process.env.PYTHON ?? 'python3'
const child = spawn(python, [path.resolve('scripts/corecraft_bridge.py'), '--port', process.env.CORECRAFT_PORT ?? '8100'], { stdio: 'inherit', env: { ...process.env, CORECRAFT_DIR: dir, PYTHONDONTWRITEBYTECODE: '1' } })
child.on('exit', (code) => process.exit(code ?? 0))
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal))
