import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; 
import api from '../lib/api';
import { LogOut, Upload, Image as ImageIcon, Loader2, X, Trash2, Calendar, AlertCircle } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();

  // --- 状态管理 ---
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const [images, setImages] = useState([]);
  const [isLoadingImages, setIsLoadingImages] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // --- 获取图片列表 ---
  const fetchImages = useCallback(async () => {
    try {
      setIsLoadingImages(true);
      const res = await api.get('/images');
      console.log("📸 获取到的图片列表:", res.data.data); // 调试日志
      setImages(res.data.data || []);
    } catch (err) {
      console.error("获取图片列表失败:", err);
      if (err.response && err.response.status === 401) {
        handleLogout();
      }
    } finally {
      setIsLoadingImages(false);
    }
  }, []);

  // --- 初始化 ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      fetchImages(); 
    }
  }, [navigate, fetchImages]);

  // --- 事件处理 ---

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const processFile = (file) => {
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件 (JPG, PNG, GIF)');
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragOver(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('file', selectedFile); 

    try {
      await api.post('/images/upload', formData);
      alert('上传成功！');
      handleCancel();
      fetchImages(); 
    } catch (err) {
      console.error('上传出错:', err);
      const errorMsg = err.response?.data?.error || err.message || '上传失败';
      alert(`上传失败: ${errorMsg}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (e, imageId) => {
    // 阻止事件冒泡，防止触发图片的点击查看详情（虽然还没做查看详情）
    e.stopPropagation(); 
    
    if (!window.confirm("确定要删除这张图片吗？此操作无法撤销。")) {
      return;
    }

    try {
      await api.delete(`/images/${imageId}`);
      // 成功后，直接在本地状态中移除该图片，避免重新请求网络，体验更快
      setImages(prev => prev.filter(img => img.ID !== imageId));
    } catch (err) {
      console.error("删除失败:", err);
      alert("删除失败，请重试");
    }
  };

  // 图片加载失败时的处理
  const handleImageError = (e) => {
    console.error("❌ 图片加载失败:", e.target.src);
    e.target.onerror = null; // 防止无限循环
    // 替换为占位图
    e.target.src = "https://placehold.co/400x400/e2e8f0/94a3b8?text=Load+Error";
  };

  if (!localStorage.getItem('token')) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-sm">
              <ImageIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">智能图库</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-900 hidden sm:block">{user.username}</span>
            <button onClick={handleLogout} className="flex items-center gap-2 text-gray-600 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-all text-sm font-medium">
              <LogOut className="h-4 w-4" /> 退出
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">我的图片</h1>
            <p className="text-sm text-gray-500 mt-1">共 {images.length} 张照片</p>
          </div>
        </div>

        <div className="mb-10 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {!previewUrl ? (
            <div 
              className={`relative h-48 flex flex-col items-center justify-center border-2 border-dashed transition-all duration-300 ${isDragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}`}
              onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            >
              <label className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center">
                <div className="flex items-center gap-3 text-gray-500 group-hover:text-indigo-600 transition-colors">
                  <Upload className="w-6 h-6" />
                  <span className="font-medium">点击上传或拖拽图片到这里</span>
                </div>
                <input type="file" className="hidden" onChange={handleFileSelect} accept="image/*" />
              </label>
            </div>
          ) : (
            <div className="p-6 md:flex gap-8 items-center">
              <div className="h-48 aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative group">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
              </div>
              <div className="flex gap-3 mt-4 md:mt-0">
                <button onClick={handleCancel} disabled={isUploading} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">取消</button>
                <button onClick={handleUpload} disabled={isUploading} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm">
                  {isUploading && <Loader2 className="w-4 h-4 animate-spin" />} 确认上传
                </button>
              </div>
            </div>
          )}
        </div>

        {isLoadingImages ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map((img) => (
              <div key={img.ID} className="group relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-square bg-gray-100 overflow-hidden cursor-pointer relative">
                  <img 
                    src={img.url} 
                    alt={img.file_name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    loading="lazy"
                    onError={handleImageError} // 添加错误处理
                  />
                </div>
                <div className="p-3 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-900 truncate" title={img.file_name}>
                    {img.file_name}
                  </p>
                  {img.tags && (
                <div className="flex flex-wrap gap-1 mt-2">
                        {img.tags.split(',').map((tag, index) => (
                            <span 
                            key={index}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700"
                            >
                            {tag}
                            </span>
                        ))}
                        </div>
                    )}
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(img.CreatedAt).toLocaleDateString()}
                    </span>
                    <button 
                    onClick={(e) => handleDelete(e, img.ID)} 
                    className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50"
                    title="删除图片"
                    >
                    <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
              <ImageIcon className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">暂无图片</h3>
            <p className="text-sm text-gray-500 mt-1">您上传的图片将会展示在这里。</p>
          </div>
        )}
      </main>
    </div>
  );
}