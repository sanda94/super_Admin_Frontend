import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { BaseUrlProvider } from './context/BaseUrl/BaseUrlContext.tsx';
import { ThemeProvider } from './context/Theme/ThemeContext.tsx';
import { ToastProvider } from './context/Alert/AlertContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <BaseUrlProvider>
        <ThemeProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </ThemeProvider>
      </BaseUrlProvider>
    </BrowserRouter>
  </StrictMode>,
)
