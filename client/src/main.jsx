import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

window.API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? window.API_BASE_URL : window.location.origin);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
