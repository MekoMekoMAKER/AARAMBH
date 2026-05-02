import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error boundary for initialization
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Root element not found');
  
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (error) {
  console.error('Critical initialization error:', error);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 20px; color: #ff4444; font-family: sans-serif;">
        <h2>AARAMBH: Application Error</h2>
        <p>Something went wrong during startup. Please try refreshing or check your browser console for details.</p>
        <pre style="background: #f0f0f0; padding: 10px; border-radius: 4px;">${error instanceof Error ? error.message : String(error)}</pre>
      </div>
    `;
  }
}
