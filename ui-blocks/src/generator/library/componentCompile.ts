// The text of a component file -> JavaScript the browser can run (sucrase: TypeScript and JSX; no server, no network). Kept apart from the part that
// runs it, so that it can be tested without a browser.
import { transform } from 'sucrase'

/** the file as CommonJS (`require`, `exports.default`), or why it cannot be compiled ("Unexpected token (12:5)") */
export function compileSource(source: string): { code: string } | { error: string } {
  try {
    return { code: transform(source, { transforms: ['typescript', 'jsx', 'imports'], jsxRuntime: 'automatic', production: true }).code }
  } catch (error) {
    return { error: `The file has a mistake: ${(error instanceof Error ? error.message : String(error)).replace(/\s+/g, ' ').slice(0, 240)}` }
  }
}

/** the names a compiled component asks for with `require` ("react/jsx-runtime", "react") */
export const requiredModules = (code: string) => [...code.matchAll(/require\(["']([^"']+)["']\)/g)].map((m) => m[1])
