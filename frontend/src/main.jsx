import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// 👇 这一行非常重要！必须引入包含了 Tailwind 指令的 CSS 文件
import './index.css' 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)