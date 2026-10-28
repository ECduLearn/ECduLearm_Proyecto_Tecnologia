import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import CargandoVista from './components/CargandoVista'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<CargandoVista />}>
      <App />
    </Suspense>
  </React.StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  // El bundle vive en <base>/assets/, así que sw.js queda en <base>/ tanto en Vercel (/) como en GitHub Pages (./)
  const bundleUrl = import.meta.url
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(new URL('../sw.js', bundleUrl)).catch(() => {
      // Sin service worker la app funciona igual, solo sin modo offline.
    })
  })
}
