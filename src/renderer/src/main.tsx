import './styles/globals.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { installPreviewApi } from './lib/preview-api'
import { installTauriApi, isTauriRuntime } from './lib/tauri-api'

if (isTauriRuntime()) installTauriApi()
else {
  document.documentElement.classList.add('wooly-preview')
  installPreviewApi()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
