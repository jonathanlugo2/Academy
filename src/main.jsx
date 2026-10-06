import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LucideProvider } from 'lucide-react'
import '@fontsource-variable/dm-sans/opsz.css'
import './index.css'
import App from './App.jsx'

// Valores por defecto de todos los iconos de Lucide. Las clases w-*/h-* de
// cada icono siguen mandando sobre el tamaño (los iconos compactos de tablas y
// badges son más pequeños a propósito); el grosor de trazo es común a todos.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LucideProvider size={18} strokeWidth={1.75}>
      <App />
    </LucideProvider>
  </StrictMode>,
)
