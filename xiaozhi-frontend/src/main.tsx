import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/index.css';

// React.StrictMode 在开发模式下会故意挂载→卸载→重新挂载组件来帮助检测副作用。
// 这会导致 useEffect 被触发两次，通过 AbortController 在各页面中取消上一个请求来避免重复调用。
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
