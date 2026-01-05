import axios from 'axios';

// 动态获取后端地址：使用当前访问的主机名（支持手机端访问）
const getBaseURL = () => {
  const hostname = window.location.hostname; // localhost 或局域网 IP
  return `http://${hostname}:8080/api`;
};

// 创建 axios 实例
const api = axios.create({
  baseURL: getBaseURL(),
});

// 请求拦截器：自动把 Token 带上
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;         
