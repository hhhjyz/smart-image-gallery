import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// 这里的路径是关键：从当前 pages 目录跳出一层(..)，进入 lib 目录
import api from '../lib/api'; 
import { User, Mail, Lock, Loader2, Image as ImageIcon } from 'lucide-react';

export default function AuthPage() {
  // --- 状态管理 ---
  const [isLogin, setIsLogin] = useState(true); // true=登录, false=注册
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 表单数据
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  // 处理输入框变化
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        // --- 登录逻辑 ---
        const res = await api.post('/auth/login', {
          username: formData.username,
          password: formData.password
        });
        
        // 1. 保存 Token
        localStorage.setItem('token', res.data.token);
        // 2. 保存用户信息 (用于展示 "你好, xxx")
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        // 3. 跳转到主页
        navigate('/'); 
      } else {
        // --- 注册逻辑 ---
        await api.post('/auth/register', formData);
        alert('注册成功，请登录！');
        // 注册成功后，自动切回登录模式
        setIsLogin(true);
      }
    } catch (err) {
      console.error(err);
      // 获取后端返回的错误信息
      setError(err.response?.data?.error || '连接服务器失败，请检查后端是否运行');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      {/* 顶部 Logo */}
      <div className="mb-8 flex items-center gap-2">
        <div className="bg-indigo-600 p-2 rounded-lg shadow-lg">
          <ImageIcon className="h-8 w-8 text-white" />
        </div>
        <span className="text-2xl font-bold text-gray-900 tracking-tight">智能图库</span>
      </div>

      {/* 登录/注册卡片 */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          {isLogin ? '欢迎回来' : '创建新账户'}
        </h2>

        {/* 错误提示条 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-500 text-sm rounded-lg border border-red-100 text-center animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 用户名 */}
          <div className="relative">
            <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <input
              name="username"
              type="text"
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white"
              placeholder="用户名"
              value={formData.username}
              onChange={handleChange}
            />
          </div>

          {/* 邮箱 (仅注册时显示) */}
          {!isLogin && (
            <div className="relative animate-in fade-in slide-in-from-top-2 duration-300">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                name="email"
                type="email"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white"
                placeholder="电子邮箱"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          )}

          {/* 密码 */}
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <input
              name="password"
              type="password"
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white"
              placeholder="密码 (至少6位)"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition duration-200 flex items-center justify-center shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : (isLogin ? '立即登录' : '注册账户')}
          </button>
        </form>

        {/* 切换模式链接 */}
        <div className="mt-6 text-center">
          <button
            onClick={() => { setError(''); setIsLogin(!isLogin); }}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline transition-colors"
          >
            {isLogin ? '没有账号？点击注册' : '已有账号？直接登录'}
          </button>
        </div>
      </div>
    </div>
  );
}