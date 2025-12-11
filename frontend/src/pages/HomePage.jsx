import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; 
import api from '../lib/api';
import Cropper from 'react-cropper';
import { 
  LogOut, Upload, Image as ImageIcon, Loader2, X, Trash2, Calendar, Tag, 
  ChevronLeft, ChevronRight, Info, Search, Plus, Camera, 
  Edit3, RotateCcw, RotateCw, Save, XCircle
} from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();

  // --- 状态管理 ---
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const [images, setImages] = useState([]);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedIndex, setSelectedIndex] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [isUpdatingTag, setIsUpdatingTag] = useState(false);

  // 编辑状态
  const [isEditing, setIsEditing] = useState(false);
  // 🛠️ 修改：使用 useRef 代替 useState 来持有 cropper 实例，这通常更稳定
  const cropperRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // --- 动态加载 Cropper CSS (CDN) ---
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.css";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
       // 不移除以免闪烁
    };
  }, []);

  // --- API 请求 ---
  const fetchImages = useCallback(async (query = searchQuery) => {
    try {
      setIsLoadingImages(true);
      const res = await api.get('/images', { params: { q: query } });
      setImages(res.data.data || []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) handleLogout();
    } finally {
      setIsLoadingImages(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
    } else {
      fetchImages('');
    }
  }, [navigate, fetchImages]);

  // 监听键盘
  useEffect(() => {
    if (selectedIndex === null || isEditing) return; 
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleCloseModal();
      if (e.key === 'ArrowLeft') handlePrev(e);
      if (e.key === 'ArrowRight') handleNext(e);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, images.length, isEditing]);

  // --- 逻辑处理 ---
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleFileSelect = (e) => processFile(e.target.files?.[0]);
  const processFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };
  const handleCancelUpload = () => { setSelectedFile(null); setPreviewUrl(null); };
  
  const handleUpload = async () => {
    if (!selectedFile) return;
    performUpload(selectedFile);
  };

  const performUpload = async (file) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file); 
    try {
      await api.post('/images/upload', formData);
      alert('上传成功！');
      handleCancelUpload(); 
      setIsEditing(false);  
      fetchImages('');      
    } catch (err) {
      alert(`上传失败: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); 
    if(!confirm("确认删除？操作不可恢复。")) return;
    try {
      await api.delete(`/images/${id}`);
      if (selectedIndex !== null && images[selectedIndex].ID === id) {
        handleCloseModal();
      }
      setImages(prev => prev.filter(img => img.ID !== id));
    } catch (err) { alert("删除失败"); }
  };

  // --- 轮播逻辑 ---
  const openModal = (index) => setSelectedIndex(index);
  const handleCloseModal = () => {
    setSelectedIndex(null);
    setIsEditing(false);
    setTagInput('');
  };
  const handlePrev = (e) => {
    e?.stopPropagation();
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  const handleNext = (e) => {
    e?.stopPropagation();
    setSelectedIndex((prev) => (prev + 1) % images.length);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchImages(searchQuery);
  };

  // --- 标签逻辑 ---
  const updateTags = async (imageId, newTagsString) => {
    setIsUpdatingTag(true);
    try {
      await api.put(`/images/${imageId}/tags`, { tags: newTagsString });
      setImages(prev => prev.map(img => img.ID === imageId ? { ...img, tags: newTagsString } : img));
    } catch (err) { alert("标签更新失败"); } finally { setIsUpdatingTag(false); }
  };
  const handleAddTag = async () => {
    if (!tagInput.trim() || !activeImage) return;
    const currentTags = activeImage.tags ? activeImage.tags.split(',') : [];
    if (currentTags.includes(tagInput.trim())) { setTagInput(''); return; }
    await updateTags(activeImage.ID, [...currentTags, tagInput.trim()].filter(t=>t).join(','));
    setTagInput('');
  };
  const handleRemoveTag = async (tag) => {
    if (!activeImage) return;
    await updateTags(activeImage.ID, activeImage.tags.split(',').filter(t => t !== tag).join(','));
  };

  // --- ✨ 图片编辑逻辑 (修复版) ---
  
  // 旋转逻辑：通过 ref 获取 cropper 实例
  const handleRotateLeft = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) cropper.rotate(-90);
  };
  
  const handleRotateRight = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) cropper.rotate(90);
  };
  
  const handleSaveEdit = () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) {
      console.error("Cropper 实例未找到");
      return;
    }
    
    // 获取 Canvas 数据
    const canvas = cropper.getCroppedCanvas();
    if (!canvas) {
      alert("无法获取图片数据。可能是图片尚未加载完成，或存在跨域问题。");
      return;
    }

    // 导出为 Blob 并上传
    canvas.toBlob((blob) => {
      if (!blob) {
        alert("图片生成失败");
        return;
      }
      // 生成新文件对象
      const file = new File([blob], `edited-${activeImage.file_name}`, { type: "image/jpeg" });
      performUpload(file);
    }, "image/jpeg");
  };

  const handleImageError = (e) => { e.target.style.display = 'none'; };

  if (!localStorage.getItem('token')) return null;
  const activeImage = selectedIndex !== null ? images[selectedIndex] : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2 flex-shrink-0 cursor-pointer" onClick={() => {setSearchQuery(''); fetchImages('');}}>
            <div className="bg-indigo-600 p-1.5 rounded"><ImageIcon className="text-white w-5 h-5"/></div>
            <span className="text-xl font-bold text-gray-900 hidden md:block">智能图库</span>
          </div>
          <form onSubmit={handleSearch} className="flex-1 max-w-md relative group">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500" />
            <input type="text" className="block w-full pl-10 pr-3 py-2 border rounded-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all" placeholder="搜索..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </form>
          <div className="flex items-center gap-4 flex-shrink-0">
            <span className="text-sm font-medium text-gray-900 hidden sm:block">{user.username}</span>
            <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-red-600">退出</button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {/* 上传区域 */}
        <div className="mb-8">
          {!previewUrl ? (
            <div 
              className={`h-24 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer transition-all ${isDragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-white'}`}
              onDragOver={e => {e.preventDefault(); setIsDragOver(true)}}
              onDragLeave={e => {e.preventDefault(); setIsDragOver(false)}}
              onDrop={e => {e.preventDefault(); setIsDragOver(false); processFile(e.dataTransfer.files?.[0])}}
            >
              <label className="cursor-pointer w-full h-full flex items-center justify-center gap-3">
                <div className="bg-indigo-100 p-2 rounded-full text-indigo-600"><Upload className="w-5 h-5" /></div>
                <span className="text-gray-600 font-medium">点击或拖拽上传新图片</span>
                <input type="file" className="hidden" onChange={handleFileSelect} accept="image/*" />
              </label>
            </div>
          ) : (
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 flex gap-6 items-center animate-in fade-in slide-in-from-top-4">
              <img src={previewUrl} className="h-32 w-32 object-contain rounded-lg bg-gray-50 border" />
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">准备上传</h3>
                <p className="text-sm text-gray-500 mb-4">文件名: {selectedFile?.name}</p>
                <div className="flex gap-3">
                  <button onClick={handleCancelUpload} disabled={isUploading} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">取消</button>
                  <button onClick={handleUpload} disabled={isUploading} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 flex items-center gap-2">{isUploading && <Loader2 className="w-4 h-4 animate-spin" />} 确认上传</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mb-6"><h2 className="text-xl font-bold text-gray-800">{searchQuery ? `"${searchQuery}" 结果` : '所有图片'} <span className="text-gray-400 text-sm">({images.length})</span></h2></div>

        {isLoadingImages ? (
          <div className="text-center py-20"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-200"/></div>
        ) : images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {images.map((img, index) => (
              <div key={img.ID} onClick={() => openModal(index)} className="group relative aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-zoom-in border border-gray-200 hover:shadow-lg transition-all">
                <img src={img.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" onError={handleImageError} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  {img.tags && <div className="flex flex-wrap gap-1 mb-1.5">{img.tags.split(',').filter(t=>t).slice(0,3).map((tag,i)=><span key={i} className="text-[10px] bg-white/20 text-white/90 px-1.5 py-0.5 rounded backdrop-blur-md">{tag}</span>)}</div>}
                  <p className="text-white text-sm font-medium truncate">{img.file_name}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-white/80 text-xs">{new Date(img.CreatedAt).toLocaleDateString()}</span>
                    <button onClick={(e) => handleDelete(e, img.ID)} className="bg-white/20 hover:bg-red-500 text-white p-1.5 rounded-full backdrop-blur-md"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (<div className="py-20 text-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">暂无图片</div>)}
      </main>

      {/* --- 全屏模态框 --- */}
      {selectedIndex !== null && activeImage && (
        <div className="fixed inset-0 z-[100] flex bg-black/95 backdrop-blur-sm animate-in fade-in duration-200">
          
          <button onClick={handleCloseModal} className="absolute top-4 right-4 text-white/50 hover:text-white p-2 z-10"><X className="w-8 h-8" /></button>
          {!isEditing && (
            <>
              <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white p-2 rounded-full hover:bg-white/10 z-10"><ChevronLeft className="w-10 h-10" /></button>
              <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white p-2 rounded-full hover:bg-white/10 z-10"><ChevronRight className="w-10 h-10" /></button>
            </>
          )}

          <div className="flex w-full h-full p-4 md:p-8 gap-8">
            
            {/* 左侧：显示区域 */}
            <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-black/50 rounded-lg">
              {isEditing ? (
                // 🛠️ 修复：使用 ref，并添加 crossOrigin 属性 (解决 Canvas 跨域污染问题)
                <Cropper
                  src={activeImage.url}
                  style={{ height: "100%", width: "100%" }}
                  initialAspectRatio={NaN}
                  guides={true}
                  background={false}
                  ref={cropperRef}
                  viewMode={1}
                  dragMode="move"
                  autoCropArea={0.8}
                  checkOrientation={false}
                  crossOrigin="anonymous" // <--- 关键！允许跨域加载图片到 Canvas
                />
              ) : (
                <img src={activeImage.url} alt={activeImage.file_name} className="max-w-full max-h-full object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
              )}
            </div>

            {/* 右侧：信息/操作栏 */}
            <div className="hidden md:flex w-80 flex-col bg-gray-900/50 border-l border-white/10 text-white p-6 backdrop-blur-md rounded-2xl">
              <div className="flex-1 overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold break-words w-2/3">{activeImage.file_name}</h2>
                  {!isEditing && (
                    <button 
                      onClick={() => setIsEditing(true)} 
                      className="flex items-center gap-1 text-sm bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" /> 编辑
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="animate-in fade-in slide-in-from-right-4">
                    <p className="text-sm text-gray-400 mb-4">编辑模式: 拖动裁剪框，或使用下方按钮旋转。</p>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <button onClick={handleRotateLeft} className="bg-white/10 hover:bg-white/20 p-3 rounded-xl flex flex-col items-center gap-2 transition-colors"><RotateCcw className="w-6 h-6" /> <span className="text-xs">左旋 90°</span></button>
                      <button onClick={handleRotateRight} className="bg-white/10 hover:bg-white/20 p-3 rounded-xl flex flex-col items-center gap-2 transition-colors"><RotateCw className="w-6 h-6" /> <span className="text-xs">右旋 90°</span></button>
                    </div>
                    <div className="space-y-3">
                      <button onClick={handleSaveEdit} disabled={isUploading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">{isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> 保存副本</>}</button>
                      <button onClick={() => setIsEditing(false)} disabled={isUploading} className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2"><XCircle className="w-5 h-5" /> 取消编辑</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-400 mb-6 flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(activeImage.CreatedAt).toLocaleString()}</p>
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><Tag className="w-4 h-4 text-indigo-400" /> 标签</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {activeImage.tags?.split(',').filter(t=>t).map((tag, i) => (
                          <div key={i} className="group relative inline-flex">
                            <span onClick={() => {handleCloseModal(); fetchImages(tag);}} className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-indigo-600 text-sm cursor-pointer border border-white/5 pr-2 group-hover:pr-6 relative overflow-hidden transition-all">{tag}</span>
                            <button onClick={() => handleRemoveTag(tag)} className="absolute right-1 top-1/2 -translate-y-1/2 text-white/50 hover:text-red-400 opacity-0 group-hover:opacity-100"><X className="w-3 h-3" /></button>
                          </div>
                        )) || <span className="text-gray-500 italic text-sm">暂无标签</span>}
                      </div>
                      <div className="flex gap-2">
                        <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTag()} placeholder="添加..." className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500" />
                        <button onClick={handleAddTag} disabled={isUpdatingTag || !tagInput.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded">{isUpdatingTag ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4" />}</button>
                      </div>
                    </div>
                    <div className="mb-6 bg-white/5 p-4 rounded-xl border border-white/5">
                      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><Camera className="w-4 h-4 text-indigo-400" /> 拍摄参数</h3>
                      <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                        <div><p className="text-gray-500 mb-0.5">相机</p><p className="text-white font-medium truncate">{activeImage.camera_model || '未知'}</p></div>
                        <div><p className="text-gray-500 mb-0.5">时间</p><p className="text-white font-medium">{activeImage.shooting_time || '未知'}</p></div>
                        <div><p className="text-gray-500 mb-0.5">分辨率</p><p className="text-white font-medium">{activeImage.resolution || '未知'}</p></div>
                        <div><p className="text-gray-500 mb-0.5">参数</p><div className="flex gap-2 text-white font-medium"><span>{activeImage.aperture || '-'}</span><span>ISO {activeImage.iso || '-'}</span></div></div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {!isEditing && (
                <div className="pt-6 border-t border-white/10 flex gap-4">
                  <button onClick={(e) => handleDelete(e, activeImage.ID)} className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-600 text-red-100 hover:text-white py-2.5 rounded-lg transition-colors font-medium"><Trash2 className="w-4 h-4" /> 删除</button>
                  <a href={activeImage.url} target="_blank" download className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-lg transition-colors font-medium">下载</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}