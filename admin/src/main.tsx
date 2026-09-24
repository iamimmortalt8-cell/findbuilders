import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/globals.css';
import { AuthProvider } from './lib/auth-context';
import LoadingScreen from './components/LoadingScreen';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LoadingScreen>
          <App />
        </LoadingScreen>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
