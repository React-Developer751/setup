// The Vite project of a page made from the stored components: package.json, the page, the components it uses, and the runtime around them (found by
// following the imports of ThemeScope: see projectFiles.ts). Pure: the files are read through `env`, so the browser (Vite) and a script (disk) build the same project.
import { fontLinks } from '../fonts'
import type { generateLibraryPage } from './generateLibraryPage'
import { closureOf } from './projectFiles'

type Library = ReturnType<typeof generateLibraryPage>
export type ProjectEntry = { path: string; content: string | Uint8Array }

export type ProjectEnv = {
  /** the package.json of the generator (the versions of the packages) */
  packageJson: string
  indexCss: string
  /** a file of src/ as text ("generator/library/ThemeScope.tsx"), undefined when there is none */
  readSource: (path: string) => Promise<string | undefined>
  /** a stored component as text ("hero/Hero3") */
  readComponent: (id: string) => Promise<string>
  /** the text types of the generated content (WebsiteContent ...) */
  contentTypes: () => string
  /** the types of the motion plan */
  motionTypes: () => string
  /** the pictures the components point at (assets/img/...) */
  assets?: (sources: string[]) => Promise<ProjectEntry[]>
}

/** The text type of the generated content, cut out of the generator's own files so it cannot drift. */
export function contentTypesFrom(finalPromptSource: string, extraContentSource: string, siteTypesSource: string): string {
  const quote = finalPromptSource.match(/^type Quote = .*$/m)![0]
  const plan = extraContentSource.match(/^export type Plan = .*$/m)![0]
  const shared = siteTypesSource.slice(siteTypesSource.indexOf('export type Milestone'))
  const start = finalPromptSource.indexOf('export type WebsiteContent')
  const content = finalPromptSource.slice(start, finalPromptSource.indexOf('\n}\n', start) + 3)
  return `// The shape of the text that fills the page.\n${quote}\n${plan}\n${shared}\n${content}`
}

const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'my-website'

export async function libraryProjectEntries(lib: Library, env: ProjectEnv): Promise<ProjectEntry[]> {
  const pkg = JSON.parse(env.packageJson) as { dependencies: Record<string, string>; devDependencies: Record<string, string> }
  const name = slug(lib.content.brandName)
  const ids = [...new Set(lib.sections.map((s) => s.componentId))]
  const sources = await Promise.all(ids.map((id) => env.readComponent(id)))

  // the runtime: everything ThemeScope needs at run time, in the same folders as in the generator (so the page imports the same paths)
  const { files: runtime, packages } = await closureOf(['generator/library/ThemeScope.tsx'], env.readSource)
  const versions: Record<string, string> = { ...pkg.devDependencies, ...pkg.dependencies }
  const dependencies: Record<string, string> = { react: versions.react, 'react-dom': versions['react-dom'] }
  for (const used of packages) if (versions[used] && !['react', 'react-dom'].includes(used)) dependencies[used] = versions[used]

  const files: ProjectEntry[] = [
    {
      path: 'package.json',
      content:
        JSON.stringify(
          {
            name,
            private: true,
            version: '1.0.0',
            type: 'module',
            scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
            dependencies,
            devDependencies: {
              '@tailwindcss/forms': versions['@tailwindcss/forms'],
              '@tailwindcss/vite': versions['@tailwindcss/vite'],
              '@types/react': versions['@types/react'],
              '@types/react-dom': versions['@types/react-dom'],
              '@vitejs/plugin-react': versions['@vitejs/plugin-react'],
              tailwindcss: versions.tailwindcss,
              typescript: versions.typescript,
              vite: versions.vite,
            },
          },
          null,
          2,
        ) + '\n',
    },
    {
      path: 'index.html',
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(lib.content.brandName)}</title>
    <meta name="description" content="${escapeHtml(lib.content.hero.subtitle)}" />
    ${fontLinks(lib.themeKey).replace(/\n/g, '\n    ')}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    },
    {
      path: 'vite.config.ts',
      content: `import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// base './' lets the built site live in any folder or sub-path of a web server
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
`,
    },
    {
      path: 'tsconfig.json',
      content:
        JSON.stringify(
          {
            compilerOptions: {
              target: 'ES2022',
              lib: ['ES2023', 'DOM', 'DOM.Iterable'],
              module: 'ESNext',
              moduleResolution: 'bundler',
              types: ['vite/client'],
              jsx: 'react-jsx',
              strict: false,
              skipLibCheck: true,
              noEmit: true,
              isolatedModules: true,
              resolveJsonModule: true,
              allowImportingTsExtensions: true,
            },
            include: ['src'],
          },
          null,
          2,
        ) + '\n',
    },
    { path: '.gitignore', content: 'node_modules\ndist\n' },
    { path: 'src/index.css', content: env.indexCss },
    { path: 'src/vite-env.d.ts', content: '/// <reference types="vite/client" />\n' },
    {
      path: 'src/main.tsx',
      content: `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './GeneratedLandingPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
`,
    },
    { path: 'src/GeneratedLandingPage.tsx', content: lib.code },
    // the types the runtime imports from files of the generator that are not copied (the text of the page, the motion plan)
    { path: 'src/generator/finalPrompt.ts', content: env.contentTypes() },
    { path: 'src/generator/motionBrain.ts', content: env.motionTypes() },
    ...[...runtime.entries()].map(([path, content]) => ({ path: `src/${path}`, content })),
    ...ids.map((id, i) => ({ path: `src/components/${id}.tsx`, content: sources[i] })),
    ...(env.assets ? await env.assets(sources) : []),
    {
      path: 'README.md',
      content: `# ${lib.content.brandName}

${lib.pages && lib.pages.length > 1 ? `A website with ${lib.pages.length} pages (${lib.pages.map((p) => p.label).join(', ')}), switched by the address (\`#/about\`)` : 'A one-page website'} assembled from ready-made components (React + Vite + Tailwind CSS + Preline). It is fully static: no server, no database.

## Run it

\`\`\`bash
npm install
npm run dev      # open the address it prints
npm run build    # the finished site is in dist/
\`\`\`

## Edit it

- \`src/GeneratedLandingPage.tsx\` the page: the text, the colours and the list of sections (each one is a file in \`src/components/\`).
- \`src/components/\` the components themselves. Their markup is untouched; the text comes from the \`content\` object, the colours from \`palette\`.
- \`src/generator/\` the small runtime that fills the text, applies the colours and the light / dark switch.

The contact and newsletter forms only show the layout: connect them to a form service before you publish.
`,
    },
  ]
  return files.map((file) => ({ ...file, path: `${name}/${file.path}` }))
}
