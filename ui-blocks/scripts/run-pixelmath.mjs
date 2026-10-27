// Starts the PixelMath image engine (the `normal` folder next to this project) so that "Pictures from the image AI" works:
//   npm run images
// The folder is only run, never changed (no .pyc files are written into it). Other places: PIXELMATH_DIR=/path/to/normal, PIXELMATH_PORT=8000,
// and PIXELMATH_API_KEY if the engine was started with a key (the server of this project sends it along).
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const dir = path.resolve(process.env.PIXELMATH_DIR ?? ['../normal', '../../normal'].find((d) => fs.existsSync(path.join(d, 'serve.py'))) ?? '../normal')
const port = process.env.PIXELMATH_PORT ?? '8000'
if (!fs.existsSync(path.join(dir, 'serve.py'))) {
  console.error(`The image engine was not found in ${dir} (serve.py is missing). Set PIXELMATH_DIR to the folder of the engine.`)
  process.exit(1)
}
const python = process.env.PYTHON ?? 'python3'
const args = ['serve.py', '--port', port, '--quiet']
console.log(`image engine: ${python} ${args.join(' ')}  (in ${dir})  ->  http://127.0.0.1:${port}`)
const child = spawn(python, args, { cwd: dir, stdio: 'inherit', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } })
child.on('exit', (code) => process.exit(code ?? 0))
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal))
