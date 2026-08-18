import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './lib/supabase.js';
import './index.css';
import '../css/main.css';
import '../css/components.css';
import '../css/admin.css';
import '../css/login-fix.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
