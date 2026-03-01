import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import { MediaPipeApp } from './MediaPipeApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MediaPipeApp />
  </StrictMode>,
)
