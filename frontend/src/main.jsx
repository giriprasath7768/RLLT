import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrimeReactProvider } from 'primereact/api'

import 'primereact/resources/themes/lara-dark-indigo/theme.css' // Theme
import 'primereact/resources/primereact.min.css'               // Core CSS
import 'primeicons/primeicons.css'                             // Icons
import './index.css'                                           // Tailwind & Base

import App from './App.jsx'

// Global interceptor to inject print styles during PDF generation without editing 21 chart files
let _html2canvas;
Object.defineProperty(window, 'html2canvas', {
    get: function () { return _html2canvas; },
    set: function (val) {
        if (typeof val === 'function' && !val.__isWrapped) {
            _html2canvas = async function (element, options = {}) {
                const origOnClone = options.onclone;
                options.onclone = (clonedDoc) => {
                    clonedDoc.body.classList.add('pdf-is-generating');
                    if (origOnClone) origOnClone(clonedDoc);
                };
                return await val.call(this, element, options);
            };
            _html2canvas.__isWrapped = true;
        } else {
            _html2canvas = val;
        }
    }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PrimeReactProvider>
      <App />
    </PrimeReactProvider>
  </StrictMode>,
)
