import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { installUserHeader } from './generator/userId'

installUserHeader()

const root = createRoot(document.getElementById('root')!)
// the page-quality check (development only): http://localhost:5173/?qa=1
if (import.meta.env.DEV && new URLSearchParams(location.search).has('qa')) {
  void import('./QaPage').then(({ default: QaPage }) => root.render(<QaPage />))
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
