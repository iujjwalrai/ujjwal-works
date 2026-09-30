import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Hello to anyone who opens devtools.
console.log(
  '%cujjwal rai%c\n\nOh hey, you opened the console — my kind of person.\nSource: https://github.com/iujjwalrai/ujjwal-works\nSay hi: iujjwalrai2005@gmail.com\n\nTip: press ⌘K / Ctrl+K anywhere on the site.',
  'font: 600 20px Geist, system-ui, sans-serif; color: #e0531b;',
  'font: 13px Geist Mono, ui-monospace, monospace; color: inherit;',
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
