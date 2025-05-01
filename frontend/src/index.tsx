import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';  // 移除 .tsx 扩展名
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals(); 