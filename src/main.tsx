import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

function initApp() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found');
    const errorDiv = document.createElement('div');
    errorDiv.textContent = 'Error: Unable to load application';
    document.body.appendChild(errorDiv);
    return;
  }

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

initApp();
