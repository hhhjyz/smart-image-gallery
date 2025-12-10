import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// 引入页面组件
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- 路由规则定义 --- */}

        {/* 1. 登录/注册页面 */}
        <Route path="/login" element={<AuthPage />} />

        {/* 2. 主页 (上传页面) */}
        {/* HomePage 内部已经写了 "未登录跳转" 的逻辑，所以这里直接引用即可 */}
        <Route path="/" element={<HomePage />} />

        {/* 3. 404 兜底规则 */}
        {/* 如果用户访问了不存在的路径，自动重定向回首页 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}