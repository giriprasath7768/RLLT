import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrimeReactProvider } from 'primereact/api'

import 'primereact/resources/themes/lara-dark-indigo/theme.css' // Theme
import 'primereact/resources/primereact.min.css'               // Core CSS
import 'primeicons/primeicons.css'                             // Icons
import './index.css'                                           // Tailwind & Base

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PrimeReactProvider>
      <App />
    </PrimeReactProvider>
  </StrictMode>,
)
