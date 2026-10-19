// One command for everything: the website app (vite), the API server and the image engine (PixelMath).
//   npm run app
import { spawn } from 'node:child_process'

const run = (name, command, args) => {
  const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], env: process.env })
  const tag = (data) => String(data).split('\n').filter(Boolean).forEach((line) => console.log(`[${name}] ${line}`))
  child.stdout.on('data', tag)
  child.stderr.on('data', tag)
  child.on('exit', (code) => console.log(`[${name}] stopped (${code})`))
  return child
}
const children = [
  run('images', process.execPath, ['scripts/run-pixelmath.mjs']),
  run('server', process.execPath, ['server/index.mjs']),
  run('app', process.execPath, ['node_modules/vite/bin/vite.js', '--port', '5173']),
]
console.log('\nOpen http://localhost:5173  (Ctrl+C stops all three)\n')
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { children.forEach((c) => c.kill(signal)); process.exit(0) })
