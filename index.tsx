
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import TimeTest from './TimeTest';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// URL parameter handling for different test modes
const urlParams = new URLSearchParams(window.location.search);
const testMode = urlParams.get('test');

let ComponentToRender = App;

if (testMode === 'time') {
  ComponentToRender = TimeTest;
}

root.render(
  <StrictMode>
    <ComponentToRender />
  </StrictMode>
);
