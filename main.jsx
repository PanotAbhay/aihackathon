import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './src/index.css';
import App from './src/App.jsx';
import { WEBKIT_DROP_CAP_BUG } from './src/utils/dom.js';

// index.css sets drop caps as normal letters while they are edited in Safari (see dom.js).
if (WEBKIT_DROP_CAP_BUG) document.documentElement.setAttribute('data-webkit-dropcap', '');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
